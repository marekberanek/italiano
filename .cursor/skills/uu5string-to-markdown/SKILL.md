---
name: uu5string-to-markdown
description: Convert uu5string content to clean Markdown with full fidelity. Use when converting BookKit pages, uu5string content, or UU5 component markup to Markdown format.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# UU5String to Markdown Converter

Converts `<uu5string/>` content into clean Markdown. Uses the `uu5-string-validator` AST parser for precise, lossless conversion.

## Usage

### Via MCP skill

```
executeSkill({
  scriptPath: "<absolute path to uu5string-to-markdown/skill.js>",
  params: { uu5string: "<uu5string/>...", outputFile: "output.md" }
})
```

```
executeSkill({
  scriptPath: "<absolute path to uu5string-to-markdown/skill.js>",
  params: { jsonFile: "bookkit/GCCIA/.../page.json", outputFile: "output.md" }
})
```

### Programmatic

```js
const { convertUu5StringToMarkdown } = require("./lib/uu5string-to-markdown.js");
const md = convertUu5StringToMarkdown("<uu5string/><UU5.Bricks.Div>Hello</UU5.Bricks.Div>");
```

## Key Design Decisions

1. **AST-based** — parses with `Uu5Parser`, never uses regex tag stripping
2. **Recursive cell conversion** — table cells and description list values containing `<uu5string/>` are parsed and converted, not stripped
3. **No post-processing hacks** — no regex to remove leaked attributes/styles; the AST walk handles everything
4. **Complete coverage** — handles 80+ component types found in BookKit data

## Component Mapping

| UU5 Component | Markdown Output |
| --- | --- |
| `UU5.Bricks.Section` / `Uu5Bricks.Section` | `## header` + children |
| `UU5.Bricks.Header` | `# text` (level-aware) |
| `UU5.Bricks.P` / `p` | paragraph + blank line |
| `UU5.Bricks.Div` / `div` | text + newline |
| `strong` / `UU5.Bricks.Strong` | `**text**` |
| `em` / `UU5.Bricks.Em` | `*text*` |
| `s` | `~~text~~` |
| `UU5.Bricks.Code` / `Uu5RichText.Code` | `` `code` `` |
| `Uu5CodeKitBricks.Code` | fenced code block |
| `UU5.Bricks.Link` / `Uu5Bricks.Link` | `[text](url)` |
| `UuContentKit.Links.Link` | `[text](src)` |
| `UU5.Bricks.Ul` / `Ol` | `- item` / `1. item` |
| `Uu5TilesBricks.Table` | markdown table |
| `UuApp.DesignKit.Table` | markdown table |
| `UuApp.DesignKit.DescriptionList` | key-value table |
| `UuApp.DesignKit.EmbeddedText` | header + fenced code |
| `UuApp.DesignKit.StateList` | state table |
| `UuApp.DesignKit.BusinessScenario` | numbered steps |
| `UU5.RichText.Block` | nested uu5string |
| `UU5.Bricks.Lsi` | English item preferred |
| `Uu5Bricks.Tabs` / `.Item` | `**[label]**` + content |
| `Uu5Bricks.InfoBlock` | blockquote |
| `Uu5ImagingBricks.Image` | `![alt](src)` |
| `UuBml.Draw.Diagram` | `*[BML Diagram]*` |
| Runtime widgets (`UuTerritory.*`, `UuAppBusinessModelKit.*`) | header only |

## Integration with bookkit-download

The `bookkit-download` skill imports this converter directly:

```js
const { convertUu5StringToMarkdown } = require(
  path.join(__dirname, "../uu5string-to-markdown/lib/uu5string-to-markdown.js"),
);
```
