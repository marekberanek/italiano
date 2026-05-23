---
name: aichat-instructions
description: Manage uuAiChat instruction sets, instructions (AI tools), and environments. Use when creating, listing, updating, or deleting uuAssistantInstructionSets, uuAssistantInstructions, or uuAssistantInstructionSetEnvironments in any uuAiChat instance.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# uuAiChat Instructions Manager

Create, list, update, and delete instruction sets, instructions (AI tools), and instruction set environments in uuAiChat.

## Prerequisites

**Authentication Required:** Call `login` on `skilled-plus4u-mcp` first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

## Usage via MCP

```
executeSkill({
  scriptPath: "<absolute path to aichat-instructions/skill.js>",
  params: {
    action: "createInstructionSet",
    baseUri: "https://uuapp.plus4u.net/uu-aichat-maing01/{awid}",
    dtoIn: { ... }
  }
})
```

## Actions

### Instruction Set

| Action | Description |
|--------|-------------|
| `createInstructionSet` | Create a new instruction set |
| `listInstructionSets` | List all instruction sets |
| `getInstructionSet` | Get instruction set by code or oid |
| `updateInstructionSet` | Update instruction set |
| `deleteInstructionSet` | Delete instruction set |
| `learnInstructionSet` | Learn/index instruction set |

### Instruction (AI Tool)

| Action | Description |
|--------|-------------|
| `createInstruction` | Create a new instruction (tool) |
| `listInstructions` | List all instructions |
| `getInstruction` | Get instruction by code or oid |
| `updateInstruction` | Update instruction |
| `deleteInstruction` | Delete instruction |

### Instruction Set Environment

| Action | Description |
|--------|-------------|
| `createEnvironment` | Create environment for an instruction set |
| `getEnvironment` | Get environment by oid |
| `getEnvironmentByUser` | Get environment for current user |
| `updateEnvironment` | Update environment |
| `listEnvironments` | List environments |
| `deleteEnvironment` | Delete environment |

## Built-in Validation (OpenAI Schema Compliance)

The skill validates instruction definitions **before** sending them to uuAiChat, catching issues that uuAiChat's own validation doesn't enforce but OpenAI rejects at runtime:

| Rule | What it checks | Error if violated |
|------|---------------|-------------------|
| **Array items required** | `type: "array"` must have `"items": { "type": "..." }` | OpenAI rejects `tools[N].parameters` |
| **Items type required** | `items` must contain `type` | Invalid function schema |
| **Object properties typed** | Each property in `type: "object"` must have `type` | Invalid parameter definition |
| **Method uppercase** | `uuCommandMethod` must be `"GET"` or `"POST"` | uuAiChat invalidDtoIn |

### Common Pitfalls

```jsonc
// BAD — array without items (OpenAI will reject this at runtime!)
{ "name": "idList", "type": "array", "desc": "...", "isRequired": false }

// GOOD — array with items type
{ "name": "idList", "type": "array", "desc": "...", "isRequired": false,
  "items": { "type": "string" } }
```

## Examples

### Create Instruction Set

```
executeSkill({
  scriptPath: "<absolute path to aichat-instructions/skill.js>",
  params: {
    action: "createInstructionSet",
    baseUri: "https://uuapp.plus4u.net/uu-aichat-maing01/{awid}",
    dtoIn: {
      code: "myToolSet",
      name: "My Tool Set",
      desc: "Tools for my domain.\n\nRules:\n1) ...",
      version: "1.0.0",
      requiredBaseUriList: ["targetAppBaseUri"],
      environmentAttributeList: [
        {
          key: "targetAppBaseUri",
          description: "Base URI of the target application",
          example: "https://uuapp.plus4u.net/...",
          isRequired: true
        }
      ]
    }
  }
})
```

### Create CMD Instruction (Tool)

```
executeSkill({
  scriptPath: "<absolute path to aichat-instructions/skill.js>",
  params: {
    action: "createInstruction",
    baseUri: "https://uuapp.plus4u.net/uu-aichat-maing01/{awid}",
    dtoIn: {
      code: "myToolGet",
      name: "Get My Entity",
      desc: "Gets entity details by ID.",
      uuAssistantInstructionSetCodeList: ["myToolSet"],
      uuCommandUseCase: "myEntity/get",
      uuCommandMethod: "get",
      uuCommandBaseUriEnvironmentKey: "targetAppBaseUri",
      uuAssistantToolDescription: "Gets entity details by ID.\n\nInputs:\n- id (required): Entity ID\n\nOutput on success: { id, name, state, ... }\nOutput on error: { isError: true, errorCode, hint }",
      uuAssistantDtoInAttributesDefinitionList: [
        {
          name: "id",
          type: "string",
          desc: "Entity ID to retrieve.",
          isRequired: true
        }
      ]
    }
  }
})
```

### Create Environment (set runtime config)

```
executeSkill({
  scriptPath: "<absolute path to aichat-instructions/skill.js>",
  params: {
    action: "createEnvironment",
    baseUri: "https://uuapp.plus4u.net/uu-aichat-maing01/{awid}",
    dtoIn: {
      instructionSetCode: "myToolSet",
      environmentData: {
        targetAppBaseUri: "https://uuapp.plus4u.net/my-app/my-awid"
      }
    }
  }
})
```

### List Instruction Sets

```
executeSkill({
  scriptPath: "<absolute path to aichat-instructions/skill.js>",
  params: {
    action: "listInstructionSets",
    baseUri: "https://uuapp.plus4u.net/uu-aichat-maing01/{awid}"
  }
})
```

### Get Instruction

```
executeSkill({
  scriptPath: "<absolute path to aichat-instructions/skill.js>",
  params: {
    action: "getInstruction",
    baseUri: "https://uuapp.plus4u.net/uu-aichat-maing01/{awid}",
    dtoIn: { code: "myToolGet" }
  }
})
```
