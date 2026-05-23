---
name: bookkit-add-page
description: Add a new page to a BookKit book (uu-bookkit-maing01). Use when the user wants to create, add, or insert a new page in a BookKit book structure. Supports "under" (child/subpage) and "after" (sibling) placement.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# BookKit Add Page

Add a new page to a BookKit book. Automatically resolves indent level and generates camelCase page code from the name.

## Prerequisites

**Authentication Required:** Call the `login` tool first.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `baseUri` | Yes | Base URI of the BookKit app |
| `under` | No | Page code — new page becomes a **child** (subpage) of this page |
| `after` | No | Page code — new page is placed **after** this page on the **same level** |
| `name` | Yes | Page name object: `{"en": "My Page"}` |
| `code` | No | Page code. Auto-generated as camelCase from name if omitted (letters only) |
| `visible` | No | Visible in navigation. Default: `true` |
| `desc` | No | Page description (UU5 string). Default: `<uu5string/>` |
| `previous` | No | Raw previous code (advanced — prefer `under`/`after`) |
| `indent` | No | Raw absolute indent (advanced — auto-calculated with `under`/`after`) |

`under` and `after` are mutually exclusive.

## How indent works

The book tree is a DFS-linearized list. Each page has an absolute `indent` level:
- 0 = top-level
- 1 = child of a top-level page
- 2 = grandchild, etc.

`previous` is the predecessor in this linear order (not the parent). When using `under` or `after`, the skill calls `getBookStructure` to resolve the correct `previous` and `indent` automatically.

## Examples

### Add a subpage under an existing page

```
executeSkill({
  scriptPath: "<absolute path to bookkit-add-page/skill.js>",
  params: {
    baseUri: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}",
    under: "60418489",
    name: { "en": "New Child Page" }
  }
})
```
→ code: `newChildPage`, indent: parent's indent + 1

### Add a page after an existing page (same level)

```
executeSkill({
  scriptPath: "<absolute path to bookkit-add-page/skill.js>",
  params: {
    baseUri: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}",
    after: "60418489",
    name: { "en": "Sibling Page" }
  }
})
```
→ code: `siblingPage`, indent: same as reference page

### Add with explicit code

```
executeSkill({
  scriptPath: "<absolute path to bookkit-add-page/skill.js>",
  params: {
    baseUri: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}",
    under: "60418489",
    code: "myCustomCode",
    name: { "en": "Custom Code Page" }
  }
})
```

## MANDATORY SAFETY RULES

### Rule 1: Confirm Before Adding
Always confirm the page name and position with the user before creating.

### Rule 2: Validate Name Object
Ensure `name` parameter is an object with at least one language key.
