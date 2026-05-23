---
name: bookkit-structure
description: Get BookKit book tree structure with indent levels. Use to understand page hierarchy before adding or moving pages.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# BookKit Structure

Returns the full book tree from `getBookStructure` API. Each page in `itemMap` has:

- `indent` — absolute depth (0 = top-level)
- `previous` / `next` — DFS-linearized order links
- `label` — page name object
- `state` — page state
- `visible` — navigation visibility

## Usage

```
executeSkill({
  scriptPath: "<absolute path to bookkit-structure/skill.js>",
  params: { url: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code=anyPage" }
})
```

## Prerequisites

**Authentication Required:** Call the `login` tool first.
