/**
 * uuApp Commands Skill - MCP Entry Point
 *
 * Single skill exposing pre-configured uuApp commands through
 * listConfigs, login, listCommands, callCommand, discoverCommands, callUuAppCommand.
 */

const path = require('path');
const {
  loadConfig,
  listConfigs,
  login,
  listCommands,
  getCommandDetail,
  callCommand,
  discoverCommands,
  callUuAppCommand,
} = require(path.join(__dirname, '../shared/uuapp.js'));

const SKILL_DIR = __dirname;

const schema = {
  name: 'uuapp-commands',
  description: 'List and call pre-configured uuApp commands across environments. Supports Plus4U and on-prem (grantToken) auth. Responses are written to files to avoid context flooding.',
  parameters: {
    action: {
      type: 'string',
      required: true,
      description: 'Action to perform: listConfigs | login | listCommands | getCommandDetail | callCommand | discoverCommands | callUuAppCommand',
    },
    config: {
      type: 'string',
      description: 'Config name from configs.json registry (required for all actions except listConfigs)',
    },
    environment: {
      type: 'string',
      description: 'Environment ID from the config (required for login, callCommand, discoverCommands, callUuAppCommand)',
    },
    app: {
      type: 'string',
      description: 'App ID within the environment (required for callCommand, discoverCommands, callUuAppCommand)',
    },
    command: {
      type: 'string',
      description: 'Command name from config (required for callCommand)',
    },
    useCase: {
      type: 'string',
      description: 'Use case path e.g. "sys/getHealth" (required for callUuAppCommand)',
    },
    method: {
      type: 'string',
      description: 'HTTP method: GET or POST (for callUuAppCommand, default GET)',
    },
    dtoIn: {
      type: 'object',
      description: 'Input data for the command (optional)',
    },
    baseUri: {
      type: 'string',
      description: 'Direct base URI (alternative to environment+app for discoverCommands and callUuAppCommand)',
    },
  },
};

async function execute(params, http, context) {
  const { action, config: configName } = params;
  const progress = context?.progress || (() => {});

  if (!action) {
    throw new Error('Parameter "action" is required. Use: listConfigs, login, listCommands, callCommand, discoverCommands, callUuAppCommand');
  }

  if (action === 'listConfigs') {
    return listConfigs(SKILL_DIR);
  }

  if (!configName) {
    throw new Error('Parameter "config" is required. Use listConfigs to see available configs.');
  }

  const config = loadConfig(configName, SKILL_DIR);

  switch (action) {
    case 'login':
      return login(config, params);
    case 'listCommands':
      return listCommands(config);
    case 'getCommandDetail':
      return getCommandDetail(config, params);
    case 'callCommand':
      await progress(1, 2, `Calling command...`);
      { const result = await callCommand(config, params, http);
        await progress(2, 2, 'Done');
        return result; }
    case 'discoverCommands':
      await progress(1, 2, 'Discovering commands...');
      { const result = await discoverCommands(config, params, http);
        await progress(2, 2, 'Done');
        return result; }
    case 'callUuAppCommand':
      await progress(1, 2, `Calling ${params.useCase || 'command'}...`);
      { const result = await callUuAppCommand(config, params, http);
        await progress(2, 2, 'Done');
        return result; }
    default:
      throw new Error(`Unknown action "${action}". Use: listConfigs, login, listCommands, getCommandDetail, callCommand, discoverCommands, callUuAppCommand`);
  }
}

module.exports = { execute, schema };
