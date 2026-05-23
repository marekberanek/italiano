---
name: bookkit-update
description: Update and edit BookKit (uu-bookkit-maing01) page sections. Use when the user wants to edit, update, modify, or save BookKit page content. Requires loading content first, user confirmation, and UU5 string validation. Always use bookkit-read first to get section codes.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# BookKit Page Editor

Update and edit BookKit page sections in uu-bookkit-maing01.

## Prerequisites

**Authentication Required:** Before using this skill, ALWAYS call the `login` tool first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

The login is idempotent - if already authenticated, it returns immediately.

## CRITICAL: Always Call bookkit-read First!

Both actions typically require calling `bookkit-read` first:
- **ADD**: To see current sections and determine correct `order` position
- **UPDATE**: To get required `sectionCode` and `rev` values

The only exception is adding a section at position 0 (first) when you don't care about existing content.

## Usage via MCP

Use the `skilled-plus4u-mcp` MCP server to execute this skill:

```
executeSkill({ scriptPath: "<absolute path to bookkit-update/skill.js>", params: { ... } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | BookKit page URL |
| `action` | No | `"update"` (default) or `"add"` |
| `content` | Yes | UU5 string content (must start with `<uu5string/>`) |
| `sectionCode` | **REQUIRED for update** | Section code from bookkit-read `body[].code` |
| `rev` | **REQUIRED for update** | Revision from bookkit-read `body[].sys.rev` |
| `order` | For add only | Position where to insert (0 = first, 1 = after first section, etc.). Defaults to 0. |

### Add a New Section

**Step 1:** Load the page to see current sections:
```
executeSkill({ scriptPath: "<absolute path to bookkit-read/skill.js>", params: { url: "PAGE_URL" } })
```
Response shows `body[]` array - count sections to determine `order` value.

**Step 2:** Add with correct position:
```
executeSkill({ 
  scriptPath: "<absolute path to bookkit-update/skill.js>", 
  params: { 
    url: "PAGE_URL",
    action: "add",
    order: 2,  // insert after 2nd section (0=first, 1=after first, etc.)
    content: "<uu5string/>New content here"
  } 
})
```

### Update an Existing Section (MUST Read First!)

**Step 1:** Load the page to get sectionCode and rev:
```
executeSkill({ scriptPath: "<absolute path to bookkit-read/skill.js>", params: { url: "PAGE_URL" } })
```
Response contains: `body[].code` (sectionCode) and `body[].sys.rev` (rev)

**Step 2:** Update with values from step 1:
```
executeSkill({ 
  scriptPath: "<absolute path to bookkit-update/skill.js>", 
  params: { 
    url: "PAGE_URL",
    action: "update",
    sectionCode: "value-from-body[].code",
    content: "<uu5string/>Updated content",
    rev: 0  // value from body[].sys.rev
  } 
})
```

## MANDATORY SAFETY RULES

### Rule 1: Add vs Update
- User says "upload" or "add" → use `action: "add"`
- User says "update" or "replace" → use `action: "update"` after confirmation

### Rule 2: Show comparison before update
Display current vs proposed content before updating.

### Rule 3: Ask for confirmation
Always ask user to confirm before executing update action.

### Rule 4: Pre-flight (MANDATORY — run BEFORE every upload)

UU5 strings can be syntactically valid yet crash at render time. The pre-flight catches the common runtime crashers:

1. **Load the render-safety rules ONCE per session** (the LLM's training data is wrong about many components):
   ```
   executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "cheatsheet" } })
   ```
   This returns `shared/uu5-render-rules.md` — colorScheme palette, modern vs legacy, RichText limits, `uu5json` escaping, component-specific gotchas, pre-upload checklist.

2. **Validate at strict level WITH the brick catalog** (catalog auto-loads — do not pass `availableBrickTags`):
   ```
   node ~/.claude/skills/uu5-string-validator/lib/validate.js <file.uu5> --level strict
   ```
   The validator now also checks colorScheme values against the safe palette, missing required attributes, and unknown components. Treat all errors as blockers; review warnings for `legacy_g04_component` (acceptable but worth noting) and `invalid_color_scheme` (always fix).

3. **Manually scan for the top crashers** (the validator catches most, but cross-check):
   - No `colorScheme="violet"` (use `purple`)
   - No `colorScheme` on `Uu5Bricks.VerticalTimeline*`, `Uu5Bricks.Carousel`, `Uu5Bricks.Accordion` (`itemColorScheme`)
   - No raw `<div>` / `<span>` / `<table>` inside `UU5.RichText.Block uu5string="…"`
   - `uu5json` attributes use single outer quotes, no `&quot;`
   - `Plus4U5Elements.PersonList` only with valid `uuIdentity`
   - No `correction` prop on `Uu5Bricks.QRCode`

The API accepts invalid content silently — the page only crashes once a user opens it. Pre-flight is non-optional.

### Rule 5: Verify after upload

After every successful upload, **re-read the page** using `bookkit-read` and verify:
- All sections are present and in the correct order
- Content matches what was intended
- Run the validator one more time on the persisted content (BookKit may rewrite some structures, e.g. wrap text in `Lsi`, set `headerSeparator=false`)

If the user reports a runtime error like `Cannot read properties of undefined (reading 'default')` or `Tag div at position N is not open`, consult `shared/uu5-render-rules.md` (`uu5-components → cheatsheet`) before changing anything else.

## Context Optimization: File-Based I/O

The MCP server supports generic file-based I/O to avoid loading large content into the chat context:

- **Large input**: Save params to a JSON file, pass path via `inputFile` parameter on `executeSkill`
- **Large output**: Use `outputFile: true` on `executeSkill` to write result to /tmp and get only summary back

This is handled automatically by the MCP server - the skill receives normal params either way.

## MANDATORY: Component Discovery via uu5-components

**Before writing ANY UU5 component** in BookKit content, you MUST verify it exists and get its real props:

```
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "brickSearch", textQuery: "section card info" } })
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "brickDefinitionGet", tagName: "Uu5Bricks.Section" } })
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "gdsIconSearch", textQuery: "settings" } })
```

**WARNING:** Your training data contains wrong/outdated component names (e.g. `Uu5Bricks.Divider` does NOT exist). These pass uu5-string-validator but FAIL at runtime. The `uu5-components` catalog is the authoritative source (161 components, 1000+ icons).

Use ONLY props returned by `brickDefinitionGet`. Property types matter:
- **unit**: `margin=8` (no quotes, no braces)
- **bool**: `collapsible=true` (no quotes)
- **string**: `header="Title"`
- **uu5json**: `data='<uu5json/>...'` (single quotes!)

## UU5 String Requirements

Content MUST:
- Start with `<uu5string/>`
- Be valid JSX-like syntax
- Use component names verified via `uu5-components` skill
- Have properly closed tags
- Use **single quotes** for all `<uu5json/>` attributes

## CRITICAL: Rich Text Formatting — Use UU5.RichText.Block

**NEVER** use `<UU5.Bricks.P>` for formatted text. Any formatted text (bold, italic, lists, colors, links, indentation) MUST use `UU5.RichText.Block` with a `uu5string` attribute.

```
<UU5.RichText.Block uu5string="<uu5string/>...formatted content..."/>
```

The `uu5string` attribute value is itself a uu5string (starts with `<uu5string/>`). Use **single quotes** for all nested style/uu5json attributes inside it to avoid escaping hell.

### Formatting Elements Inside UU5.RichText.Block

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
| Link | `<UuContentKit.Links.Link src="URL" target="_blank">text</UuContentKit.Links.Link>` |

### Example

```
<UU5.RichText.Block uu5string="<uu5string/><strong>Nadpis</strong><UU5.Bricks.Div><i>kurziva</i></UU5.Bricks.Div><br/><UU5.Bricks.Ul><UU5.Bricks.Li>položka 1</UU5.Bricks.Li><UU5.Bricks.Li>položka 2</UU5.Bricks.Li></UU5.Bricks.Ul><UU5.Bricks.Div style='<uu5json/>{"marginLeft":"8px"}'>odsazený text</UU5.Bricks.Div><UU5.Bricks.Div><UuContentKit.Links.Link src='https://example.com' target='_blank'>odkaz</UuContentKit.Links.Link></UU5.Bricks.Div>"/>
```

Structural components (headers, tables, code blocks) sit **outside** `UU5.RichText.Block` — use it only for formatted text portions.

## CRITICAL: HTML Entities Inside Nested `uu5string` Attribute

The **outer** `uu5string` parser decodes HTML entities into Unicode characters. The **inner** parser invoked for the value of a `uu5string="..."` attribute (typically on `UU5.RichText.Block`) does **NOT** decode them — they render as literal text on the page.

**Symptom:** Page shows literal `Tabs &bull; Timeline &mdash; live` instead of `Tabs • Timeline — live`.

**Rule:** Inside any `uu5string="..."` attribute value, write the **Unicode character directly**, never the HTML entity.

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
```
<UU5.RichText.Block uu5string="<uu5string/>Tabs &bull; Timeline &mdash; live"/>
```

**Correct:**
```
<UU5.RichText.Block uu5string="<uu5string/>Tabs • Timeline — live"/>
```

The same rule applies to any other prop that re-parses uu5string (e.g. nested `desc`, nested `header` containing markup), and to ECC content where the `uu5string` field is itself wrapped in JSON.

## Code Blocks — Use Uu5CodeKitBricks.Code

For any code snippets or technical content, use `Uu5CodeKitBricks.Code`. This component sits **outside** `UU5.RichText.Block` as a standalone element.

```
<Uu5CodeKitBricks.Code value="let x = \"50\";" codeStyle="javascript"/>
```

Multiline code:
```
<Uu5CodeKitBricks.Code value="let x = \"50\";

const funkce = () => {
  console.log(\"ja sem franta!!\")
}" codeStyle="javascript"/>
```

### Supported `codeStyle` values

`javascript`, `java`, `php`, `yaml`, `json`, `sh`, `batch`, `docker`, `golang`, `handlebars`, `text`

### Rules
- Quotes inside the `value` attribute MUST be escaped as `\"`
- Newlines inside `value` are preserved as-is
- **NEVER** put code blocks inside `UU5.RichText.Block` — they are separate structural elements
