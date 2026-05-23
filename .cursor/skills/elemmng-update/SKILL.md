---
name: elemmng-update
description: Write content to preparation or minutes sections of an Elementary Management meeting (uu-elementarymanagement-maing01). Use when the user wants to edit, update, or write to meeting preparation notes or minutes.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Elementary Management Meeting Writer

Write content to the preparation or minutes section of an Elementary Management meeting.

## Prerequisites

**Authentication:** The MCP server handles authentication automatically. If no valid token exists,
a browser window will open for interactive login.

**Important:** The meeting section must NOT be locked by another user or browser session. If you get `lockSectionFailed`, ask the user to close any open editing sessions in the browser first ("Ukončit úpravy").

## Usage via MCP

```
executeSkill({ scriptPath: "<absolute path to elemmng-update/skill.js>", params: { url: "https://uuapp.plus4u.net/uu-elementarymanagement-maing01/{awid}/meeting?id={meetingId}", content: "Text to write", target: "minutes" } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | Meeting URL |
| `content` | Yes | Content to write (plain text or uu5string when format=uu5string) |
| `target` | No | `"minutes"` (default) or `"preparation"` |
| `format` | No | `"text"` (default, wraps in RichText.Block) or `"uu5string"` (raw, sent as-is) |
| `action` | No | `"update"` (default) or `"inspect"` to dump section structure |

## API Workflow

The skill follows the ECC section editing workflow:

1. **Lock** section (`meeting/section/lock`)
2. **Update** section with content (`meeting/section/update`)
3. **Unlock** section (`meeting/section/unlock`)

### Payload Format

All three calls use the same base body structure:

```json
{
  "meetingId": "{meetingId}",
  "id": "{meetingId}",
  "uuEccDtoIn": { "oid": "{sectionOid}", "bid": "{sectionBid}" },
  "uuEccData": { "oid": "{sectionOid}", "bid": "{sectionBid}" }
}
```

The update call adds `content` (uu5String) and `commitTs` inside both `uuEccDtoIn` and `uuEccData`.

### Content Format — ALWAYS wrap in `UU5.RichText.Block`

**MANDATORY.** All meeting content must live inside `UU5.RichText.Block`. Never emit bare `<UU5.Bricks.P>`, `<UU5.Bricks.Div>`, `<p>`, or raw text at the top level — those render inconsistently and clash with the Elementary Management editor. `UU5.RichText.Block` matches the stored form and the project-wide rich-text rule (see `~/.claude/memory/feedback_uu5_string_rules.md`).

With `format="text"` (default), the skill wraps your content automatically:

```
<uu5string/><UU5.RichText.Block uu5string="<uu5string/>Your text here"/>
```

With `format="uu5string"` (raw), **you** are responsible for the wrapping — always produce a `UU5.RichText.Block` as the outer container. Inside its `uu5string` prop, use rich-text formatting only:

- bold `<strong>…</strong>`, italic `<i>…</i>`, underline `<u>…</u>`
- line break `<br/>`
- bullets `<UU5.Bricks.Ul><UU5.Bricks.Li>…</UU5.Bricks.Li></UU5.Bricks.Ul>`
- numbered `<UU5.Bricks.Ol><UU5.Bricks.Li>…</UU5.Bricks.Li></UU5.Bricks.Ol>`
- link `<UuContentKit.Links.Link src='URL' target='_blank'>…</UuContentKit.Links.Link>`
- inline highlight/color `<UU5.Bricks.Span style='<uu5json/>{"backgroundColor":"#FFF176"}'>…</UU5.Bricks.Span>`

Structural blocks that cannot fit inside RichText (section headers, tables, code blocks) go as **siblings** of the `UU5.RichText.Block` — never as its children. Bare `<UU5.Bricks.P>` / `<UU5.Bricks.Div>` are never acceptable substitutes.

### Round-trip from `elemmng-read`

`elemmng-read` returns minutes/preparation as Markdown for readability. When you round-trip (edit text → write back), convert your Markdown back through `markdown-to-uu5` or hand-write the UU5 — but always ensure the final payload is wrapped in `UU5.RichText.Block`. Do not paste raw markdown-converted output that contains bare `UU5.Bricks.P`/`Div` blocks; re-wrap it in `UU5.RichText.Block` first.

## Key Implementation Details

- Sections are identified by marker tags: `UuElementaryManagement.Meeting.DetailPreparation` and `UuElementaryManagement.Meeting.DetailMinutes`.
- The first non-readOnly section after each marker is the editable content section.
- `commitTs` from the section data is required for optimistic concurrency control.
- The `oid` and `bid` of the section must be sent in both `uuEccDtoIn` and `uuEccData`.
