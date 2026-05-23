---
name: mngkit-update
description: Update existing or add new sections in Management Kit (mngkit) documents in uu-managementkit-maing02. Use when the user wants to edit, update, modify, add sections, or save mngkit documents, pages, or sections. Requires loading content first, user confirmation, and UU5 string validation.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Management Kit Page Editor

Update existing sections or add new sections to Management Kit documents in uu-managementkit-maing02.

## Prerequisites

**Authentication Required:** Before using this skill, ALWAYS call the `login` tool first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

The login is idempotent - if already authenticated, it returns immediately.

## CRITICAL: Read First Required!

**You MUST call `mngkit-read` first** to get the required OIDs. These cannot be guessed - they must come from the read response.

- **For UPDATE**: Need `baseUri`, `documentOid`, `sectionOid`
- **For ADD**: Need `baseUri`, `documentOid`, `panelOid` (= `mainPanelOid` or `mainPanel.oid`)

## FORBIDDEN: Never Write to topSection or bottomSection

**topSectionOid and bottomSectionOid are STRICTLY FORBIDDEN as sectionOid targets.**
Content written to these OIDs does NOT render visibly in ManagementKit. The API accepts the write silently but the page appears empty. This is enforced at code level and the skill will reject any attempt.

- **NEVER** use `topSectionOid` or `topSection.oid` as `sectionOid`
- **NEVER** use `bottomSectionOid` or `bottomSection.oid` as `sectionOid`
- **ONLY** use OIDs from `mainPanel.sectionList[].sectionOid`

## Usage via MCP

Use the `skilled-plus4u-mcp` MCP server to execute this skill:

```
executeSkill({ scriptPath: "<absolute path to mngkit-update/skill.js>", params: { ... } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `baseUri` | **Yes** | mngkit-read response `baseUri` |
| `documentOid` | **Yes** | mngkit-read response `documentOid` |
| `action` | No | `"update"` (default) or `"add"` |
| `sectionOid` | **For update** | mngkit-read response `sections[].oid` (from `mainPanel.sectionList`) |
| `panelOid` | **For add** | mngkit-read response `mainPanelOid` or `mainPanel.oid` |
| `orderIndex` | For add only | Position where to insert (1-based). Defaults to 1. |
| `content` | No* | Array of ECC component objects `[{uu5Tag, props, children}, ...]` |
| `contentFilePath` | No* | Path to JSON file with ECC component array |

*Either `content` or `contentFilePath` is required.

### Add a New Section

**Step 1:** Load the page to get panelOid:
```
executeSkill({ scriptPath: "<absolute path to mngkit-read/skill.js>", params: { url: "DOCUMENT_URL" } })
```
Response contains: `content.requestedPage.mainPanelOid` and `content.requestedPage.mainPanel.sectionList[]`

**Step 2:** Add with correct position:
```
executeSkill({ 
  scriptPath: "<absolute path to mngkit-update/skill.js>", 
  params: { 
    baseUri: "value-from-step1",
    documentOid: "value-from-step1",
    action: "add",
    panelOid: "value-from-mainPanelOid",
    orderIndex: 1,
    contentFilePath: "/tmp/content_ecc.json"
  } 
})
```

### Update an Existing Section

**Step 1:** Load the page to get OIDs:
```
executeSkill({ scriptPath: "<absolute path to mngkit-read/skill.js>", params: { url: "DOCUMENT_URL" } })
```
Response contains: `baseUri`, `documentOid`, `mainPanel.sectionList[].sectionOid`

**Step 2:** Update with values from step 1:
```
executeSkill({ 
  scriptPath: "<absolute path to mngkit-update/skill.js>", 
  params: { 
    baseUri: "value-from-step1",
    documentOid: "value-from-step1",
    sectionOid: "value-from-mainPanel.sectionList[].sectionOid",
    contentFilePath: "/tmp/content_ecc.json"
  } 
})
```

**HARD BLOCK:** The skill will throw an error if `sectionOid` matches any `topSectionOid` or `bottomSectionOid` across all pages. Always target `mainPanel.sectionList[]`.

### Content Format — ECC Component Array

Content must be a **JSON array of ECC component objects**, NOT raw uu5string. Each object has `uu5Tag`, `props`, and optionally `children` (array of nested ECC objects). Formatted text MUST be wrapped in `Uu5RichTextBricks.Block`. Other structural components (sections, headers, tables) can appear alongside it as separate ECC entries.

**CRITICAL tag naming:** Use `Uu5Bricks`, `Uu5RichTextBricks`, `Uu5TilesBricks` — NOT `UU5.Bricks`, NOT `UU5.RichText.Block`.

**NEVER** use `UU5Bricks.P` for formatted text — always `Uu5RichTextBricks.Block`.

#### Sections (headings with nested content)

```json
[{
  "uu5Tag": "Uu5Bricks.Section",
  "props": { "header": "Section Title" },
  "children": [
    { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "Text content" } }
  ]
}]
```

Sections can be nested — a child `Uu5Bricks.Section` inside the `children` array creates a subsection.

#### Text blocks

```json
{ "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "Plain text or uu5string markup" } }
```

Content inside the `uu5String` prop value:

- Can be plain text (no prefix needed) or uu5string with formatting tags (see below)
- If using uu5string markup, start with `<uu5string/>`
- Use proper UU5 component names with properly closed tags

#### Tables

```json
{
  "uu5Tag": "Uu5TilesBricks.Table",
  "props": {
    "tag": null,
    "props": "<uu5json/>{}",
    "data": "<uu5json/>[\n  [\"cell1\", \"cell2\"],\n  [\"cell3\", \"cell4\"]\n]",
    "columnList": "<uu5json/>[\n  {\"header\": \"Column 1\"},\n  {\"header\": \"Column 2\"}\n]"
  }
}
```

- `data`: `<uu5json/>` followed by a JSON array of rows, each row is an array of cell values (strings)
- `columnList`: `<uu5json/>` followed by a JSON array of column definitions with `header` property

### Code Blocks — Use Uu5CodeKitBricks.Code

For code snippets or technical content, use `Uu5CodeKitBricks.Code` as a separate ECC entry — **NOT** inside `Uu5RichTextBricks.Block`.

```json
[{
  "uu5Tag": "Uu5CodeKitBricks.Code",
  "props": {
    "value": "let x = \"50\";\n\nconst funkce = () => {\n  console.log(\"ja sem franta!!\")\n}",
    "codeStyle": "javascript"
  }
}]
```

Supported `codeStyle` values: `javascript`, `java`, `php`, `yaml`, `json`, `sh`, `batch`, `docker`, `golang`, `handlebars`, `text`

### Formatting Elements Inside the uu5string Prop

The `uu5string` prop value is itself a uu5string. Use **single quotes** for all `<uu5json/>` style attributes (avoid `&quot;` — it breaks JSON.parse in ECC context).

| Purpose | Element |
|---------|---------|
| Bold | `<strong>text</strong>` |
| Italic | `<i>text</i>` |
| Underline | `<u>text</u>` |
| Block / paragraph | `<UU5.Bricks.Div>text</UU5.Bricks.Div>` |
| Line break | `<br/>` |
| Bullet list | `<UU5.Bricks.Ul><UU5.Bricks.Li>item</UU5.Bricks.Li></UU5.Bricks.Ul>` |
| Numbered list | `<UU5.Bricks.Ol><UU5.Bricks.Li>item</UU5.Bricks.Li></UU5.Bricks.Ol>` |
| Indent 1 level | `<UU5.Bricks.Div style='<uu5json/>{"marginLeft":"8px"}'>text</UU5.Bricks.Div>` |
| Indent 2 levels | `<UU5.Bricks.Div style='<uu5json/>{"marginLeft":"16px"}'>text</UU5.Bricks.Div>` |
| Highlight (yellow) | `<UU5.Bricks.Span style='<uu5json/>{"backgroundColor":"#FFF176"}'>text</UU5.Bricks.Span>` |
| Colored text | `<UU5.Bricks.Span style='<uu5json/>{"color":"#43A047"}'>text</UU5.Bricks.Span>` |
| Link | `<UuContentKit.Links.Link src='https://...' target='_blank'>text</UuContentKit.Links.Link>` |

### CRITICAL: HTML Entities Inside Nested `uu5string` Attribute

The **outer** `uu5string` parser decodes HTML entities into Unicode characters. The **inner** parser invoked for the value of a `uu5string="..."` attribute (typically on `Uu5RichTextBricks.Block`) does **NOT** decode them — they render as literal text on the page.

**Symptom:** Page shows literal `Tabs &bull; Timeline &mdash; live` instead of `Tabs • Timeline — live`.

**Rule:** Inside any `uu5string="..."` attribute value (including the ECC `uu5string` prop), write the **Unicode character directly**, never the HTML entity.

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

**Exception — keep as entities:** `&lt;`, `&gt;`, `&amp;`, `&quot;`. Their literal characters collide with parser/attribute syntax. The inner parser doesn't decode them either, so if you need to display literal `<` or `>` (e.g. `<div>` in prose), put that text **outside** `Uu5RichTextBricks.Block` — use a sibling `Uu5CodeKitBricks.Code` ECC entry instead.

**Wrong:**
```json
[{
  "uu5Tag": "Uu5RichTextBricks.Block",
  "props": { "uu5string": "<uu5string/>Tabs &bull; Timeline &mdash; live" }
}]
```

**Correct:**
```json
[{
  "uu5Tag": "Uu5RichTextBricks.Block",
  "props": { "uu5string": "<uu5string/>Tabs • Timeline — live" }
}]
```

### Full Example — Section with Text and Table

```json
[
  {
    "uu5Tag": "Uu5Bricks.Section",
    "props": { "header": "Overview" },
    "children": [
      {
        "uu5Tag": "Uu5RichTextBricks.Block",
        "props": { "uu5String": "Introductory paragraph with <strong>bold</strong> text." }
      },
      {
        "uu5Tag": "Uu5TilesBricks.Table",
        "props": {
          "tag": null,
          "props": "<uu5json/>{}",
          "data": "<uu5json/>[\n  [\"Row 1 Col 1\", \"Row 1 Col 2\"],\n  [\"Row 2 Col 1\", \"Row 2 Col 2\"]\n]",
          "columnList": "<uu5json/>[\n  {\"header\": \"Name\"},\n  {\"header\": \"Description\"}\n]"
        }
      },
      {
        "uu5Tag": "Uu5RichTextBricks.Block",
        "props": { "uu5String": "Closing paragraph." }
      }
    ]
  }
]
```

For large content, save the JSON array to a file and use `contentFilePath` instead.

## MANDATORY SAFETY RULES

### Rule 1: Add vs Update
- User says "upload" or "add" → use `action: "add"` with `panelOid`
- User says "update" or "replace" → use `action: "update"` with `sectionOid` after confirmation
- If `mainPanel.sectionList` is empty → must use `action: "add"`

### Rule 2: Show comparison before update
Display current vs proposed content before updating.

### Rule 3: Ask for confirmation
Always ask user to confirm before executing update.

### Rule 4: Pre-flight (MANDATORY — run BEFORE every upload)

UU5 strings can be syntactically valid yet crash at render time. The pre-flight catches the common runtime crashers:

1. **Load the render-safety rules ONCE per session** (the LLM's training data is wrong about many components):
   ```
   executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "cheatsheet" } })
   ```
   This returns `shared/uu5-render-rules.md` — colorScheme palette, modern vs legacy components, RichText limits, `uu5json` escaping, component-specific gotchas, pre-upload checklist.

2. **Validate every uu5string fragment at strict level WITH the brick catalog** (catalog auto-loads — do not pass `availableBrickTags`):
   ```
   node ~/.claude/skills/uu5-string-validator/lib/validate.js <fragment.uu5> --level strict
   ```
   The validator now also checks colorScheme values, missing required attributes, and unknown components. Treat all errors as blockers; review warnings for `legacy_g04_component` (acceptable but worth noting) and `invalid_color_scheme` (always fix).

3. **Manually scan for the top crashers** (validator catches most, but cross-check):
   - No `colorScheme="violet"` (use `purple`)
   - No `colorScheme` on `Uu5Bricks.VerticalTimeline*`, `Uu5Bricks.Carousel`, `Uu5Bricks.Accordion` (`itemColorScheme`)
   - No raw `<div>` / `<span>` / `<table>` inside `Uu5RichTextBricks.Block uu5string="…"`
   - `uu5json` attributes use single outer quotes, no `&quot;`
   - `Plus4U5Elements.PersonList` only with valid `uuIdentity`
   - No `correction` prop on `Uu5Bricks.QRCode`

The ECC API accepts invalid content silently — the slide / section only crashes once a user opens it. Pre-flight is non-optional.

### Rule 5: Verify after upload
After every successful upload, **re-read the page** using `mngkit-read` and verify:
- All sections are present with correct content
- Content matches what was intended
- Re-validate the persisted content (ManagementKit may rewrap structures)

If the user reports a runtime error like `Cannot read properties of undefined (reading 'default')` or `Tag div at position N is not open`, consult `shared/uu5-render-rules.md` (`uu5-components → cheatsheet`) before changing anything else.

## Context Optimization: File-Based I/O

The MCP server supports generic file-based I/O to avoid loading large content into the chat context:

- **Large input**: Save params to a JSON file, pass path via `inputFile` parameter on `executeSkill`
- **Large output**: Use `outputFile: true` on `executeSkill` to write result to /tmp and get only summary back

This is handled automatically by the MCP server - the skill receives normal params either way.

## MANDATORY: Component Discovery via uu5-components

**Before writing ANY UU5 component** in ManagementKit content, you MUST verify it exists and get its real props:

```
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "brickSearch", textQuery: "table card section" } })
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "brickDefinitionGet", tagName: "Uu5TilesBricks.Table" } })
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "gdsIconSearch", textQuery: "calendar" } })
```

**WARNING:** Your training data contains wrong/outdated component names (e.g. `Uu5Bricks.Divider` does NOT exist). These pass uu5-string-validator but FAIL at runtime. The `uu5-components` catalog is the authoritative source (161 components, 1000+ icons).

Use ONLY props returned by `brickDefinitionGet`. Property types matter:
- **unit**: `margin=8` (no quotes, no braces)
- **bool**: `collapsible=true` (no quotes)
- **string**: `header="Title"`
- **uu5json**: `data='<uu5json/>...'` (single quotes!)

## UU5 String Requirements (inside ECC uu5string prop)

Content inside the `uu5string` prop MUST:
- Start with `<uu5string/>`
- Be valid JSX-like syntax
- Use component names verified via `uu5-components` skill
- Have properly closed tags
- Use **single quotes** for all `<uu5json/>` attributes: `style='<uu5json/>{"key":"value"}'`
- **NEVER** use `&quot;` inside `<uu5json/>` values — it won't be decoded before JSON.parse
- **NEVER** nest `Uu5RichTextBricks.Block` with `uu5string` prop inside other components — the double escaping breaks in ECC context
