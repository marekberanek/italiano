---
name: mngkit-add-page
description: Add a new page to a Management Kit document (uu-managementkit-maing02). Use when the user wants to create, add, or insert a new page in a ManagementKit document structure. Supports placement after an existing page.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Management Kit Add Page

Add a new page to a Management Kit document.

## Prerequisites

**Authentication Required:** Call the `login` tool first.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | No* | ManagementKit document URL (extracts baseUri + documentOid) |
| `baseUri` | No* | Base URI for API calls (from mngkit-read response) |
| `documentOid` | No* | Document OID (from mngkit-read response) |
| `name` | Yes | Page name (display name for the new page) |
| `previousPageOid` | No | Page OID after which to insert the new page. If omitted, page is added at the end. |
| `hidden` | No | Whether page is hidden in navigation. Default: `false` |

*Either `url` or both `baseUri` + `documentOid` are required.

## Examples

### Add page using document URL

```
executeSkill({
  scriptPath: "<absolute path to mngkit-add-page/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={documentOid}",
    name: "New Page"
  }
})
```

### Add page after a specific page

First list existing pages to get pageOids:

```
executeSkill({ scriptPath: "<absolute path to mngkit-list-pages/skill.js>", params: { url: "DOCUMENT_URL" } })
```

Then add the page after a specific one:

```
executeSkill({
  scriptPath: "<absolute path to mngkit-add-page/skill.js>",
  params: {
    url: "DOCUMENT_URL",
    name: "New Page",
    previousPageOid: "pageOid-from-list-pages"
  }
})
```

### Add page using baseUri + documentOid (from mngkit-read)

```
executeSkill({
  scriptPath: "<absolute path to mngkit-add-page/skill.js>",
  params: {
    baseUri: "https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}",
    documentOid: "value-from-mngkit-read",
    name: "New Page"
  }
})
```

## Workflow

1. **List pages** (optional): Call `mngkit-list-pages` to see existing pages and get `pageOid` values for placement
2. **Add page**: Call `mngkit-add-page` with the new page name and optional `previousPageOid`
3. **Add content**: After the page is created, use `mngkit-read` to get the new page's OIDs, then `mngkit-update` with `action: "add"` to create sections with content

## MANDATORY SAFETY RULES

### Rule 1: Confirm Before Adding
Always confirm the page name and position with the user before creating.

### Rule 2: Note on API
The `document/ecc/document/addPage` API is used. If it returns an error, the endpoint may differ — report the exact error for debugging.
