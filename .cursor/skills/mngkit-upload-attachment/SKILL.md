---
name: mngkit-upload-attachment
description: Upload binary files (PDF, PPTX, images, etc.) to a Management Kit document (uu-managementkit-maing02) as EBC attachments, or list existing attachments. Returns file link tags for embedding in page content. Use when the user wants to attach files to a ManagementKit document or link to attachments from pages.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Management Kit Upload Attachment

Upload a binary file to a ManagementKit document as an EBC attachment, or list existing attachments.

## Prerequisites

**Authentication Required:** Call the `login` tool first.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `action` | No | `"upload"` (default) or `"list"` |
| `url` | No* | ManagementKit document URL |
| `baseUri` | No* | Base URI for API calls (from mngkit-read) |
| `documentOid` | No* | Document OID (from mngkit-read) |
| `filePath` | For upload | Local file path to upload |
| `filename` | No | Override filename (defaults to basename of filePath) |
| `mimeType` | No | Override MIME type (auto-detected from extension) |

*Either `url` or both `baseUri` + `documentOid` are required.

## Upload a File

```
executeSkill({
  scriptPath: "<absolute path to mngkit-upload-attachment/skill.js>",
  params: {
    url: "DOCUMENT_URL",
    filePath: "/tmp/presentation.pptx"
  }
})
```

Response includes `links` with all three display variants and `eccComponent` for direct use in ECC content:

- `links.inline` — text link (no type attribute)
- `links.boxLink` — file box with icon and filename (`type="boxLink"`)
- `links.button` — download button (`type="button"`)
- `eccComponent` — ready-to-use ECC object `{uu5Tag: "UuEbc.File.Link", props: {src, type?}}`

### UuEbc.File.Link variants

| Variant | Tag | Use case |
|---------|-----|----------|
| Inline link | `<UuEbc.File.Link src="..."/>` | Text link within a paragraph |
| Box link | `<UuEbc.File.Link src="..." type="boxLink"/>` | File card with icon — best for standalone attachments |
| Button | `<UuEbc.File.Link src="..." type="button"/>` | Download button |

## List Existing Attachments

```
executeSkill({
  scriptPath: "<absolute path to mngkit-upload-attachment/skill.js>",
  params: {
    url: "DOCUMENT_URL",
    action: "list"
  }
})
```

Returns `itemList[]` with each file enriched with `links` (all variants) and `eccComponent` for embedding.

## Embedding File Link in Page Content

After uploading, use the returned `linkTag` in an ECC section via `mngkit-update`:

```json
[{
  "uu5Tag": "UU5.RichText.Block",
  "props": {
    "uu5string": "<uu5string/><strong>Přílohy:</strong>"
  }
}, {
  "uu5Tag": "UuEbc.File.Link",
  "props": {
    "src": "{baseUri}/document/ebc/file/getDataByOid?bid&oid={documentOid}&uuEbcData.fileOid={fileOid}",
    "type": "boxLink"
  }
}]
```

## Workflow: Upload + Link

1. **Upload**: `mngkit-upload-attachment` with `filePath` → get `linkTag`
2. **Read page**: `mngkit-read` to get `panelOid` or `sectionOid`
3. **Add/update section**: `mngkit-update` with content including the `linkTag` as a separate ECC entry

## API Details

- **Upload**: `POST document/ebc/collection/createFile` (multipart, dot-notation)
- **List files**: `GET document/ebc/collection/listFilesByOid`
- **File link component**: `<UuEbc.File.Link src="...getDataByOid..." type="boxLink"/>`
- **Download**: `GET document/ebc/file/getDataByOid` (authenticated, returns binary)
