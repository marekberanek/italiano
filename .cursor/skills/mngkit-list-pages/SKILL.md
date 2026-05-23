---
name: mngkit-list-pages
description: List all pages in a Management Kit document (uu-managementkit-maing02). Use when the user wants to see the document structure, list pages, or get an overview of available content. Can save to file for grep/search operations.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Management Kit Page Lister

List all pages in a Management Kit document with their OIDs, names, and order.

## Prerequisites

**Authentication Required:** Before using this skill, ALWAYS call the `login` tool first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

The login is idempotent - if already authenticated, it returns immediately.

## Usage via MCP

Use the `skilled-plus4u-mcp` MCP server to execute this skill:

```
executeSkill({ scriptPath: "<absolute path to mngkit-list-pages/skill.js>", params: { url: "DOCUMENT_URL" } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | ManagementKit document URL |
| `outputFile` | No | Path to save output as JSON for grep/search |

### Examples

**List pages (return in response):**

```
executeSkill({ 
  scriptPath: "<absolute path to mngkit-list-pages/skill.js>", 
  params: { 
    url: "https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={documentOid}" 
  } 
})
```

**Save to file for searching:**

```
executeSkill({ 
  scriptPath: "<absolute path to mngkit-list-pages/skill.js>", 
  params: { 
    url: "https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={documentOid}",
    outputFile: "/tmp/mngkit-pages.json"
  } 
})
```

## Response Structure

```json
{
  "documentName": "My Document",
  "documentOid": "...",
  "eccDocumentOid": "...",
  "pageList": [
    {
      "pageOid": "...",
      "name": "Page 1",
      "hidden": false,
      "order": 0
    }
  ],
  "pageCount": 5
}
```

## Key Fields

- `pageList[].pageOid` — Page OID (use with `mngkit-read` by constructing URL with `&pageOid=`)
- `pageList[].name` — Page display name
- `pageList[].hidden` — Whether page is hidden in navigation
- `pageList[].order` — Page order in the document

## Context Optimization: File-Based I/O

The MCP server supports generic file-based I/O to avoid loading large content into the chat context:

- **Large output**: Use `outputFile` parameter to save to file, or `outputFile: true` on `executeSkill` to write result to /tmp
