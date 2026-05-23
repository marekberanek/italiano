---
name: uuapp-commands
description: List and call pre-configured uuApp commands across environments. Supports Plus4U and on-prem (grantToken) auth. Use when the user wants to call uuApp APIs, check app health, list use cases, or interact with uuApp environments.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# uuApp Commands

Call pre-configured uuApp commands across multiple environments. Supports both Plus4U OIDC and on-prem grantToken authentication. Responses are written to files to avoid context flooding.

## CRITICAL RULES

**NEVER read config files directly.** Do NOT use Read, Grep, Glob, or any file tool on config JSON files
(`configs/*.json`, `configs.json`). These files are large and will flood the context.

**You MUST use only the skill actions to access configuration data:**
- `listConfigs` -- to discover available configs
- `listCommands` -- to see available commands (compact: name + description only)
- `getCommandDetail` -- to get full command details including dtoIn schema

**Before calling any command that requires input parameters, ALWAYS call `getCommandDetail` first**
to get the `dtoInSchema` so you know what parameters are needed.

## Prerequisites

**For Plus4U environments:** Call `login` on `skilled-plus4u-mcp` first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

**For on-prem environments (grantToken):** No Plus4U login needed. Use the skill's `login` action instead (see below).

## Usage via MCP

All actions use `executeSkill` on `skilled-plus4u-mcp`:

```
CallMcpTool({
  server: "skilled-plus4u-mcp",
  toolName: "executeSkill",
  arguments: { scriptPath: "<absolute path to uuapp-commands/skill.js>", params: { action: "...", ... } }
})
```

## Actions

### listConfigs

List all available configuration files.

```
{ action: "listConfigs" }
```

Returns: `{ configs: [{ name, description }] }`

### login

Authenticate against an on-prem environment using grantToken credentials from config.

```
{ action: "login", config: "smarta-int", environment: "smarta-int" }
```

- For on-prem (grantToken): authenticates and stores token in OS keychain
- For Plus4U environments: returns message to use skilled-plus4u-mcp login instead
- Tokens auto-refresh on expiry (non-interactive)

### listCommands

List all pre-configured commands from a config file. Returns compact format grouped by app.

```
{ action: "listCommands", config: "smarta-int" }
```

Returns: `{ apps: [{ environment, app, authType, commands: [{ name, description }] }] }`

### getCommandDetail

Get full details for a specific command, including dtoIn schema (required/optional parameters).
**Always call this before calling a command that needs input parameters.**

```
{ action: "getCommandDetail", config: "smarta-int", environment: "smarta-int", app: "powergrid", command: "getNemo" }
```

Returns: `{ name, description, useCase, method, dtoInSchema, outputDescription, outputFormat }`

The `dtoInSchema` contains parameter definitions: `{ paramName: { type, required, description } }`

### callCommand

Call a pre-configured command. Response is written to a file.

```
{
  action: "callCommand",
  config: "smarta-int",
  environment: "smarta-int",
  app: "cgmesio",
  command: "getHealth"
}
```

With input data:

```
{
  action: "callCommand",
  config: "smarta-int",
  environment: "smarta-int",
  app: "cgmesio",
  command: "listItems",
  dtoIn: { pageSize: 10, pageIndex: 0 }
}
```

Returns:

```json
{
  "status": "ok",
  "file": ".uuapp-output/smarta-int_cgmesio_getHealth_1741234567.json",
  "size": "2.4 KB",
  "format": "json",
  "outputDescription": "Object with keys: status, app, version",
  "preview": "{ \"status\": \"OK\", ... }"
}
```

**The response data is in the file, not in the return value.** Use Read or Grep to inspect it.

### discoverCommands

Discover available use cases on an app by calling `sys/getUseCases`.

```
{ action: "discoverCommands", config: "smarta-int", environment: "smarta-int", app: "cgmesio" }
```

Or with a direct baseUri:

```
{ action: "discoverCommands", config: "smarta-int", baseUri: "https://example.com/my-app/awid/" }
```

### callUuAppCommand

Call any use case (not pre-configured in config).

```
{
  action: "callUuAppCommand",
  config: "smarta-int",
  environment: "smarta-int",
  app: "cgmesio",
  useCase: "sys/getHealth",
  method: "GET"
}
```

## File-Based Output

Commands that call APIs write their response to `.uuapp-output/` in the workspace. The return value contains:

- `file` -- relative path to the output file
- `size` -- human-readable file size
- `format` -- json, markdown, or text
- `outputDescription` -- describes the response structure (from config)
- `preview` -- first 200 chars of the response

Use the `outputDescription` and `preview` to decide how to read the file:

- Small files: use Read tool to read the whole file
- Large files: use Grep to search for specific keys/values
- Very large files: use Shell (wc -l, head -n) for quick inspection

## Typical Workflows

**On-prem environment:**

```
1. executeSkill("uuapp-commands", { action: "listConfigs" })
2. executeSkill("uuapp-commands", { action: "login", config: "smarta-int", environment: "smarta-int" })
3. executeSkill("uuapp-commands", { action: "listCommands", config: "smarta-int" })
4. executeSkill("uuapp-commands", { action: "getCommandDetail", config: "smarta-int", environment: "smarta-int", app: "powergrid", command: "getNemo" })
5. executeSkill("uuapp-commands", { action: "callCommand", ..., dtoIn: { nemoId: "..." } })
6. Read the output file
```

**Plus4U environment:**

```
1. CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
2. executeSkill("uuapp-commands", { action: "listCommands", config: "plus4u-prod" })
3. executeSkill("uuapp-commands", { action: "getCommandDetail", config: "plus4u-prod", environment: "prod", app: "myApp", command: "listItems" })
4. executeSkill("uuapp-commands", { action: "callCommand", ..., dtoIn: { pageSize: 10 } })
5. Read the output file
```

## Config Structure

Configs are managed internally by the skill. **Do NOT read config files directly -- always use the skill actions.**
