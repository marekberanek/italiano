---
name: uu5-presentation
description: Create professional UU5 presentations for ManagementKit. 45 slide types across 13 categories. Template-first, outline-first workflow. Requires uu5-components skill for component lookup and uu5-chart for charts.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# UU5 Presentation Creator

Create professional presentations using UU5 components in JSON format for ManagementKit documents. Covers 45 slide types organized in 13 categories.

## IMMUTABLE DESIGN SYSTEM — READ THIS FIRST

**This is the #1 rule of this skill. Everything below is LOCKED. You have ZERO creative freedom on visual design.**

### LOCKED Colors — Use ONLY these, NEVER invent others

| Token | Exact Value | Where |
|---|---|---|
| `SUBTITLE_COLOR` | `#1976D2` | ALL subtitles, ALL accents, ALL stat values, ALL icon colors |
| `TITLE_COLOR` | `#000000` or `rgb(0, 0, 0)` | ALL titles |
| `BODY_COLOR` | `#000000` | ALL body text, bullets, headings |
| `CAPTION_COLOR` | `#757575` | Quote attributions, secondary text only |
| `DARK_BG` | `linear-gradient(to bottom, #001659 0%, #00154A 100%)` | Welcome, Demo, Thank You slides ONLY |
| `LIGHT_BG` | `linear-gradient(to bottom, #CAE6FC 0.5%, #FFFFFF 40%)` | ALL content slides — every single one |
| `GRADIENT_BG` | `linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #E8F5E9 100%)` | Gradient variant slides (10, 11, 12) ONLY |
| `PANEL_BG` | `#E3F2FD` | Left/right panel backgrounds in 1:1 splits |
| `CARD_SCHEME` | `"primary"` | ALL cards — `colorScheme` prop |

**FORBIDDEN:**
- Using ANY color not listed above (no purple, pink, orange, cyan, green, red, etc.)
- Varying gradients between slides (ALL content slides use `LIGHT_BG`)
- Using `colorScheme: "blue"`, `"violet"`, `"pink"`, `"orange"` etc. — ONLY `"primary"`
- Inventing "themed" color palettes per presentation topic

### LOCKED Typography — Use ONLY these sizes

| Element | Exact Size | Exact Weight |
|---|---|---|
| Subtitle | `16px` | bold |
| Title | `32px` | bold |
| Block title / card heading | `18px` | bold |
| Body / bullet / description | `16px` | normal |
| Stat value | `32px` | bold |
| Caption / stat label | `15px` | normal |

**FORBIDDEN:**
- Using 36px, 72px, 22px, 20px, 24px, 28px, or ANY other font size
- Varying font sizes between slides for the same element type

### LOCKED uu5String Format — ONLY this pattern

**ALWAYS use this exact escaping pattern:**
```
"<uu5string/><strong><span style=\"<uu5json/>{\\\"color\\\":\\\"#1976D2\\\"}\"><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"16px\\\"}\">TEXT</span></span></strong>"
```

**FORBIDDEN:**
- Using `<div>` tags — NEVER, use `<span>` with uu5json styling
- Using inline CSS like `style="color:#1976D2;font-size:16px;"` — ALWAYS use `<uu5json/>` escaping
- Using `letter-spacing`, `line-height`, or other CSS properties not in the template

### LOCKED Component Props

| Component | Prop | ONLY Value |
|---|---|---|
| `Uu5Bricks.Card` | `colorScheme` | `"primary"` |
| `Uu5Bricks.Card` | `significance` | `"distinct"` |
| `Uu5Bricks.InfoItem` | `colorScheme` | `"primary"` |
| `Uu5Bricks.InfoItem` | `significance` | `"highlighted"` |
| `Uu5Bricks.Background` (content slides) | `gradient` | `LIGHT_BG` exactly |
| `Uu5Bricks.Background` (content slides) | `background` | `"soft"` |

### LOCKED uu5json Escaping — Single braces ONLY

The `<uu5json/>` block must contain a single JSON object with single curly braces:

**CORRECT (in JSON file):** `"<uu5json/>{\\\"color\\\":\\\"#1976D2\\\"}"`
**WRONG (double braces):** `"<uu5json/>{{\\\"color\\\":\\\"#1976D2\\\"}}"`

When the JSON file is parsed, the uu5string value must be:
`<uu5json/>{"color":"#1976D2"}` — single `{` and `}`.

**FORBIDDEN:**
- Double curly braces `{{...}}` around uu5json values — this WILL crash the renderer
- Missing escaping — `"` inside uu5json must be escaped as `\"` (which is `\\\"` in JSON)

### Self-check before generating ANY slide

Before writing JSON, verify:
1. Is every color one of the 4 allowed text colors? (`#1976D2`, `#000000`, `rgb(0,0,0)`, `#757575`)
2. Is every font size one of the 4 allowed sizes? (`16px`, `32px`, `18px`, `15px`)
3. Is the gradient exactly `LIGHT_BG` for content slides?
4. Is every `colorScheme` set to `"primary"`?
5. Is every uu5String using `<span>` with `<uu5json/>` escaping, never `<div>`?
6. Does every `<uu5json/>` block use SINGLE curly braces, never `{{...}}`?

If ANY answer is no — fix it before proceeding.

## Prerequisites

| Dependency | Purpose | When |
|---|---|---|
| `uu5-components` skill | Look up component props and icons | BEFORE writing ANY UU5 JSON |
| `uu5-chart` skill | Generate chart components | When slide requires a chart |
| `skilled-plus4u-mcp` | MngKit page read/write | Upload slides to ManagementKit |

**MANDATORY:** Call `brickSearch` / `brickDefinitionGet` before using any UU5 component. Call `gdsIconSearch` before using any icon. Your training data contains outdated component names — always verify.

## Slide Template Catalog (via MCP)

This skill has a searchable slide template catalog. Use it to get complete, correct JSON for each slide type.

### Actions

```
executeSkill({ scriptPath: "<absolute path to uu5-presentation/skill.js>", params: { action: "slideSearch", textQuery: "cards 3 items" } })
executeSkill({ scriptPath: "<absolute path to uu5-presentation/skill.js>", params: { action: "slideTemplateGet", slideId: "slide_14" } })
executeSkill({ scriptPath: "<absolute path to uu5-presentation/skill.js>", params: { action: "slideList" } })
executeSkill({ scriptPath: "<absolute path to uu5-presentation/skill.js>", params: { action: "slideCategories" } })
```

| Action | Purpose | Key Params |
|---|---|---|
| `slideSearch` | Find matching slide types by query | `textQuery`, optional `category`, `limit` |
| `slideTemplateGet` | Get complete JSON template with `{{placeholders}}` | `slideId` (e.g. "slide_14") |
| `slideList` | List all available templates | optional `category` filter |
| `slideCategories` | Show categories and slide counts | — |

### Workflow with templates

1. `slideSearch` or `slideList` → find the right slide type
2. `slideTemplateGet` → get complete JSON with `{{PLACEHOLDER}}` markers
3. Replace `{{PLACEHOLDER}}` markers with actual content
4. For charts: use `uu5-chart` skill to generate chart JSON, replace `{{CHART_PLACEHOLDER}}`
5. For images: use `uu5-components` brickSearch for image component, replace `{{IMAGE_PLACEHOLDER}}`
6. For icons: use `uu5-components` gdsIconSearch, replace `{{ICON_N}}`
7. Wrap result in array `[{ template }]` and write to `/tmp/slide-N.json`

### Available templates (22)

| Category | Templates |
|---|---|
| system | slide_01 Welcome, slide_02 Demo, slide_03 Thank You |
| split | slide_04-06 (chart), slide_07-09 (image), slide_10 (gradient) |
| cards | slide_13 (2), slide_14 (3), slide_44 (4), slide_15 (6) |
| content | slide_17 (3 info blocks), slide_35 (title+chart), slide_37 (title+image) |
| media | slide_19 (2 images+desc) |
| data | slide_27 (stats+key points), slide_28 (stats+chart) |
| text | slide_30 (quote), slide_32 (statement) |

## CRITICAL: One Slide = One Section

**NEVER put multiple slides into a single ManagementKit section.**

1. Generate N files: `/tmp/slide-1.json` through `/tmp/slide-N.json`
2. Each file: `[{ single slide root element }]` — array with one object
3. Call `mngkit-create-section` N times, once per file, in order

## Mandatory Workflow

```
1. UNDERSTAND   → content, audience, purpose, depth
2. OUTLINE      → narrative arc, key messages, slide count
3. APPROVE      → present outline to user, get confirmation
4. SELECT TYPES → read slide-types.md, use decision tree below
5. CONTENT      → fill each slide per its output contract
6. COMPONENTS   → uu5-components skill for every tag and icon
7. BUILD JSON   → compose from building blocks below
8. WRITE FILES  → /tmp/slide-N.json per slide
9. UPLOAD       → mngkit-create-section per slide
10. VERIFY      → review checklist
```

**Outline before slides.** Never produce slides without establishing deck structure first.

## Global Presentation Rules

### Rule priority (highest → lowest)

1. Factual accuracy and user-requested content
2. Template structure and component usage
3. Readability and audience comprehension
4. Slide hierarchy and scanability
5. Visual consistency across deck
6. Aesthetic optimization

### Core rules

- **Template first** — reuse existing slide types. Never invent patterns when existing ones can be adapted. Never replace typography, color system, spacing, or graphic language.
- **Slide-type definitions are binding** — follow the rules in slide-types.md for selection and content. Don't fill slides by intuition when a definition exists.
- **Content fit** — adapt content to the layout, not the reverse. Split overloaded slides. Convert prose to bullets. Move detail to appendix. Never shrink text below readable minimum.
- **Hierarchy** — each slide communicates ONE main point. Title states the point, not just the topic.
- **Consistency** — similar content uses same layout and order. Avoid same type back-to-back. Avoid overusing one type.
- **Business wording** — professional, concise, neutral. Active voice. Concrete statements. No emojis, no meta commentary, no filler.
- **Icons** — visually distinct per slide. Semantically aligned. Never repeat same icon on one slide. Always verify via `gdsIconSearch`.

## Shared Field Definitions

Apply across ALL slide types. Individual types may tighten but never loosen these limits.

| Field | Length | Style |
|---|---|---|
| `subtitle` | 1-3 words | Sentence case, context label |
| `title` | max 6-8 words | Sentence case, outcome-oriented |
| `block_title` | 2-5 words | Sentence case, names the idea |
| `block_bullet` | max 12 words | One concise statement |
| `block_heading` | 2-4 words | Sentence case, block theme |
| `block_description` | max 18 words | One practical insight |
| `description_paragraph` | max 30 words | 1-2 sentences, business narrative |
| `card_heading` | 2-4 words | Sentence case |
| `card_text` | 8-18 words (varies) | Essential qualifier |
| `stat_value` | short numeric | Clear format with unit if needed |
| `stat_label` | 1-3 words | Instantly understandable |

### Title rules

Title must express the ANSWER, not just the SUBJECT:
- Bad: "Q1 Performance" → Good: "Revenue grew 12% in Q1"
- Bad: "Team Update" → Good: "Team capacity fully restored"

## uu5String Escaping Reference

Colors, font sizes, and component props are defined in the IMMUTABLE DESIGN SYSTEM section above. Use ONLY those values.

```
Plain:
"<uu5string/>Text"

Subtitle (16px bold blue):
"<uu5string/><strong><span style=\"<uu5json/>{\\\"color\\\":\\\"#1976D2\\\"}\"><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"16px\\\"}\">TEXT</span></span></strong>"

Title (32px bold black):
"<uu5string/><strong><span style=\"<uu5json/>{\\\"color\\\":\\\"rgb(0, 0, 0)\\\"}\"><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"32px\\\"}\">TEXT</span></span></strong>"

Block heading (18px bold black):
"<uu5string/><strong><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"18px\\\"}\">TEXT</span></strong>"

Body text (16px normal black):
"<uu5string/><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"16px\\\"}\">TEXT</span>"

Stat value (32px bold blue):
"<uu5string/><strong><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"32px\\\", \\\"color\\\":\\\"#1976D2\\\"}\">VALUE</span></strong>"

Caption (15px normal black):
"<uu5string/><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"15px\\\"}\">TEXT</span>"

Icon inline (32px blue):
"<uu5string/><Uu5Elements.Icon icon=\"ICON_CODE\" style=\"<uu5json/>{\\\"fontSize\\\":\\\"32px\\\", \\\"color\\\":\\\"#1976D2\\\"}\" />"
```

**Escaping rule:** `\"` in JSON = `"` in uu5string. `\\\"` in JSON = literal `\"` inside `<uu5json/>` blocks.

**FORBIDDEN:** Using `<div>`, inline CSS without `<uu5json/>`, or any colors/sizes not in the IMMUTABLE DESIGN SYSTEM.

## JSON Building Blocks

Compose slides from these patterns. **Always verify component props via uu5-components before use.**

### BB-LIGHT: Light gradient content slide

Most content slides use this wrapper.

```json
{
  "uu5Tag": "Uu5Bricks.Slide",
  "props": { "contentEditable": true, "padding": "0px" },
  "children": [{
    "uu5Tag": "Uu5Bricks.Background",
    "props": {
      "gradient": "linear-gradient(to bottom, #CAE6FC 0.5%, #FFFFFF 40%)",
      "background": "soft",
      "style": "height:100%; width:100%;",
      "margin": 0, "padding": 0, "borderRadius": "none"
    },
    "children": [{
      "uu5Tag": "Uu5Bricks.Section",
      "props": {
        "style": "height: 100%",
        "contentPadding": "40px 40px 0px 40px",
        "margin": 0, "headerSeparator": false
      },
      "children": ["→ BB-HEADER then slide content"]
    }]
  }]
}
```

### BB-DARK: Dark gradient system slide

For Welcome, Demo, Thank You slides.

```json
{
  "uu5Tag": "Uu5Bricks.Background",
  "props": {
    "borderRadius": "none", "margin": 0,
    "gradient": "linear-gradient(to bottom, #001659 0%, #00154A 100%)"
  },
  "children": [{
    "uu5Tag": "Uu5Bricks.Slide",
    "props": { "contentEditable": true, "padding": "<uu5json/>{}" },
    "children": [{
      "uu5Tag": "Uu5Bricks.Section",
      "props": {
        "style": "height:100%",
        "contentPadding": "40px",
        "margin": 0, "headerSeparator": false
      },
      "children": ["→ content"]
    }]
  }]
}
```

### BB-GRADIENT: Full gradient slide

For gradient-background image variants (slides 10-12).

```json
{
  "uu5Tag": "Uu5Bricks.Slide",
  "props": { "contentEditable": true, "padding": "0px" },
  "children": [{
    "uu5Tag": "Uu5Bricks.Background",
    "props": {
      "gradient": "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #E8F5E9 100%)",
      "style": "height:100%; width:100%;",
      "margin": 0, "padding": 0, "borderRadius": "none"
    },
    "children": [{
      "uu5Tag": "Uu5Bricks.Section",
      "props": {
        "style": "height: 100%",
        "contentPadding": "40px",
        "margin": 0, "headerSeparator": false
      },
      "children": ["→ BB-HEADER then content"]
    }]
  }]
}
```

### BB-HEADER: Subtitle + title

```json
{
  "uu5Tag": "Uu5Bricks.Section",
  "props": { "headerSeparator": false, "margin": "0 0 40px 0", "contentPadding": 0 },
  "children": [
    {
      "uu5Tag": "Uu5RichTextBricks.Block",
      "props": {
        "uu5String": "<uu5string/><strong><span style=\"<uu5json/>{\\\"color\\\":\\\"#1976D2\\\"}\"><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"16px\\\"}\">SUBTITLE</span></span></strong>"
      }
    },
    {
      "uu5Tag": "Uu5RichTextBricks.Block",
      "props": {
        "uu5String": "<uu5string/><strong><span style=\"<uu5json/>{\\\"color\\\":\\\"rgb(0, 0, 0)\\\"}\"><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"32px\\\"}\">TITLE</span></span></strong>"
      }
    }
  ]
}
```

### BB-SPLIT-1TO1: Two equal columns

```json
{
  "uu5Tag": "Uu5Bricks.Layout",
  "props": { "type": "columns", "margin": 0, "padding": 0 },
  "children": [
    { "uu5Tag": "Uu5Bricks.Layout.Item", "props": { "colSpan": "m: 6;" }, "children": ["→ LEFT"] },
    { "uu5Tag": "Uu5Bricks.Layout.Item", "props": { "colSpan": "m: 6;" }, "children": ["→ RIGHT"] }
  ]
}
```

### BB-SPLIT-1TO2: Narrow left, wide right

```json
{
  "uu5Tag": "Uu5Bricks.Layout",
  "props": { "type": "columns", "margin": 0, "padding": 0 },
  "children": [
    { "uu5Tag": "Uu5Bricks.Layout.Item", "props": { "colSpan": "m: 4;" }, "children": ["→ LEFT"] },
    { "uu5Tag": "Uu5Bricks.Layout.Item", "props": { "colSpan": "m: 8;" }, "children": ["→ RIGHT"] }
  ]
}
```

### BB-GRID: N-column equal grid

Column spans: 2 items = `m: 6`, 3 items = `m: 4`, 4 items = `m: 3`, 6 items = `m: 2`.

```json
{
  "uu5Tag": "Uu5Bricks.Layout",
  "props": { "type": "columns", "margin": 0, "padding": 0, "columnGap": "d" },
  "children": [
    { "uu5Tag": "Uu5Bricks.Layout.Item", "props": { "colSpan": "m: N;" }, "children": ["→ item"] }
  ]
}
```

### BB-CARD: Card with icon

```json
{
  "uu5Tag": "Uu5Bricks.Card",
  "props": {
    "headerSeparator": false, "significance": "distinct",
    "margin": 0, "contentPadding": "b c", "colorScheme": "primary"
  },
  "children": [
    {
      "uu5Tag": "Uu5RichTextBricks.Block",
      "props": {
        "style": "margin-bottom:16px;",
        "uu5String": "<uu5string/><Uu5Elements.Icon icon=\"ICON_CODE\" style=\"<uu5json/>{\\\"fontSize\\\":\\\"32px\\\", \\\"color\\\":\\\"#1976D2\\\"}\" />"
      }
    },
    {
      "uu5Tag": "Uu5RichTextBricks.Block",
      "props": { "uu5String": "<uu5string/><strong><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"18px\\\"}\">HEADING</span></strong>" }
    },
    {
      "uu5Tag": "Uu5RichTextBricks.Block",
      "props": { "uu5String": "<uu5string/><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"15px\\\"}\">Card text.</span>" }
    }
  ]
}
```

### BB-INFO-BLOCK: Icon-led open item

```json
{
  "uu5Tag": "Uu5Bricks.Layout",
  "props": {
    "type": "columns", "rowGap": "d", "alignItems": "start",
    "columnGap": "d", "margin": "xs: 0px 0 24px;", "padding": "xs: 0;"
  },
  "children": [
    {
      "uu5Tag": "Uu5Bricks.Layout.Item",
      "props": { "colSpan": "m: 1;" },
      "children": [{
        "uu5Tag": "Uu5Bricks.InfoItem",
        "props": { "icon": "ICON_CODE", "size": "l", "colorScheme": "primary", "margin": 0, "significance": "highlighted" }
      }]
    },
    {
      "uu5Tag": "Uu5Bricks.Layout.Item",
      "props": { "colSpan": "m: 11;" },
      "children": [{
        "uu5Tag": "Uu5Bricks.Section",
        "props": { "margin": 0, "contentPadding": 0, "headerSeparator": false, "padding": "0 0 0 16px" },
        "children": [
          { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "<uu5string/><strong><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"18px\\\"}\">HEADING</span></strong>" } },
          { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "<uu5string/><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"16px\\\"}\">Description text.</span>" } }
        ]
      }]
    }
  ]
}
```

### BB-KEY-POINTS: Title + bullet block

```json
{
  "uu5Tag": "Uu5Bricks.Section",
  "props": { "headerSeparator": false, "margin": "0 0 24px 0", "contentPadding": 0 },
  "children": [
    { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "<uu5string/><strong><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"18px\\\"}\">BLOCK_TITLE</span></strong>" } },
    { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "<uu5string/><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"16px\\\"}\">• Bullet text</span>" } }
  ]
}
```

### BB-STAT: Statistic value + label

```json
{
  "uu5Tag": "Uu5Bricks.Section",
  "props": { "headerSeparator": false, "margin": 0, "contentPadding": "16px" },
  "children": [
    { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "<uu5string/><strong><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"32px\\\", \\\"color\\\":\\\"#1976D2\\\"}\">VALUE</span></strong>" } },
    { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "<uu5string/><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"15px\\\"}\">LABEL</span>" } }
  ]
}
```

### BB-QUOTE: Centered quote

```json
{
  "uu5Tag": "Uu5Bricks.Section",
  "props": { "headerSeparator": false, "margin": "auto", "contentPadding": "80px 60px", "style": "text-align:center; max-width:800px;" },
  "children": [
    { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "<uu5string/><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"28px\\\", \\\"fontStyle\\\":\\\"italic\\\"}\">\"Quote text.\"</span>" } },
    { "uu5Tag": "Uu5RichTextBricks.Block", "props": { "uu5String": "<uu5string/><span style=\"<uu5json/>{\\\"fontSize\\\":\\\"16px\\\", \\\"color\\\":\\\"#757575\\\"}\">— Author, Title</span>" } }
  ]
}
```

### 1:1 Panel backgrounds

For 1:1 split slides, the panel coloring depends on media type:

| Variant | Left panel | Right panel |
|---|---|---|
| Chart slides (04, 05, 06) | Light blue `#E3F2FD` | White (default) |
| Image slides (07, 08, 09) | White (default) | Light blue `#E3F2FD` |
| Gradient slides (10, 11, 12) | Full gradient | Full gradient |

Apply panel color by wrapping the column content in `Uu5Bricks.Background` with `background` prop or inline style.

## Slide Type Catalog

**Read `slide-types.md` in this skill directory for detailed definitions of all 45 types.**

| # | Category | Slides | Pattern |
|---|---|---|---|
| 1 | System | 01, 02, 03 | Welcome, Demo, Thank You |
| 2 | 1:1 Chart | 04, 05, 06 | Key points / info blocks / description + chart |
| 3 | 1:1 Image | 07, 08, 09 | Key points / info blocks / description + image |
| 4 | 1:1 Image Gradient | 10, 11, 12 | Same as #3 on gradient background |
| 5 | Cards | 13, 14, 44, 45, 15 | 2 / 3 / 4 / 4-desc / 6 cards |
| 6 | Info Blocks | 16, 17, 18 | 2 / 3 / 6 open icon-led items |
| 7 | Images + Desc | 19, 20 | 2 / 3 images with caption |
| 8 | Bento | 21, 22, 23 | 4 / 5 / 6 mixed tiles, no title |
| 9 | Bento + Title | 24, 25, 26 | 4 / 5 / 6 mixed tiles with title |
| 10 | Statistics | 27, 28, 29 | KPIs + key points / chart / dashboard |
| 11 | Quotes | 30, 31, 32, 33, 34 | Quote / statement ± image |
| 12 | Title + Desc | 35, 36, 37, 38, 39 | Title + desc + chart / table / image(s) |
| 13 | Tiles | 40, 41, 42 | Person / logo grids |
| 14 | Wide variant | 43 | Description + image 1:2 |

## Slide Selection Decision Tree

```
What is the slide's purpose?

├─ Opening? → slide_01 (Welcome)
├─ Live demo? → slide_02 (Demo)
├─ Closing? → slide_03 (Thank You)
│
├─ One message + chart?
│  ├─ 2-3 point groups → slide_04
│  ├─ 3 parallel categories → slide_05
│  └─ Narrative summary → slide_06
│
├─ One message + image?
│  ├─ Gradient background? → slide_10 / 11 / 12
│  ├─ 2-3 point groups → slide_07
│  ├─ 3 parallel categories → slide_08
│  ├─ Narrative summary → slide_09
│  └─ Image needs more space → slide_43 (1:2)
│
├─ Multiple parallel topics?
│  ├─ Card containers?
│  │  ├─ 2 → slide_13
│  │  ├─ 3 → slide_14
│  │  ├─ 4 with icons → slide_44
│  │  ├─ 4 description → slide_45
│  │  └─ 6 overview → slide_15
│  ├─ Open layout (no cards)?
│  │  ├─ 2 → slide_16
│  │  ├─ 3 → slide_17
│  │  └─ 6 → slide_18
│  └─ Image-primary items?
│     ├─ 2 images → slide_19
│     └─ 3 images → slide_20
│
├─ Visual composition?
│  ├─ With title → slide_24 / 25 / 26 (by tile count)
│  └─ No title → slide_21 / 22 / 23 (by tile count)
│
├─ KPI / metrics?
│  ├─ KPIs + text → slide_27
│  ├─ KPIs + chart → slide_28
│  └─ 6 KPI dashboard → slide_29
│
├─ One strong message?
│  ├─ Quote → slide_30 (or 31 with image)
│  └─ Statement → slide_32 / 33 (or 34 with image)
│
├─ Title + desc + primary object?
│  ├─ Chart → slide_35
│  ├─ Table → slide_36
│  ├─ 1 image → slide_37
│  ├─ 2 images → slide_38
│  └─ 3 images → slide_39
│
└─ Person / logo grid?
   ├─ Large person tiles → slide_40
   ├─ Small person tiles → slide_41
   └─ Logos → slide_42
```

## Deck Sequencing

```
1. Intro (slide_01)
2. Agenda / orientation (if needed)
3. Main sections — vary slide types for visual interest
4. Supporting evidence where needed
5. Decisions, risks, next steps
6. Outro (slide_03)
```

**Avoid:** starting with detail before context, mixing unrelated topics without section breaks, same type back-to-back, ending on evidence instead of conclusion.

## Slide Count Guidance

- Count based on communication value, not source volume
- Split overloaded slides rather than compressing
- Remove weak points before creating slides for them
- Status reports: concise, decision-oriented flow
- Every slide must justify its existence

## Review Checklist

- [ ] Deck has clear beginning, middle, end
- [ ] Slide count appropriate for message
- [ ] Every slide uses a recognized template pattern
- [ ] No slide overloaded beyond readable density
- [ ] Titles state the point, not just the topic
- [ ] Repeated types are visually consistent
- [ ] Same type not overused or queued without reason
- [ ] Icons meaningful, non-repetitive per slide
- [ ] All components verified via `uu5-components`
- [ ] All icons verified via `gdsIconSearch`
- [ ] Charts built via `uu5-chart`
- [ ] One JSON file per slide, one section per slide

## Anti-patterns

NEVER:
- Treat template as mood-board inspiration instead of constraint
- Skip slide-type rules, fill slides ad hoc
- Force oversized content into a single slide
- Add decorations not in the template system
- Mix hierarchy styles across the deck
- Use custom layouts when content editing suffices
- Preserve all source text when it breaks readability
- Build slides with no narrative flow
- Overuse one slide type because it's convenient
- Use vague filler language to complete a slide
- Write UU5 component tags without verifying via `uu5-components`

## Output Contract

When reporting to user, state:
- Proposed outline with slide count and rationale
- Slide type selected for each slide
- Content reduced, split, or reframed to fit
- Any unresolved fit issues or provisional decisions

## MngKit Integration

```
1. mngkit-read → understand target page
2. Per slide N:
   a. Write /tmp/slide-N.json (array with one root element)
   b. mngkit-create-section with contentFilePath
3. Verify page after upload
```

For large JSON, use `outputFile: true` on skill calls to reduce context.
