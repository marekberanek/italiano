---
name: uu5json-to-markdown
description: Convert UU5 JSON representation to readable Markdown format. Use when working with UU5 content stored as JSON objects ({ uu5Tag, props, children }) from BookKit, ManagementKit, or any UU5-based application and need human-readable output. This is the JSON-representation equivalent of uu5-to-markdown.
---

# UU5 JSON to Markdown Converter

Convert UU5 JSON representation into readable Markdown format.

## Prerequisites

- Node.js (v14+)

## Quick Start

```bash
# From the skill directory (uu5json-to-markdown/)
echo '[{"uu5Tag":"UU5.Bricks.P","props":{},"children":["Hello world"]}]' | node lib/convert.js

# From file
node lib/convert.js < content.json
```

## Input Format

UU5 JSON is an array (or single object) of component nodes:

```json
[
  {
    "uu5Tag": "UU5.Bricks.Header",
    "props": { "level": "1" },
    "children": ["My Heading"]
  },
  {
    "uu5Tag": "UU5.Bricks.P",
    "props": {},
    "children": [
      "Hello ",
      { "uu5Tag": "strong", "props": {}, "children": ["world"] }
    ]
  }
]
```

Each node has:
- `uu5Tag` (or `tag`) — component name
- `props` — component attributes as an object
- `children` — array of strings or nested nodes (optional)

## Conversion Rules

| UU5 JSON `uu5Tag` | Markdown Output |
|-------------------|-----------------|
| `UU5.Bricks.Header` (level 1–6) | `# text` … `###### text` |
| `Uu5Bricks.Section` (header attr) | `## header` + content |
| `UU5.Bricks.P` | paragraph text |
| `UU5.Bricks.Div` | block text |
| `strong` | `**text**` |
| `em` / `i` | `*text*` |
| `s` | `~~text~~` |
| `UU5.Bricks.Link` (href prop) | `[text](url)` |
| `UU5.Bricks.Code` | `` `code` `` |
| `UU5.CodeKit.CodeViewer` | code block with language |
| `UU5.Bricks.Ul` / `ul` | unordered list |
| `UU5.Bricks.Ol` / `ol` | ordered list |
| `UU5.Bricks.Li` / `li` | `- item` |
| `br` | newline |
| `UU5.Bricks.Blockquote` | `> text` |
| `UU5.Bricks.Lsi` | Extract English or first available |
| `Uu5RichTextBricks.Block` | Inline uu5string fallback (strips tags) |

## Examples

### Basic Text

**Input:**
```json
[{"uu5Tag":"UU5.Bricks.P","props":{},"children":["Hello ","world"]}]
```

**Output:**
```markdown
Hello world
```

### Headers

**Input:**
```json
[{"uu5Tag":"UU5.Bricks.Header","props":{"level":"2"},"children":["Section Title"]}]
```

**Output:**
```markdown
## Section Title
```

### Lists

**Input:**
```json
[{
  "uu5Tag": "UU5.Bricks.Ul",
  "props": {},
  "children": [
    {"uu5Tag":"UU5.Bricks.Li","props":{},"children":["First item"]},
    {"uu5Tag":"UU5.Bricks.Li","props":{},"children":["Second item"]}
  ]
}]
```

**Output:**
```markdown
- First item
- Second item
```

### Code Blocks

**Input:**
```json
[{"uu5Tag":"UU5.CodeKit.CodeViewer","props":{"codeStyle":"javascript","value":"const x = 1;"},"children":[]}]
```

**Output:**
```markdown
```javascript
const x = 1;
```
```

## Integration

This skill complements:
- **uu5-to-markdown** — converts UU5 XML string format (opposite representation)
- **markdown-to-uu5** — converts Markdown → UU5
- **mngkit-read** — loads content from Management Kit (returns JSON with `uu5Tag`)
- **uu5-string-validator** — validates UU5 string before conversion

## Notes

- Both `uu5Tag` and `tag` field names are accepted
- LSI elements render English content by default, falling back to first available language
- Nested lists are supported
- Unknown components have their children rendered, tag names removed
- `Uu5RichTextBricks.Block` nodes with embedded `uu5String` are handled via a simple tag-stripping fallback
