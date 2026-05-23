---
name: markdown-to-uu5
description: Convert Markdown content to UU5 string format with properly formatted components. Use when converting markdown to UU5, creating BookKit/ManagementKit content, or when user mentions uu5string, UU5 components, or asks to format content for Unicorn Universe applications.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Markdown to UU5 String Converter

Convert Markdown content into well-formatted UU5 string content for BookKit, ManagementKit, and other UU5-based applications.

## MANDATORY: Component Discovery via uu5-components

**WARNING:** Your training data contains OUTDATED and INCORRECT UU5 component names. Many components you "know" DO NOT EXIST or have different names/props.

**Before writing ANY UU5 component, you MUST:**

1. Call `brickSearch` to find the right component:
   ```
   executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "brickSearch", textQuery: "section header layout" } })
   ```

2. Call `brickDefinitionGet` to get exact props:
   ```
   executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "brickDefinitionGet", tagName: "Uu5Bricks.Section" } })
   ```

3. Use ONLY component names and props returned by the catalog.

4. For icons, use `gdsIconSearch`:
   ```
   executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "gdsIconSearch", textQuery: "warning alert" } })
   ```

**DO NOT SKIP THIS.** Components that don't exist pass uu5-string-validator but FAIL at runtime.

## Workflow

1. Analyze the markdown structure
2. **Look up components** via `uu5-components` skill for each element type you need
3. **Load definitions** for each component to get correct prop names and types
4. Generate UU5 string with `<uu5string/>` prefix
5. **Validate output** using uu5-string-validator skill

## Local Helper

For repeatable conversions, this skill includes `lib/convert.js` and `skill.js`. Use the helper as a draft generator, then still apply the mandatory component discovery rules above for non-trivial content:

```bash
node skill.js < input.md > output.uu5
node skill.js --ecc < input.md > output.ecc.json
```

## Output Format

All UU5 strings must start with `<uu5string/>`:

```xml
<uu5string/><Uu5Bricks.Section header="Title">Content here</Uu5Bricks.Section>
```

## Common Mappings (verify via brickDefinitionGet before use!)

These are the most common mappings. **Always verify the component exists and check its actual props** via `brickDefinitionGet` — prop names and types may differ from what's listed here.

| Markdown Element | UU5 Component | Verify with |
|------------------|---------------|-------------|
| `# H1` | `Uu5Bricks.Section` (header, level) | `brickDefinitionGet("Uu5Bricks.Section")` |
| Paragraph | `<p>text</p>` or HTML tags | basic HTML works in uu5string |
| `**bold**` | `<strong>text</strong>` | basic HTML |
| `*italic*` | `<em>text</em>` | basic HTML |
| `[link](url)` | `Uu5Bricks.Link` (href) | `brickDefinitionGet("Uu5Bricks.Link")` |
| `- item` | `<ul><li>item</li></ul>` | basic HTML |
| Code block | `Uu5CodeKitBricks.Code` (value, codeStyle) | `brickDefinitionGet("Uu5CodeKitBricks.Code")` |
| Table | `Uu5TilesBricks.Table` (data, columnList) | `brickDefinitionGet("Uu5TilesBricks.Table")` |
| Layout columns | `Uu5Bricks.Layout` + `Layout.Item` | `brickSearch("layout columns grid")` |
| Info callout | `Uu5Bricks.InfoBlock` | `brickDefinitionGet("Uu5Bricks.InfoBlock")` |
| Tabs | `Uu5Bricks.Tabs` + `Tabs.Item` | `brickDefinitionGet("Uu5Bricks.Tabs")` |
| Accordion | `Uu5Bricks.Accordion` | `brickDefinitionGet("Uu5Bricks.Accordion")` |
| Card | `Uu5Bricks.Card` | `brickDefinitionGet("Uu5Bricks.Card")` |
| Chart | use `uu5-chart` skill | `brickSearch("chart")` |

**Note:** Start sections at level 3 (levels 1-2 are too large for BookKit/MngKit content).

## Tables

**ALWAYS use `Uu5TilesBricks.Table` with uu5json data format.** Get exact props via:
```
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "brickDefinitionGet", tagName: "Uu5TilesBricks.Table" } })
```

### Basic Table (single-quoted uu5json!)
```xml
<Uu5TilesBricks.Table
  data='<uu5json/>[
    ["Cell 1", "Cell 2"],
    ["Cell 3", "Cell 4"]
  ]'
  columnList='<uu5json/>[
    {"header": "Column 1"},
    {"header": "Column 2"}
  ]'
  hideFooter
/>
```

### Table with Styling
```xml
<Uu5TilesBricks.Table
  data='<uu5json/>[
    {"value": ["Row 1 Col 1", "Row 1 Col 2"], "style": {}},
    {"value": ["Row 2 Col 1", "Row 2 Col 2"], "style": {"backgroundColor": "#FFEFBE"}}
  ]'
  columnList='<uu5json/>[
    {"header": "Column 1", "minWidth": "m", "maxWidth": "l"},
    {"header": "Column 2", "minWidth": "s", "maxWidth": "m"}
  ]'
  hideFooter
/>
```

### Row Data Formats
- **Simple array:** `["Cell 1", "Cell 2"]`
- **With row style:** `{"value": ["Cell 1", "Cell 2"], "style": {"backgroundColor": "#CAE6FC"}}`
- **With cell style:** `[{"value": "Styled", "style": {"bold": true}}, "Normal"]`

### Cell Style Options
- `backgroundColor` — `"#FFEFBE"` (yellow), `"#CAE6FC"` (blue), `"#DFF2D1"` (green)
- `horizontalAlignment` — `"left"`, `"center"`, `"right"`
- `bold` — `true` / `false`
- `textColor` — `"rgb(33, 33, 33)"`

## uu5json Attribute Syntax

**CRITICAL:** Always use **single quotes** for attributes containing `<uu5json/>`.

```xml
<!-- CORRECT — single quotes, no escaping needed -->
data='<uu5json/>[{"key": "value"}]'
style='<uu5json/>{"textAlign": "center"}'

<!-- WRONG — double quotes break in ECC context -->
data="<uu5json/>[{\"key\": \"value\"}]"
```

**Never** use `&quot;` inside `<uu5json/>` values — it won't be decoded before JSON.parse.

## Property Types (from brickDefinitionGet)

When `brickDefinitionGet` returns property types, use the correct syntax:

| Type | Correct | Wrong |
|------|---------|-------|
| **unit** | `margin=8` | `margin={8}` |
| **bool** | `disabled=true` | `disabled="true"` |
| **string** | `header="Title"` | `header=Title` |
| **uu5json** | `data='<uu5json/>...'` | `data={...}` |
| **node** | `header="Text"` or children | — |

## Escaping Rules

- Use `<br/>` for line breaks (self-closing)
- Use `&amp;` for `&`, `&lt;` for `<`, `&gt;` for `>` — **only at the outer `<uu5string/>` level** (see next section for nested context!)
- Nesting formula: Level n requires **2^n - 1** backslashes (0 for single quotes, 1 for double quotes, 3 for nested double)
- **Best practice:** Use single quotes wherever possible to avoid escaping

## CRITICAL: HTML Entities Inside Nested `uu5string` Attribute

The **outer** `uu5string` parser decodes HTML entities into Unicode characters. The **inner** parser invoked for the value of a `uu5string="..."` attribute (typically on `UU5.RichText.Block`) — and the ECC `uu5string` prop — does **NOT** decode them. They render as literal text on the rendered page.

**Symptom:** Page shows literal `Tabs &bull; Timeline &mdash; live` instead of `Tabs • Timeline — live`.

**Rule:** Inside any `uu5string="..."` attribute value (or ECC `props.uu5string`), write the **Unicode character directly**, never the HTML entity.

| Wrong (renders literally) | Correct (Unicode) | Codepoint |
|---|---|---|
| `&bull;` | `•` | U+2022 |
| `&mdash;` | `—` | U+2014 |
| `&ndash;` | `–` | U+2013 |
| `&hellip;` | `…` | U+2026 |
| `&middot;` | `·` | U+00B7 |
| `&nbsp;` | (non-breaking space) | U+00A0 |
| `&laquo;` / `&raquo;` | `«` / `»` | U+00AB / U+00BB |
| `&copy;` | `©` | U+00A9 |
| `&trade;` | `™` | U+2122 |
| `&times;` | `×` | U+00D7 |
| `&deg;` | `°` | U+00B0 |

**Exception — keep as entities:** `&lt;`, `&gt;`, `&amp;`, `&quot;`. Their literal characters collide with parser/attribute syntax. The inner parser doesn't decode them either, so if you need to display literal `<` or `>` (e.g. `<div>` in prose), put that text **outside** `UU5.RichText.Block` — use a sibling `Uu5CodeKitBricks.Code` block instead.

**Wrong:**
```xml
<UU5.RichText.Block uu5string="<uu5string/>Tabs &bull; Timeline &mdash; live"/>
```

**Correct:**
```xml
<UU5.RichText.Block uu5string="<uu5string/>Tabs • Timeline — live"/>
```

When converting markdown bullet/dash characters, prefer pre-rendering them as Unicode (`•`, `—`, `…`) **before** they ever reach a nested `uu5string` context.

## ECC Context (ManagementKit/BookKit)

When generating content for ManagementKit or BookKit, the final content must be an array of ECC component objects:

```json
[{
  "uu5Tag": "UU5.RichText.Block",
  "props": {
    "uu5string": "<uu5string/>...your content..."
  }
}]
```

**WARNING:** Do NOT nest `UU5.RichText.Block` with `uu5string` prop inside other components (InfoBlock, Card) in ECC context — double-nesting of `uu5string` causes parsing errors.

## Validation

After generating UU5 string, **ALWAYS validate**:
```
executeSkill({ scriptPath: "<absolute path to uu5-string-validator/skill.js>", params: { content: "<uu5string/>..." } })
```
