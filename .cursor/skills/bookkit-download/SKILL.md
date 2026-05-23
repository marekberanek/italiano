---
name: bookkit-download
description: Download an entire BookKit book (uu-bookkit-maing01) and convert to Markdown. Use when the user wants to export, download, dump, or back up a BookKit book to local files.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# BookKit Download

Download a complete BookKit book in two phases:

1. **Download** — fetch all pages from the API and save raw JSON responses into `bookkit/<name>/`.
2. **Convert** — read raw JSON from `bookkit/<name>/` and write Markdown files to `books/<name>/`.

## Prerequisites

**Authentication Required:** Call the `login` tool first:

```
CallMcpTool({ server: "skilled-plus4u-mcp", toolName: "login" })
```

## Usage via MCP

```
executeSkill({
  scriptPath: "<absolute path to bookkit-download/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code=home",
    name: "GCCIA"
  }
})
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | Any BookKit URL from the book |
| `name` | **Yes** | Book directory name (e.g. `"GCCIA"`). Same name is used for both `bookkit/<name>/` and `books/<name>/`. **Always use the name the user mentioned.** |
| `mode` | No | `"all"` (default) = download + convert. `"download"` = raw JSON only. `"convert"` = convert existing raw data only. |

## Output Location

- Raw JSON pages → **`bookkit/<name>/`**
- Markdown pages → **`books/<name>/`**

The `<name>` comes directly from the required `name` parameter. No fallbacks, no guessing.

## Output Structure

Both directories have the same internal structure (mirroring the book hierarchy). The only difference is the file extension (`.json` vs `.md`).

**Example book:**
```
Home (indent 0)
  ├─ Chapter 1 (indent 1)
  │   ├─ Section 1.1 (indent 2)
  │   └─ Section 1.2 (indent 2)
  └─ Chapter 2 (indent 1)
```

**Resulting directories:**
```
bookkit/GCCIA/                         (raw JSON)
├── _meta.json
├── home-Home.json
├── chapter-1-Chapter-1/
│   ├── README.json
│   ├── section-1-1-Section-1-1.json
│   └── section-1-2-Section-1-2.json
└── chapter-2-Chapter-2.json

books/GCCIA/                           (Markdown)
├── home-Home.md
├── chapter-1-Chapter-1/
│   ├── README.md
│   ├── section-1-1-Section-1-1.md
│   └── section-1-2-Section-1-2.md
└── chapter-2-Chapter-2.md
```

Pages with sub-pages become directories with `README.md` / `README.json`; leaf pages become `{code}-{Name}.md` / `.json` files. If the book has a single root page, its children are placed at the top level.

### Metadata (`_meta.json`)

Saved in `bookkit/<name>/_meta.json`:

```json
{
  "baseUri": "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}",
  "downloadedAt": "2025-01-01T00:00:00.000Z",
  "pageCount": 25,
  "pages": [
    { "code": "home", "name": "Home", "filePath": "home-Home.md" },
    ...
  ]
}
```

## Execution Modes

| Mode | What it does | Requires `url`? |
|------|-------------|-----------------|
| `"all"` (default) | Download raw JSON + convert to Markdown | Yes |
| `"download"` | Download raw JSON only | Yes |
| `"convert"` | Convert existing raw JSON to Markdown | No |

## Response Structure

```json
{
  "message": "Downloaded 25/25 raw pages to bookkit/GCCIA. Converted 25/25 pages to books/GCCIA",
  "pageCount": 25,
  "rawDir": "bookkit/GCCIA",
  "booksDir": "books/GCCIA"
}
```

## How It Works

1. Fetches book structure via `getBookStructure` API
2. Traverses the linked list to get pages in DFS order
3. Builds a tree from indent levels, assigns filesystem paths
4. **Phase 1 (download):** Downloads pages in parallel batches (5 at a time), saves raw JSON to `bookkit/<name>/`
5. **Phase 2 (convert):** Reads each raw JSON file, converts UU5 strings to Markdown, writes to `books/<name>/`
