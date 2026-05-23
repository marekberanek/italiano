---
name: mngkit-structure
description: Get Management Kit document structure with page hierarchy (uu-managementkit-maing02). Use to understand document structure before adding or navigating pages.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Management Kit Structure

Returns the document structure from Management Kit ECC API. Provides page list with OIDs and names.

## Prerequisites

**Authentication Required:** Call the `login` tool first.

## Usage

```
executeSkill({
  scriptPath: "<absolute path to mngkit-structure/skill.js>",
  params: { url: "https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={documentOid}" }
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
      "name": "Page 1"
    }
  ],
  "rawData": { ... }
}
```

## Key Fields

- `pageList[].pageOid` — Page OID (for constructing URLs with `&pageOid=`)
- `pageList[].name` — Page display name
- `documentOid` — Document OID (for API calls)
- `eccDocumentOid` — ECC document OID (internal)
- `rawData` — Full ECC response for advanced inspection

## When to Use

- Before adding pages with `mngkit-add-page` — to see existing pages and their OIDs
- Before reading specific pages with `mngkit-read` — to find the right pageOid
- When investigating document structure or debugging
