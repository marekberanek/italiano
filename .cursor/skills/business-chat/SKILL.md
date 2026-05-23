---
name: business-chat
description: Interact with Plus4U Business Chat service for questions and conversations. Use when the user wants to ask questions, get information, or have a conversation with the business chat. Maintains conversation context via conversationId.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Business Chat

Ask questions and have conversations with the Plus4U Business Chat service directly.

## Prerequisites

**Authentication Required:** Before using this skill, ALWAYS call the `login` tool first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

The login is idempotent - if already authenticated, it returns immediately.

## Usage via MCP

Use the `skilled-plus4u-mcp` MCP server to execute this skill:

```
executeSkill({ scriptPath: "<absolute path to business-chat/skill.js>", params: { message: "Your question" } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `baseUri` | No | uu-businesschat-maing01 base URI. Defaults to Product Hub business chat (`https://uuapp.plus4u.net/uu-businesschat-maing01/1c3914bd5677248f5e93f2406d4ad5b6/`) |
| `message` | Yes | The question or message to send to the chat |
| `conversationId` | No | 32-character ID to continue an existing conversation. If not provided, a new one is generated. |

### Example - New Conversation

```
executeSkill({ 
  scriptPath: "<absolute path to business-chat/skill.js>", 
  params: { 
    message: "How do I configure authentication?" 
  } 
})
```

### Example - Continue Conversation

```
executeSkill({ 
  scriptPath: "<absolute path to business-chat/skill.js>", 
  params: { 
    message: "Can you give me an example?",
    conversationId: "abc123def456..." 
  } 
})
```

## Response Structure

```json
{
  "conversationId": "32-character-conversation-id",
  "...": "response content from business chat"
}
```

## Key Fields

- `conversationId` - Store this value and pass it in subsequent calls to continue the conversation
- Response includes all data returned from the business chat service

## Conversation Management

The skill generates a conversation ID if not provided:

1. **First message**: Call without `conversationId` - a new one is generated automatically
2. **Store the ID**: Save `conversationId` from the response
3. **Continue**: Pass the stored `conversationId` in subsequent calls
4. **New conversation**: Omit `conversationId` to start fresh with a new ID

## Tips

- Keep questions clear and specific for better responses
- Use conversation continuation for follow-up questions to maintain context
- By default, the skill uses Product Hub business chat - override `baseUri` only if you need a different instance
