---
name: elemmng-read
description: Load full meeting content from Elementary Management (uu-elementarymanagement-maing01) — preparation notes, minutes, and participants. Use when loading meeting content via meetingUrl obtained from calendar skill output.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Elementary Management Meeting Reader

Loads full meeting detail from Elementary Management including preparation notes, minutes, and participant list.

## Prerequisites

**Authentication:** The MCP server handles authentication automatically. If no valid token exists,
a browser window will open for interactive login.

## Usage via MCP

```
executeSkill({ scriptPath: "<absolute path to elemmng-read/skill.js>", params: { url: "https://uuapp.plus4u.net/uu-elementarymanagement-maing01/{awid}/meetingDetail?id={meetingId}" } })
```

**Batch loading** (multiple meetings in parallel):
```
batchExecuteSkill({ scriptPath: "<absolute path to elemmng-read/skill.js>", paramsList: [{ url: "https://.../meeting?id=id1" }, { url: "https://.../meeting?id=id2" }] })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | Meeting URL — available as `meetingUrl` in calendar skill output |

## Response Structure

```json
{
  "name": "Meeting name",
  "place": "Signal / CL7 1.09 Meerkat",
  "coordinator": "Adéla Babicová",
  "start": "2026-03-27T08:00:00.000Z",
  "end": "2026-03-27T10:00:00.000Z",
  "state": "scheduled",
  "participants": ["Name 1", "Name 2"],
  "preparationText": "## Agenda\n...",
  "minutesText": "## Notes\n...",
  "hasPreparation": true,
  "hasMinutes": false
}
```

### Fields

| Field | Description |
|-------|-------------|
| `name` | Meeting name |
| `place` | Meeting location (plain text, UU5 tags stripped) |
| `coordinator` | Coordinator name (person who organized the meeting) |
| `start` | ISO 8601 start time (UTC) |
| `end` | ISO 8601 end time (UTC) |
| `state` | Meeting state (e.g. `scheduled`, `cancelled`) |
| `participants[]` | Array of participant names |
| `preparationText` | Preparation notes as Markdown (empty string if none) |
| `minutesText` | Meeting minutes as Markdown (empty string if none) |
| `hasPreparation` | `true` if preparation notes exist |
| `hasMinutes` | `true` if minutes exist |

## Key Implementation Details

- Content is loaded via a chain: `meeting/get` → `page/get` → `panel/get` → `section/get` (parallel).
- Sections are split into preparation vs. minutes based on system marker tags (`UuElementaryManagement.Meeting.DetailPreparation`, `UuElementaryManagement.Meeting.DetailMinutes`).
- Legacy diary items have no `meetingId` — skip this skill for items where `isLegacy: true`.
