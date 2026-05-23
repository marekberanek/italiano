---
name: bookkit-list-pages
description: List all pages in a BookKit book (uu-bookkit-maing01). Use when the user wants to see the book structure, list pages, or get an overview of available content. Can save to file for grep/search operations.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# BookKit Page Lister

List all pages in a BookKit book with their codes, names, and hierarchy.

## Prerequisites

**Authentication Required:** Before using this skill, ALWAYS call the `login` tool first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

The login is idempotent - if already authenticated, it returns immediately.

## Usage via MCP

Use the `skilled-plus4u-mcp` MCP server to execute this skill:

```
executeSkill({ scriptPath: "<absolute path to bookkit-list-pages/skill.js>", params: { url: "BOOKKIT_URL" } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | Any BookKit URL from the book |
| `outputFile` | No | Path to save output as JSON for grep/search |

### Examples

**List pages (return in response):**

```
executeSkill({ 
  scriptPath: "<absolute path to bookkit-list-pages/skill.js>", 
  params: { 
    url: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code=home" 
  } 
})
```

**Save to file for searching:**

```
executeSkill({ 
  scriptPath: "<absolute path to bookkit-list-pages/skill.js>", 
  params: { 
    url: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code=home",
    outputFile: "/tmp/bookkit-pages.json"
  } 
})
```

Then use grep:

```bash
grep -i "search term" /tmp/bookkit-pages.json
```

## Response Structure

**Direct response (no outputFile):**

```json
{
  "itemList": [
    {
      "code": "home",
      "name": "Home",
      "indent": 0,
      "visible": true,
      "desc": "..."
    },
    {
      "code": "chapter1",
      "name": "Chapter 1",
      "indent": 1,
      "visible": true
    }
  ],
  "pageInfo": {
    "pageIndex": 0,
    "pageSize": 1000,
    "total": 50
  }
}
```

**File output (with outputFile):**

```json
{
  "message": "Saved 50 pages to /tmp/bookkit-pages.json",
  "pageCount": 50,
  "outputFile": "/tmp/bookkit-pages.json"
}
```

The saved file contains:
- `summary` - Human-readable tree view for quick scanning
- `pages` - Full page data array
- `pageInfo` - Pagination metadata

## Context Optimization: File-Based I/O

The MCP server supports generic file-based I/O to avoid loading large content into the chat context:

- **Large input**: Save params to a JSON file, pass path via `inputFile` parameter on `executeSkill`
- **Large output**: Use `outputFile: true` on `executeSkill` to write result to /tmp and get only summary back

This is handled automatically by the MCP server - the skill receives normal params either way.

## Key Fields

- `itemList[].code` - Page code (use with bookkit-read)
- `itemList[].name` - Page display name
- `itemList[].indent` - Hierarchy level (0 = root, 1 = child, etc.)
- `itemList[].visible` - Whether page is visible in navigation
