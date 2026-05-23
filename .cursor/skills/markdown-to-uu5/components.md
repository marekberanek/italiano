# UU5 Component Reference

Complete reference for UU5 components used in content conversion.

## Structure Components

### Uu5Bricks.Section

Main sectioning component for content organization. Used as primary wrapper for BookKit/ManagementKit pages.

```xml
<Uu5Bricks.Section 
  header="Section Title"
  headerSeparator
  headerType="heading"
  level=3
  margin="b"
  tag=null
  props="<uu5json/>{}"
  contentEditable
  colorSchema=null
>
  Content
</Uu5Bricks.Section>
```

**Attributes:**
- `header` - Section title text (can be UU5 string with components)
- `headerSeparator` - Boolean, adds visual separator line below header
- `headerType` - `"heading"` or default
- `level` - Heading level (1-6), affects header size
- `margin` - Margin shorthand: `"b"` (bottom), `"t"` (top), `"tb"` (both)
- `tag` - Set to `null` for no wrapper tag (used for nested sections)
- `props` - Additional props as UU5 JSON: `"<uu5json/>{}"`
- `contentEditable` - Boolean, enables in-place editing
- `colorSchema` - Color scheme or `null`

**Usage with nested sections:**
```xml
<Uu5Bricks.Section header="Parent">
  <Uu5Bricks.Section tag=null props="<uu5json/>{}" header="Child Section">
    Nested content
  </Uu5Bricks.Section>
</Uu5Bricks.Section>
```

### Uu5Bricks.Layout

Multi-column layout container.

```xml
<Uu5Bricks.Layout 
  type="columns" 
  columnCount=12 
  columnGap="d" 
  rowGap="d" 
  margin="b"
>
  <Uu5Bricks.Layout.Item colSpan="m: 6; l: 3">
    Column content
  </Uu5Bricks.Layout.Item>
</Uu5Bricks.Layout>
```

**Layout.Item colSpan format:**
- `"m: 6; l: 3"` - 6 columns on medium, 3 on large
- `"6"` - Always 6 columns
- Breakpoints: `xs`, `s`, `m`, `l`, `xl`

### Uu5Bricks.Card

Card container with header.

```xml
<Uu5Bricks.Card 
  header="Card Title" 
  colorScheme="primary" 
  significance="highlighted"
  headerSeparator
  margin="b"
>
  Card content
</Uu5Bricks.Card>
```

**colorScheme values:** `primary`, `neutral`, `warning`, `negative`, `positive`

**significance values:** `highlighted`, `distinct`, `common`, `subdued`

### Uu5Bricks.InfoBlock

Alert/callout block with icon.

```xml
<Uu5Bricks.InfoBlock 
  icon="uugds-alert-solid" 
  colorScheme="warning"
>
  Alert content
</Uu5Bricks.InfoBlock>
```

### Uu5Bricks.InfoGroup

Horizontal icon group for features/highlights.

```xml
<Uu5Bricks.InfoGroup 
  itemColorScheme="primary" 
  itemSignificance="highlighted"
>
  <Uu5Bricks.InfoGroup.Item icon="uugds-check-circle" title="Feature"/>
</Uu5Bricks.InfoGroup>
```

### Uu5Bricks.Tabs

Tab container for multi-view content.

```xml
<Uu5Bricks.Tabs>
  <Uu5Bricks.Tabs.Item label="Tab Label" code="unique-code">
    Tab content
  </Uu5Bricks.Tabs.Item>
</Uu5Bricks.Tabs>
```

## Text Components

### Basic HTML Elements

These standard HTML elements are supported:

```xml
<p>Paragraph</p>
<strong>Bold</strong>
<b>Bold (alternative)</b>
<i>Italic</i>
<em>Emphasis</em>
<s>Strikethrough</s>
<u>Underline</u>
<br/>
<span style="<uu5json/>{\"color\": \"rgb(0, 0, 0)\"}">Styled span</span>
```

### Uu5RichTextBricks.Block

Rich text block for complex formatted content. Commonly used inside Layout.Item for multi-column content.

```xml
<Uu5RichTextBricks.Block 
  readOnly 
  uu5String="<uu5string/><p>Content with <strong>formatting</strong></p><ul><li>List item</li></ul>"
/>
```

**Attributes:**
- `uu5String` - Content as UU5 string (must start with `<uu5string/>`)
- `readOnly` - Boolean, prevents editing

**Typical usage in multi-column layouts:**
```xml
<Uu5Bricks.Layout type="columns">
  <Uu5Bricks.Layout.Item colSpan="m: 6; l: 3">
    <Uu5RichTextBricks.Block uu5String="<uu5string/><p><strong>Title:</strong></p><ul><li>Item 1</li><li>Item 2</li></ul>"/>
  </Uu5Bricks.Layout.Item>
</Uu5Bricks.Layout>
```

### UU5.RichText.Block

Legacy rich text block (similar to Uu5RichTextBricks.Block).

```xml
<UU5.RichText.Block uu5string="<uu5string/><p>Content</p>"/>
```

Note: Uses `uu5string` (lowercase) instead of `uu5String`.

### Uu5RichText.Code

Inline code element.

```xml
<Uu5RichText.Code>inline code</Uu5RichText.Code>
```

### UU5.Bricks.Code

Legacy inline code element.

```xml
<UU5.Bricks.Code>inline code</UU5.Bricks.Code>
```

### Uu5CodeKit.Code.Input

Code block with syntax highlighting.

```xml
<Uu5CodeKit.Code.Input 
  readOnly={true} 
  codeStyle="javascript" 
  value="const x = 1;" 
/>
```

**codeStyle values:** `javascript`, `python`, `bash`, `json`, `xml`, `css`, `html`, `typescript`, `java`, `sql`, etc.

## Diagrams

### UuBml.Draw.Diagram

BPMN/UML diagram component.

```xml
<UuBml.Draw.Diagram value="<uu5json/>{...diagram data...}"/>
```

The diagram data is a complex JSON structure containing element definitions, connectors, and layout information. Typically created through the UuBml.Draw editor.

### UuBmlDraw.Imaging.Image

Display saved diagram as image.

```xml
<UuBmlDraw.Imaging.Image code="diagram-code-hash" className="center"/>
```

**Attributes:**
- `code` - Unique diagram code/hash
- `className` - CSS class: `"center"` for centered display

## Lists

### Unordered List

```xml
<ul>
  <li>Item 1</li>
  <li>Item 2
    <ul>
      <li>Nested item</li>
    </ul>
  </li>
</ul>
```

### Ordered List

Use `<ol>` for numbered lists, or style attribute:

```xml
<ul style="<uu5json/>{\"textAlign\": \"left\"}" id="unique-id">
  <li id="item1">First</li>
  <li id="item2">Second</li>
</ul>
```

## Tables

**IMPORTANT: ALWAYS use `Uu5TilesBricks.Table` with uu5json data format.** Never use the verbose `UU5.Bricks.Table.Tr/Td` structure - it's deprecated and harder to maintain.

### Uu5TilesBricks.Table

Complex table component with styling. Supports UU5 string content in cells.

```xml
<Uu5TilesBricks.Table 
  tag=null 
  props="<uu5json/>{}"
  data="<uu5json/>[
    {
      \"value\": [\"Cell 1\", \"Cell 2\"],
      \"style\": {}
    }
  ]" 
  columnList="<uu5json/>[
    {
      \"header\": \"Column 1\",
      \"headerType\": \"text\",
      \"minWidth\": \"m\",
      \"maxWidth\": \"l\",
      \"headerStyle\": {\"horizontalAlignment\": \"center\"},
      \"footerStyle\": {\"horizontalAlignment\": \"center\"},
      \"style\": {}
    }
  ]" 
  hideFooter
  hideHeader
/>
```

**Column properties:**
- `header` - Column header text
- `headerType` - `"text"` for plain text headers
- `minWidth` / `maxWidth` - Size: `"xs"`, `"s"`, `"m"`, `"l"`, `"xl"`
- `headerStyle` - Header cell style object
- `footerStyle` - Footer cell style object
- `style` - Default cell style for column

**Cell style options:**
```json
{
  "backgroundColor": "#FFEFBE",
  "horizontalAlignment": "center",
  "verticalAlignment": "center",
  "bold": true,
  "strike": true,
  "textColor": "rgb(33, 33, 33)",
  "fontSize": "15px"
}
```

**Common background colors:**
- `#FFEFBE` - Light yellow (highlight)
- `#CAE6FC` - Light blue (info)
- `#F3DBF4` - Light purple (in progress)
- `#FDEAD6` - Light orange (review)
- `#DFF2D1` / `#E1F0E1` - Light green (complete)
- `#DBEEFD` - Light blue (status)

**Row data formats:**

Simple array:
```json
["Cell 1", "Cell 2", "Cell 3"]
```

Object with style:
```json
{"value": ["Cell 1", "Cell 2"], "style": {"backgroundColor": "#FFEFBE"}}
```

UU5 content in cells:
```json
["<uu5string /><Uu5RichText.Badge state=\"active\" icon=\"check\"/>", "Text cell"]
```

Styled individual cell:
```json
[
  {"value": "Styled", "style": {"backgroundColor": "#CAE6FC", "horizontalAlignment": "center"}},
  "Normal"
]
```

Rich content with line breaks:
```json
{"value": "<uu5string /><p>Line 1</p><ul><li>Item</li></ul>", "style": {}}

## Links

### Uu5Bricks.Link

Standard link component.

```xml
<Uu5Bricks.Link 
  href="https://example.com" 
  target="_self"
>
  Link text
</Uu5Bricks.Link>
```

**target values:** `_self`, `_blank`

### UuTBricks.Artifact.Link

Link to uuApp artifact.

```xml
<UuTBricks.Artifact.Link 
  baseUri="https://uuapp.plus4u.net/uu-businessterritory-maing01/407135c5d0eb451482495519f78eff10" 
  oid="696e3e5ae50d22b83d0b8056" 
  altText="Artifact Name"
/>
```

### UuContentKit.Links.FileLink

Link to file in content storage.

```xml
<UuContentKit.Links.FileLink 
  src="67ed8591ee40441857ff5aa4" 
  fileName="document.pdf"
  target="_self"
>
  Download file
</UuContentKit.Links.FileLink>
```

Can also use full URL:
```xml
<UuContentKit.Links.FileLink 
  src="https://uuapp.plus4u.net/...?oid=...&uuEbcData.fileOid=..."
  target="_self"
>
  File link
</UuContentKit.Links.FileLink>
```

### UuContentKit.Links.Link

Link to external content with custom styling.

```xml
<UuContentKit.Links.Link 
  src="https://uuapp.plus4u.net/uu-bookkit-maing01/.../book/page?code=..." 
  target="_blank"
  type="link"
  bgStyle="transparent"
  colorSchema="info"
  size="s"
>
  Link text
</UuContentKit.Links.Link>
```

**Attributes:**
- `src` - Target URL
- `target` - `"_blank"`, `"_self"`
- `type` - Link type
- `bgStyle` - Background style: `"transparent"`, `"filled"`
- `colorSchema` - Color: `"info"`, `"primary"`, etc.
- `size` - Size: `"xs"`, `"s"`, `"m"`, `"l"`

### UuContentKit.Bricks.BlockDefault

Default content block with icon.

```xml
<UuContentKit.Bricks.BlockDefault icon="mdi-close-circle-outline">
  <UU5.Bricks.Header level="6">Title</UU5.Bricks.Header>
  <UU5.Bricks.Div>Content paragraph</UU5.Bricks.Div>
</UuContentKit.Bricks.BlockDefault>
```

## Icons

### Uu5Elements.Icon / Uu5RichText.Icon

Display icons from various icon libraries.

```xml
<Uu5Elements.Icon icon="uugds-check-circle"/>
<Uu5RichText.Icon icon="mdi-star"/>
```

**Attributes:**
- `icon` - Icon identifier (required)
- `className` - CSS class for styling
- `tooltip` - Tooltip text (or use `withTooltip` HOC)
- `colorScheme` - Color theme

**Icon libraries:**
- `uugds-*` - uuGds icons (official design system)
- `uugdsstencil-*` - uuGds stencil icons
- `mdi-*` - Material Design Icons

**Common uugds icons:**
- `uugds-check-circle` - checkmark
- `uugds-alert-solid` - alert/warning
- `uugds-alert-circle` - info alert
- `uugds-sync` - refresh/sync
- `uugds-lock-closed` - lock
- `uugds-lock-open` - unlock
- `uugds-search` - search
- `uugds-filter` - filter
- `uugds-view-list` - list view
- `uugds-refresh` - refresh
- `uugds-plus` - add/plus
- `uugds-minus` - minus/remove
- `uugds-checkbox-list` - checkbox list
- `uugds-pencil` - edit
- `uugds-trash` - delete
- `uugds-download` - download
- `uugds-upload` - upload

**Common stencil icons:**
- `uugdsstencil-education-assignment` - assignment
- `uugdsstencil-badge-info` - info badge
- `uugdsstencil-badge-flash` - flash badge
- `uugdsstencil-edit-list-numbered` - numbered list
- `uugdsstencil-it-context` - context

**Common mdi icons:**
- `mdi-star` - star
- `mdi-star-half` - half star
- `mdi-close-circle-outline` - close/cancel
- `mdi-check` - check
- `mdi-information` - info

## Badges

### Uu5RichText.Badge

Status badges with icons.

```xml
<Uu5RichText.Badge state="active" icon="check"/>
<Uu5RichText.Badge state="system" icon="cancel"/>
<Uu5RichText.Badge state="alternativeActive" icon="flash"/>
<Uu5RichText.Badge state="alternativeFinal" icon="cancel"/>
<Uu5RichText.Badge icon="uugdsstencil-badge-info" state="active"/>
```

**state values:** `active`, `system`, `alternativeActive`, `alternativeFinal`

**Common icon values:** `check`, `cancel`, `flash`

## Legacy Tabs

### UU5.Bricks.Tabs

Tabbed content container (legacy component).

```xml
<UU5.Bricks.Tabs mountContent="onActive" type="tabs">
  <UU5.Bricks.Tabs.Item header="Tab 1" name="tab1">
    Tab 1 content
  </UU5.Bricks.Tabs.Item>
  <UU5.Bricks.Tabs.Item header="Tab 2" name="tab2" contentEditable>
    Tab 2 content
  </UU5.Bricks.Tabs.Item>
</UU5.Bricks.Tabs>
```

**Attributes:**
- `mountContent` - `"onActive"` (lazy load), `"onFirstActive"`, `"always"`
- `mountTabContent` - Same options for individual tabs
- `type` - `"tabs"`, `"pills"`

**Tabs.Item attributes:**
- `header` - Tab label text
- `name` - Unique identifier
- `contentEditable` - Boolean, enables editing

## Localization

### UU5.Bricks.Lsi

Language-specific content wrapper. Used to provide content in multiple languages.

```xml
<UU5.Bricks.Lsi>
  <UU5.Bricks.Lsi.Item language="en">English content</UU5.Bricks.Lsi.Item>
  <UU5.Bricks.Lsi.Item language="cs">Czech content</UU5.Bricks.Lsi.Item>
</UU5.Bricks.Lsi>
```

**Common pattern for bilingual content:**
```xml
<UU5.Bricks.Lsi>
  <UU5.Bricks.Lsi.Item language="cs">
    <UU5.Bricks.Section header="Český nadpis">
      Obsah v češtině
    </UU5.Bricks.Section>
  </UU5.Bricks.Lsi.Item>
  <UU5.Bricks.Lsi.Item language="en">
    <UU5.Bricks.Section header="English Title">
      Content in English
    </UU5.Bricks.Section>
  </UU5.Bricks.Lsi.Item>
</UU5.Bricks.Lsi>
```

## Div and Block Elements

### UU5.Bricks.Div

Generic container/wrapper.

```xml
<UU5.Bricks.Div>
  Content wrapper
</UU5.Bricks.Div>
```

### UU5.Bricks.Header

Header element with level.

```xml
<UU5.Bricks.Header level="6">Heading Text</UU5.Bricks.Header>
```

**Attributes:**
- `level` - Heading level 1-6 (equivalent to `<h1>`-`<h6>`)

### UU5.Bricks.P — DEPRECATED

**Do NOT use** for BookKit or ManagementKit content. Use `<UU5.Bricks.Div>` inside `UU5.RichText.Block` instead.

```xml
<!-- WRONG - do not use -->
<UU5.Bricks.P>Paragraph text content.</UU5.Bricks.P>

<!-- CORRECT -->
<UU5.RichText.Block uu5string="<uu5string/><UU5.Bricks.Div>Paragraph text content.</UU5.Bricks.Div>"/>
```

## Embedding

### Plus4U5.Bricks.Iframe

Embed external content in an iframe.

```xml
<Plus4U5.Bricks.Iframe 
  src="https://uuapp.plus4u.net/uu-bookkit-maing01/.../getBinaryData?code=...&contentDisposition=inline" 
  height=1000
/>
```

**Attributes:**
- `src` - Source URL
- `height` - Height in pixels

## BookKit Components

### UuBookKit.Review.CommentPoint

Review comment anchor point.

```xml
<UuBookKit.Review.CommentPoint code="unique-hash-code"/>
```

### UuBookKit.Imaging.ThumbnailList

Image gallery/thumbnail list.

```xml
<UuBookKit.Imaging.ThumbnailList mode="track" data='<uu5json/>[]'/>
```

### UuBookKit.References.Quotation

Quote/reference from another book.

```xml
<UuBookKit.References.Quotation
  code="unique-quote-code"
  baseUri="https://uuapp.plus4u.net/uu-bookkit-maing01/..."
/>
```

## JSON Attribute Patterns

### Empty object

```xml
props="<uu5json/>{}"
style="<uu5json/>{}"
```

### Style object

```xml
style="<uu5json/>{
  \"textAlign\": \"center\",
  \"color\": \"rgb(0, 0, 0)\",
  \"fontSize\": \"15px\",
  \"fontFamily\": \"Roboto, sans-serif\"
}"
```

### Data array

```xml
data="<uu5json/>[
  {\"value\": [\"A\", \"B\"], \"style\": {}},
  {\"value\": [\"C\", \"D\"], \"style\": {}}
]"
```

## Component Namespaces

| Namespace | Description |
|-----------|-------------|
| `Uu5Bricks` | Basic layout and structure (Section, Layout, Card, InfoBlock, Tabs, Link) |
| `Uu5Elements` | UI elements (Icon, Badge, Grid, Button, Alert, Accordion, Tabs, etc.) |
| `Uu5RichText` | Rich text components (Icon, Badge, Code) |
| `Uu5RichTextBricks` | Rich text blocks (Block) |
| `Uu5TilesBricks` | Data display (Table) |
| `Uu5CodeKit` | Code display (Code.Input) |
| `Uu5Forms` | Form components (Form, Text, Select, Checkbox, Date, etc.) |
| `UuTBricks` | Territory/artifact links (Artifact.Link) |
| `UuContentKit` | Content management (Links.Link, Links.FileLink) |
| `UuBml.Draw` | Diagrams (Diagram) |
| `UuBookKit` | Book-specific components (Review, Imaging) |
| `UU5.Bricks` | Legacy/core components (Lsi, Lsi.Item, Tabs, Section, Div, Code, Header, P) |
| `UU5.RichText` | Legacy rich text (Block) |
| `Plus4U5.Bricks` | Plus4U integration (Iframe) |
| `UuBookKit` | BookKit-specific (Review, Imaging, References) |
| `UuAppModelKit` | AppModel Kit (Uu5Component.Bricks.Properties, BasicInfo) |
| `UuTerritory` | Territory components (Activity, ArtifactIfc) |

## Uu5Elements Components

Core visual components from the Uu5Elements library.

### Uu5Elements.Grid

CSS Grid layout component using `useGridStyle` hook internally.

```xml
<Uu5Elements.Grid
  templateColumns="repeat(3, 1fr)"
  templateRows="auto"
  gap="16px"
  alignItems="center"
  justifyItems="start"
>
  <Uu5Elements.Grid.Item>Item 1</Uu5Elements.Grid.Item>
  <Uu5Elements.Grid.Item colSpan={2}>Wide item</Uu5Elements.Grid.Item>
</Uu5Elements.Grid>
```

**Attributes:**
- `templateColumns` - CSS grid-template-columns value
- `templateRows` - CSS grid-template-rows value
- `templateAreas` - CSS grid-template-areas
- `gap` / `columnGap` / `rowGap` - Grid gaps
- `alignItems` - Vertical alignment
- `justifyItems` - Horizontal alignment

**Grid.Item attributes:**
- `colSpan` - Number of columns to span
- `rowSpan` - Number of rows to span
- `gridArea` - Named grid area

### Uu5Elements.Box

Basic container with uuGds shape, sizing, and radius palettes.

```xml
<Uu5Elements.Box
  significance="highlighted"
  colorScheme="primary"
  borderRadius="moderate"
  padding="16px"
>
  Content
</Uu5Elements.Box>
```

**Attributes:**
- `significance` - `"highlighted"`, `"distinct"`, `"common"`, `"subdued"`
- `colorScheme` - `"primary"`, `"neutral"`, `"warning"`, `"negative"`, `"positive"`
- `borderRadius` - `"none"`, `"moderate"`, `"elementary"`, `"full"`
- `padding` - CSS padding value
- `background` - Background style

### Uu5Elements.Button

Interactive button with tooltip support.

```xml
<Uu5Elements.Button
  significance="highlighted"
  colorScheme="primary"
  size="m"
  icon="uugds-plus"
  iconPosition="left"
  onClick={handler}
  disabled={false}
>
  Click me
</Uu5Elements.Button>
```

**Attributes:**
- `significance` - `"highlighted"`, `"distinct"`, `"common"`, `"subdued"`
- `colorScheme` - `"primary"`, `"neutral"`, `"warning"`, `"negative"`, `"positive"`
- `size` - `"xs"`, `"s"`, `"m"`, `"l"`, `"xl"`
- `icon` - Icon identifier
- `iconPosition` - `"left"`, `"right"`
- `disabled` - Boolean
- `pressed` - Boolean (for toggle buttons)
- `tooltip` - Tooltip text

### Uu5Elements.Tabs

Tab navigation with keyboard support.

```xml
<Uu5Elements.Tabs
  initialActiveCode="tab1"
  borderRadius="moderate"
  significance="distinct"
>
  <Uu5Elements.Tabs.Item code="tab1" label="First Tab">
    Tab 1 content
  </Uu5Elements.Tabs.Item>
  <Uu5Elements.Tabs.Item code="tab2" label="Second Tab" icon="uugds-search">
    Tab 2 content
  </Uu5Elements.Tabs.Item>
</Uu5Elements.Tabs>
```

**Keyboard support:**
- `Tab` - Move focus out of tablist
- `Enter`/`Space` - Activate tab
- `Left`/`Right Arrow` - Navigate between tabs
- `Home`/`End` - Jump to first/last tab

### Uu5Elements.Alert

Alert message component.

```xml
<Uu5Elements.Alert
  colorScheme="warning"
  icon="uugds-alert-solid"
  header="Warning"
  priority="low"
>
  Alert message content
</Uu5Elements.Alert>
```

**Attributes:**
- `colorScheme` - Color theme
- `icon` - Alert icon
- `header` - Alert title
- `priority` - `"low"`, `"normal"`, `"high"`
- `closeButton` - Show close button

### Component Summary

**Layout:**
- `Uu5Elements.Grid` - CSS Grid layout
- `Uu5Elements.Grid.Item` - Grid item
- `Uu5Elements.Panel` - Panel container
- `Uu5Elements.Accordion` - Collapsible sections
- `Uu5Elements.Drawer` - Side drawer

**Navigation:**
- `Uu5Elements.Tabs` - Tab navigation
- `Uu5Elements.Breadcrumbs` - Breadcrumb navigation
- `Uu5Elements.Menu` - Menu component
- `Uu5Elements.MenuItem` - Menu item

**Feedback:**
- `Uu5Elements.Alert` - Alert messages
- `Uu5Elements.AlertBus` - Alert management
- `Uu5Elements.Progress` - Progress indicator
- `Uu5Elements.Pending` - Loading state
- `Uu5Elements.Skeleton` - Loading skeleton

**Interactive:**
- `Uu5Elements.Button` - Button
- `Uu5Elements.ButtonGroup` - Button group
- `Uu5Elements.Toggle` - Toggle switch
- `Uu5Elements.Dropdown` - Dropdown menu
- `Uu5Elements.ActionGroup` - Action buttons

**Display:**
- `Uu5Elements.Badge` - Status badge
- `Uu5Elements.Tag` - Tag/label
- `Uu5Elements.Icon` - Icon
- `Uu5Elements.RichIcon` - Icon with background
- `Uu5Elements.DateTime` - Date/time display
- `Uu5Elements.Number` - Number display

**Containers:**
- `Uu5Elements.Box` - Basic box
- `Uu5Elements.HighlightedBox` - Highlighted container
- `Uu5Elements.CollapsibleBox` - Collapsible container
- `Uu5Elements.Tile` - Tile component
- `Uu5Elements.ListItem` - List item

**Overlay:**
- `Uu5Elements.Modal` - Modal dialog (via ModalBus)
- `Uu5Elements.Popover` - Popover
- `Uu5Elements.Tooltip` - Tooltip
- `Uu5Elements.Dialog` - Dialog

## Uu5Forms Components

**Basic Inputs:**
- `Uu5Forms.Text` / `Uu5Forms.Text.Input`
- `Uu5Forms.TextArea` / `Uu5Forms.TextArea.Input`
- `Uu5Forms.Number` / `Uu5Forms.Number.Input`
- `Uu5Forms.Password` / `Uu5Forms.Password.Input`
- `Uu5Forms.Email` / `Uu5Forms.Email.Input`

**Selection:**
- `Uu5Forms.Select` / `Uu5Forms.Select.Input`
- `Uu5Forms.TextSelect` / `Uu5Forms.TextSelect.Input`
- `Uu5Forms.Checkbox` / `Uu5Forms.Checkbox.Input`
- `Uu5Forms.Checkboxes` / `Uu5Forms.Checkboxes.Input`
- `Uu5Forms.Radios` / `Uu5Forms.Radios.Input`
- `Uu5Forms.SwitchSelect` / `Uu5Forms.SwitchSelect.Input`

**Date/Time:**
- `Uu5Forms.Date` / `Uu5Forms.Date.Input`
- `Uu5Forms.DateTime` / `Uu5Forms.DateTime.Input`
- `Uu5Forms.Time` / `Uu5Forms.Time.Input`
- `Uu5Forms.DateRange` / `Uu5Forms.DateRange.Input`

**Form Integration:**
- `Uu5Forms.Form` - Form container
- `Uu5Forms.Form.View` - Form view
- `Uu5Forms.Form.Provider` - Form context
- `Uu5Forms.SubmitButton` - Submit button
- `Uu5Forms.CancelButton` - Cancel button
- `Uu5Forms.ResetButton` - Reset button

**Form-bound inputs (FormXxx):**
- `Uu5Forms.FormText`, `Uu5Forms.FormTextArea`, `Uu5Forms.FormNumber`
- `Uu5Forms.FormSelect`, `Uu5Forms.FormCheckbox`, `Uu5Forms.FormRadios`
- `Uu5Forms.FormDate`, `Uu5Forms.FormDateTime`, `Uu5Forms.FormTime`
