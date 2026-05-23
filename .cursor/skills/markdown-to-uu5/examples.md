# Conversion Examples

Practical examples of converting Markdown to UU5 string content.

## Basic Text Formatting

### Markdown Input

```markdown
# Main Title

This is a paragraph with **bold text**, *italic text*, and `inline code`.

- Item 1
- Item 2
  - Nested item

[Link to docs](https://example.com)
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.Section header="Main Title" headerSeparator>
  <p>This is a paragraph with <strong>bold text</strong>, <i>italic text</i>, and <Uu5RichText.Code>inline code</Uu5RichText.Code>.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2
      <ul>
        <li>Nested item</li>
      </ul>
    </li>
  </ul>
  <p><Uu5Bricks.Link href="https://example.com" target="_self">Link to docs</Uu5Bricks.Link></p>
</Uu5Bricks.Section>
```

## Multi-Column Layout

### Markdown Input

```markdown
## Two Columns

Column 1 content here.

Column 2 content here.
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.Section header="Two Columns" headerSeparator>
  <Uu5Bricks.Layout type="columns">
    <Uu5Bricks.Layout.Item colSpan="m: 6; l: 6">
      <Uu5RichTextBricks.Block uu5String="<uu5string/><p>Column 1 content here.</p>"/>
    </Uu5Bricks.Layout.Item>
    <Uu5Bricks.Layout.Item colSpan="m: 6; l: 6">
      <Uu5RichTextBricks.Block uu5String="<uu5string/><p>Column 2 content here.</p>"/>
    </Uu5Bricks.Layout.Item>
  </Uu5Bricks.Layout>
</Uu5Bricks.Section>
```

## Info Cards with Icons

### Markdown Input

```markdown
## Best Practices

> **Important:** Always validate before saving.

Key features:
- Tool design
- User guidance
- Orchestration
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.Card header="Best practices checklist" colorScheme="primary" significance="highlighted" headerSeparator margin="b">
  <Uu5Bricks.InfoGroup itemColorScheme="primary" itemSignificance="highlighted">
    <Uu5Bricks.InfoGroup.Item icon="uugds-check-circle" title="Tool design"/>
    <Uu5Bricks.InfoGroup.Item icon="uugdsstencil-it-context" title="User guidance"/>
    <Uu5Bricks.InfoGroup.Item icon="uugds-sync" title="Orchestration"/>
  </Uu5Bricks.InfoGroup>
</Uu5Bricks.Card>
```

## Warning Block

### Markdown Input

```markdown
> ⚠️ Warning: This operation cannot be undone.
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.InfoBlock icon="uugds-alert-solid" colorScheme="warning">
  <Uu5RichTextBricks.Block uu5String="<uu5string/><p>This operation cannot be undone.</p>"/>
</Uu5Bricks.InfoBlock>
```

## Table with Styling

### Markdown Input

```markdown
| Name | Status | Actions |
|------|--------|---------|
| Item A | Active | Edit |
| Item B | Pending | Review |
```

### UU5 Output

```xml
<uu5string/>
<Uu5TilesBricks.Table 
  data="<uu5json/>[
    {\"value\": [\"Item A\", \"<uu5string /><Uu5RichText.Badge state=\\\"active\\\" icon=\\\"check\\\"/>\", \"Edit\"], \"style\": {}},
    {\"value\": [\"Item B\", \"<uu5string /><Uu5RichText.Badge state=\\\"system\\\" icon=\\\"flash\\\"/>\", \"Review\"], \"style\": {}}
  ]" 
  columnList="<uu5json/>[
    {\"header\": \"Name\", \"minWidth\": \"m\", \"maxWidth\": \"l\"},
    {\"header\": \"Status\", \"minWidth\": \"xs\", \"maxWidth\": \"xs\"},
    {\"header\": \"Actions\", \"minWidth\": \"s\", \"maxWidth\": \"m\"}
  ]" 
  hideFooter
/>
```

## Table with Category Headers

### Markdown Input

```markdown
| Category | Item | Notes |
|----------|------|-------|
| **INFRASTRUCTURE** | | |
| Linux | Active | Complete |
| Network | Active | Complete |
```

### UU5 Output

```xml
<uu5string/>
<Uu5TilesBricks.Table 
  data="<uu5json/>[
    [{\"value\": \"INFRASTRUCTURE\", \"style\": {\"bold\": true, \"backgroundColor\": \"#FFEFBE\"}}, {\"value\": \"\", \"style\": {\"backgroundColor\": \"#FFEFBE\"}}, {\"value\": \"\", \"style\": {\"backgroundColor\": \"#FFEFBE\"}}],
    {\"value\": [\"Linux\", \"<uu5string /><Uu5RichText.Badge state=\\\"active\\\" icon=\\\"check\\\"/>\", \"Complete\"], \"style\": {}},
    {\"value\": [\"Network\", \"<uu5string /><Uu5RichText.Badge state=\\\"active\\\" icon=\\\"check\\\"/>\", \"Complete\"], \"style\": {}}
  ]" 
  columnList="<uu5json/>[
    {\"header\": \"Category\", \"minWidth\": \"l\", \"maxWidth\": \"l\"},
    {\"header\": \"Item\", \"minWidth\": \"xs\", \"maxWidth\": \"xs\"},
    {\"header\": \"Notes\", \"minWidth\": \"m\", \"maxWidth\": \"m\"}
  ]" 
  hideFooter
/>
```

## Tabs

### Markdown Input

```markdown
## Documentation

### Tab: Overview
Overview content here.

### Tab: API
API documentation here.

### Tab: Examples
Example code here.
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.Section header="Documentation" headerSeparator>
  <Uu5Bricks.Tabs>
    <Uu5Bricks.Tabs.Item label="Overview" code="overview">
      <Uu5RichTextBricks.Block uu5String="<uu5string/><p>Overview content here.</p>"/>
    </Uu5Bricks.Tabs.Item>
    <Uu5Bricks.Tabs.Item label="API" code="api">
      <Uu5RichTextBricks.Block uu5String="<uu5string/><p>API documentation here.</p>"/>
    </Uu5Bricks.Tabs.Item>
    <Uu5Bricks.Tabs.Item label="Examples" code="examples">
      <Uu5RichTextBricks.Block uu5String="<uu5string/><p>Example code here.</p>"/>
    </Uu5Bricks.Tabs.Item>
  </Uu5Bricks.Tabs>
</Uu5Bricks.Section>
```

## Checklist Card

### Markdown Input

```markdown
## Tool Design Checklist

- [x] Return explicit success/error signals
- [x] Make errors actionable
- [ ] Keep outputs small
- [ ] Be retry-friendly
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.Section header="Tool design" headerType="heading" level=3 headerSeparator margin="b">
  <Uu5Bricks.Card header="Checklist" headerSeparator colorScheme="primary" significance="distinct" margin="b">
    <Uu5RichTextBricks.Block readOnly uu5String="<uu5string/>
      <ul>
        <li><strong>Return explicit success/error signals</strong>
          <ul>
            <li>success: <Uu5RichText.Code>success=true</Uu5RichText.Code></li>
            <li>error: <Uu5RichText.Code>success=false</Uu5RichText.Code> + <Uu5RichText.Code>errorCode</Uu5RichText.Code></li>
          </ul>
        </li>
        <li><strong>Make errors actionable</strong>
          <ul>
            <li>include missing parameter names, allowed values</li>
          </ul>
        </li>
        <li><strong>Keep outputs small and relevant</strong></li>
        <li><strong>Be retry-friendly</strong></li>
      </ul>
    "/>
  </Uu5Bricks.Card>
</Uu5Bricks.Section>
```

## Side-by-Side Comparison

### Markdown Input

```markdown
## Comparison

### Parallel Operations
Use for independent reads.

### Sequential Operations
Use for stateful mutations.
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.Section header="Comparison" headerSeparator>
  <Uu5Bricks.Layout type="columns" columnCount=12 columnGap="d" rowGap="d" margin="b">
    <Uu5Bricks.Layout.Item colSpan=6>
      <Uu5Bricks.Card header="Parallel Operations" headerSeparator colorScheme="neutral" significance="common" margin="b">
        <Uu5RichTextBricks.Block readOnly uu5String="<uu5string/>
          <ul>
            <li>independent reads / retrieval</li>
          </ul>
        "/>
      </Uu5Bricks.Card>
    </Uu5Bricks.Layout.Item>
    <Uu5Bricks.Layout.Item colSpan=6>
      <Uu5Bricks.Card header="Sequential Operations" headerSeparator colorScheme="primary" significance="common" margin="b">
        <Uu5RichTextBricks.Block readOnly uu5String="<uu5string/>
          <ul>
            <li>ordered edits / stateful mutations</li>
          </ul>
        "/>
      </Uu5Bricks.Card>
    </Uu5Bricks.Layout.Item>
  </Uu5Bricks.Layout>
</Uu5Bricks.Section>
```

## Summary Block with Icon

### Markdown Input

```markdown
> **Summary:** Multi-agent delegation enables complex task distribution.
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.InfoBlock icon="uugdsstencil-education-assignment">
  <Uu5Bricks.Section header="Summary" headerSeparator=false level=4>
    <UU5.RichText.Block uu5string="<uu5string/>
      <UU5.Bricks.Div>
        <strong>Multi-Agent Delegation</strong> enables <strong>complex task distribution</strong> across specialized AI agents.
      </UU5.Bricks.Div>
    "/>
  </Uu5Bricks.Section>
</Uu5Bricks.InfoBlock>
```

## Complex Table with Links and Badges

### Markdown Input

```markdown
| KHE | Status | Resources |
|-----|--------|-----------|
| ⭐ Linux Basics | ✅ Published | [User Guide](link) |
| ⭐ Network Basics | 🔄 In Progress | [Documentation](link) |
```

### UU5 Output

```xml
<uu5string/>
<Uu5TilesBricks.Table 
  data="<uu5json/>[
    {
      \"value\": [
        \"<uu5string /><Uu5RichText.Icon icon=\\\"mdi-star\\\"/><Uu5Bricks.Link href=\\\"...\\\">Linux Basics</Uu5Bricks.Link>\",
        \"<uu5string /><Uu5RichText.Badge state=\\\"active\\\" icon=\\\"check\\\"/>\",
        \"<uu5string /><p>Interní</p><ul><li><Uu5Bricks.Link href=\\\"...\\\" target=\\\"_self\\\">User Guide</Uu5Bricks.Link></li></ul>\"
      ],
      \"style\": {}
    },
    {
      \"value\": [
        \"<uu5string /><Uu5RichText.Icon icon=\\\"mdi-star\\\"/><Uu5Bricks.Link href=\\\"...\\\">Network Basics</Uu5Bricks.Link>\",
        \"<uu5string /><Uu5RichText.Badge icon=\\\"uugdsstencil-badge-flash\\\" state=\\\"alternativeActive\\\"/>\",
        \"<uu5string /><p>Interní</p><ul><li><Uu5Bricks.Link href=\\\"...\\\" target=\\\"_self\\\">Documentation</Uu5Bricks.Link></li></ul>\"
      ],
      \"style\": {}
    }
  ]" 
  columnList="<uu5json/>[
    {\"header\": \"KHE\", \"minWidth\": \"l\", \"maxWidth\": \"l\"},
    {\"header\": \"Status\", \"minWidth\": \"xs\", \"maxWidth\": \"xs\"},
    {\"header\": \"Resources\", \"minWidth\": \"xl\", \"maxWidth\": \"xl\"}
  ]" 
  hideFooter
/>
```

## Localized Content

### Markdown Input

```markdown
## Bilingual Section

EN: Welcome to the documentation.
CS: Vítejte v dokumentaci.
```

### UU5 Output

```xml
<uu5string/>
<UU5.Bricks.Lsi>
  <UU5.Bricks.Lsi.Item language="en">
    <Uu5Bricks.InfoBlock icon="uugdsstencil-education-assignment">
      <Uu5Bricks.Section header="Welcome" headerSeparator=false level=4>
        <UU5.RichText.Block uu5string="<uu5string/><UU5.Bricks.Div>Welcome to the documentation.</UU5.Bricks.Div>"/>
      </Uu5Bricks.Section>
    </Uu5Bricks.InfoBlock>
  </UU5.Bricks.Lsi.Item>
  <UU5.Bricks.Lsi.Item language="cs">
    <Uu5Bricks.InfoBlock icon="uugdsstencil-education-assignment">
      <Uu5Bricks.Section header="Vítejte" headerSeparator=false level=4>
        <UU5.RichText.Block uu5string="<uu5string/><UU5.Bricks.Div>Vítejte v dokumentaci.</UU5.Bricks.Div>"/>
      </Uu5Bricks.Section>
    </Uu5Bricks.InfoBlock>
  </UU5.Bricks.Lsi.Item>
</UU5.Bricks.Lsi>
```

## Status Indicators

Common status badge patterns:

```xml
<!-- Complete/Active -->
<Uu5RichText.Badge state="active" icon="check"/>

<!-- Pending/System -->
<Uu5RichText.Badge state="system" icon="cancel"/>

<!-- In Progress -->
<Uu5RichText.Badge state="alternativeActive" icon="flash"/>

<!-- Cancelled/Final -->
<Uu5RichText.Badge state="alternativeFinal" icon="cancel"/>
```

## Icon Prefixes for Importance

```xml
<!-- Required knowledge -->
<Uu5RichText.Icon icon="mdi-star"/>

<!-- Optional knowledge -->
<Uu5RichText.Icon icon="mdi-star-half"/>

<!-- Prerequisite -->
<Uu5Elements.Icon icon="uugds-checkbox-list"/>
```

## Four-Column Information Layout

Complex multi-column layout with icons and descriptions.

### Markdown Input

```markdown
## Key Knowledge Areas

**Scope:**
- ☐ Prerequisite
- ⭐ Required
- ⭐½ Optional

**Knowledge Levels:**
- Informative
- Basic
- Intermediate

**Notes:**
Additional information about the training program.
```

### UU5 Output

```xml
<uu5string/>
<Uu5Bricks.Section header="Key Knowledge Areas" headerSeparator>
  <Uu5Bricks.Section tag=null props="<uu5json/>{}">
    <Uu5Bricks.Layout type="columns">
      <Uu5Bricks.Layout.Item colSpan="m: 6; l: 3">
        <Uu5RichTextBricks.Block uu5String="<uu5string/><p><strong>Scope:</strong></p><ul><li><Uu5Elements.Icon icon=\"uugds-checkbox-list\"/> - prerequisite</li><li><Uu5Elements.Icon icon=\"mdi-star\"/> - required</li><li><Uu5Elements.Icon icon=\"mdi-star-half\"/> - optional</li></ul>"/>
      </Uu5Bricks.Layout.Item>
      <Uu5Bricks.Layout.Item colSpan="m: 6; l: 3">
        <Uu5RichTextBricks.Block uu5String="<uu5string/><p><strong>Knowledge Levels:</strong></p><ul><li>informative</li><li>basic</li><li>intermediate</li></ul>"/>
      </Uu5Bricks.Layout.Item>
      <Uu5Bricks.Layout.Item colSpan="m: 6; l: 3">
        <Uu5RichTextBricks.Block uu5String="<uu5string/><Uu5RichText.Badge icon=\"uugdsstencil-badge-info\" state=\"active\"/> Additional training notes"/>
      </Uu5Bricks.Layout.Item>
      <Uu5Bricks.Layout.Item colSpan="m: 6; l: 3"/>
    </Uu5Bricks.Layout>
  </Uu5Bricks.Section>
</Uu5Bricks.Section>
```

## Tabbed Examples (Legacy UU5.Bricks.Tabs)

Used commonly in BookKit documentation.

```xml
<uu5string/>
<UU5.Bricks.Tabs mountContent="onActive">
  <UU5.Bricks.Tabs.Item header="Example" name="Example">
    Content for first tab
  </UU5.Bricks.Tabs.Item>
  <UU5.Bricks.Tabs.Item header="Code" name="Code" contentEditable>
    Code content
  </UU5.Bricks.Tabs.Item>
  <UU5.Bricks.Tabs.Item header="Details" name="Details">
    Details content
  </UU5.Bricks.Tabs.Item>
</UU5.Bricks.Tabs>
```

## Keyboard Support Table

Documentation-style table for keyboard shortcuts.

```xml
<uu5string/>
<Uu5TilesBricks.Table 
  data='<uu5json/>[
    ["<uu5string /><UU5.Bricks.Code>Tab</UU5.Bricks.Code>", "<uu5string />Move focus out of component"],
    ["<uu5string /><UU5.Bricks.Code>Enter</UU5.Bricks.Code> or <UU5.Bricks.Code>Space</UU5.Bricks.Code>", "<uu5string />Activate the selected item"],
    ["<uu5string /><UU5.Bricks.Code>Arrow Up/Down</UU5.Bricks.Code>", "<uu5string />Navigate between items"]
  ]' 
  columns='<uu5json/>[
    {"header": "Key"},
    {"header": "Function"}
  ]'
/>
```

## Plan/Schedule Table with Colored Cells

Complex table with background colors for status/phases.

```xml
<uu5string/>
<Uu5TilesBricks.Table 
  data="<uu5json/>[
    {
      \"value\": [
        \"John Smith\",
        {\"value\": \"Planning\", \"style\": {\"horizontalAlignment\": \"center\", \"backgroundColor\": \"#CAE6FC\"}},
        \"Kickoff\",
        {\"value\": \"Task A\", \"style\": {\"horizontalAlignment\": \"center\", \"backgroundColor\": \"#F3DBF4\"}},
        {\"value\": \"Task B\", \"style\": {\"horizontalAlignment\": \"center\", \"backgroundColor\": \"#F3DBF4\"}},
        {\"value\": \"Review\", \"style\": {\"horizontalAlignment\": \"center\", \"backgroundColor\": \"#FDEAD6\"}},
        \"Final check\"
      ],
      \"style\": {}
    }
  ]" 
  columnList="<uu5json/>[
    {\"header\": \"Author\", \"style\": {}},
    {\"header\": \"Week 1\", \"headerType\": \"text\", \"headerStyle\": {\"horizontalAlignment\": \"center\"}},
    {\"header\": \"Week 2\", \"headerType\": \"text\", \"headerStyle\": {\"horizontalAlignment\": \"center\"}, \"style\": {\"horizontalAlignment\": \"center\", \"backgroundColor\": \"#DFF2D1\"}},
    {\"header\": \"Week 3\", \"headerType\": \"text\", \"headerStyle\": {\"horizontalAlignment\": \"center\"}},
    {\"header\": \"Week 4\", \"headerType\": \"text\", \"headerStyle\": {\"horizontalAlignment\": \"center\"}},
    {\"header\": \"Week 5\", \"headerType\": \"text\", \"headerStyle\": {\"horizontalAlignment\": \"center\"}},
    {\"header\": \"Week 6\", \"headerType\": \"text\", \"headerStyle\": {\"horizontalAlignment\": \"center\"}, \"style\": {\"backgroundColor\": \"#E1F0E1\"}}
  ]" 
  hideFooter
/>
```

## Artifact Links

Links to uuApp artifacts.

```xml
<uu5string/>
<UuTBricks.Artifact.Link 
  baseUri="https://uuapp.plus4u.net/uu-businessterritory-maing01/407135c5d0eb451482495519f78eff10" 
  oid="696e3e5ae50d22b83d0b8056" 
  altText="CICD Basics"
/>
```

## File Downloads with Nested Lists

Complex list with file links.

```xml
<uu5string/>
<ul>
  <li>
    <UuContentKit.Links.FileLink src="67ed8591ee40441857ff5aa4" fileName="presentation.pptx">
      presentation.pptx
    </UuContentKit.Links.FileLink> (Author Name)
  </li>
  <li>
    Reference materials
    <ul>
      <li>
        <Uu5Bricks.Link href="ucl-bt:44191585378839233" target="_self">
          Related video
        </Uu5Bricks.Link>
      </li>
      <li>
        <UuContentKit.Links.FileLink src="67ed8563f10d9773ed3c78e2" fileName="docs.pdf">
          Documentation PDF
        </UuContentKit.Links.FileLink>
      </li>
    </ul>
  </li>
</ul>
```
