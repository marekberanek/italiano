---
name: uu5-components
description: Search UU5 brick components and GDS icons. MUST use brickSearch before writing ANY uu5 component — training data contains outdated/wrong component names that pass validation but FAIL at runtime. Use brickDefinitionGet to get exact props. Use cheatsheet to load render-safety rules (colorScheme palette, legacy vs modern, RichText limits) before authoring content.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# UU5 Component Catalog

Search UU5 brick components, get their property definitions, and search GDS icons. Same data as uuAiChat's built-in component catalog (160 components, 1000+ icons).

## Source of Truth

`data/bricks.json` is the single source of truth for known modern UU5 brick tags and prop definitions in this repository. Do not duplicate component lists in other skills.

- `uu5-string-validator` loads this catalog automatically for component existence, required prop, and selected prop value checks.
- `brickSearch`, `brickDefinitionGet`, and validator diagnostics must therefore agree.
- If component metadata is missing or wrong, update this skill/catalog, not a separate registry in another skill.

The catalog intentionally focuses on modern brick metadata. Legacy `UU5.*` components can still work in BookKit/MngKit, but they are handled as compatibility warnings/rules, not as duplicated catalog entries.

## Prerequisites

No authentication needed — all data is bundled locally.

## MANDATORY Workflow

**WARNING:** Your training data contains OUTDATED and INCORRECT uu5 component names. Many components you "know" DO NOT EXIST or have different names.

Examples of WRONG components you might hallucinate:
- `Uu5Bricks.Divider` (DOES NOT EXIST)
- `Uu5Bricks.Separator` (DOES NOT EXIST)
- `Uu5Elements.Divider` (DOES NOT EXIST)

**You MUST follow this for EVERY component:**

1. BEFORE writing ANY uu5 component (per session):
   → Call `cheatsheet` action ONCE — it returns the render-safety rules (colorScheme palette, legacy `UU5.*` vs modern `Uu5*`, RichText limits, known crashers).
2. BEFORE writing ANY uu5 brick:
   → Call `brickSearch({ textQuery: "component name or functionality" })`
3. AFTER finding a component:
   → Call `brickDefinitionGet({ tagName: "exact.Tag.Name" })`
   → Use ONLY props from this definition
4. BEFORE using ANY icon:
   → Call `gdsIconSearch({ textQuery: "icon description" })`
   → Use ONLY icon codes returned by this search

## Modern vs Legacy components — quick rule

The catalog only lists **modern (`Uu5Bricks.*` from `uu5g05`)** components. Legacy (`UU5.Bricks.*` from `uu5g04`) components still work at runtime but have **different prop contracts**:

- `Uu5Bricks.Div` (modern) — only `margin` / `padding`. NO `style` prop.
- `UU5.Bricks.Div` (legacy) — accepts `style='<uu5json/>{…}'` for inline styling.

For visuals, prefer modern alternatives: `Uu5Bricks.Background`, `Uu5Bricks.Box`, `Uu5Bricks.Card`, `Uu5Bricks.InfoBlock`, `Uu5Bricks.Layout`. See cheatsheet §2.

The validator (`uu5-string-validator`) flags legacy components as informational warnings.

## Usage

```
executeSkill({
  scriptPath: "<absolute path to uu5-components/skill.js>",
  params: {
    action: "brickSearch",
    textQuery: "accordion collapsible panel"
  }
})
```

## Actions

### brickSearch

Find components by text query. Returns ranked results.

| Parameter | Required | Description |
|-----------|----------|-------------|
| textQuery | yes | Search query (e.g. "chart", "table", "layout") |
| library | no | Filter by library (e.g. "uu5Bricks", "uu5ChartsBricks") |
| limit | no | Max results (default: 10) |

**Returns:** `[{ tagName, library, description, propCount }]`

### brickDefinitionGet

Get full component definition with all properties.

| Parameter | Required | Description |
|-----------|----------|-------------|
| tagName | yes | Exact component tag (e.g. "Uu5Bricks.Section") |

**Returns:** `{ tagName, uu5ComponentLibrary, description, properties: { propName: { type, required, defaultValue, description } } }`

### gdsIconSearch

Search GDS icons by description.

| Parameter | Required | Description |
|-----------|----------|-------------|
| textQuery | yes | Icon description (e.g. "calendar", "user person") |
| category | no | Filter by category |
| limit | no | Max results (default: 5) |

**Returns:** `[{ code, name, category }]`

### list

List all components, optionally filtered by library.

| Parameter | Required | Description |
|-----------|----------|-------------|
| library | no | Filter by library name |

**Returns:** Component list grouped by library with counts.

### cheatsheet

Returns the full render-safety rules document (`shared/uu5-render-rules.md`) — colorScheme palette, modern vs legacy components, `UU5.RichText.Block` limits, `uu5json` escaping rules, component-specific gotchas, and the pre-upload checklist.

| Parameter | Required | Description |
|-----------|----------|-------------|
| _(none)_  |          | No parameters |

**Returns:** `{ source: "<absolute path>", content: "<markdown>" }`

Call this **once per session** before authoring any uu5string content. The same rules are also enforced automatically by `uu5-string-validator` when called via the catalog-aware mode (default).

## Available Libraries

| Library | Components |
|---------|-----------|
| uu5Bricks | 60 |
| Plus4U5Elements | 44 |
| uu5BricksForms | 35 |
| uu5ImagingBricks | 9 |
| uu5ChartsBricks | 5 |
| uu5AnimationBricks | 2 |
| uu5TilesBricks | 1 |
| uu5CodeKitBricks | 1 |
| uu5RichTextBricks | 1 |
| uu5TreeBricks | 1 |
| uu5MathBricks | 1 |

## Examples

### Find a component for horizontal line

```
brickSearch({ textQuery: "horizontal line divider separator" })
→ Returns actual components (NOT hallucinated Uu5Bricks.Divider)
→ If nothing found, use <hr/> as fallback
```

### Get Section component props

```
brickDefinitionGet({ tagName: "Uu5Bricks.Section" })
→ { tagName, properties: { header, level, collapsible, actionList, ... } }
```

### Find chart components

```
brickSearch({ textQuery: "chart", library: "uu5ChartsBricks" })
→ XyChart, PieChart, RadarChart, RadialBarChart, BarChart
```

### Find calendar icon

```
gdsIconSearch({ textQuery: "calendar date schedule" })
→ [{ code: "uugds-calendar", name: "Calendar" }, ...]
```
