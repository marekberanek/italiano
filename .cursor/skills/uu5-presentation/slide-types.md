# Slide Type Reference

Detailed definitions for all 45 slide types. Read this when selecting and filling slides.

## How to use

1. Use the decision tree in SKILL.md to narrow to a category
2. Find the pattern group below — shared structure is defined once per group
3. Pick the variant that matches your media type
4. Follow the output format exactly
5. Compose JSON from building blocks in SKILL.md
6. Look up every component via `uu5-components` skill before writing JSON

Field definitions (subtitle, title, etc.) are in SKILL.md § Shared Field Definitions.

---

## 1. System Slides

Static or semi-static slides for deck structure. Wrapper: **BB-DARK**.

### slide_01 — Welcome

**Use:** First slide of every deck. Formal opener.
**Editable fields only:**
- `surtitle`: Short context — reporting period, report type (e.g. "Status Report 2025/Q1")
- `title`: Organization or subject name (e.g. "Unicorn Systems")
- `presenter`: 1-2 presenters, each as `Name Surname, Job title`

**Structure:** Full-height layout with bottom-aligned content. Use `Uu5Bricks.InfoItem` with `uuIdentity` for presenters.

**Rules:**
- Max 2 presenters
- No other content — no agenda, metrics, charts, badges, dates, footnotes, decorations
- Preserve logo placement and branding elements
- Do not rewrite into an agenda or summary slide
- Keep visually calm and uncluttered

**Choose when:** First slide, goal is formal intro, content limited to context + subject + presenter.
**Do not choose when:** Slide explains agenda, acts as section divider, or needs key messages.

**Output:**
```
SURTITLE: <short context>
TITLE: <main subject>
PRESENTER_1: Name Surname, Job title
[PRESENTER_2: Name Surname, Job title]
```

### slide_02 — Demo

**Use:** Transition to live demo. Static placeholder.
**Content:** Centered text "Demo" on blue gradient. No editable fields.
**Rules:**
- Text must remain exactly "Demo"
- Do not add subtitle, notes, icons, or any content
- Only use when a live demo is actually planned

### slide_03 — Thank You

**Use:** Final slide of every deck. Mandatory.
**Content:** "Thank you for your attention" + logo. No editable fields.
**Rules:**
- Must be last slide — never omit
- Do not add contact info, Q&A text, or additional content
- Do not rewrite the wording
- Do not turn into a Q&A slide

---

## 2. Key Points + Media (1:1 Split)

One clear message through 2-3 distinct text blocks on left, one supporting media on right.

### Shared structure

- **Layout:** BB-SPLIT-1TO1 inside appropriate wrapper
- **Left:** BB-HEADER + 2-3 × BB-KEY-POINTS blocks
- **Right:** Chart, image, or image on gradient

**Structure options (pick exactly one, never mix):**
- 2 blocks × up to 3 bullets each
- 3 blocks × up to 2 bullets each

**Fields:**

| Field | Limit |
|---|---|
| subtitle | 1-3 words |
| title | max 6-8 words, outcome-oriented |
| block_N_title | 2-5 words |
| block_N_bullet_M | max 12 words |

**Output format:**
```
SUBTITLE: <context>
TITLE: <outcome headline>
BLOCK_1_TITLE: <theme>
BLOCK_1_BULLET_1: <statement>
BLOCK_1_BULLET_2: <statement>
[BLOCK_1_BULLET_3: <statement>]
BLOCK_2_TITLE: <theme>
BLOCK_2_BULLET_1: <statement>
BLOCK_2_BULLET_2: <statement>
[BLOCK_2_BULLET_3: <statement>]
[BLOCK_3_TITLE: <theme>]
[BLOCK_3_BULLET_1: <statement>]
[BLOCK_3_BULLET_2: <statement>]
MEDIA_NOTE: <what the chart/image shows>
```

### Selection rules

**Choose when ALL true:**
- Content summarizable into one outcome-oriented headline
- Supporting points organize into 2-3 distinct blocks
- Media (chart or image) strengthens understanding of same message
- Topic benefits from balanced text-plus-visual slide

**Do NOT choose when:**
- No meaningful media to show
- Content requires deep explanation beyond bullet limits
- Content is a long list of unrelated updates
- Media would be too detailed to read quickly at slide size
- Message better handled by pure text, section divider, or full-media slide

### Content guidance

- Prefer status, progress, impact, readiness, trend, or priority themes
- Narrow broad input to the most useful, decision-relevant insight
- If input is complex, extract the most actionable points
- Make the title the answer, not just the subject
- Each block must represent a distinct idea — no overlap
- Keep bullets parallel in style where possible

### Forbidden

- Do not mix 2-block and 3-block structures on the same slide
- Do not turn one block into a mini-paragraph
- Do not add extra text areas, callouts, or side notes outside the defined structure
- Do not use more text than the structure allows
- Do not rely on the media alone to communicate the key point — text and media must tell the same story

### Media rules

**Chart (slide_04):** Must support the textual message, not compete with it. Use simple chart with immediately readable meaning. Avoid dense labeling. If chart adds little value, do not choose this type. Use `uu5-chart` skill.

**Image (slide_07, slide_10):** Must be business-relevant — product screenshot, UI preview, service visual. No decorative imagery with no content value. Must be immediately understandable at presentation size.

### Variants

| Slide | Media | Wrapper | Left BG | Right BG |
|---|---|---|---|---|
| **slide_04** | Chart | BB-LIGHT | Blue panel `#E3F2FD` | White |
| **slide_07** | Image | BB-LIGHT | White | Blue panel `#E3F2FD` |
| **slide_10** | Image | BB-GRADIENT | Full gradient | Full gradient |

**Slide_10:** Use when gradient treatment suits the deck section. Do not use if gradient reduces clarity or conflicts with surrounding flow.

---

## 3. Info Blocks + Media (1:1 Split)

One topic through exactly 3 parallel icon-led blocks on left, one supporting media on right.

### Shared structure

- **Layout:** BB-SPLIT-1TO1
- **Left:** BB-HEADER + 3 × BB-INFO-BLOCK
- **Right:** Chart or image

**Fixed:** Always exactly 3 blocks. Each: icon + heading + description. Blocks must be parallel in level and importance.

**Fields:**

| Field | Limit |
|---|---|
| subtitle | 1-3 words |
| title | max 6-8 words |
| block_N_heading | 2-4 words |
| block_N_description | max 18 words |

**Output format:**
```
SUBTITLE: <context>
TITLE: <outcome headline>
BLOCK_1_HEADING: <theme>
BLOCK_1_DESCRIPTION: <insight>
BLOCK_2_HEADING: <theme>
BLOCK_2_DESCRIPTION: <insight>
BLOCK_3_HEADING: <theme>
BLOCK_3_DESCRIPTION: <insight>
MEDIA_NOTE: <what the chart/image shows>
```

### Selection rules

**Choose when ALL true:**
- Topic expressible through three distinct parallel blocks
- Each block summarizable with short heading + one short explanation
- Media supports same overall message
- Content benefits from compact labeled chunks rather than bullets or paragraphs

**Do NOT choose when:**
- Content needs fewer than 3 meaningful blocks
- Content requires deep explanation per block
- Message better expressed as bullets, prose, or media-dominant slide
- Blocks would become repetitive or artificially forced

### Content guidance

- Use the three blocks to show parallel categories, not a sequence
- Prefer themes like progress, readiness, impact, priority, or capability
- Keep wording concrete and business-relevant across all three descriptions
- Keep the three descriptions parallel in style where possible

### Forbidden

- Do not convert blocks into bullet lists
- Do not add extra text areas, side notes, or secondary sections
- Do not use fewer or more than 3 blocks
- Do not repurpose for unrelated content just because layout is convenient

### Media rules

Same as §2 — chart must support text, image must be business-relevant. If media adds little value, choose a different slide type.

### Variants

| Slide | Media | Wrapper | Left BG | Right BG |
|---|---|---|---|---|
| **slide_05** | Chart | BB-LIGHT | Blue panel | White |
| **slide_08** | Image | BB-LIGHT | White | Blue panel |
| **slide_11** | Image | BB-GRADIENT | Full gradient | Full gradient |

---

## 4. Description + Media (1:1 or 1:2 Split)

One focused message through short narrative on left, one media on right.

### Shared structure

- **Layout:** BB-SPLIT-1TO1 (or BB-SPLIT-1TO2 for slide_43)
- **Left:** BB-HEADER + 1-2 short description paragraphs
- **Right:** Chart or image

**Fields:**

| Field | Limit |
|---|---|
| subtitle | 1-3 words |
| title | max 6-8 words |
| description_paragraph_1 | max 30 words, 1-2 sentences |
| description_paragraph_2 (opt) | max 30 words, 1-2 sentences |

**Output format:**
```
SUBTITLE: <context>
TITLE: <outcome headline>
DESCRIPTION_PARAGRAPH_1: <narrative>
[DESCRIPTION_PARAGRAPH_2: <narrative>]
MEDIA_NOTE: <what the chart/image shows>
```

### Selection rules

**Choose when ALL true:**
- Content best explained through short narrative summary
- One media supports or validates that explanation
- Message focused enough to stay compact
- Topic does not need multiple labeled blocks

**Do NOT choose when:**
- Content needs several distinct subtopics
- Content better expressed as bullets or parallel blocks
- Text would become too long to read quickly
- Media would need substantial explanation on its own

### Content guidance

- Focus on the main implication, shift, or status
- Summarize rather than document
- Explain meaning or implication, not every detail
- Both paragraphs (if two used) must support the same main message

### Forbidden

- Do not convert description into bullets or multiple labeled blocks
- Do not let description become a long paragraph that overflows the layout
- Do not add bullets, extra blocks, side notes, or secondary sections

### Media rules

Same as §2 — media must support same message as description. If media adds little value, choose a different type.

### Variants

| Slide | Media | Wrapper | Split | Panel |
|---|---|---|---|---|
| **slide_06** | Chart | BB-LIGHT | 1:1 | Left blue |
| **slide_09** | Image | BB-LIGHT | 1:1 | Right blue |
| **slide_12** | Image | BB-GRADIENT | 1:1 | Full gradient |
| **slide_43** | Image | BB-LIGHT | 1:2 | Right blue, wider image |

**Slide_43:** Use when image needs more visual space than text. Description area narrower — keep text even more concise.

---

## 5. Cards

Multiple topics as compact card containers with icons (or descriptions only for slide_45).

### Shared structure

- **Wrapper:** BB-LIGHT
- **Layout:** BB-HEADER + BB-GRID with BB-CARD per item

### Selection rules (all card variants)

**Choose when ALL true:**
- Content divides cleanly into N comparable or parallel areas
- Each area benefits from card treatment with visual separation
- Each card can remain compact within its text limits

**Do NOT choose when:**
- Cards would become text-heavy beyond their limits
- One topic dominates heavily over the others
- Content doesn't divide into the exact required card count
- A lighter layout (info blocks) would suffice

### Content guidance

- Make cards clearly distinct from each other
- Prefer parallel categories rather than sequential explanation
- Keep all cards comparable in depth and density
- As card count increases, text per card must decrease proportionally

### Forbidden

- Do not repeat the same icon across cards on one slide (except slide_45 which has no icons)
- Do not add bullets, extra sections, footnotes, or side notes inside cards
- Do not overload cards with text beyond their per-variant limits
- Do not use generic icons that don't relate to card content
- Do not choose a card variant just because the layout looks good — content must fit naturally

### slide_13 — 2 Cards

**Grid:** 2 columns (`m: 6`)
**Per card:** icon + heading (2-4 words) + 1-2 paragraphs (max 18 words each)
**Use for:** Two-track updates, current vs next, two priorities, two solution areas.

**Output per card:**
```
CARD_N_ICON: <icon meaning>
CARD_N_HEADING: <theme>
CARD_N_TEXT_PARAGRAPH_1: <max 18 words>
[CARD_N_TEXT_PARAGRAPH_2: <max 18 words>]
```

### slide_14 — 3 Cards

**Grid:** 3 columns (`m: 4`)
**Per card:** icon + heading (2-4 words) + 1-2 paragraphs (max 16 words each)
**Use for:** Three priorities, capabilities, value points.
**Note:** Prefer one paragraph unless second is necessary — space is tighter than 2-card variant.

### slide_44 — 4 Cards

**Grid:** 2×2 (`m: 6`, two rows)
**Per card:** icon + heading (2-4 words) + 1 line (max 10 words)
**Use for:** Four priorities, status categories, capability areas.
**Note:** One short supporting line only — no paragraphs.

**Output per card:**
```
CARD_N_ICON: <icon meaning>
CARD_N_HEADING: <2-4 words>
CARD_N_TEXT: <max 10 words>
```

### slide_45 — 4 Cards Description (no icons)

**Grid:** 2×2 (`m: 6`, two rows)
**Per card:** heading (2-4 words) + description paragraph (max 24 words)
**No icons.** Use BB-CARD without the icon block.
**Use for:** Four thematic explanations, service areas, value propositions — when icons would add noise.

**Output per card:**
```
CARD_N_HEADING: <2-4 words>
CARD_N_DESCRIPTION: <max 24 words>
```

### slide_15 — 6 Cards

**Grid:** 3×2 (`m: 4`, two rows)
**Per card:** icon + heading (1-3 words) + 1 line (max 8 words)
**Use for:** Six capabilities, status items, summary highlights.
**Rule:** Overview-level only. Aggressively limit text. Each card understandable almost instantly.

**Output per card:**
```
CARD_N_ICON: <icon meaning>
CARD_N_HEADING: <1-3 words>
CARD_N_TEXT: <max 8 words>
```

### Card variant selection guide

| Need | Variant |
|---|---|
| 2 comparable themes, moderate space | slide_13 |
| 3 parallel topics, compressed | slide_14 |
| 4 themes, icon + one short line | slide_44 |
| 4 themes, description-heavy, no icons | slide_45 |
| 6 overview items, minimal text | slide_15 |

---

## 6. Info Blocks (Standalone)

Multiple topics as open icon-led items without card containers.

### Shared structure

- **Wrapper:** BB-LIGHT
- **Layout:** BB-HEADER + N × BB-INFO-BLOCK (stacked or in grid)

### Selection rules

**Choose when ALL true:**
- Content divides into N comparable or parallel areas
- Each area benefits from icon-led grouping
- Each item can remain compact
- Card containers not necessary for clarity

**Do NOT choose when:**
- Items would become text-heavy
- One topic dominates over others
- Stronger visual separation needed — use cards instead

### Content guidance

- Make items clearly distinct
- Prefer parallel categories, not sequential explanation
- Keep all items comparable in depth
- Use icons that are visually distinct and semantically aligned

### Forbidden

- Do not repeat icons across items on one slide
- Do not add bullets, extra sections, or footnotes inside items
- Do not convert into card layout — if cards needed, use §5

### slide_16 — 2 Info Blocks

**Per item:** icon + heading (2-4 words) + 1-2 paragraphs (max 18 words each)
**Use for:** Two-track updates, current vs planned, challenge vs response.

**Output per item:**
```
ITEM_N_ICON: <icon meaning>
ITEM_N_HEADING: <theme>
ITEM_N_TEXT_PARAGRAPH_1: <max 18 words>
[ITEM_N_TEXT_PARAGRAPH_2: <max 18 words>]
```

### slide_17 — 3 Info Blocks

**Per item:** icon + heading (2-4 words) + 1-2 paragraphs (max 16 words each)
**Use for:** Three priorities, capabilities, value points.
**Note:** Prefer one paragraph unless second is necessary.

### slide_18 — 6 Info Blocks

**Layout:** 3×2 grid of info blocks
**Per item:** icon + heading (1-3 words) + 1 line (max 8 words)
**Use for:** Overview-level scanning of six areas.
**Rule:** Overview only. Aggressively limit text.

### When to choose info blocks vs cards

| Condition | Use |
|---|---|
| Content needs strong visual separation | Cards (§5) |
| Content is naturally well-separated | Info blocks (§6) |
| Cards would feel heavy for the content | Info blocks |
| Items need background containers | Cards |

---

## 7. Images with Description

Image-primary slides with short supporting text per image.

### Shared structure

- **Wrapper:** BB-LIGHT
- **Layout:** BB-HEADER + BB-GRID with image + heading + description per item

### Selection rules

**Choose when ALL true:**
- Message best shown through N images
- Each image needs only short textual explanation
- All images are meaningfully comparable or related

**Do NOT choose when:**
- Images not comparable or unrelated
- Text would become too long per image
- One image dominates heavily over the others
- Topic better explained through prose, blocks, or charts

### Content guidance

- Let images do most of the communication
- Use headings to name items clearly
- Use descriptions only for the key qualifier or implication
- Keep text secondary to images

### Forbidden

- Do not let text become more important than images
- Do not add bullets, extra sections, footnotes, or side notes
- Do not use decorative imagery with no business value

### slide_19 — 2 Images

**Grid:** 2 columns
**Per image:** heading (2-4 words) + description (max 14 words)
**Use for:** Before/after, two product views, two solution variants, two examples.

**Output per image:**
```
IMAGE_N_NOTE: <what the image shows>
IMAGE_N_HEADING: <name>
IMAGE_N_DESCRIPTION: <max 14 words>
```

### slide_20 — 3 Images

**Grid:** 3 columns
**Per image:** heading (2-4 words) + description (max 12 words)
**Use for:** Three product views, three examples, three feature views, three variants.

---

## 8. Bento (No Title)

Mixed-size tile grid. Visual composition without global title area.

### Shared structure

- **Wrapper:** BB-LIGHT (tiles fill entire content area)
- **No BB-HEADER** — tiles start at top of slide
- **One tile dominant** (larger), others supporting
- Each tile: light blue surface with rounded corners

**Per tile:**
- Dominant tile: icon + image + optional short text
- Supporting tiles: surtitle (1-3 words) + title (2-5 words) + optional image/chart

### Selection rules

**Choose when ALL true:**
- Slide should work as visual bento composition
- One element deserves stronger emphasis than others
- Content breaks into N related but distinct parts
- Separate top title area is not necessary

**Do NOT choose when:**
- Slide needs formal subtitle + title above layout — use §9 (Bento with Title) instead
- All items must have identical weight — use cards or info blocks
- Content is too text-heavy for tile-based presentation
- Audience needs detailed explanation, not visual overview

### Content guidance

- Use visual variety across tiles while keeping one coherent business theme
- Prefer mixing screenshots, charts, and UI visuals if they support same topic
- Keep icon usage minimal and meaningful
- The larger dominant tile should carry the primary visual or explanation

### Forbidden

- Do not overload any tile with paragraph-heavy content
- Do not use repetitive visuals or repeated messages across tiles
- Do not make all tiles the same size — preserve the dominant/supporting distinction
- Every tile must independently scannable

### slide_21 — Bento 4 Blocks

**Grid:** 1 large left + 2 stacked middle + 1 large right
**4 tiles** total, one clearly dominant.
**Use for:** Feature families, product-area overviews, grouped capability highlights.

### slide_22 — Bento 5 Blocks

**Grid:** 1 large left + 2 stacked middle + 2 stacked right
**5 tiles** total, one clearly dominant.
**Use for:** Product ecosystem snapshots, grouped capability overviews, feature portfolios.

### slide_23 — Bento 6 Blocks

**Grid:** 4 smaller top row + 2 wider bottom row
**6 tiles** total, bottom tiles carry slightly more weight.
**Use for:** Portfolio overviews, product-system snapshots, mixed visual summary boards.

**Output per tile:**
```
TILE_N_ROLE: <dominant | supporting>
TILE_N_SURTITLE: <context> (supporting tiles)
TILE_N_TITLE: <theme> (supporting tiles)
[TILE_N_IMAGE_NOTE: <what image shows>]
[TILE_N_TEXT: <short text if applicable>]
```

---

## 9. Bento with Title

Same bento grids as §8 but with BB-HEADER (subtitle + title) above the tile grid.

### Selection rules

**Choose when:** Slide needs BOTH a formal headline AND a bento composition.
**Do NOT choose when:** Title area is unnecessary — use §8 instead.

### Content guidance

- Global title summarizes the whole slide
- Tile content supports the title — does not repeat it verbatim
- All other bento rules from §8 apply

### slide_24 — Bento + Title 4 Blocks

Same grid as slide_21. Additional: subtitle + title above.

### slide_25 — Bento + Title 5 Blocks

Same grid as slide_22. Additional: subtitle + title above.

### slide_26 — Bento + Title 6 Blocks

Same grid as slide_23. Additional: subtitle + title above.

**Output:** Same as §8 tile output + `SUBTITLE` and `TITLE` fields.

---

## 10. Statistics

KPI-focused slides with headline numbers.

### Shared structure

- **Wrapper:** BB-LIGHT
- **KPI block:** 4 × BB-STAT in 2×2 grid (or 6 for dashboard)

### Selection rules (all stat variants)

**Choose when ALL true:**
- Slide is primarily driven by KPI values, metric comparison, or numeric overview
- Statistics represent meaningful headline values
- Numbers deserve prominent visual treatment

**Do NOT choose when:**
- Metrics are secondary to narrative
- Fewer than 4 KPIs available (use description + chart instead)
- Numbers need extensive explanation that won't fit the layout

### Content guidance

- Keep KPI values short and presentation-friendly — use clear numeric format
- Include unit or currency symbol only if essential
- KPI labels must be instantly understandable in 1-3 words
- Right-side content (key points or chart) must explain/contextualize the left-side numbers — not duplicate labels

### Forbidden

- Do not add charts, images, cards, or extra sections beyond what the variant defines
- Do not use stat labels as mini-descriptions — keep them to 1-3 words
- Do not use more or fewer than the specified number of KPIs

### slide_27 — Statistics + Key Points (1:1)

**Layout:** BB-SPLIT-1TO1
**Left:** BB-HEADER + 4 KPIs in 2×2 grid (blue panel)
**Right:** 3 key-point groups, each: group_title (2-5 words) + exactly 2 bullets (max 12 words each)

**Rules:**
- Exactly 4 statistics, exactly 3 key-point groups
- Each group interprets or contextualizes the KPI set — does not just repeat labels
- Groups should represent distinct themes

**Use for:** Status metrics with interpretation, workforce snapshots, delivery KPIs with business implications.

**Output:**
```
SUBTITLE: <context>
TITLE: <outcome headline>
STAT_1_VALUE: <number>
STAT_1_LABEL: <1-3 words>
STAT_2_VALUE: <number>
STAT_2_LABEL: <1-3 words>
STAT_3_VALUE: <number>
STAT_3_LABEL: <1-3 words>
STAT_4_VALUE: <number>
STAT_4_LABEL: <1-3 words>
GROUP_1_TITLE: <theme>
GROUP_1_BULLET_1: <max 12 words>
GROUP_1_BULLET_2: <max 12 words>
GROUP_2_TITLE: <theme>
GROUP_2_BULLET_1: <max 12 words>
GROUP_2_BULLET_2: <max 12 words>
GROUP_3_TITLE: <theme>
GROUP_3_BULLET_1: <max 12 words>
GROUP_3_BULLET_2: <max 12 words>
```

### slide_28 — Statistics + Chart (1:1)

**Layout:** BB-SPLIT-1TO1
**Left:** BB-HEADER + 4 KPIs (blue panel)
**Right:** One chart (use `uu5-chart` skill)

**Rules:**
- Chart must support same business story as KPI set — not a different topic
- Chart and KPIs must not tell different stories
- Use simple chart with immediately readable meaning

**Use for:** KPI snapshot with trend support, metric summary with composition chart.
**Output:** Same KPI fields as slide_27 + `CHART_NOTE`.

### slide_29 — Statistics Dashboard

**Layout:** BB-HEADER + 6 KPI tiles in 3×2 BB-GRID
**No right panel.** All content is KPI tiles.

**Rules:**
- Exactly 6 KPIs
- Overview-level only — no deep explanation per KPI
- All tiles equal in weight

**Use for:** Quick numeric overview, dashboard-style metric communication.

**Output:**
```
SUBTITLE: <context>
TITLE: <outcome headline>
STAT_1_VALUE: <number>  STAT_1_LABEL: <label>
STAT_2_VALUE: <number>  STAT_2_LABEL: <label>
STAT_3_VALUE: <number>  STAT_3_LABEL: <label>
STAT_4_VALUE: <number>  STAT_4_LABEL: <label>
STAT_5_VALUE: <number>  STAT_5_LABEL: <label>
STAT_6_VALUE: <number>  STAT_6_LABEL: <label>
```

---

## 11. Quotes & Statements

Single strong sentence-level message. One idea, one slide.

### Selection rules (all quote/statement variants)

**Choose when ALL true:**
- Slide is built around one strong sentence-level message
- Message deserves a full slide for emphasis
- Content is a quote, testimonial, finding, declaration, or mission-level statement

**Do NOT choose when:**
- Content is explanatory or needs multiple points
- Message is purely informational without emphasis value
- Content would read as a normal paragraph, not a standout message

### Content guidance

- Message must be strong enough to justify a full slide on its own
- For quotes: use the exact wording, attribute properly
- For statements: use active, confident business language
- Supporting text (where allowed) should add context, not dilute the message

### Forbidden

- Do not add bullets, charts, or extra content blocks
- Do not use as a regular content slide with a large font
- Do not weaken the message with hedging language

### slide_30 — Quote

**Wrapper:** BB-LIGHT
**Layout:** BB-QUOTE centered on slide
**Content:** Attributed quote (italic, 28px) + author attribution (16px, gray)
**Use for:** External quotes, testimonials, expert opinions.

**Output:**
```
QUOTE_TEXT: <the quote>
QUOTE_AUTHOR: Name Surname, Title
```

### slide_31 — Quote + Image (1:1)

**Layout:** BB-SPLIT-1TO1. Left: quote + attribution. Right: image (author photo or related visual).
**Use for:** Attributed quote with visual context — author photo, product the quote references.

**Output:** Same as slide_30 + `IMAGE_NOTE: <what image shows>`.

### slide_32 — Statement

**Wrapper:** BB-LIGHT
**Layout:** Centered statement (28px, bold) + optional one supporting line (16px)
**Use for:** Internal declarations, mission statements, key findings, strategic messages.

**Output:**
```
STATEMENT_TEXT: <the statement>
[SUPPORTING_TEXT: <one-line qualifier>]
```

### slide_33 — Statement Centered

Same as slide_32 but tighter centered layout. No supporting line. Maximum impact.
**Use for:** Single strong sentence that needs no qualification.

**Output:**
```
STATEMENT_TEXT: <the statement>
```

### slide_34 — Statement + Image (1:1)

**Layout:** BB-SPLIT-1TO1. Left: statement + optional supporting line. Right: supporting image.
**Use for:** Statement with visual evidence or context.

**Output:** Same as slide_32 + `IMAGE_NOTE: <what image shows>`.

---

## 12. Title + Description + Object

Formal subtitle-title-description header with one primary content object below.

### Shared structure

- **Wrapper:** BB-LIGHT
- **Top:** BB-HEADER + 1 description paragraph (max 28 words, 1-2 sentences)
- **Bottom:** One large content object spanning full width below the header

### Selection rules (all variants)

**Choose when ALL true:**
- Slide needs formal subtitle + title framing
- One short description is sufficient to frame content
- One content object is the primary focal element
- Object should have more visual space than surrounding text

**Do NOT choose when:**
- Multiple content objects needed on same slide
- Object too dense or detailed for quick reading at slide size
- Text explanation needs multiple sections or paragraphs
- Description alone would be insufficient — use key points or info blocks instead

### Content guidance

- Keep description short and framing-only — it sets up the object
- Let the object carry the main analytical or visual content
- Description and object must tell the same story
- Do not add bullets, side notes, or multiple text blocks

### Forbidden

- Do not add extra content areas beyond subtitle + title + description + one object
- Do not use as a text-heavy slide — the object must be primary
- Do not choose this type if the object would be too small to read at presentation size

### slide_35 — with Chart

**Object:** Large chart (use `uu5-chart`). Chart is primary focal object.
**Use for:** Trend overview, performance summary, quantified business update.
**Rule:** If chart needs substantial explanation, consider slide_04 (key points + chart) instead.

### slide_36 — with Table

**Object:** Presentation-friendly table.
**Use for:** List overviews, structured records, small operational summaries, itemized business info.
**Rules:**
- Manageable number of rows and columns
- Avoid dense small text
- If table too complex for quick scanning, split or simplify
- Do not choose if info better expressed as cards, bullets, or chart

### slide_37 — with Image

**Object:** One large image. Image is primary focal object.
**Use for:** Product screenshot framing, visual concept, single highlight.
**Rule:** If image is too weak to carry the slide, combine with key points instead.

### slide_38 — with 2 Images

**Object:** Two equally weighted images side by side.
**Use for:** Before/after, two views, two variants.
**Rule:** Images must be comparable or meaningfully related. If captions needed per image, use slide_19 instead.

### slide_39 — with 3 Images

**Object:** Three equally weighted images.
**Use for:** Three views, three variants, three-step visual sets.
**Rule:** If captions needed per image, use slide_20 instead.

**Output format (all variants):**
```
SUBTITLE: <context>
TITLE: <outcome headline>
DESCRIPTION: <1-2 sentences, max 28 words>
OBJECT_NOTE: <what the chart/table/image(s) show>
```

---

## 13. Tiles

Uniform grid of equally weighted items — people or logos.

### Shared structure

- **Wrapper:** BB-LIGHT
- **Layout:** BB-HEADER + uniform BB-GRID
- All items equal in emphasis. Consistent image quality and crop.

### Selection rules

**Choose when ALL true:**
- Slide should present multiple equally weighted items
- Each item best recognized visually first
- Only a short label needed per item
- Items form a coherent, related set

**Do NOT choose when:**
- Each item also needs subtitle or description — use image slides (§7) instead
- Items are better shown as cards with text
- Imagery too inconsistent for a clean grid

### Content guidance

- Keep labels short and instantly readable
- All labels parallel in style (all names, or all company names, etc.)
- Do not add descriptions or metadata under labels
- Ensure all items belong to one coherent set — don't mix categories

### Forbidden

- Do not vary tile sizes — all items must be visually equal
- Do not add descriptions, titles, or metadata below labels
- Do not mix people and logos on one slide

### slide_40 — Tiles Large (Persons)

**Grid:** Larger image tiles + name label below.
**Per item:** image + label (name)
**Use for:** Recognition, featured people, award nominees, highlighted examples.

### slide_41 — Tiles Small (Persons)

**Grid:** Denser grid of smaller tiles.
**Per item:** image + name + optional role
**Use for:** Team overviews, participant lists, group introductions.

### slide_42 — Tiles Logos

**Grid:** Logo images in uniform grid.
**Per item:** logo image + optional company name
**Use for:** Partners, clients, technology stack, vendor overview.

**Output format:**
```
SUBTITLE: <context>
TITLE: <outcome headline>
ITEM_1_IMAGE_NOTE: <description>
ITEM_1_LABEL: <name>
ITEM_2_IMAGE_NOTE: <description>
ITEM_2_LABEL: <name>
...
```

---

## Cross-reference: By support medium

| Medium | Slides |
|---|---|
| Chart | 04, 05, 06, 28, 35 |
| Image | 07, 08, 09, 31, 34, 37, 38, 39, 43 |
| Image + gradient | 10, 11, 12 |
| Structured items | 13, 14, 15, 16, 17, 18, 44, 45 |
| Multi-image gallery | 19, 20 |
| Bento tiles | 21, 22, 23, 24, 25, 26 |
| Statistics | 27, 28, 29 |
| Quote / statement | 30, 31, 32, 33, 34 |
| Table | 36 |
| Person / logo grid | 40, 41, 42 |

## Cross-reference: By item count

| Count | Slides |
|---|---|
| Single message | 01, 02, 03, 30, 31, 32, 33, 34 |
| 2 items | 13, 16, 19, 38 |
| 3 items | 05, 08, 11, 14, 17, 20, 39 |
| Flexible 2-3 | 04, 07, 10 |
| 4 items | 21, 24, 27, 44, 45 |
| 5 items | 22, 25 |
| 6 items | 15, 18, 23, 26, 29 |
| Description only | 06, 09, 12, 43 |
| Single object | 35, 36, 37 |
| Uniform grid | 40, 41, 42 |

## Cross-reference: By text pattern

| Pattern | Slides |
|---|---|
| Key points blocks | 04, 07, 10 |
| Info blocks (icon-led) | 05, 08, 11, 16, 17, 18 |
| Description narrative | 06, 09, 12, 43 |
| Cards with icons | 13, 14, 15, 44 |
| Cards description only | 45 |
| Image gallery + captions | 19, 20 |
| Bento tiles | 21, 22, 23, 24, 25, 26 |
| Stats + explanation | 27 |
| Stats + chart | 28 |
| Stats dashboard | 29 |
| Attributed quotes | 30, 31 |
| Statements | 32, 33, 34 |
| Title + desc + chart | 35 |
| Title + desc + table | 36 |
| Title + desc + image(s) | 37, 38, 39 |
| Person tiles | 40, 41 |
| Logo grid | 42 |
