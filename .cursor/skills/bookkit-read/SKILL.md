---
name: bookkit-read
description: Read and load BookKit (uu-bookkit-maing01) pages and documents. Use when the user wants to read, view, load, or inspect BookKit pages, their sections, or content. Handles authentication via skilled-plus4u-mcp and returns UU5 string content.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# BookKit Page Reader

Read and inspect BookKit documents and pages from uu-bookkit-maing01.

## Prerequisites

**Authentication Required:** Before using this skill, ALWAYS call the `login` tool first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

The login is idempotent - if already authenticated, it returns immediately.

**Batch Reading:** To read multiple pages in one call, use `batchExecuteSkill`:

```
CallMcpTool({
  server: "skilled-plus4u-mcp",
  toolName: "batchExecuteSkill",
  arguments: {
    scriptPath: "<absolute path to bookkit-read/skill.js>",
    paramsList: [
      { url: "PAGE_URL_1" },
      { url: "PAGE_URL_2" }
    ]
  }
})
```

## Usage via MCP

Use the `skilled-plus4u-mcp` MCP server to execute this skill:

```
executeSkill({ scriptPath: "<absolute path to bookkit-read/skill.js>", params: { url: "PAGE_URL" } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | BookKit page URL |

### Example

```
executeSkill({ 
  scriptPath: "<absolute path to bookkit-read/skill.js>", 
  params: { 
    url: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code={pageCode}" 
  } 
})
```

## Response Structure

```json
{
  "code": "pageCode",
  "name": "Page Name",
  "body": [
    {
      "code": "sectionCode",
      "content": "<uu5string/>...",
      "sys": { "rev": 0 }
    }
  ]
}
```

## Key Fields

- `body[]` - Array of content sections
- `body[].code` - Section code (needed for updates)
- `body[].content` - UU5 string content
- `body[].sys.rev` - Revision number (needed for updates)
