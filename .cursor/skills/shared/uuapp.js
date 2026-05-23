/**
 * uuApp Commands - Shared Logic
 *
 * Config loading, dual auth (Plus4U / on-prem grantToken),
 * HTTP calling, JSONata response transformation, file-based output.
 */

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

// Allow self-signed certificates for on-prem environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Resolve dependencies from the MCP server's node_modules
const mcpRequire = createRequire(process.argv[1] || __filename);

let jsonata;
try { jsonata = mcpRequire('jsonata'); } catch { jsonata = null; }

let KeyringEntry;
try {
  const keyring = mcpRequire('@napi-rs/keyring');
  KeyringEntry = keyring.Entry;
} catch { KeyringEntry = null; }

// ─── Constants ───────────────────────────────────────────────────────────────

const KEYCHAIN_SERVICE_PREFIX = 'uuapp-commands';
const KEYCHAIN_ACCOUNT = 'default-user';
const TOKEN_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_OIDC_SCOPE = 'openid http:// https://';
const DEFAULT_OUTPUT_DIR = '.uuapp-output';
const MAX_PREVIEW_LENGTH = 200;

// In-memory token cache: { [envId]: { token, expiry } }
const tokenCache = {};

// ─── Config Loading ──────────────────────────────────────────────────────────

function loadConfigRegistry(skillDir) {
  const registryPath = path.join(skillDir, 'configs.json');
  if (!fs.existsSync(registryPath)) {
    return { configs: [] };
  }
  return JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
}

function loadConfig(configName, skillDir) {
  const registry = loadConfigRegistry(skillDir);
  const entry = registry.configs.find(c => c.name === configName);
  if (!entry) {
    throw new Error(`Config "${configName}" not found. Available: ${registry.configs.map(c => c.name).join(', ')}`);
  }

  const configPath = path.resolve(skillDir, entry.file);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  resolveEnvVars(config);
  return config;
}

function resolveEnvVars(config) {
  for (const env of Object.values(config.environments || {})) {
    if (env.oidc && env.oidc.strategy === 'grantToken') {
      env.oidc.accessCode1 = resolveValue(env.oidc.accessCode1);
      env.oidc.accessCode2 = resolveValue(env.oidc.accessCode2);
      if (env.oidc.grantTokenUri) {
        env.oidc.grantTokenUri = resolveValue(env.oidc.grantTokenUri);
      }
    }
  }
}

function resolveValue(value) {
  if (value && typeof value === 'string' && value.startsWith('$')) {
    const resolved = process.env[value.slice(1)];
    if (resolved !== undefined) return resolved;
  }
  return value;
}

// ─── Auth (grantToken + Keychain) ────────────────────────────────────────────

async function grantTokenAuth(oidcConfig) {
  const scope = oidcConfig.scope || DEFAULT_OIDC_SCOPE;
  const body = new URLSearchParams({
    grant_type: 'password',
    accessCode1: oidcConfig.accessCode1,
    accessCode2: oidcConfig.accessCode2,
    scope,
  });

  const response = await fetch(oidcConfig.grantTokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`grantToken failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const token = data.id_token || data.access_token;
  if (!token) {
    throw new Error('grantToken response contains no token');
  }

  return { token, expiry: getTokenExpiry(token) };
}

function getTokenExpiry(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return new Date(Date.now() + 3600_000);
    const padded = parts[1] + '='.repeat((4 - (parts[1].length % 4)) % 4);
    const decoded = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
    const parsed = JSON.parse(decoded);
    if (parsed.exp) return new Date(parsed.exp * 1000);
  } catch { /* fallback */ }
  return new Date(Date.now() + 3600_000);
}

function isTokenValid(envId) {
  const cached = tokenCache[envId];
  if (!cached) return false;
  return cached.expiry.getTime() - Date.now() > TOKEN_BUFFER_MS;
}

function saveTokenToKeychain(envId, token, expiry) {
  if (!KeyringEntry) return;
  try {
    const entry = new KeyringEntry(`${KEYCHAIN_SERVICE_PREFIX}/${envId}`, KEYCHAIN_ACCOUNT);
    entry.setPassword(JSON.stringify({
      token,
      tokenExpiry: expiry.toISOString(),
      savedAt: new Date().toISOString(),
    }));
  } catch { /* ignore keychain errors */ }
}

function loadTokenFromKeychain(envId) {
  if (!KeyringEntry) return null;
  try {
    const entry = new KeyringEntry(`${KEYCHAIN_SERVICE_PREFIX}/${envId}`, KEYCHAIN_ACCOUNT);
    const raw = entry.getPassword();
    if (!raw) return null;
    const data = JSON.parse(raw);
    return { token: data.token, expiry: new Date(data.tokenExpiry) };
  } catch { return null; }
}

async function getOrRefreshToken(envId, oidcConfig) {
  // 1. In-memory cache
  if (isTokenValid(envId)) {
    return tokenCache[envId].token;
  }

  // 2. Keychain
  const stored = loadTokenFromKeychain(envId);
  if (stored && stored.expiry.getTime() - Date.now() > TOKEN_BUFFER_MS) {
    tokenCache[envId] = stored;
    return stored.token;
  }

  // 3. Re-authenticate via grantToken (non-interactive)
  const result = await grantTokenAuth(oidcConfig);
  tokenCache[envId] = result;
  saveTokenToKeychain(envId, result.token, result.expiry);
  return result.token;
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

function createBearerHttp(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return {
    async get(url) {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${body}`);
      }
      const ct = response.headers.get('content-type') || '';
      return ct.includes('application/json') ? response.json() : response.text();
    },
    async post(url, body) {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const respBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${respBody}`);
      }
      const ct = response.headers.get('content-type') || '';
      return ct.includes('application/json') ? response.json() : response.text();
    },
  };
}

async function resolveHttp(envConfig, envId, injectedHttp) {
  if (envConfig.oidc && envConfig.oidc.strategy === 'grantToken') {
    const token = await getOrRefreshToken(envId, envConfig.oidc);
    return createBearerHttp(token);
  }
  if (!injectedHttp) {
    throw new Error(`Environment "${envId}" has no on-prem auth configured and Plus4U is not authenticated. Call login on skilled-plus4u-mcp first.`);
  }
  return injectedHttp;
}

async function callApi(http, baseUri, useCase, method, dtoIn) {
  const base = baseUri.endsWith('/') ? baseUri : baseUri + '/';
  const url = new URL(useCase, base);

  if (method === 'GET') {
    if (dtoIn && Object.keys(dtoIn).length > 0) {
      url.searchParams.set('dto', JSON.stringify(dtoIn));
    }
    return http.get(url.toString());
  }
  return http.post(url.toString(), dtoIn || {});
}

// ─── Response Transformation ─────────────────────────────────────────────────

async function transformResponse(response, outputTransform, outputFormat) {
  let data = response;

  if (outputTransform && jsonata) {
    try {
      const expr = jsonata(outputTransform);
      data = await expr.evaluate(data);
    } catch { /* use raw data on transform failure */ }
  }

  const format = outputFormat || 'json';
  switch (format) {
    case 'markdown': return toMarkdown(data);
    case 'text': return toText(data);
    default: return JSON.stringify(data, null, 2);
  }
}

function toMarkdown(data) {
  if (data === null || data === undefined) return '_No data_';
  if (typeof data !== 'object') return String(data);

  if (Array.isArray(data)) return arrayToMarkdownTable(data);

  const obj = data;
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const otherFields = Object.entries(obj)
        .filter(([k]) => k !== key)
        .map(([k, v]) => `**${k}:** ${formatValue(v)}`)
        .join(' | ');
      const header = otherFields ? otherFields + '\n\n' : '';
      return header + arrayToMarkdownTable(value);
    }
  }
  return objectToMarkdownList(obj);
}

function arrayToMarkdownTable(arr) {
  if (arr.length === 0) return '_Empty list_';
  const first = arr[0];
  if (typeof first !== 'object' || first === null) {
    return arr.map(item => `- ${formatValue(item)}`).join('\n');
  }
  const keys = Object.keys(first);
  const header = `| ${keys.join(' | ')} |`;
  const separator = `| ${keys.map(() => '---').join(' | ')} |`;
  const rows = arr.map(item => `| ${keys.map(k => formatValue(item[k])).join(' | ')} |`);
  return [header, separator, ...rows].join('\n');
}

function objectToMarkdownList(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `- **${key}:** ${formatValue(value)}`)
    .join('\n');
}

function formatValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function toText(data) {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
}

// ─── File Output ─────────────────────────────────────────────────────────────

function writeOutput(content, outputDir, fileName, maxOutputSize) {
  const dir = path.resolve(process.cwd(), outputDir || DEFAULT_OUTPUT_DIR);
  fs.mkdirSync(dir, { recursive: true });

  let finalContent = content;
  if (maxOutputSize && Buffer.byteLength(content, 'utf-8') > maxOutputSize) {
    finalContent = content.slice(0, maxOutputSize) + '\n\n[TRUNCATED at ' + maxOutputSize + ' bytes]';
  }

  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, finalContent, 'utf-8');

  const relativePath = path.relative(process.cwd(), filePath);
  const size = Buffer.byteLength(finalContent, 'utf-8');

  return {
    file: relativePath,
    size: size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`,
    sizeBytes: size,
  };
}

function makeFileName(env, app, command, format) {
  const ts = Date.now();
  const ext = format === 'markdown' ? 'md' : format === 'text' ? 'txt' : 'json';
  return `${env}_${app}_${command}_${ts}.${ext}`;
}

function makePreview(content) {
  if (content.length <= MAX_PREVIEW_LENGTH) return content;
  return content.slice(0, MAX_PREVIEW_LENGTH) + '...';
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function listConfigs(skillDir) {
  const registry = loadConfigRegistry(skillDir);
  return {
    configs: registry.configs.map(c => ({
      name: c.name,
      description: c.description || '',
    })),
  };
}

async function login(config, params) {
  const { environment } = params;
  if (!environment) throw new Error('Parameter "environment" is required');

  const envConfig = (config.environments || {})[environment];
  if (!envConfig) {
    const available = Object.keys(config.environments || {});
    throw new Error(`Environment "${environment}" not found. Available: ${available.join(', ')}`);
  }

  if (!envConfig.oidc || envConfig.oidc.strategy !== 'grantToken') {
    return {
      environment,
      authType: 'plus4u',
      message: 'This environment uses Plus4U auth. Call login on skilled-plus4u-mcp instead.',
    };
  }

  const result = await grantTokenAuth(envConfig.oidc);
  tokenCache[environment] = result;
  saveTokenToKeychain(environment, result.token, result.expiry);

  const expiresIn = Math.round((result.expiry.getTime() - Date.now()) / 60_000);
  return {
    environment,
    authType: 'grantToken',
    authenticated: true,
    expiresInMinutes: expiresIn,
  };
}

function listCommands(config) {
  const result = [];
  for (const [envId, env] of Object.entries(config.environments || {})) {
    const authType = env.oidc && env.oidc.strategy === 'grantToken' ? 'grantToken' : 'plus4u';
    for (const [appId, app] of Object.entries(env.apps || {})) {
      const commands = (app.commands || []).map(cmd => ({
        name: cmd.name,
        description: cmd.description,
      }));
      const entry = { environment: envId, app: appId, authType };
      if (commands.length > 0) {
        entry.commands = commands;
      } else {
        entry.commands = null;
        entry.note = 'No pre-configured commands. Use discoverCommands or callUuAppCommand.';
        entry.baseUri = app.baseUri;
      }
      result.push(entry);
    }
  }
  return { apps: result };
}

function getCommandDetail(config, params) {
  const { environment, app, command } = params;
  if (!environment) throw new Error('Parameter "environment" is required');
  if (!app) throw new Error('Parameter "app" is required');
  if (!command) throw new Error('Parameter "command" is required');

  const envConfig = (config.environments || {})[environment];
  if (!envConfig) throw new Error(`Environment "${environment}" not found`);

  const appConfig = (envConfig.apps || {})[app];
  if (!appConfig) throw new Error(`App "${app}" not found in environment "${environment}"`);

  const cmdConfig = (appConfig.commands || []).find(c => c.name === command);
  if (!cmdConfig) {
    const available = (appConfig.commands || []).map(c => c.name);
    throw new Error(`Command "${command}" not found. Available: ${available.join(', ')}`);
  }

  return {
    name: cmdConfig.name,
    description: cmdConfig.description,
    useCase: cmdConfig.useCase,
    method: cmdConfig.method,
    dtoInSchema: cmdConfig.dtoInSchema || null,
    outputDescription: cmdConfig.outputDescription || null,
    outputFormat: cmdConfig.outputFormat || 'json',
  };
}

async function callCommand(config, params, http) {
  const { environment, app, command, dtoIn } = params;
  if (!environment) throw new Error('Parameter "environment" is required');
  if (!app) throw new Error('Parameter "app" is required');
  if (!command) throw new Error('Parameter "command" is required');

  const envConfig = (config.environments || {})[environment];
  if (!envConfig) throw new Error(`Environment "${environment}" not found`);

  const appConfig = (envConfig.apps || {})[app];
  if (!appConfig) throw new Error(`App "${app}" not found in environment "${environment}"`);

  const cmdConfig = (appConfig.commands || []).find(c => c.name === command);
  if (!cmdConfig) {
    const available = (appConfig.commands || []).map(c => c.name);
    throw new Error(`Command "${command}" not found in app "${app}". Available: ${available.join(', ')}`);
  }

  const resolvedHttp = await resolveHttp(envConfig, environment, http);
  const response = await callApi(resolvedHttp, appConfig.baseUri, cmdConfig.useCase, cmdConfig.method, dtoIn);

  const format = cmdConfig.outputFormat || 'json';
  const content = await transformResponse(response, cmdConfig.outputTransform, format);

  const fileName = makeFileName(environment, app, command, format);
  const fileInfo = writeOutput(content, config.outputDir, fileName, cmdConfig.maxOutputSize);

  return {
    status: 'ok',
    ...fileInfo,
    format,
    outputDescription: cmdConfig.outputDescription || null,
    preview: makePreview(content),
  };
}

async function discoverCommands(config, params, http) {
  const { environment, app, baseUri: directBaseUri } = params;

  let resolvedHttp, baseUri;

  if (directBaseUri) {
    if (environment) {
      const envConfig = (config.environments || {})[environment];
      if (envConfig) resolvedHttp = await resolveHttp(envConfig, environment, http);
    }
    if (!resolvedHttp) {
      if (!http) throw new Error('Plus4U login required when using baseUri directly (or provide environment for grantToken auth)');
      resolvedHttp = http;
    }
    baseUri = directBaseUri;
  } else {
    if (!environment) throw new Error('Parameter "environment" (or "baseUri") is required');
    if (!app) throw new Error('Parameter "app" is required');

    const envConfig = (config.environments || {})[environment];
    if (!envConfig) throw new Error(`Environment "${environment}" not found`);

    const appConfig = (envConfig.apps || {})[app];
    if (!appConfig) throw new Error(`App "${app}" not found in environment "${environment}"`);

    resolvedHttp = await resolveHttp(envConfig, environment, http);
    baseUri = appConfig.baseUri;
  }

  const response = await callApi(resolvedHttp, baseUri, 'sys/getUseCases', 'GET');
  const content = await transformResponse(response, null, 'json');
  const envLabel = environment || 'direct';
  const appLabel = app || 'app';
  const fileName = makeFileName(envLabel, appLabel, 'getUseCases', 'json');
  const fileInfo = writeOutput(content, config.outputDir || DEFAULT_OUTPUT_DIR, fileName);

  return {
    status: 'ok',
    ...fileInfo,
    format: 'json',
    outputDescription: 'Array of use case objects with useCase (path), method, and description',
    preview: makePreview(content),
  };
}

async function callUuAppCommand(config, params, http) {
  const { environment, app, baseUri: directBaseUri, useCase, method, dtoIn } = params;
  if (!useCase) throw new Error('Parameter "useCase" is required');

  const callMethod = (method || 'GET').toUpperCase();
  let resolvedHttp, baseUri;

  if (directBaseUri) {
    if (environment) {
      const envConfig = (config.environments || {})[environment];
      if (envConfig) resolvedHttp = await resolveHttp(envConfig, environment, http);
    }
    if (!resolvedHttp) {
      if (!http) throw new Error('Plus4U login required when using baseUri directly (or provide environment for grantToken auth)');
      resolvedHttp = http;
    }
    baseUri = directBaseUri;
  } else {
    if (!environment) throw new Error('Parameter "environment" (or "baseUri") is required');
    if (!app) throw new Error('Parameter "app" is required');

    const envConfig = (config.environments || {})[environment];
    if (!envConfig) throw new Error(`Environment "${environment}" not found`);

    const appConfig = (envConfig.apps || {})[app];
    if (!appConfig) throw new Error(`App "${app}" not found in environment "${environment}"`);

    resolvedHttp = await resolveHttp(envConfig, environment, http);
    baseUri = appConfig.baseUri;
  }

  const response = await callApi(resolvedHttp, baseUri, useCase, callMethod, dtoIn);
  const content = await transformResponse(response, null, 'json');
  const cmdName = useCase.replace(/\//g, '_');
  const envLabel = environment || 'direct';
  const appLabel = app || 'app';
  const fileName = makeFileName(envLabel, appLabel, cmdName, 'json');
  const fileInfo = writeOutput(content, config.outputDir || DEFAULT_OUTPUT_DIR, fileName);

  return {
    status: 'ok',
    ...fileInfo,
    format: 'json',
    preview: makePreview(content),
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  loadConfigRegistry,
  loadConfig,
  listConfigs,
  login,
  listCommands,
  getCommandDetail,
  callCommand,
  discoverCommands,
  callUuAppCommand,
};
