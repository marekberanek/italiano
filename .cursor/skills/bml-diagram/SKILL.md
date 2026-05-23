---
name: bml-diagram
description: Generate UuBml diagrams with proper JSON structure for architecture, workflow, and system documentation. Use when creating BML diagrams, UuBml visualizations, architecture diagrams, or when the user mentions uuBml, diagram generation, or visual documentation.
---

# UuBml Diagram Generation

Generate complete UuBml diagram JSON for architecture, workflow, and system documentation.

## Context Optimization: File-Based I/O

The MCP server supports generic file-based I/O to avoid loading large content into the chat context:

- **Large input**: Save params to a JSON file, pass path via `inputFile` parameter on `executeSkill`
- **Large output**: Use `outputFile: true` on `executeSkill` to write result to /tmp and get only summary back

This is handled automatically by the MCP server - the skill receives normal params either way.

## CRITICAL: Mandatory Library Usage

**NEVER create BML diagram JSON manually.** Always use the `lib/bml-generator.js` library:

- The library handles socket point generation, connector routing, and proper escaping
- Manual JSON creation WILL result in missing socket points and rendering errors
- The library output is the ONLY valid way to generate diagrams
- Agent MUST use `require('./lib/bml-generator')` in all diagram generation scripts

## CRITICAL: File-Based Generation (Context Optimization)

**NEVER load generated UU5 diagram content into the chat context.** The diagram JSON is 15-25KB and will:
- Bloat context and increase API costs significantly
- Risk truncation causing rendering errors (missing icons, broken connectors)

### Required Workflow:

1. **Generate to temp file:**
   - Write Node.js script that uses DiagramBuilder
   - Script MUST save output to `/tmp/diagram_output.txt` (or similar temp path)
   - Script should output confirmation with size: `console.log('Diagram saved. Size:', uu5.length, 'bytes');`
   - Script success output is sufficient verification - no need for additional file checks

2. **Upload using MCP skill with `contentFilePath`:**
   - Use `contentFilePath` parameter instead of `content` to pass the file path directly
   - Example: `bookkit-update` with `contentFilePath: "/tmp/diagram_output.txt"`
   - The skill reads the file directly - content never enters chat context
   - NEVER try to preview or display the full UU5 string in chat

### What NOT to do:
- Do NOT use `console.log(builder.toUu5String())` - this loads content into context
- Do NOT use Read tool to load the generated diagram file
- Do NOT use `wc`, `head`, `cat`, or any command to inspect the output file
- Do NOT pass `content` parameter with diagram content - use `contentFilePath` instead

## MANDATORY: Uploading Diagrams to BookKit/MngKit

When the user asks to "upload" or "add" a diagram to a page:

### Rule 1: ADD new content, do NOT replace existing
- Use `/addPageSection` to create a NEW section
- NEVER use `updatePageSection` unless user explicitly says "replace" or "overwrite"

### Rule 2: ALWAYS describe the diagram BEFORE uploading
Show the user a summary of what will be uploaded (element counts, structure description) and ask for confirmation.
Do NOT display the full UU5 string - it's too large for the chat context.

### Rule 3: ALWAYS ask for confirmation before any upload
```
"I've created the diagram. Here's a preview:
[show a short description only (counts + structure), NOT the UU5 string]

Do you want me to add this as a NEW section to the page?"
```

### Rule 4: If addPageSection fails, do NOT fall back to updatePageSection
If adding fails, report the error. Do NOT try to "fix" it by overwriting existing content.

## MANDATORY: Analysis Before Creating Diagram

**STOP! Before creating ANY diagram, you MUST complete this analysis:**

### Step 1: Element Inventory
Create a complete list of ALL elements in the source:
```
BLOCKS (containers/groups):
- [ ] Block 1: name, approximate size, what it contains
- [ ] Block 2: ...

ICONS (nodes/components):
- [ ] Icon 1: name, type, importance, which block it belongs to
- [ ] Icon 2: ...

CONNECTIONS (lines between elements):
- [ ] Connection 1: from → to, label (if any), style
- [ ] Connection 2: ...

SPECIAL ELEMENTS:
- [ ] Legend/key explaining colors or symbols
- [ ] Annotations or notes
- [ ] Nested structures (elements inside elements)
```

### Step 2: Verify Completeness
- Count elements in source image/description
- Count elements in your inventory
- **If counts don't match, you missed something!**

### Step 3: Ask Clarifying Questions
**If the source is complex (>10 elements), ASK the user:**
- "I see X blocks, Y icons, and Z connections. Is this correct?"
- "Should I include [specific detail] or simplify it?"
- "The legend shows 4 connection types - should I use different line styles?"

### Step 4: Plan Layout
Before writing any code:
- Sketch the layout with approximate positions on a grid
- Ensure all blocks have enough space for their contents
- **Plan connection routing to avoid overlaps (see Connector Routing Rules below)**

### Step 4b: Classify Connection Patterns

Before writing ANY connect() call, classify each connection into one of these patterns
and use the CORRECT API:

| Pattern | Detection | API |
|---------|-----------|-----|
| 1:1 (one source, one target) | Unique pair, no shared endpoints | `builder.connect(a, b)` |
| 1:N fan-out (one source, N targets) | Same source appears N times | `builder.connectMulti(source, [t1, t2, ...])` |
| N:1 fan-in (N sources, one target) | Same target appears N times | `builder.connectMultiIn([s1, s2, ...], target)` |
| Chain (A→B→C sequential) | Linear sequence | `builder.connectChain([a, b, c])` |

Write out the classification BEFORE coding:
```
CONNECTIONS:
- User → [StrategyA, StrategyB]: 1:N fan-out → connectMulti
- [StrategyA, StrategyB] → Definition: N:1 fan-in → connectMultiIn
- Definition → [Item, Bound, Custom]: 1:N fan-out → connectMulti
- [Item, Bound, Custom] → AttrFilter: N:1 fan-in → connectMultiIn
- AttrFilter → Result: 1:1 → connect
```

**NEVER use individual connect() when a source or target appears in more than one connection.**

### Step 5: Quality Checklist Before Upload
- [ ] All blocks from source are present
- [ ] All icons from source are present  
- [ ] All connections from source are present
- [ ] Labels/ports on connections match source
- [ ] Legend is included (if source has one)
- [ ] Layout matches source structure
- [ ] **No connectors cross each other**
- [ ] **No connectors pass through icons**
- [ ] **Connector labels do not overlap**
- [ ] **Annotations point to nearby icons (max 1-2 grid cells)**

**DO NOT PROCEED if checklist is incomplete!**

## CRITICAL: Connector Routing Rules

These rules prevent overlapping lines, wrong attachment points, and visual clutter.

### Rule 1: NEVER connect multiple sources to the same target with individual connectors

When N icons need to reach the SAME target, all N lines converge on one point causing overlap.

**BAD** (causes overlapping lines):
```javascript
builder.connect(iconA, sharedTarget);
builder.connect(iconB, sharedTarget);
builder.connect(iconC, sharedTarget);
// Result: 3 lines crossing/overlapping near sharedTarget
```

**GOOD options:**
```javascript
// Option A: Use connectMulti for fan-in (single multi-connector)
builder.connectMulti(sharedTarget, [iconA, iconB, iconC]);

// Option B: Give each source its OWN target icon (duplicate the target)
// Place each target directly below its source so connectors go straight down
const targetForA = builder.addIcon({ text: 'Target', position: belowA });
const targetForB = builder.addIcon({ text: 'Target', position: belowB });
builder.connect(iconA, targetForA);  // straight down, no crossing
builder.connect(iconB, targetForB);  // straight down, no crossing
```

### Rule 2: Choose connector attachment side based on relative position

| Source position relative to Target | Connect from Source side | Connect to Target side |
|-----------------------------------|------------------------|----------------------|
| Directly above target | bottom | top |
| Directly below target | top | bottom |
| Directly left of target | right | left |
| Directly right of target | left | right |
| Diagonal (above-left) | bottom OR right | top OR left |

**NEVER** connect from the bottom of source to the bottom of target. This forces a U-shaped path that crosses other elements.

### Rule 3: Space connected icons at least 2 grid columns (256px) apart

Icons with connectors going in the same direction need room for the lines to run without overlapping.

| Situation | Minimum spacing |
|-----------|----------------|
| Icons in same row, connectors going down | 256px (2 cols) horizontal spacing |
| Icons in same column, connectors going right | 256px (2 rows) vertical spacing |
| Fan-out children | 256px apart, parent centered above |

### Rule 4: Trace every connector path mentally before coding

Before adding `builder.connect(A, B)`, mentally draw the line on your grid sketch:
1. Does it cross any existing connector? If yes, rearrange icons first.
2. Does it pass through another icon? If yes, route around or rearrange.
3. Does its label overlap another label? If yes, use different `labelPosition` values (1/2/3) or remove labels from obvious connections.

### Rule 5: Fan-out pattern (1 parent -> N children)

```
              [Parent]
           /    |    \
      [C1]    [C2]    [C3]
```

- Use ONE `connectMulti(parent, [c1, c2, c3])` call
- Space children evenly, at least 256px apart
- Center parent above the middle child
- **NEVER** use N separate `connect()` calls for a fan-out

### Rule 6: Fan-in pattern (N sources -> 1 target)

```
      [S1]    [S2]    [S3]
           \    |    /
              [Target]
```

- Use ONE `connectMultiIn([s1, s2, s3], target)` call for fan-in
- Or use `connectMulti(target, [s1, s2, s3])` (reverses the semantic but achieves the same layout)
- Or give each source its OWN copy of the target icon directly below it
- **NEVER** use N separate `connect()` calls pointing to the same target

**Common mistake:** Two icons on the same row (e.g., col1 and col5) both connecting down to a target in the middle (col3). The two diagonal lines WILL cross. Fix: use `connectMultiIn` to route them through a single junction point.

### Rule 7: When one icon connects to two different targets

Place targets on opposite sides so connectors diverge, not converge:

```javascript
// Good: leftTarget to the left, rightTarget to the right
// Connectors naturally go in opposite directions
const left = builder.addIcon({ position: { x: gridX(1), y: gridY(2) } });
const center = builder.addIcon({ position: { x: gridX(3), y: gridY(1) } });
const right = builder.addIcon({ position: { x: gridX(5), y: gridY(2) } });
builder.connect(center, left);   // goes down-left
builder.connect(center, right);  // goes down-right, no crossing
```

### Rule 8: Annotation placement

- Annotations MUST be within 1-2 grid cells of their target icon
- For BMK concept pages, prefer within 1 grid cell whenever possible
- Pointer should be short and direct (not crossing other elements)
- If the annotation would need a long pointer, move it closer or use a floating annotation instead

### Rule 9: Choose the right text element — Callout vs Annotation vs Label icon

There are three ways to add explanatory text to a diagram. Choose based on the use case:

| Element | Best For | Visual Style |
|---------|----------|-------------|
| **Callout** (`addCallout`) | Speech-bubble explanations with pointer to an icon | Colored bubble (color follows importance) |
| **Annotation** (`addAnnotation`) | Neutral text boxes with optional pointer | Plain text box with thin border |
| **Label icon** (`addLabel`) | Simple short labels next to elements | Low-importance icon with text |

```javascript
// Callout — colored speech bubble pointing to an icon (PREFERRED for explanations)
builder.addCallout({
    position: { x: 350, y: 100 },
    size: { width: 200, height: 80 },
    text: '<uu5string/>Public portal that provides:\n- charging stations\n- navigation\n- payments',
    importance: 'normal',
    targetIcon: someIcon,
    pointerSide: 'left'
});

// Annotation — neutral text box with optional pointer
builder.addAnnotation({
    position: { x: 100, y: 500 },
    size: { width: 180, height: 64 },
    text: '<uu5string/>Invoice data transfer to ERP system',
    importance: 'normal',
    targetIcon: someIcon,
    pointerSide: 'top'
});

// Label icon — simple short text labels (best for <25 chars)
builder.addLabel({
    text: 'DSO/LDS',
    position: { x: gridX(1), y: gridY(5) }
});
```

**Guidelines:**
- Use **Callouts** for multi-line explanatory text (paragraphs, bullet lists)
- Use **Annotations** for short neutral notes without strong visual emphasis
- Use **Label icons** for single-line element names or brief identifiers
- For floating text without pointer: `addFloatingCallout()` or `addFloatingAnnotation()`

### Rule 10: Calculate textWidth from text length — never truncate labels

Icons have a fixed `textWidth` that determines how much label text is visible. If the text is longer than the width allows, it gets **truncated with "..."**, which is unreadable.

**Formula:** `textWidth = Math.max(96, text.length * 7)`

| Text length | Recommended textWidth |
|-------------|----------------------|
| < 14 chars | 96px (minimum) |
| 14–20 chars | 128–140px |
| 20–30 chars | 160–210px |
| 30–40 chars | 220–280px |
| 40+ chars | 280px+ (consider shortening the text instead) |

```javascript
// BAD — text will be truncated
builder.addIcon({ text: 'Entity Definition with referenceDefinition', textWidth: 190 });
// Renders as: "Entity Definition with referenc..."

// GOOD — text fully visible
builder.addIcon({ text: 'Entity Definition with referenceDefinition', textWidth: 300 });

// BETTER — shorten the text to fit a reasonable width
builder.addIcon({ text: 'Entity Definition (config)', textWidth: 180 });
```

**Best practice:** Prefer shorter, punchier labels (under 25 chars) over long descriptive text. If a label needs more than 30 characters, consider splitting into two icons or shortening the text.

### Rule 11: Never place two horizontal connectMulti trunk lines at the same Y level

When multiple `connectMulti` calls create horizontal trunk lines at the same row, the trunk segments **overlap and become unreadable**. This commonly happens in bipartite layouts (sources on the left, targets on the right, same row).

**BAD** (two horizontal trunks overlap at row 2):
```javascript
// Sources and targets all on row 2 — trunk lines overlap!
const src1 = builder.addIcon({ position: { x: gridX(0), y: gridY(2) } });
const src2 = builder.addIcon({ position: { x: gridX(2), y: gridY(2) } });
const tgt1 = builder.addIcon({ position: { x: gridX(7), y: gridY(2) } });
const tgt2 = builder.addIcon({ position: { x: gridX(9), y: gridY(2) } });
builder.connectMulti(src1, [tgt1, tgt2]); // horizontal trunk at row 2
builder.connectMulti(src2, [tgt1, tgt2]); // ANOTHER horizontal trunk at row 2 — OVERLAPS!
```

**GOOD** (sources above, targets below — vertical trunks don't overlap):
```javascript
// Place sources on row 1, targets on row 3
const src1 = builder.addIcon({ position: { x: gridX(1), y: gridY(1) } });
const src2 = builder.addIcon({ position: { x: gridX(3), y: gridY(1) } });
const tgt1 = builder.addIcon({ position: { x: gridX(1), y: gridY(3) } });
const tgt2 = builder.addIcon({ position: { x: gridX(3), y: gridY(3) } });
builder.connectMulti(src1, [tgt1, tgt2]); // vertical trunk going down
builder.connectMulti(src2, [tgt1, tgt2]); // separate vertical trunk — no overlap
```

**ALSO GOOD** (use individual connectors for small numbers):
```javascript
// For ≤3 connections per source, individual connects are cleaner than connectMulti
builder.connect(src1, tgt1);
builder.connect(src1, tgt2);
builder.connect(src2, tgt1);
```

**General rule for bipartite (M:N) layouts:**
- Place the two groups on **different rows** (sources above, targets below)
- Use **vertical** multi-connectors (parent above, children below) — never horizontal trunks through occupied space
- If both groups must be on the same row, use individual `connect()` calls for ≤3 connections per source

### Rule 12: Align actors directly above their primary actions

When a diagram has actors (row 0) connecting to actions (row 2), place each actor **directly above** the action it connects to. Diagonal connectors create awkward L-shaped routing.

```javascript
// BAD — Business User at col 5, but its action is at col 3 → diagonal routing
const user = builder.addIcon({ position: { x: gridX(5), y: gridY(0) } });
const action = builder.addIcon({ position: { x: gridX(3), y: gridY(2) } });
builder.connect(user, action); // L-shaped line going left then down

// GOOD — actor directly above its action → clean vertical line
const user = builder.addIcon({ position: { x: gridX(3), y: gridY(0) } });
const action = builder.addIcon({ position: { x: gridX(3), y: gridY(2) } });
builder.connect(user, action); // straight down
```

### Rule 13: Skip connector labels in dense diagrams

When a diagram has more than 3 connectors in the same vertical or horizontal band (within 256px):
- REMOVE labels from all but the 1-2 most important connectors
- Use the containing block title or nearby icon labels to convey meaning instead
- Connector labels in dense areas ALWAYS overlap — there is no fix other than removing them

**Density check:** if total connector labels > (total connectors / 2), you have too many. Remove the least essential labels first.

### Rule 14: Spatial budget — minimize empty rows

Before coding, calculate the minimum rows needed:
- Each row of icons = 1 grid row (128px)
- Gap between rows with connectors = 1 grid row (128px)
- Entry/exit icons = 1 grid row each

**Formula:** `totalRows = (iconRows * 2) + 1 (for entry) + 1 (for exit)`

Example: 4 icon rows → totalRows = 4*2 + 2 = 10 rows = 1280px.
If your diagram exceeds this by more than 20%, you have unnecessary empty space.

**NEVER** space content rows more than 2 grid rows (256px) apart unless there are crossing connectors that need the routing space.

### Rule 9b (legacy): Avoid floating annotations with complex uu5json styling

Floating annotations (`addFloatingAnnotation`) with nested `<uu5json/>` styling in the text can break diagram rendering. Use one of these alternatives instead:

**BAD** (can break rendering):
```javascript
builder.addFloatingAnnotation({
    text: '<uu5string/><div style="<uu5json/>{\\\"textAlign\\\":\\\"center\\\"}">GAP</div>'
});
```

**GOOD alternatives:**
```javascript
// Option A: Use a low-importance icon as a label
builder.addIcon({ text: 'GAP', type: 'activityCondition', importance: 'low' });

// Option B: Use plain text without uu5json styling
builder.addFloatingAnnotation({
    text: '<uu5string/>GAP'
});
```

## Quick Start (After Analysis)

1. Complete the MANDATORY analysis above
2. **Write Node.js script using `lib/bml-generator.js`** (NEVER create JSON manually)
3. Add ALL blocks first (containers)
4. Add ALL icons inside their blocks
5. Add ALL connections with labels
6. **Save output to temp file** (script confirms success with size)
7. **Upload using `contentFilePath` parameter** (e.g., `bookkit-update` with `contentFilePath: "/tmp/diagram_output.txt"`)
8. **NEVER load diagram content into chat context**

## CRITICAL: Fit Canvas to Content

Many diagram quality issues come from exporting on a huge fixed canvas where
elements occupy only a small corner (tiny text/icons, large empty space).

- Use `autoFit` in `DiagramBuilder` constructor, or call `builder.fitToContent(...)`
- Keep outer padding (`56-88px`) and set reasonable minimum size
- Avoid forcing `minHeight` above `700` unless content truly needs it
- Use `importance: "normal"` or higher for key nodes; avoid `low` for primary labels
- For multi-diagram generators, use content-based adaptive fit per diagram (two-pass: preview bounds, then final fit)

```javascript
const builder = new DiagramBuilder({
    width: 2048,
    height: 2048,
    autoFit: true,
    fitOptions: { padding: 72, minWidth: 960, minHeight: 560 }
});
```

Adaptive pattern for generator scripts:
```javascript
const preview = builder.build({
  autoFit: true,
  fitOptions: { padding: 64, minWidth: 0, minHeight: 0, maxWidth: 2048, maxHeight: 2048 }
});

const fitOptions = {
  padding: 64,
  minWidth: Math.ceil(Math.max(preview.size.width, 832) / 64) * 64,
  minHeight: Math.ceil(Math.max(preview.size.height, 448) / 64) * 64
};

const uu5 = builder.toUu5String({ autoFit: true, fitOptions });
```

## CRITICAL: Grid System Rules

The BML diagram uses a **fixed 128-pixel grid system**. Icons MUST snap to these exact positions.

### Grid Constants
| Constant | Value | Description |
|----------|-------|-------------|
| Canvas Size | 2048×2048 pixels | Maximum diagram size |
| Icon Size | 64×64 pixels | Each icon is 64×64 |
| Grid Spacing | 128 pixels | Distance between grid positions |
| Gap Between Icons | 64 pixels | Space between adjacent icons (128 - 64 = 64) |

### CRITICAL: Fixed Grid Positions

**Icons MUST be placed at these exact grid positions:**

**X-axis positions** (start at 64, increment by 128):
```
64, 192, 320, 448, 576, 704, 832, 960, 1088, 1216, 1344, 1472, 1600, 1728, 1856
```
Formula: `X = 64 + n × 128` where n = 0, 1, 2, 3...

**Y-axis positions** (start at 0, increment by 128):
```
0, 128, 256, 384, 512, 640, 768, 896, 1024, 1152, 1280, 1408, 1536, 1664, 1792, 1920
```
Formula: `Y = n × 128` where n = 0, 1, 2, 3...

### Grid Limits
| Constraint | Value | Description |
|------------|-------|-------------|
| Canvas | 2048×2048 px | Maximum canvas size |
| Icon size | 64×64 px | Fixed icon dimensions |
| Max X positions | 15 | (64 to 1856, fits 15 columns) |
| Max Y positions | 16 | (0 to 1920, fits 16 rows) |
| Max icons | 15×16 = 240 | Maximum icons on canvas |

**Planning your layout:**
```javascript
// Grid position helpers
const gridX = (col) => 64 + col * 128;   // col = 0, 1, 2...
const gridY = (row) => row * 128;         // row = 0, 1, 2...

// Example: 5 columns × 4 rows
const builder = new DiagramBuilder({ width: 2048, height: 2048 });

// Place icon at column 2, row 3
builder.addIcon({ 
    position: { x: gridX(2), y: gridY(3) },  // {x: 320, y: 384}
    type: 'server'
});
```

### Positioning Rules
1. **X positions**: SHOULD be `64 + n × 128` (64, 192, 320, 448...) for visual consistency
2. **Y positions**: SHOULD be `n × 128` (0, 128, 256, 384...) for visual consistency
3. **Connectors**: Lines are always BETWEEN icons, in the 64px gap
4. **Blocks**: Can be any size and position (more flexible than icons)
5. **Fine positioning**: The library allows 8-pixel grid snapping when needed

### Example Grid Layout
```
           x=64    x=192   x=320   x=448   x=576
        ┌───────────────────────────────────────────
y=0     │   ●       ●       ●       ●       ●
        │
y=128   │   ●       ●       ●       ●       ●
        │
y=256   │   ●       ●       ●       ●       ●
        │
y=384   │   ●       ●       ●       ●       ●
```

## Output Format

```xml
<UuBml.Draw.Diagram value="<uu5json/>{JSON_CONTENT}"/>
```

## Core Structure Template

```json
{
  "id": "uniqueId",
  "author": "15-0000-1",
  "size": { "width": 2048, "height": 2048 },
  "editMode": {
    "frameVisible": true,
    "gridVisible": true,
    "socketsVisible": false,
    "plugsVisible": false,
    "anchorsVisible": false,
    "consoleVisible": false
  },
  "presentationMode": {
    "frameVisible": false,
    "gridVisible": false,
    "socketsVisible": false,
    "plugsVisible": false,
    "anchorsVisible": false
  },
  "elementMap": {},
  "elementZOrderList": []
}
```

## Element Types

### Icon (Main building block)

```json
{
  "id": "iconId",
  "elementType": "Icon",
  "sourceUuBmlStencil": "STENCIL_NAME",
  "uuBmlIconCode": "ICON_CODE",
  "position": { "x": 192, "y": 128 },
  "text": "Label",
  "textWidth": 128,
  "textHidden": false,
  "importance": "normal",
  "plural": false,
  "searchKey": "",
  "state": {},
  "label": {},
  "textBackgroundVisible": false,
  "topPointList": ["socket1", "socket2", "..."],
  "rightPointList": ["socket1", "socket2", "..."],
  "leftPointList": ["socket1", "socket2", "..."],
  "bottomPointList": ["socket1", "socket2", "..."],
  "pluggedSocketsMap": {}
}
```

**Note:** Socket point lists are auto-generated by the library (8-9 hex IDs per side). The template above shows placeholders - never create these manually.

#### Icon State

Icons can display a visual state indicator via the `state` property:

```javascript
builder.addIcon({
    type: 'object',
    text: 'Auction',
    position: { x: gridX(2), y: gridY(0) },
    state: { uuBmlIconStateCode: 's10', uuBmlIconStateGeneric: 'active' }
});
```

**`uuBmlIconStateGeneric` values:**

| Value | Use for |
|-------|---------|
| `active` | Standard active state |
| `system` | System/internal state |
| `initial` | Initial state |
| `final` | Terminal/completed state |
| `alternative-active` | Alternative active state |
| `problem` | Error/problem state |
| `passive` | Inactive/dormant state |
| `alternative-final` | Alternative terminal state |
| `cancelled` | Cancelled state |

Without `state`, the icon has no state indicator (empty object `{}`).
```

### Connector (Simple A→B connection)

```json
{
  "id": "connectorId",
  "elementType": "Connector",
  "searchKey": "",
  "plugMap": {
    "plugA": {
      "id": "plugA",
      "position": { "x": 64, "y": 128 },
      "elementId": "sourceIconId",
      "socketId": "sourceSocketId"
    },
    "plugB": {
      "id": "plugB",
      "position": { "x": 192, "y": 128 },
      "elementId": "targetIconId",
      "socketId": "targetSocketId"
    }
  },
  "socketMap": {},
  "middlePointList": [],
  "importance": "normal",
  "lineStyle": "solid",
  "relationType": "general",
  "startPoint": { "pointType": "Plug", "id": "plugA", "pointer": null },
  "endPoint": { "pointType": "Plug", "id": "plugB", "pointer": "general" },
  "label": null,
  "labelPosition": null
}
```

### MultiConnector (One-to-many connection)

```json
{
  "id": "multiConnectorId",
  "elementType": "MultiConnector",
  "plugMap": {
    "startPlug": { "id": "startPlug", "position": { "x": 64, "y": 128 }, "elementId": "sourceId", "socketId": "socketId" },
    "endPlug1": { "id": "endPlug1", "position": { "x": 192, "y": 64 }, "elementId": "target1Id", "socketId": "socket1Id" },
    "endPlug2": { "id": "endPlug2", "position": { "x": 192, "y": 192 }, "elementId": "target2Id", "socketId": "socket2Id" }
  },
  "socketMap": {},
  "anchorMap": {},
  "importance": "normal",
  "direction": "horizontal",
  "bidirectional": false,
  "inverted": false,
  "lineStyle": "solid",
  "searchKey": "",
  "relationType": "general",
  "startPoint": { "pointType": "Plug", "id": "startPlug", "pointer": null },
  "endPointList": [
    { "pointType": "Plug", "id": "endPlug1", "pointer": "general" },
    { "pointType": "Plug", "id": "endPlug2", "pointer": "general" }
  ]
}
```

### Block (Container/grouping)

Blocks use a dedicated grid system for clean alignment:

| Constant | Value | Description |
|----------|-------|-------------|
| `BLOCK_PADDING` | 40px | Start offset from canvas edge (5 tiles) |
| `BLOCK_STANDARD_SIZE` | 176px | Standard block = 22 tiles |
| `BLOCK_GAP` | 16px | Gap between blocks = 2 tiles |
| `BLOCK_STEP` | 192px | Step between positions = 24 tiles |

**Block Grid Positions:**
```
Position = (40 + col × 192, 40 + row × 192)

col/row 0: 40
col/row 1: 232
col/row 2: 424
col/row 3: 616
col/row 4: 808
col/row 5: 1000
```

**Block Sizes (width/height):**
```
1 unit: 176px (22 tiles) - standard block
2 units: 368px (46 tiles)
3 units: 560px (70 tiles)
```

**Socket Distribution:**
- Sockets placed every ~8px along block edges
- Top/bottom: `floor(width / 8) + 1` sockets (176px → 23)
- Left/right: `floor(height / 8) - 1` sockets (176px → 21)

```json
{
  "id": "blockId",
  "elementType": "Block",
  "searchKey": "",
  "size": { "width": 176, "height": 176 },
  "position": { "x": 40, "y": 40 },
  "importance": "normal",
  "text": "<uu5string/>Block",
  "textLocation": "top",
  "topSocketList": ["hexId1", "hexId2", "..."],
  "bottomSocketList": ["..."],
  "leftSocketList": ["..."],
  "rightSocketList": ["..."],
  "anchorPositionMap": {
    "topLeft": "hexId",
    "topMiddle": "hexId",
    "topRight": "hexId",
    "right": "hexId",
    "bottomRight": "hexId",
    "bottomMiddle": "hexId",
    "bottomLeft": "hexId",
    "left": "hexId"
  },
  "pluggedSocketsMap": {}
}
```

**JavaScript helpers:**
```javascript
const { blockPosition, blockSize, iconPositionInBlock } = require('./lib/bml-generator');

// Position at grid cell (col=1, row=0) → (232, 40)
const pos = blockPosition(1, 0);

// Size spanning 2 columns × 1 row → (368, 176)
const size = blockSize(2, 1);

// Icon position inside block at internal grid (0,0) → 8px inset from corner
const iconPos = iconPositionInBlock(block, 0, 0);
```

### Uu5Component (Embedded UU5 content)

Allows embedding any UU5 string content directly inside the diagram.

```json
{
  "id": "uu5CompId",
  "elementType": "Uu5Component",
  "searchKey": "",
  "size": { "width": 200, "height": 100 },
  "position": { "x": 28, "y": 128 },
  "importance": "normal",
  "text": "<uu5string/><Uu5Elements.Header level=\"3\">Title</Uu5Elements.Header><Uu5Elements.Text>Content here</Uu5Elements.Text>",
  "textLocation": "top",
  "topSocketList": [],
  "bottomSocketList": [],
  "leftSocketList": [],
  "rightSocketList": [],
  "anchorPositionMap": {},
  "pluggedSocketsMap": {}
}
```

The `text` property accepts full UU5 string content.

### Annotation (Text box with optional pointer)

Annotations are neutral text boxes with optional pointers to other elements. Best for short neutral notes.

**Properties:** `position`, `size`, `text`, `importance`, `pointerHidden`, `link`

**Pointer side mapping (orderInPolygon):**
| Value | Side |
|-------|------|
| 1 | top |
| 2 | right |
| 3 | bottom |
| 4 | left |

**JavaScript usage:**
```javascript
// Annotation pointing to an icon
const icon = builder.addIcon({ type: 'command', position: {x: 576, y: 448} });

builder.addAnnotation({
    position: { x: 700, y: 448 },
    size: { width: 176, height: 72 },
    text: '<uu5string/>Invoice data transfer to ERP system of Operator.',
    importance: 'normal',
    targetIcon: icon,
    pointerSide: 'left'
});

// Floating annotation (no pointer)
builder.addFloatingAnnotation({
    position: { x: 100, y: 100 },
    size: { width: 150, height: 50 },
    text: '<uu5string/>Just a note',
    importance: 'low'
});
```

### Callout (Colored speech bubble with pointer)

Callouts are **colored speech bubbles** whose visual style follows the `importance` level. They are the primary element for adding explanatory text to diagrams (e.g., the speech bubbles in architecture overviews).

**Properties:** `position`, `size`, `text`, `importance`, `targetIcon`, `pointerSide`, `link`

**Importance → Color mapping:**
| Importance | Color | Use For |
|------------|-------|---------|
| `objective` | Distinct highlight | Critical callout |
| `highest` | Red/strong | Error or warning callout |
| `high` | Orange/medium | Important note |
| `normal` | Blue/standard | General explanation |
| `low` | Gray/subdued | Background context |
| `problem` | Problem indicator | Issue description |

```javascript
// Callout pointing to an icon (colored speech bubble)
const platform = builder.addIcon({ type: 'uusubapp', position: {x: 320, y: 256} });

builder.addCallout({
    position: { x: 40, y: 200 },
    size: { width: 200, height: 100 },
    text: '<uu5string/>Public portal that provides:\n- charging stations\n- navigation\n- reservations\n- payments',
    importance: 'normal',
    targetIcon: platform,
    pointerSide: 'right'
});

// Floating callout (no pointer — standalone colored bubble)
builder.addFloatingCallout({
    position: { x: 500, y: 600 },
    size: { width: 220, height: 64 },
    text: '<uu5string/>Large-scale control of infrastructure.',
    importance: 'low'
});

// Callout with clickable link
builder.addCallout({
    position: { x: 700, y: 300 },
    size: { width: 180, height: 60 },
    text: '<uu5string/>See documentation',
    importance: 'normal',
    link: { type: 'link', link: 'https://example.com', target: '_blank' }
});
```

### Starburst (Star-shaped highlight)

Starbursts are star-shaped elements for drawing attention. Use for marking new features, warnings, or important highlights.

**Properties:** `position`, `size`, `text`, `importance`, `spikesNumber`, `spikesShape`, `link`

```javascript
builder.addStarburst({
    position: { x: 192, y: 128 },
    size: { width: 128, height: 128 },
    text: '<uu5string/>NEW!',
    importance: 'highest',
    spikesNumber: 12,       // Number of spikes (default: 12)
    spikesShape: 'normal'   // 'normal' or 'rounded'
});
```

**In JavaScript**, use actual characters (newlines, quotes) - let `JSON.stringify` handle escaping:

```javascript
const uu5Content = `<uu5string/>
<Uu5Elements.Header level="3">Title</Uu5Elements.Header>
<Uu5Elements.Text>Content here</Uu5Elements.Text>`;

builder.addUu5Component({
    position: { x: 100, y: 200 },
    size: { width: 300, height: 150 },
    text: uu5Content
});
```

**In the final JSON** (after serialization), it looks like:
```json
{
  "text": "<uu5string/>\n<Uu5Elements.Header level=\"3\">Title</Uu5Elements.Header>"
}
```

The content can include any UU5 components including `UuBookKit.References.Quotation`.

### Annotation (Text with pointer)

**IMPORTANT**: Annotations MUST have valid `pointerStart` configuration. Never set `pointerStart: null` - it will cause rendering errors.

```json
{
  "id": "annotationId",
  "elementType": "Annotation",
  "searchKey": "",
  "size": { "width": 160, "height": 64 },
  "position": { "x": 40, "y": 180 },
  "text": "<uu5string />Your annotation text with <Uu5RichText.Code>code</Uu5RichText.Code>",
  "pointerStart": {
    "positionOnAnnotation": ["bottom", "left", "top", "right"],
    "pointList": [{ "x": 100, "y": 180 }, { "x": 120, "y": 180 }],
    "orderInPolygon": 1
  },
  "pointerEnd": { "pointType": "Plug", "id": "pointerPlugId" },
  "plugMap": {
    "pointerPlugId": {
      "id": "pointerPlugId",
      "position": { "x": 128, "y": 128 },
      "elementId": "targetElementId",
      "socketId": "targetSocketId"
    }
  },
  "anchorPositionMap": {}
}
```

For simple text labels without pointers, use UU5 components outside the diagram instead:
```xml
<Uu5Elements.Header level="2">Title</Uu5Elements.Header>
```

## Common Stencils and Icons

| Stencil | Icon Codes | Use For |
|---------|------------|---------|
| `uuappcommon` | `activity`, `activityState`, `command`, `document`, `folder`, `object`, `role`, `useCase`, `businessUseCase`, `runScript`, `uusubapp`, `vote`, `uujson` | Core application elements |
| `uubmlitstuff` | `applicationServer` | IT infrastructure |
| `uuplus4umall` | `product` | External products, tools |
| `uubmlcompanyicons` | `plus4u` | Company/brand icons |
| `uubookkit` | `book`, `page`, `section`, `uuBookKit` | BookKit elements |
| `uuappmodelkit` | `uuAppModelKit` | AppModelKit references |
| `uumanagementkit` | `managementKit` | ManagementKit references |
| `uufls` | `uuFls` | FLS references |
| `uuAiChat` | `uuAi`, `uuBusinessChat` | AI/Chat references |
| `uucloudmongodboperator` | `database` | Database icons |
| `uucloudoperationregistry` | `messageBus` | Message bus/queue |
| `uuasyncjob` | `jobBroker` | Async job processing |
| `uubinarycontent` | `file` | Binary files |
| `uutestman` | `testcase` | Testing |
| `uutsstore` | `tsStore` | Time series storage |
| `uutsmetamodel` | `tsType`, `tsMetaModel` | Time series metadata |
| `energyicons` | `powerStation`, `ecpClient`, `trader` | Energy domain |

## Importance Levels

| Level | Visual | Use For |
|-------|--------|---------|
| `objective` | Distinct highlight | Most important elements |
| `highest` | Strong emphasis | Commands, key operations |
| `high` | Medium emphasis | Main components |
| `normal` | Standard | Regular elements |
| `low` | Subdued | Background elements |

## Line Styles

| Style | Visual | Use For |
|-------|--------|---------|
| `solid` | ───── | Direct relationships, standard connections |
| `dashed` | - - - | Indirect/skip relationships, optional paths |
| `dotted` | ····· | Weak dependencies, references |

## Connection Presets

The library provides convenient presets for common connection patterns:

| Preset | Visual | Use For |
|--------|--------|---------|
| `arrow` | ───→ | Standard arrow: method calls, data flow, general dependencies |
| `association` | ◇──1 | Parent-child containment, component hierarchies |
| `skip` | ◇- -1 | Indirect association (dashed): components between source and target |
| `aggregation` | ───◇ | Has-a relationship (hollow diamond) |
| `composition` | ───◆ | Owns relationship (filled diamond) |
| `inheritance` | ───△ | Extends/implements relationship |
| `optional` | - -→ | Optional/conditional arrow (dashed) |
| `reference` | ···→ | Weak reference (dotted) |
| `line` | ───── | Plain line without arrows |

**Usage with presets:**
```javascript
// Standard arrow (default)
builder.connect(methodIcon, commandIcon);

// Parent-child association with multiplicity markers
builder.connect(childComponent, parentComponent, { preset: 'association' });

// Skip/indirect relationship (dashed line)
builder.connect(childIcon, parentIcon, { preset: 'skip' });

// Or use helper methods
builder.connectAssociation(child, parent);  // Association preset
builder.connectSkip(child, parent);         // Skip preset (dashed)
builder.connectInheritance(subclass, superclass);
```

## Connector Labels

Connectors can have text labels displayed along the line:

```javascript
builder.connect(fromIcon, toIcon, {
    label: 'My Label Text',
    labelPosition: 1  // Position along the connector path
});
```

**Label Position Values:**
- `1` - Near the start of the connector
- `2` - Middle of the connector  
- `3` - Near the end of the connector
- `null` - No label position (label hidden even if text provided)

**Example with labels:**
```javascript
// Connection with label at middle
builder.connect(appGW, umeLB, { label: 'init UME', labelPosition: 2 });

// Connection with label near start
builder.connect(docker, umeAKS, { label: 'deploy', labelPosition: 1 });
```

## Relation Types

**Convention:** `connect(child/part, parent/owner)` — the symbol (◆, ◇, △) appears at endPoint (parent side).

| Type | startPointer | endPointer | Visual | Use For |
|------|-------------|-----------|--------|---------|
| `general` | `null` | `general` | →  | Standard arrow, method calls, dependencies |
| `association1` | `one` | `association` | 1—◇ | Association with "1" multiplicity, parent-child |
| `associationN` | `null` | `association` | —◇ | Association with "N" multiplicity (N from relationType) |
| `aggregation1` | `one` | `aggregation` | 1—◇ | Aggregation (hollow diamond), has-a with "1" multiplicity |
| `aggregationN` | `null` | `aggregation` | —◇ | Aggregation with N multiplicity (N from relationType) |
| `composition1` | `one` | `composition` | 1—◆ | Composition (filled diamond), strong ownership with "1" |
| `compositionN` | `null` | `composition` | —◆ | Composition with N multiplicity (N from relationType) |
| `inheritance` | `null` | `inheritance` | —△ | Inheritance, extends/implements |

These pointer defaults are applied automatically when using `relationType` without a preset. Explicit `startPointer`/`endPointer` options always override defaults.

## Pointer Types

Control what appears at each end of a connector. `null` means nothing is drawn at that end — if a visual element must appear, the pointer must be explicitly set.

| Pointer | Visual | Description |
|---------|--------|-------------|
| `null` | (none) | No decoration, plain line end |
| `general` | → | Standard arrow pointer |
| `one` | 1 | Multiplicity "1" marker. Only for `*1` relation types (cardinality 0..1 or 1). |
| `association` | ◇ | Association diamond marker |
| `aggregation` | ◇ | Aggregation hollow diamond |
| `composition` | ◆ | Composition filled diamond |
| `inheritance` | △ | Inheritance triangle |

**Custom pointer configuration:**
```javascript
// Convention: connect(child, parent) — symbol at endPoint (parent side)
builder.connect(childIcon, parentIcon, {
    relationType: 'association1',
    lineStyle: 'solid',
    startPointer: 'one',        // Shows "1" at child
    endPointer: 'association'   // Shows diamond at parent
});
```

## Positioning Rules (Summary)

1. **Canvas**: 2048×2048 pixels maximum
2. **Icon size**: 64×64 pixels
3. **Grid spacing**: 128 pixels (icons positioned at 128px intervals)
4. **X positions**: `64 + n × 128` (64, 192, 320, 448...)
5. **Y positions**: `n × 128` (0, 128, 256, 384...)
6. **Gap between icons**: 64 pixels (space for connectors)
7. **Block size**: Any size (should align to grid boundaries)

## Z-Order

`elementZOrderList` controls layering:
- First = bottom (Blocks first)
- Last = top (Connectors last)

## Socket Connection System

Icons have socket points on all sides. When connecting:
1. Source icon provides socket from appropriate side
2. Connector plug connects to that socket
3. Update `pluggedSocketsMap` on the icon

## Generation Workflow

### When Creating from Image/Screenshot:

1. **Analyze thoroughly**: 
   - Count ALL blocks, icons, connections in the image
   - Note ALL labels, ports, annotations
   - Identify nested structures (elements inside blocks)
   - Note the legend if present

2. **Create element inventory**:
   ```
   Source has:
   - 4 blocks: Rancher RKE2, DEV RKE2, UME RKE2, Legend
   - 15 icons: server1-3 (Rancher), server1-6 (DEV), server1-3 (UME), 3 LBs, 2 users
   - 12 connections with port labels
   ```

3. **Ask if complex**: If >10 elements, show inventory and ask user to confirm

4. **Plan layout on paper/mentally**:
   - Determine diagram size needed
   - Position blocks first
   - Position icons inside blocks
   - Plan connection routing

5. **Create in order**:
   - Blocks (containers) first
   - Icons inside blocks
   - Connections with labels
   - Legend/annotations

6. **Verify**: Compare your diagram inventory to source inventory

### Z-Order Rules:
- Blocks → Icons → Connectors → Annotations
- Blocks must be FIRST (bottom layer) so icons appear on top

## JavaScript Library

Use the `lib/bml-generator.js` library for programmatic diagram generation.

### Quick Example (File-Based Output - REQUIRED)

```javascript
const { DiagramBuilder } = require('./lib/bml-generator');
const fs = require('fs');

// Build on full canvas, then auto-fit to used content area
const builder = new DiagramBuilder({
    width: 2048,
    height: 2048,
    autoFit: true,
    fitOptions: { padding: 96, minWidth: 1024, minHeight: 640 }
});

const phases = [
    { text: '1. Planning', type: 'activityState', importance: 'highest' },
    { text: '2. Analysis', type: 'activityState', importance: 'high' },
    { text: '3. Design', type: 'activityState', importance: 'high' },
    { text: '4. Development', type: 'activityState', importance: 'high' },
    { text: '5. Testing', type: 'activityState', importance: 'high' },
    { text: '6. Deployment', type: 'activityState', importance: 'high' }
];

// Add icons in circular layout (centered in 2048×2048 canvas)
const icons = builder.addIcons(phases, 'circle', { centerX: 960, centerY: 896, radius: 384 });
builder.connectCycle(icons);

// CRITICAL: Save to temp file - NEVER console.log the full content
const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/diagram_output.txt', uu5);
console.log('Diagram saved to /tmp/diagram_output.txt');
console.log('Size:', uu5.length, 'bytes');
```

### Complete Architecture Diagram Template

```javascript
const { DiagramBuilder } = require('./lib/bml-generator');
const fs = require('fs');

// Helper functions for grid positions
const gridX = (col) => 64 + col * 128;   // X = 64 + n × 128
const gridY = (row) => row * 128;         // Y = n × 128

// Canvas workspace (auto-fit trims unused area in final output)
const builder = new DiagramBuilder({
    width: 2048,
    height: 2048,
    autoFit: true,
    fitOptions: { padding: 96, minWidth: 1024, minHeight: 640 }
});

// === BLOCKS (define containers first) ===
builder.addBlock({ 
    id: 'block_main', 
    position: { x: gridX(0), y: gridY(0) },  // {x: 64, y: 0}
    size: { width: 512, height: 384 },        // Spans 4 columns × 3 rows
    text: 'Main System', 
    importance: 'highest' 
});

// === ICONS (add inside blocks, icons are 64×64 pixels) ===
const server = builder.addIcon({ 
    type: 'server', 
    position: { x: gridX(1), y: gridY(1) },  // {x: 192, y: 128}
    text: 'Server', 
    textWidth: 96, 
    importance: 'highest' 
});

const database = builder.addIcon({ 
    type: 'database', 
    position: { x: gridX(1), y: gridY(2) },  // {x: 192, y: 256}
    text: 'Database', 
    textWidth: 96 
});

// === CONNECTIONS ===
builder.connect(server, database, { label: 'query', labelPosition: 2 });

// === SAVE TO FILE (REQUIRED) ===
const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/diagram_output.txt', uu5);
console.log('Diagram saved. Size:', uu5.length, 'bytes');
// Do NOT log or output the actual UU5 content!
```

### Available Layouts

| Layout | Function | Options |
|--------|----------|---------|
| `circle` | Arrange in circle | `centerX`, `centerY`, `radius`, `startAngle` |
| `horizontal` | Left to right | `startX`, `y`, `spacing` |
| `vertical` | Top to bottom | `x`, `startY`, `spacing` |
| `grid` | Grid arrangement | `startX`, `startY`, `columns`, `spacingX`, `spacingY` |

### Available Types (STENCILS)

**Core Application (uuappcommon)**
| Type Key | Icon |
|----------|------|
| `activity` | activity |
| `activityState` | activityState |
| `activityAction` | activityAction |
| `activityCondition` | activityCondition |
| `command` | command |
| `document` | document |
| `folder` | folder |
| `folderOpened` | folderopened |
| `folderInterface` | folderInterface |
| `object` | object |
| `objectTemplate` | objectTemplate |
| `role` | role |
| `useCase` | useCase |
| `useCaseObject` | useCaseObject |
| `businessUseCase` | businessUseCase |
| `elementaryActivity` | elementaryActivity |
| `runScript` | runScript |
| `scheduledCommand` | scheduledAsynchronousCommand |
| `userEntrypoint` | userVisualEntrypoint |
| `activityItem` | uuactivityitem |
| `json` | uujson |
| `vote` | vote |
| `uuappBox` | uuappBox |
| `uusubapp` | uusubapp |
| `accessRightUnit` | accessRightUnit |
| `accessRights` | accessRights |
| `accessRole` | accessRole |
| `actor` | actor |
| `artifact` | artifact |
| `artifactInterface` | artifactInterface |
| `artifactState` | artifactState |
| `asynchronousCommand` | asynchronousCommand |
| `attachment` | attachment |
| `businessAccessRole` | businessAccessRole |
| `businessGroup` | businessGroup |
| `businessRole` | businessRole |
| `button` | button |
| `chart1ContentComponent` | chart1ContentComponent |
| `chart2ContentComponent` | chart2ContentComponent |
| `controlPanel` | controlPanel |
| `contentComponent` | contentComponent |
| `comment` | comment |
| `doIt` | doIt |
| `decide` | decide |
| `dataTable` | dataTable |
| `dataRow` | dataRow |
| `emailUser` | emailUser |
| `emailGroup` | emailGroup |
| `emailCompany` | emailCompany |
| `emotionContentComponent` | emotionContentComponent |
| `imageContentComponent` | imageContentComponent |
| `help` | help |
| `guideline` | guideline |
| `group` | group |
| `meeting` | meeting |
| `locationContentComponent` | locationContentComponent |
| `lifeCycle` | lifeCycle |
| `interface` | interface |
| `notice` | notice |
| `message` | message |
| `method` | method |
| `process` | process |
| `personalRoleFolder` | personalRoleFolder |
| `task` | task |
| `visualUseCase2` | visualUseCase2 |
| `uuxml` | uuxml |
| `uusubappDataStore` | uusubappdatastore |
| `uuIotNode` | uuIotNode |
| `uuappMetaFolder` | uuappMetaFolder |
| `uuappWorkspace` | uuappWorkspace |
| `uuappBinaryStore` | uuappbinarystore |
| `uubinary` | uubinary |
| `uudigitalOperator` | uudigitaloperator |
| `uuee` | uuee |
| `uunode` | uunode |
| `uuobc` | uuobc |
| `uuelc` | uuelc |

**Infrastructure**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `server` | uubmlitstuff | applicationServer |
| `database` | uucloudmongodboperator | database |
| `messageBus` | uucloudoperationregistry | messageBus |
| `jobBroker` | uuasyncjob | jobBroker |
| `asyncQueue` | uuasyncjob | queue |
| `asyncCommand` | uuasyncjob | command |
| `file` | uubinarycontent | file |

**Products**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `product` | uuplus4umall | product |
| `book` | uubookkit | book |
| `page` | uubookkit | page |
| `section` | uubookkit | section |
| `bookKit` | uubookkit | uuBookKit |
| `caption` | uubookkit | caption |
| `trash` | uubookkit | trash |
| `appModelKit` | uuappmodelkit | uuAppModelKit |
| `managementKit` | uumanagementkit | managementKit |
| `fls` | uufls | uuFls |
| `uuAi` | uuAiChat | uuAi |
| `businessChat` | uuAiChat | uuBusinessChat |

**Testing & Data**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `testcase` | uutestman | testcase |
| `tsStore` | uutsstore | tsStore |
| `tsType` | uutsmetamodel | tsType |
| `tsMetaModel` | uutsmetamodel | tsMetaModel |

**Energy Domain**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `powerStation` | energyicons | powerStation |
| `ecpClient` | energyicons | ecpClient |
| `ecpNode` | energyicons | ecpNode |
| `trader` | energyicons | trader |
| `electricity` | energyicons | electricity |
| `dsoB` | energyicons | dsoB |
| `fuel` | energyicons | fuel |
| `lowVoltageLine` | energyicons | lowVoltageLine |
| `res` | energyicons | res |

**Enterprise & Platform**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `enterpriseUuAppPlatform` | enterpriseuuappplatform | enterpriseuuappplatform |
| `uuAppPipeline` | uuapppipeline | uuAppPipeline |

**Geoinformatics**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `geoApplicationProcess` | geoinformatics | applicationProcess |
| `geoPlace` | geoinformatics | place |
| `geoProduct` | geoinformatics | product |
| `geoUser` | geoinformatics | user |
| `geoUserVisualEntrypoint` | geoinformatics | userVisualEntrypoint |
| `geoWebpage` | geoinformatics | webpage |
| `geoTablet` | geoinformatics | tablet |
| `geoMobilePhone` | geoinformatics | mobilePhone |
| `geoDesktop` | geoinformatics | desktop |
| `geoCity` | geoinformatics | city |
| `geoBuilding` | geoinformatics | building |

**WebKit**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `homepage` | uuwebkit | homepage |
| `webkitWebpage` | uuwebkit | webpage |
| `website` | uuwebkit | website |

**Territory (uuterritory)**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `territoryActivity` | uuterritory | activity |
| `territoryElementaryActivity` | uuterritory | elementaryActivity |
| `territoryElementaryDecide` | uuterritory | elementaryDecide |
| `territoryElementaryChat` | uuterritory | elementaryChat |
| `territoryInfo` | uuterritory | info |
| `territoryUuai` | uuterritory | uuai |
| `territoryUuappTypeProfile` | uuterritory | uuappTypeProfile |
| `territoryUuartifact` | uuterritory | uuartifact |
| `territoryUubusinessAccessRole` | uuterritory | uubusinessAccessRole |
| `territoryUugroup` | uuterritory | uugroup |
| `territoryUuobject` | uuterritory | uuobject |
| `territoryUuunit` | uuterritory | uuunit |
| `territoryUuwhiteList` | uuterritory | uuwhiteList |
| `territoryUuthing` | uuterritory | uuthing |
| `territoryUurole` | uuterritory | uurole |
| `territoryUuObjectRoleProfile` | uuterritory | uuObjectRoleProfile |
| `territoryUupermission` | uuterritory | uupermission |
| `territoryUumyTerritory` | uuterritory | uumyTerritory |
| `territoryUuAtcRoleProfile` | uuterritory | uuAtcRoleProfile |
| `territoryUuawidee` | uuterritory | uuawidee |

**Cloud Log Store**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `log` | uucloudlogstore | log |
| `logRecord` | uucloudlogstore | logRecord |
| `uuCloudLogstore` | uucloudlogstore | uuCloudLogstore |

**OS Common**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `controller` | uuoscommon | controller |
| `systemMessage` | uuoscommon | systemMessage |
| `uuBusinessClub` | uuoscommon | uuBusinessClub |
| `uuclub` | uuoscommon | uuclub |
| `uuconsole` | uuoscommon | uuconsole |
| `club` | uuoscommon | club |

**Engines & Console**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `uuScriptEngine` | uuscriptengine | uuScriptEngine |
| `uuBookingEngine` | uubookingengine | uuBookingEngine |
| `uuConsole` | uuconsole | uuConsole |

**Software Development (uupproductionsoftwaredevelopement)**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `swComponent` | uupproductionsoftwaredevelopement | component |
| `swFile` | uupproductionsoftwaredevelopement | file |
| `nonVisualComponent` | uupproductionsoftwaredevelopement | nonVisualComponent |
| `swModule` | uupproductionsoftwaredevelopement | module |
| `subsystem` | uupproductionsoftwaredevelopement | subsystem |
| `userPolicy` | uupproductionsoftwaredevelopement | userPolicy |
| `visualComponent` | uupproductionsoftwaredevelopement | visualComponent |
| `swUserVisualEntrypoint` | uupproductionsoftwaredevelopement | userVisualEntrypoint |
| `thread` | uupproductionsoftwaredevelopement | thread |
| `methodology2` | uupproductionsoftwaredevelopement | methodology2 |
| `directoryTree` | uupproductionsoftwaredevelopement | directoryTree |
| `dataStructure` | uupproductionsoftwaredevelopement | dataStructure |
| `browser` | uupproductionsoftwaredevelopement | browser |
| `cache` | uupproductionsoftwaredevelopement | cache |
| `swDatabase` | uupproductionsoftwaredevelopement | database |

**Transport (uubmltransport)**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `airplane` | uubmltransport | airplane |
| `bus` | uubmltransport | bus |
| `car` | uubmltransport | car |
| `offRoad` | uubmltransport | offRoad |
| `roadster` | uubmltransport | roadster |
| `sailboat` | uubmltransport | sailboat |
| `tanker` | uubmltransport | tanker |
| `tractor` | uubmltransport | tractor |
| `train` | uubmltransport | train |
| `truck` | uubmltransport | truck |
| `truckLoaded` | uubmltransport | truckLoaded |

**Electronic Stuff (uubmlelectronicstuff)**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `antenna` | uubmlelectronicstuff | antenna |
| `camera` | uubmlelectronicstuff | camera |
| `notebook` | uubmlelectronicstuff | notebook |
| `tablet` | uubmlelectronicstuff | tablet |
| `television` | uubmlelectronicstuff | television |
| `gps` | uubmlelectronicstuff | gps |
| `headphones` | uubmlelectronicstuff | headphones |
| `microphone` | uubmlelectronicstuff | microphone |

**Buildings & Equipment (uubmlbuildingsandequipment)**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `building` | uubmlbuildingsandequipment | building |
| `city` | uubmlbuildingsandequipment | city |
| `hotel` | uubmlbuildingsandequipment | hotel |
| `house` | uubmlbuildingsandequipment | house |
| `restaurant` | uubmlbuildingsandequipment | restaurant |
| `key` | uubmlbuildingsandequipment | key |
| `machine` | uubmlbuildingsandequipment | machine |

**Office Stuff (uubmlofficestuff)**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `calendar` | uubmlofficestuff | calendar |
| `clipboard` | uubmlofficestuff | clipboard |
| `clock` | uubmlofficestuff | clock |
| `desktop` | uubmlofficestuff | desktop |
| `monitor` | uubmlofficestuff | monitor |
| `office` | uubmlofficestuff | office |
| `printer` | uubmlofficestuff | printer |

**Miscellaneous (uubmlmiscellaneous)**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `exclamation` | uubmlmiscellaneous | exclamation |
| `infoMisc` | uubmlmiscellaneous | info |
| `okMisc` | uubmlmiscellaneous | ok |
| `questionMisc` | uubmlmiscellaneous | question |
| `stopMisc` | uubmlmiscellaneous | stop |
| `universe` | uubmlmiscellaneous | universe |

**ChargeUp / eMobility (uuchargeup)**
| Type Key | Stencil | Icon |
|----------|---------|------|
| `aggregator` | uuchargeup | aggregator |
| `chargingApp` | uuchargeup | application |
| `chargingStation` | uuchargeup | chargingStation |
| `evDriver` | uuchargeup | evDriver |
| `invoice` | uuchargeup | invoice |
| `report` | uuchargeup | report |
| `reservation` | uuchargeup | reservation |
| `chargingSystem` | uuchargeup | system |
| `tariff` | uuchargeup | tariff |
| `transaction` | uuchargeup | transaction |

### DiagramBuilder Methods

| Method | Description |
|--------|-------------|
| `addIcon(config)` | Add single icon (supports `link` property) |
| `addIcons(configs, layout, options)` | Add multiple icons with layout |
| `addLabel(config)` | Add text label (low-importance icon shortcut) |
| `addBlock(config)` | Add container block |
| `addUu5Component(config)` | Add embedded UU5 content component |
| `addAnnotation(config)` | Add annotation with optional pointer (supports `importance`, `pointerHidden`, `link`) |
| `addFloatingAnnotation(config)` | Add floating annotation (no pointer) |
| `addCallout(config)` | Add colored speech bubble with optional pointer (supports `importance`, `link`) |
| `addFloatingCallout(config)` | Add floating callout (no pointer, colored bubble) |
| `addStarburst(config)` | Add star-shaped highlight (supports `spikesNumber`, `spikesShape`, `link`) |
| `addLane(config)` | Add horizontal swim lane with centered icons |
| `connect(from, to, options)` | Connect two icons (use `preset` for line type) |
| `connectAssociation(from, to)` | Connect with association style (◇—1) |
| `connectSkip(from, to)` | Connect with dashed association (indirect) |
| `connectAggregation(from, to)` | Connect with aggregation (◇) |
| `connectComposition(from, to)` | Connect with composition (◆) |
| `connectInheritance(from, to)` | Connect with inheritance (△) |
| `connectLine(from, to)` | Connect with plain line (no arrows) |
| `connectChain(icons)` | Connect icons A→B→C |
| `connectCycle(icons)` | Connect in cycle A→B→C→A |
| `connectMulti(from, toArray)` | Fan-out using MultiConnector |
| `connectMultiIn(fromArray, to)` | Fan-in using MultiConnector |
| `connectMultiAssociation(from, toArray)` | Fan-out with association style |
| `classifyConnections(list)` | Auto-classify connection patterns (1:1, fan-out, fan-in) |
| `executeConnectionPlan(plan)` | Execute classified connection plan |
| `build()` | Get diagram JSON |
| `toUu5String()` | Get UU5 string |

### Uu5Component Usage

```javascript
// Use template literals with actual newlines and quotes
const uu5Content = `<uu5string/>
<Uu5Elements.Header level="3">API Response</Uu5Elements.Header>
<Uu5Elements.Text>Returns JSON with status and data.</Uu5Elements.Text>`;

builder.addUu5Component({
    position: { x: 20, y: 20 },
    size: { width: 100, height: 60 },
    text: uu5Content
});

// toUu5String() handles escaping automatically
const uu5Output = builder.toUu5String();
```

**Manual escaping for UU5 embedding (legacy only):**
```javascript
const json = JSON.stringify(diagram);
const escaped = json
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"');   // Then escape quotes
const content = `<UuBml.Draw.Diagram value="<uu5json/>${escaped}"/>`;
```

### Connection Routing

The library automatically creates **orthogonal (right-angle) connectors** with breakpoints:

- **Aligned elements**: Direct horizontal or vertical line
- **Diagonal elements**: L-shaped routing with breakpoints in `middlePointList`
- **Fan-out patterns**: Use `connectMulti()` for cleaner one-to-many connections

### Socket Positioning

Icons are 64×64 pixels. Connector attachment positions are at icon edges and center.

**Socket Position Offsets (from icon.position):**

| Side | X Offset | Y Offset | Description |
|------|----------|----------|-------------|
| **Top** | x + 32 | y | Horizontal center, at icon top edge |
| **Bottom** | x + 32 | y + 80 | Horizontal center, below icon + label space |
| **Left** | x | y + 40 | At icon left edge, visual center |
| **Right** | x + 64 | y + 40 | At icon right edge, visual center |

**Example:** For an icon at grid position `{x: 192, y: 128}` (column 1, row 1):
- Top socket: `{x: 224, y: 128}`
- Bottom socket: `{x: 224, y: 208}`
- Left socket: `{x: 192, y: 168}`
- Right socket: `{x: 256, y: 168}`

**IMPORTANT for orthogonal lines:** 
- All connector segments MUST be either horizontal (same Y) or vertical (same X)
- Connectors run in the 64px gap between icons
- Plug positions must align with breakpoint positions
- Breakpoints must create proper L-shaped or S-shaped routes

## CRITICAL: Use uu5g05 Components Only

**NEVER use uu5g04 components (UU5.Bricks.*).** Always use uu5g05 equivalents.

### uu5g04 to uu5g05 Migration Map

| uu5g04 (NEVER use) | uu5g05 (ALWAYS use) | Library |
|---------------------|---------------------|---------|
| `UU5.Bricks.Section` | `Uu5Bricks.Section` (for page sections) or `Uu5Bricks.Block` (for styled blocks) | Uu5Bricks. Section wraps Block with `card="none"`, `headerType="heading"`. See [docs](https://uuapp.plus4u.net/uu-bookkit-maing01/095c89622cff47349335a20b01d8b92d/book/page?code=Uu5BricksSection). |
| `UU5.Bricks.Header` | `Uu5Elements.Header` | Uu5Elements |
| `UU5.Bricks.P` | `Uu5Elements.Text` (inside `Uu5RichTextBricks.Block`) | Uu5Elements |
| `UU5.Bricks.Strong` | `Uu5Elements.Text` with `bold` prop | Uu5Elements |
| `UU5.Bricks.Code` | `Uu5Bricks.Code` | Uu5Bricks |
| `UU5.Bricks.Ul/Ol/Li` | `UU5.Bricks.Ul/Ol/Li` (no simple uu5g05 replacement — these still work) | **Exception**: keep using uu5g04 list components for simple text lists |
| `UU5.Bricks.Table.*` | `Uu5TilesBricks.Table` with `columnList` + `data` | Uu5TilesBricks |
| `UU5.Bricks.Pre + Code` | `Uu5CodeKitBricks.Code` | Uu5CodeKitBricks |

**NEVER use raw HTML tags** (`<p>`, `<strong>`, `<table>`, `<ul>`, `<li>`, `<tr>`, `<td>`) in uu5string. Always use the uu5g05 component equivalents above.

### Key uu5g05 Libraries

| Library | Purpose | Key Components |
|---------|---------|----------------|
| `Uu5Bricks` | Layout & structure | `Block`, `Section`, `Code`, `Link`, `Card`, `InfoBlock`, `Blockquote` |
| `Uu5Elements` | UI elements | `Header`, `Grid`, `Box`, `HighlightedBox`, `Button`, `Badge` |
| `Uu5RichTextBricks` | Rich text content | `Block` (with `uu5String` prop for formatted text) |
| `Uu5CodeKitBricks` | Code display | `Code` (with `codeStyle`, `value`, `wrapEnabled`) |

### Code Blocks (Uu5CodeKitBricks.Code)

```xml
<Uu5CodeKitBricks.Code codeStyle="javascript" wrapEnabled value='const item = {
  code: "CONTRACT-001",
  timeInterval: { from: "2024-01-01", to: null }
};'></Uu5CodeKitBricks.Code>
```

Rules:
- `codeStyle` values: `javascript`, `json`, `html`, `css`, `bash`, `xml`, `text`
- Always add `wrapEnabled` for long lines
- Prefer single quotes around the `value` attribute so JavaScript double quotes stay readable
- **CRITICAL: The `value` content must NOT contain literal single quotes** — a `'` inside `value='...'` terminates the attribute and breaks UU5 parsing. Replace apostrophes with alternatives (e.g., `A_new` instead of `A'`, or restructure the text).
- Do NOT pre-escape code quotes as `&quot;` (it can render literally in output)
- Content goes in `value` attribute, NOT as children

### Bullet Lists

**For simple text lists**, use `UU5.Bricks.Ul/Ol` + `UU5.Bricks.Li` (these uu5g04 list components still work correctly in BookKit and have no direct simple uu5g05 replacement):

```xml
<UU5.Bricks.Ul>
  <UU5.Bricks.Li>First item</UU5.Bricks.Li>
  <UU5.Bricks.Li>Second item</UU5.Bricks.Li>
</UU5.Bricks.Ul>
```

**For algorithm-style step lists with titles + descriptions**, use `UuApp.DesignKit.BulletList`. **NEVER use numbered `Uu5Elements.Text` blocks** (`1. ...`, `2. ...`) — they render as continuous paragraphs without line breaks.

```xml
<UuApp.DesignKit.BulletList data="<uu5json/>{
  \"itemList\": [
    {\"type\":\"bulletItem\",\"id\":\"r01\",\"name\":\"Rule title\",\"desc\":\"Rule explanation.\",\"customIcon\":null},
    {\"type\":\"bulletItem\",\"id\":\"r02\",\"name\":\"Another rule\",\"desc\":\"Another explanation.\",\"customIcon\":null}
  ],
  \"defaultIcon\": \"mdi-chevron-right\",
  \"name\": \"Business Rules\",
  \"desc\": \"\"
}"/>
```

Rules:
- **CRITICAL: Use `\"` (backslash-escaped quotes) inside the `data` attribute, NEVER `&quot;` (HTML entities).** The UU5 JSON parser does not recognize `&quot;` and will throw `Expected property name or '}' in JSON at position 4`.
- `name` = bold title for each item; `desc` = description text
- `defaultIcon` = MDI icon for all items (e.g., `mdi-chevron-right`, `mdi-check-circle`, `mdi-help-circle`, `mdi-cog`)
- `id` must be unique within the list (short hex or keyword IDs are fine)
- `customIcon` should be `null` (JSON null, not the string "null")

### Section Blocks (Uu5Bricks.Block)

Use for visually distinct, styled sections with headers:

```xml
<Uu5Bricks.Block header="Business Rules" significance="distinct" colorScheme="building" card="content">
  <Uu5Elements.Text category="story" segment="body" type="common">
    Content here with <Uu5Elements.Text bold>bold</Uu5Elements.Text> and <Uu5Bricks.Code>code</Uu5Bricks.Code>.
  </Uu5Elements.Text>
</Uu5Bricks.Block>
```

**Uu5Bricks.Block / Uu5Elements.Block props:**

| Prop | Values | Use For |
|------|--------|---------|
| `header` | String | Section title |
| `headerType` | `heading`, `title` | Heading style |
| `significance` | `common`, `highlighted`, `distinct`, `subdued` | Visual emphasis level |
| `colorScheme` | See color scheme table below | Color theme |
| `collapsible` | Boolean | Expandable/collapsible section |
| `card` | `full`, `content`, `none` | Card appearance |
| `borderRadius` | `none`, `elementary`, `moderate`, `full` | Corner rounding |
| `footer` | String | Footer text |

**colorScheme values (3 categories):**

| Category | Values | Use For |
|----------|--------|---------|
| **building** | `building` | Neutral/structural, default gray tones |
| **meaning** | `primary`, `positive`, `negative`, `warning` | Semantic colors (blue, green, red, yellow) |
| **basic** | `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink` | Direct colors without semantic meaning |

**significance values:**

| Value | Visual Effect |
|-------|---------------|
| `common` | Standard appearance, no emphasis |
| `highlighted` | Strong background fill, high contrast |
| `distinct` | Border/outline emphasis, medium contrast |
| `subdued` | Dimmed/muted appearance |

**card values:**

| Value | Visual Effect |
|-------|---------------|
| `full` | Full card with border, background, shadow |
| `content` | Content area only (no outer card frame) |
| `none` | No card appearance at all |

**Recommended combinations for concept/documentation pages:**

| Purpose | significance | colorScheme | card | Visual |
|---------|-------------|-------------|------|--------|
| Top-level page section | `common` | (default) | `full` | Standard card with header |
| Key business rules | `distinct` | `building` | `content` | Neutral outlined block |
| Warnings/constraints | `distinct` | `warning` | `content` | Subtle warning block |
| Error scenarios | `distinct` | `negative` | `content` | Subtle error block |
| Informational notes | `distinct` | `primary` | `content` | Subtle info block |
| Important callout | `distinct` | `building` | `content` | Neutral callout |
| Code context/explanation | `subdued` | `building` | `content` | Muted gray block |

### Simple Text Content (Preferred)

For generated documentation pages, prefer direct `Uu5Elements.Text` blocks:

```xml
<Uu5Elements.Text category="story" segment="body" type="common">
  Paragraph with <Uu5Elements.Text bold>bold</Uu5Elements.Text> and <Uu5Bricks.Code>inline code</Uu5Bricks.Code>.
</Uu5Elements.Text>
```

Use `Uu5RichTextBricks.Block` only when advanced rich-text editing features are required.
**NEVER use raw HTML tags** (`<p>`, `<strong>`, `<table>`, `<ul>`) in uu5 content.

### Tables (Uu5TilesBricks.Table)

For static data tables, use `Uu5TilesBricks.Table` with `columnList` and `data`:

```xml
<Uu5TilesBricks.Table
  columnList="<uu5json/>[
    {\"header\":\"Model\"},
    {\"header\":\"Gaps Allowed\"},
    {\"header\":\"API\"}
  ]"
  data="<uu5json/>[
    [\"Single validity\",\"N/A\",\"entityItem\"],
    [\"Multiple (contiguous)\",\"No\",\"entity\"]
  ]"
  hideFooter
/>
```

### Headings (Uu5Elements.Header)

```xml
<Uu5Elements.Header level="2">Section Heading</Uu5Elements.Header>
<Uu5Elements.Header level="4">Sub-heading</Uu5Elements.Header>
```

### Standard Page Section Template (uu5g05)

```xml
<uu5string/>
<Uu5Bricks.Section header="Section Title" contentEditable>
  <Uu5Elements.Text category="story" segment="body" type="common">
    Description paragraph with <Uu5Bricks.Code>inline code</Uu5Bricks.Code> and <Uu5Elements.Text bold>bold text</Uu5Elements.Text>.
  </Uu5Elements.Text>

  <Uu5Elements.Header level="4">Sub-heading</Uu5Elements.Header>
  <!-- diagram goes here -->

  <Uu5Bricks.Block header="Business Rules" significance="distinct" colorScheme="building" card="content">
    <Uu5Elements.Text category="story" segment="body" type="common">- Rule 1 - detailed explanation.</Uu5Elements.Text>
    <Uu5Elements.Text category="story" segment="body" type="common">- Rule 2 - detailed explanation.</Uu5Elements.Text>
  </Uu5Bricks.Block>

  <Uu5Elements.Header level="4">Code Example</Uu5Elements.Header>
  <Uu5CodeKitBricks.Code codeStyle="javascript" wrapEnabled value='const dtoIn = { code: "ITEM-001" };'></Uu5CodeKitBricks.Code>

  <Uu5TilesBricks.Table
    columnList="<uu5json/>[{\"header\":\"Column 1\"},{\"header\":\"Column 2\"}]"
    data="<uu5json/>[[\"Value A\",\"Value B\"]]"
    hideFooter
  />

  <Uu5Bricks.Block header="Warning" significance="distinct" colorScheme="warning" card="content">
    <Uu5Elements.Text category="story" segment="body" type="common">Important constraint or caveat here.</Uu5Elements.Text>
  </Uu5Bricks.Block>

  <Uu5Bricks.Block header="Error Scenarios" significance="distinct" colorScheme="negative" card="content">
    <Uu5Elements.Text category="story" segment="body" type="common">When validation fails, the system throws <Uu5Bricks.Code>errorCode</Uu5Bricks.Code>.</Uu5Elements.Text>
  </Uu5Bricks.Block>

  <Uu5Bricks.Block header="Note" significance="distinct" colorScheme="primary" card="content">
    <Uu5Elements.Text category="story" segment="body" type="common">Additional context or informational note.</Uu5Elements.Text>
  </Uu5Bricks.Block>
</Uu5Bricks.Section>
```

## Iterative Diagram Quality Improvement

When the user shows a screenshot of a rendered diagram with issues, follow this cycle:

1. **Identify the issue category:**
   - Crossing lines → Rule violation (usually Rule 1, 5, 6, or 7)
   - Wrong attachment points → Icon positioning issue (Rule 2)
   - Broken/missing elements → Annotation or floating annotation issue (Rule 9)
   - Too small/cramped → Canvas sizing issue (autoFit settings)

2. **Fix the root cause in the generation script**, not just the symptom

3. **Update this skill** with the specific pattern that caused the issue, so it doesn't recur:
   - Add a "Common mistake" callout to the relevant rule
   - Add a concrete BAD/GOOD code example

4. **Regenerate and verify** before presenting to the user

### Known Issue Patterns (from real iterations)

| Pattern | Root Cause | Fix |
|---------|-----------|-----|
| N lines converging on one icon | Multiple `connect()` to same target | Use `connectMulti()` or `connectMultiIn()` |
| Two diagonal lines crossing in X shape | Two icons on same row connecting to target in middle row | Use `connectMultiIn([left, right], target)` |
| Callout text not wrapping | Used literal `\n` in callout text — renders as `\n` not a newline | Use `<br/>` for line breaks in callout/annotation text. For bullet lists, use UU5 components like `<UU5.Bricks.Ul>` inside the text. |
| Diagram appears tiny on page | Fixed 2048x2048 canvas with content in corner | Use `autoFit: true` with `fitOptions` |
| Diagram appears too tall with lots of empty space | `minHeight` set too high for simple layout | Lower `minHeight` (typically 480-640) and keep annotation close to anchors |
| Labels overlapping on parallel connectors | Multiple connectors in same direction with labels | Remove redundant labels or stagger `labelPosition` (1/2/3) |
| Text labels truncated with "..." | `textWidth` too small for the label text | Use `textWidth: Math.max(96, text.length * 7)` or shorten the text to under 25 chars. See Rule 10. |
| Two horizontal multi-connector trunk lines overlapping | Multiple `connectMulti` calls with same-row sources and targets | Place sources above targets (different rows) so trunks are vertical and don't overlap. See Rule 11. |
| Diagonal L-shaped connector from actor to action | Actor not aligned above its action column | Place each actor directly above its primary action. See Rule 12. |
| Diagram too tall with empty gaps between rows | Lanes/rows spaced 3+ grid rows apart | Use 2-row spacing (256px) between content rows. See Rule 14. |
| Connector labels overlap in dense area | Too many labels in same visual band | Remove labels when > 3 connectors in 256px band. See Rule 13. |
| Icons clustered on left side of block, empty right side | Fixed left-offset positioning in lane/row | Center icons: `firstX = centerX - (totalSpan / 2)`. Use `addLane()` for automatic centering. |

| Multi-connector trunk cuts through icons on the same row | `connectMulti(parent, [children])` where parent and children are on the same row or the trunk passes through occupied columns | **ALWAYS place the parent 2+ rows above/below the children so the trunk line is vertical.** See Rule 15. |
| Diagram is hard to understand without context | No explanatory text in the diagram; reader doesn't know what each step means | **Add callout icons** (low-importance) next to key elements or between rows. See Rule 16. |

### Rule 15: NEVER let a multi-connector trunk line pass through icons

When `connectMulti(parent, [child1, child2, ...])` creates a fan-out, the library draws a **trunk line** from the parent to a junction point, then branches to each child. If the trunk is horizontal and children are spread across many columns, the trunk line **cuts through any icons in between**.

**BAD** (trunk passes through icons between parent and children):
```javascript
// profileMap at col 4 row 0, children at cols 1-9 row 2
// Horizontal trunk at row 1 cuts through everything in between
const parent = builder.addIcon({ position: { x: gridX(4), y: gridY(0) } });
const c1 = builder.addIcon({ position: { x: gridX(1), y: gridY(2) } });
const c2 = builder.addIcon({ position: { x: gridX(3), y: gridY(2) } });
const c3 = builder.addIcon({ position: { x: gridX(5), y: gridY(2) } });
builder.connectMulti(parent, [c1, c2, c3]);
// Trunk goes horizontally from col 1 to col 5 at ~row 1, crossing any icons there
```

**GOOD** (parent directly above, vertical trunk — no crossing):
```javascript
// Parent centered above children, 3 rows gap, trunk goes straight down
const parent = builder.addIcon({ position: { x: gridX(3), y: gridY(0) } });
const c1 = builder.addIcon({ position: { x: gridX(1), y: gridY(3) } });
const c2 = builder.addIcon({ position: { x: gridX(3), y: gridY(3) } });
const c3 = builder.addIcon({ position: { x: gridX(5), y: gridY(3) } });
builder.connectMulti(parent, [c1, c2, c3]);
// Trunk goes vertically down from parent, then branches — clean fan-out
```

**Key principle:** The parent icon MUST be centered above (or below) the child group, with at least 2-3 empty rows between them. This ensures the trunk line is vertical and doesn't pass through any icons.

**For wide fan-outs (5+ children):** Consider splitting into two `connectMulti` calls if the children span more than 8 columns. Or use a two-tier layout with intermediate grouping icons.

### Rule 16: Add callout icons to explain diagram steps

Every non-trivial diagram should include **callout icons** — small text labels that explain what each step or group represents. These help readers understand the diagram without reading the surrounding text.

**Pattern: Step-by-step callouts**
```javascript
// Place a callout icon between rows to explain the transition
const step1 = builder.addIcon({
    text: '1. Extract artifact IDs',
    type: 'activityCondition',
    importance: 'low',
    position: { x: gridX(0), y: gridY(3) },  // left margin, between rows
    textWidth: 170
});
```

**Pattern: Group labels**
```javascript
// Label a group of icons to explain what they represent
const label = builder.addIcon({
    text: 'Workspace Profiles',
    type: 'activityCondition',
    importance: 'low',
    position: { x: gridX(0), y: gridY(1) },  // left of the row
    textWidth: 140
});
```

**Callout placement rules:**
- Place callouts in the **left margin** (column 0) or **right margin** of the diagram
- Use `type: 'activityCondition'` with `importance: 'low'` for all callouts
- Keep callout text under 30 characters — use short, punchy descriptions
- Place between content rows (e.g., at gridY(3) when content is at gridY(2) and gridY(4))
- For numbered steps, prefix with "1. ", "2. ", etc.
- **NEVER place a callout icon in a column that has connectors passing through it**
- Use `textWidth: Math.max(96, text.length * 7)` to avoid truncation

**How many callouts per diagram:**
- Simple diagrams (3-5 icons): 1-2 callouts
- Medium diagrams (6-10 icons): 2-4 callouts
- Complex diagrams (10+ icons): 3-5 callouts, max one per row gap

## Additional Resources

For complete stencil reference, see [stencils.md](stencils.md)
For more examples, see [examples.md](examples.md)
For programmatic examples, see [lib/examples.js](lib/examples.js)
