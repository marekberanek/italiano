# UU5 Render Safety Rules

Single source of truth for authoring UU5 string content that renders **on first try** in BookKit, ManagementKit and other UU5 hosts. Compiled from real production crashes — read this **before** writing any uu5string and **before** uploading via `bookkit-update` / `mngkit-update`.

---

## 1. Modern (`Uu5Bricks.*` g05) vs Legacy (`UU5.Bricks.*` g04)

The catalog (`uu5-components`) lists the **modern g05** components only. Both libraries are loaded at runtime, but they have **different prop contracts**:

| Concern                         | Modern (g05) `Uu5Bricks.*`            | Legacy (g04) `UU5.Bricks.*`             |
|---------------------------------|----------------------------------------|------------------------------------------|
| Listed in catalog               | yes                                    | no                                       |
| Inline `style` on plain wrapper | **NO** — `Uu5Bricks.Div` only takes `margin` / `padding` | yes — `UU5.Bricks.Div` accepts `style='<uu5json/>{...}'` |
| Recommended for new content     | yes                                    | only as last-resort wrapper for inline `style` |

**Rule of thumb:** prefer the modern catalog. Reach for `UU5.Bricks.Div` / `UU5.Bricks.Span` only when you genuinely need a styled wrapper that no `Uu5Bricks.*` component provides.

---

## 2. Visual styling — pick the right tool

There is **no** styled-`<div>` in the modern catalog. Use the right component for the job:

| You want…                                       | Use                                   |
|-------------------------------------------------|----------------------------------------|
| Background color, gradient, padding, radius     | `Uu5Bricks.Background`                 |
| Bordered card with header / colorScheme         | `Uu5Bricks.Card`                       |
| Coloured callout / info box                     | `Uu5Bricks.InfoBlock`                  |
| Generic styled box (border, padding)            | `Uu5Bricks.Box`                        |
| Grid / flex layout                              | `Uu5Bricks.Layout` + `Uu5Bricks.Layout.Item` |
| Plain wrapper for spacing                       | `Uu5Bricks.Div` (only `margin`/`padding`) |
| Styled inline / paragraph text                  | `UU5.RichText.Block` with HTML inside  |
| Last-resort styled wrapper                      | `UU5.Bricks.Div style='<uu5json/>{…}'` (legacy) |

---

## 3. `UU5.RichText.Block` — what may live inside

`UU5.RichText.Block uu5string="<uu5string/>…"` accepts **only inline elements** in its `uu5string`. **Raw HTML block tags break the parser** and produce errors like `Tag div at position N is not open`.

**Allowed inside `uu5string`:**
- `<strong>`, `<i>`, `<u>`, `<br/>`
- `<UU5.Bricks.Span style='<uu5json/>{…}'>…</UU5.Bricks.Span>`
- `<UU5.Bricks.Div style='<uu5json/>{…}'>…</UU5.Bricks.Div>` (legacy g04, OK here)
- `<UU5.Bricks.Ul>`, `<UU5.Bricks.Ol>`, `<UU5.Bricks.Li>`
- `<UuContentKit.Links.Link src="…">…</UuContentKit.Links.Link>`

**NOT allowed inside `uu5string`:**
- Raw `<div>`, `<span>`, `<p>`, `<table>` (they break the uu5string parser)
- Structural components (`Uu5Bricks.Card`, `Uu5Bricks.Section`, charts, tables) — put them **outside** `RichText.Block`

---

## 4. `colorScheme` — safe palette and known crashers

The colorScheme value space is **not uniform across libraries**. A value that works on `uu5Bricks` may crash a component from `uu5extrasg01` or `uu5g05-elements` with the runtime error:

```
TypeError: Cannot read properties of undefined (reading 'default')
  at .../uu5g05-elements.min.js
  at .../uu5extrasg01.min.js
```

### Safe palette (works on `uu5Bricks` Card / InfoBlock / Tabs / Box / etc.)

- Semantic: `primary`, `positive`, `negative`, `warning`, `neutral`, `important`, `dim`
- Basic colours: `blue`, `dark-blue`, `light-blue`, `cyan`, `green`, `dark-green`, `light-green`, `yellow`, `orange`, `red`, `pink`, `purple`, `dark-purple`, `brown`, `grey`, `steel`

### Known crashers (do NOT use)

- `violet` — **not in the BookKit color map** → `undefined.default` crash. Use `purple` instead.
- `building`, `meaning` — only valid on a few specialised components; assume unsafe.
- Any value not in the safe palette above.

### Components with stricter colorScheme maps — strip the prop

These crash on most non-trivial values; the safest action is to **omit `colorScheme` entirely**:

- `Uu5Bricks.VerticalTimeline` (and `.Item`) — from `uu5extrasg01`
- `Uu5Bricks.Carousel` — colorScheme rarely behaves; omit it
- `Uu5Bricks.Accordion` — `itemColorScheme` is unreliable; omit it

---

## 5. Component-specific gotchas

| Component                          | Gotcha / safe pattern                                                                 |
|------------------------------------|----------------------------------------------------------------------------------------|
| `Plus4U5Elements.PersonList`       | Crashes when `itemList` lacks valid `uuIdentity`. For non-uuIdentity data use `UU5.Bricks.Table`. |
| `Uu5Bricks.QRCode`                 | Does NOT support `correction` prop. Only basic props (`value`, `size`).                |
| `Uu5Bricks.VerticalTimeline.Item`  | Strip `colorScheme` (see §4).                                                          |
| `Uu5Bricks.Carousel`               | Strip `colorScheme` (see §4).                                                          |
| `Uu5Bricks.Accordion`              | Strip `itemColorScheme` (see §4).                                                      |
| `Uu5AnimationBricks.Snake`         | Heavy / sometimes flaky inside `InfoBlock` overview lists. Use sparingly.              |

---

## 6. `uu5json` attribute escaping

For any attribute carrying JSON (`style`, `data`, etc.):

```
style='<uu5json/>{"color":"#43A047","fontSize":"18px"}'
```

**Rules:**
- Outer attribute quotes MUST be **single quotes** when the JSON contains double quotes.
- The `<uu5json/>` prefix is required.
- HTML entities (`&quot;`, `&amp;`) are **not** decoded inside `uu5json` — never pre-encode.
- When this attribute is itself nested inside another `uu5string="…"`, single-quoting still works because the outer host attribute uses double quotes.

**Wrong:**
```
style="{&quot;color&quot;:&quot;red&quot;}"
style="<uu5json/>{"color":"red"}"
```

**Right:**
```
style='<uu5json/>{"color":"red"}'
```

---

## 7. Pre-upload checklist

Before calling `bookkit-update` / `mngkit-update`, verify EVERY item:

1. Content starts with `<uu5string/>`.
2. Validator passes at `level=strict` **with brick catalog enabled** (auto-loaded by the validator).
3. No `colorScheme="violet"` (or any value outside §4 safe palette).
4. No `colorScheme` on `Uu5Bricks.VerticalTimeline*`, `Uu5Bricks.Carousel`, `Uu5Bricks.Accordion` (`itemColorScheme`).
5. No raw `<div>` / `<span>` inside `UU5.RichText.Block uu5string="…"`.
6. `uu5json` attributes use single quotes outside, no HTML entities inside.
7. `Plus4U5Elements.PersonList` only used with valid `uuIdentity` items.
8. `Uu5Bricks.QRCode` does not have `correction` prop.

After upload:
- Re-read the page and confirm the section's content matches what was sent.
- If the user reports a runtime error, search this file for the offending component / prop **before** trying random changes.

---

## 8. Property Types (strict — follow exactly)

Values from `brickDefinitionGet` include property types. Use the correct syntax:

| Type | Correct | Wrong | Note |
|------|---------|-------|------|
| **number** | `level=1` | `level={1}` `level="1"` | Direct numbers, no braces or quotes |
| **unit** | `height=400` | `height={400}` | Direct numbers, no braces |
| **boolean** | `disabled=true` | `disabled="true"` `disabled={true}` | Direct true/false, no quotes or braces |
| **string** | `header="Title"` | `header=Title` | Always quoted |
| **uu5json** | `data='<uu5json/>...'` | `data={...}` `data="..."` | Must have prefix, single quotes |
| **node** | `header="Text"` or children | — | String or nested uu5string |

---

## 9. Escaping Formula (2^n - 1)

| Nesting | Backslashes | Example |
|---------|-------------|---------|
| `'` (root) | 0 | `style='<uu5json/>{ "color": "red" }'` |
| `"` (root) | 1 | `style="<uu5json/>{ \"color\": \"red\" }"` |
| `"` → `"` | 3 | `attr="...style=\"<uu5json/>{ \\\"color\\\": \\\"red\\\" }\""` |
| `'` → `"` | 1 | `attr='...style="<uu5json/>{ \"color\": \"red\" }"'` |

**Best practice:** Use single quotes (0 backslashes). Alternate `'` and `"` when nesting. Valid backslash counts: 0, 1, 3, 7, 15.

---

## 10. HTML Entities Inside Nested `uu5string`

The **outer** uu5string parser decodes HTML entities. The **inner** parser (inside `uu5string="..."` attribute, e.g. `UU5.RichText.Block`) does **NOT** decode them — they render as literal text.

**Rule:** Inside any `uu5string="..."` attribute value, write the **Unicode character directly**, never the HTML entity.

| Wrong (literal) | Correct (Unicode) | Codepoint |
|---|---|---|
| `&bull;` | `•` | U+2022 |
| `&mdash;` | `—` | U+2014 |
| `&ndash;` | `–` | U+2013 |
| `&hellip;` | `…` | U+2026 |
| `&nbsp;` | (non-breaking space) | U+00A0 |
| `&copy;` | `©` | U+00A9 |
| `&trade;` | `™` | U+2122 |
| `&times;` | `×` | U+00D7 |
| `&deg;` | `°` | U+00B0 |

**Exception — keep as entities:** `&lt;`, `&gt;`, `&amp;`, `&quot;` (collide with parser syntax).

---

## 11. Most Important Bricks (quick reference)

Always verify via `brickDefinitionGet` before use. This is a cheatsheet, not the source of truth.

**Layout & Structure:**
- `Uu5Bricks.Block` — header, content, footer, action list
- `Uu5Bricks.Section` — content sections with heading levels
- `Uu5Bricks.Layout` — grid: `type="tiles"` (auto-flow), `type="columns"` (12-col grid), `type="area"` (named areas)
- `Uu5Bricks.Tabs` — tabbed content (use `label` not `header` on Tabs.Item)
- `Uu5Bricks.Card` — bordered card with header/colorScheme
- `Uu5Bricks.Box` — generic styled box

**Content Display:**
- `Uu5RichTextBricks.Block` — rich text with HTML formatting (see §3)
- `Uu5Bricks.InfoGroup` — grouped info items with icons
- `Uu5Bricks.Tile` — card-like boxes with header/footer
- `Uu5Bricks.Panel` — collapsible dropdown
- `Uu5Bricks.Accordion` — multiple collapsible panels (one open at a time)
- `Uu5Bricks.InfoBlock` — highlighted callout (info/warning/error)

**Data Visualization:**
- `Uu5TilesBricks.Table` — data tables (`columnList` for headers)
- `Uu5ChartsBricks.XyChart` — line, bar, area charts
- `Uu5ChartsBricks.PieChart` — pie/donut charts
- `Uu5ChartsBricks.RadarChart` — radar/spider charts
- `Uu5ChartsBricks.GaugeChart` — gauge displays
- `Uu5CodeKitBricks.Code` — code blocks (`value`, `codeStyle`)

**Media:**
- `Uu5ImagingBricks.Image` — image with lightbox
- `Uu5ImagingBricks.Gallery` — image galleries
- `Uu5Bricks.Video` — video player

**Interactive:**
- `Uu5Bricks.Carousel` — slideshow (strip `colorScheme`!)
- `Uu5Bricks.VerticalTimeline` — timeline (strip `colorScheme`!)
- `Uu5Bricks.Dropdown` — dropdown menu
- `Uu5Bricks.ModalLink` — link opening modal

---

## 12. Common Mistakes (from production)

1. **`</uu5string>` or `</uu5json>` closing tags** — DON'T exist, prefixes are self-closing only
2. **Missing required attributes** — always check `brickDefinitionGet` for `required: "true"` fields
3. **Wrong primitive types** — `level=1` NOT `level={1}`, `height=400` NOT `height={400}`
4. **Missing `<uu5json/>` prefix** on JSON props
5. **CSS syntax in style** — use uu5json with camelCase: `style='<uu5json/>{"fontSize":"18px"}'`
6. **Typographic quotes inside HTML tags** — use standard `"` only, avoid `„"` or `""`
7. **HTML entities in nested uu5string** — see §10

---

## 13. Maintenance

When a new gotcha is discovered in production:
1. Add it to §4 / §5 / §6 here.
2. If detectable, encode it in `uu5-string-validator/lib/constants/color-scheme-values.js` (palette / mistake mapping) or in the validator's component checks.
3. Mention it in the relevant `bookkit-update` / `mngkit-update` "Lessons learned" block.
