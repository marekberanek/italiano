---
name: mngkit-read
description: Read and load Management Kit (mngkit) pages and documents from uu-managementkit-maing02. Use when the user wants to read, view, load, or inspect mngkit documents, pages, or their content. Handles authentication via skilled-plus4u-mcp and returns UU5 string content.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Management Kit Page Reader

Read and inspect Management Kit documents and pages from uu-managementkit-maing02.

## Prerequisites

**Authentication Required:** Before using this skill, ALWAYS call the `login` tool first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

The login is idempotent - if already authenticated, it returns immediately.

**Batch Reading:** To read multiple documents in one call, use `batchExecuteSkill`:

```
CallMcpTool({
  server: "skilled-plus4u-mcp",
  toolName: "batchExecuteSkill",
  arguments: {
    scriptPath: "<absolute path to mngkit-read/skill.js>",
    paramsList: [
      { url: "DOCUMENT_URL_1" },
      { url: "DOCUMENT_URL_2" }
    ]
  }
})
```

## Usage via MCP

Use the `skilled-plus4u-mcp` MCP server to execute this skill:

```
executeSkill({ scriptPath: "<absolute path to mngkit-read/skill.js>", params: { url: "DOCUMENT_URL" } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | ManagementKit document URL |

### Example

```
executeSkill({ 
  scriptPath: "<absolute path to mngkit-read/skill.js>", 
  params: { 
    url: "https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={documentOid}&pageOid={pageOid}" 
  } 
})
```

## Response Structure

```javascript
{
  baseUri: "...",              // for API calls
  documentOid: "...",          // for updates
  pageOid: "...",              // current page
  eccDocumentOid: "...",       // ECC document OID
  content: {
    name: "Document name",
    pageList: [                // navigation only (no content/panels!)
      { pageOid: "...", name: "...", hidden: false }
    ],
    requestedPage: {           // <-- ACTUAL PAGE DATA IS HERE
      name: "Page name",
      mainPanelOid: "...",     // <-- panelOid for mngkit-create-section
      topSectionOid: "...",    // FORBIDDEN - never write here
      bottomSectionOid: "...", // FORBIDDEN - never write here
      mainPanel: {
        oid: "...",            // same as mainPanelOid
        sectionList: [{
          sectionOid: "...",   // for mngkit-update
          content: [{ uu5Tag, props, children }]
        }]
      }
    }
  }
}
```

## CRITICAL: Where to Find Data

- **Page content** is in `content.requestedPage` — NOT in `content.pageList[]`
- `content.pageList[]` is only a navigation index (pageOid + name, no panels/sections)
- **panelOid** for `mngkit-create-section` = `content.requestedPage.mainPanelOid` or `content.requestedPage.mainPanel.oid`
- **sectionOid** for `mngkit-update` = `content.requestedPage.mainPanel.sectionList[].sectionOid`
- If `sectionList` is empty → page has no sections, use `mngkit-create-section` first

## Key Fields

- `baseUri` - Base URI for API calls (needed for updates)
- `documentOid` - Document OID (needed for updates)
- `content.requestedPage.mainPanelOid` - Panel OID (needed for creating sections)
- `content.requestedPage.mainPanel.sectionList[]` - Content sections
- `sectionList[].sectionOid` - Section OID (needed for updates)
