---
name: calendar
description: Lists the user's meeting schedule from dwg01 (Digital Workspace) — times, locations, organizers. Use when the user asks for "kalendář", "rozvrh", "program", "co mám za schůzky", or wants to accept/reject meetings ("přijmi", "odmítni"). Also the default when the request is ambiguous (e.g. "dej mi meetingy z pátku") — shows the schedule first, the user can then ask for content.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Calendar - DWG01 Meetings

List your meetings from the Digital Workspace (dwg01) for the current week.

## Prerequisites

**Authentication:** The MCP server handles authentication automatically. If no valid token exists,
a browser window will open for interactive login.

## Usage via MCP

```
executeSkill({ scriptPath: "<absolute path to calendar/skill.js>", params: { } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `uuIdentity` | No | uuIdentity of the user. If not provided, resolve it by calling `getAuthStatus` on the skilled-plus4u-mcp server — the response contains the authenticated user's `uuIdentity`. |
| `dateFrom` | No | Start date ISO (default: Monday of the current week) |
| `dateTo` | No | End date ISO (default: Sunday of the current week) |

### Examples

List this week's meetings (default):
```
executeSkill({ scriptPath: "<absolute path to calendar/skill.js>", params: {} })
```

List meetings for a specific date range:
```
executeSkill({ scriptPath: "<absolute path to calendar/skill.js>", params: { dateFrom: "2026-03-20", dateTo: "2026-03-26" } })
```

List meetings for a different user:
```
executeSkill({ scriptPath: "<absolute path to calendar/skill.js>", params: { uuIdentity: "123-456" } })
```

## How It Works

1. Resolves the **requested person’s** dwg01 workspace URI via `uu-plus4upeople-maing01/findPerson` using `uuIdentity` (your own identity from `getAuthStatus`, or another person’s if you pass `uuIdentity` explicitly).
2. Fetches diary rows from that workspace:
   - **Single day** (`dateFrom === dateTo`): `uuDwRecord/listMyDiaryRecords` — merges `uuDwrActiveList` + `uuDwrFinalList` (active, rejected, and cancelled).
   - **Multi-day range**: `uuDwRecord/listMyActiveDiaryRecords` — uses `itemList` (active meetings only; better performance for a week view).
3. **Someone else’s calendar:** The `listMy*` use cases are tied to the **authenticated user’s** permissions in dwg01. When you ask for **another user’s** diary (`uuIdentity` ≠ caller), those endpoints may respond with **HTTP 403**. In that case the skill **automatically falls back** to `uuDwRecord/listDiaryRecords` (same date range) and merges `uuDwrActiveList` + `uuDwrFinalList`.
4. Sorts all items by `startTime`, maps them to meeting objects (empty names are allowed), and categorizes into `meetings` (active), `rejected`, and `cancelled`.
5. Returns all three groups with full meeting details and action fields where available.

## Elementary Activity States

| State | Meaning |
|-------|---------|
| `initial` | Nevyjádřil jsem se (no response yet) |
| `accepted` | Zúčastním se (will attend) |
| `attention` | Nezúčastním se (will not attend) |
| `warning` | Upozornění (warning) |
| `replanned` | Přeplánováno (replanned) |
| `notSolvedActive` | Aktivní, nevyřešeno |
| `solvedActive` | Aktivní, vyřešeno |

## Displaying Results

Present as a table grouped by day, **sorted by startTime ascending** within each day. Apply these rules:

### 1. Declined and cancelled meetings display
Behavior depends on the date range:

**Multi-day range** (`dateFrom !== dateTo`): Do NOT show meetings where `rejected === true` or `artifactState === 'cancelled'`. The user doesn't need to see them in a weekly overview.

**Single-day view** (`dateFrom === dateTo`): Show all meetings split into three separate tables — Active, Rejected, Cancelled:
- **Active**: `rejected === false` AND `artifactState !== 'cancelled'`
- **Rejected**: `rejected === true` AND `artifactState !== 'cancelled'`
- **Cancelled**: `artifactState === 'cancelled'`

### 2. Mark meetings needing response
If a meeting is **in the future** (startTime > now) and within the next 7 days, and the state is `initial` or `replanned`, add ⚠️ before the name. This is a mild warning — the user hasn't confirmed attendance yet. Both `initial` and `replanned` meetings require the user to respond.

### 3. Highlight time overlaps
If two or more **visible** meetings overlap in time (their time ranges intersect), add ❗ before the name. This is the most serious signal — the user needs to resolve time conflicts. If a meeting has both overlap and needs response, show both: ❗⚠️.

### 4. Numbering for bulk actions
All meetings get a sequential number in the `#` column. Numbering is continuous across all days and across all tables (active, rejected) — not reset per day or per table. Only **cancelled** meetings have no number. This allows the user to reference any meeting by number for bulk accept/reject or other actions.

### 5. Meeting name as link
In the Schůzka column, render the meeting name as a markdown link `[name](meetingUrl)`. If `meetingUrl` is null, use plain text.

### 6. No "Stav" column
Do NOT include a state column in the table. The icons before the meeting name are sufficient. The table has 5 columns: #, Čas, Schůzka, Poznámka, Organizátor.

### 7. Structured next actions
After the table, analyze the current calendar state and present **contextual next actions** as a numbered list. Only show actions that are relevant — skip any that don't apply. Use this priority order:

**a) Overlaps (highest priority)** — if any ❗ meetings exist:
> ❗ **Konflikty** — schůzky #X, #Y a #Z se překrývají. Kterou chceš ponechat?

**b) Unconfirmed meetings** — if any ⚠️ meetings exist:
> ⚠️ **K potvrzení** ({count}): #{list}. Přijmout všechny bez konfliktů? Nebo vyber čísla.

**c) Meeting details** — always show if there are non-legacy active meetings:
> 📋 **Přehled meetingů** — chceš shrnutí, co se bude řešit? (např. "shrň 2,5" nebo "co se řešilo na 3")

**d) Quick actions hint** — always show as a compact one-liner at the end:
> Tip: "přijmi 1,3,5-8" / "odmítni 2" / "přijmi všechny"

Rules:
- Group overlapping meetings together and name them explicitly so the user can decide without scrolling back.
- For unconfirmed meetings, state the exact count and list the numbers. If all non-overlapping meetings can be safely accepted, offer that as the default action.
- Adapt language: for a single overlap pair be specific ("schůzky #2 a #3 se překrývají v 09:00–09:30"), for many overlaps summarize.
- Keep it concise — each action block is 1–2 lines max.

When the user selects meetings by number, range, or day name for accept/reject, call `calendar-accept` in parallel for each selected meeting using the stored sourceAppBaseUri, activityRefId, and elementaryActivity from the calendar output.

When the user asks for meeting details, summaries, or content (e.g. "přehled meetingů", "shrň meetingy 2,5", "co se řešilo na 3"), switch to the `meetings-review` skill. Pass the `meetingUrl` of the selected meetings as the `urls` parameter. If no specific meetings are selected (e.g. "přehled meetingů"), pass all non-legacy active meetings from the current calendar view.

### 8. Suggest rejecting overlapping meetings on accept
When the user accepts a meeting that has overlaps (❗), propose rejecting all overlapping `initial` meetings and ask the user to confirm before taking action. Example: "Přijal jsem #3 Oběd J+J. Překrývají se s ním #4 PSS Automation a #5 Entity Management — odmítnout je?"
Only reject the overlapping meetings after the user explicitly confirms (e.g. "ano" / "odmítni je").

### 9. Batch accept — warn on overlaps, don't auto-accept
When the user batch-accepts multiple meetings (e.g. "přijmi zbytek", "přijmi všechny středa"), do NOT blindly accept overlapping meetings. Instead:
1. Accept all non-overlapping meetings immediately.
2. For groups of overlapping meetings, list them and ask the user which one(s) to keep.
3. Only accept overlapping meetings if the user explicitly confirms (e.g. "přijmi 4,5,6" when they all overlap).

This prevents the user from accidentally accepting conflicting meetings they didn't notice.

### Example output

```
### Úterý 24. 3.
| # | Čas | Schůzka | Místo | Organizátor |
|---|---|---|---|---|
| 1 | 08:00–09:00 | [Meeting A](https://...) | room 1.2 | Jan Novák |
| 2 | 09:00–10:00 | ⚠️ [Meeting B](https://...) | Signal | Eva Malá |
| 3 | 09:30–10:30 | ❗⚠️ [Meeting C](https://...) | room 3.1 | Jan Novák |

### Středa 25. 3.
| # | Čas | Schůzka | Místo | Organizátor |
|---|---|---|---|---|
| 4 | 08:00–09:00 | ⚠️ [Meeting D](https://...) | room 2.1 | Petr Velký |
| 5 | 10:00–11:00 | ❗⚠️ [Meeting E](https://...) | Signal | Eva Malá |
| 6 | 10:00–11:00 | ❗⚠️ [Meeting F](https://...) | online | Jan Novák |

❗ **Konflikty** — #2 Meeting B a #3 Meeting C se překrývají (09:00–10:30); #5 Meeting E a #6 Meeting F se překrývají (10:00–11:00). Kterou chceš ponechat?

⚠️ **K potvrzení** (5): #2, #3, #4, #5, #6. Přijmout všechny bez konfliktů (#4)? Nebo vyber čísla.

📋 **Přehled meetingů** — chceš shrnutí, co se bude řešit? (např. "shrň 2,5" nebo "co se řešilo na 3")

Tip: "přijmi 4-6" / "odmítni 3" / "přijmi všechny středa"
```

## Response Structure

```json
{
  "dwUri": "https://uuapp.plus4u.net/uu-myterritory-dwg01/{awid}/",
  "dateRange": { "dateFrom": "2026-03-23", "dateTo": "2026-03-29" },
  "meetingCount": 8,
  "meetings": [
    {
      "name": "Meeting Name",
      "startTime": "2026-03-24T07:00:00.000Z",
      "endTime": "2026-03-24T07:30:00.000Z",
      "timeLocal": "09:00–10:00 CEST",
      "location": "Room 1.2",
      "organizer": "Jane Doe",
      "artifactState": "scheduled",
      "rejected": false,
      "category": "active",
      "meetingUrl": "https://...",
      "elementaryActivityStateCode": "initial",
      "sourceAppBaseUri": "https://uuapp.plus4u.net/uu-businessterritory-maing01/{awid}",
      "activityRefId": "...",
      "elementaryActivity": "..."
    }
  ],
  "rejected": [...],
  "cancelled": [...]
}
```

### Meeting object fields

| Field | Description |
|-------|-------------|
| `id` | Diary record ID |
| `name` | Meeting name |
| `startTime` | ISO 8601 start time (UTC) |
| `endTime` | ISO 8601 end time (UTC) |
| `timeLocal` | Time range in local time as `HH:MM–HH:MM CET` or `HH:MM–HH:MM CEST` |
| `location` | Meeting location (UU5 tags stripped) |
| `organizer` | Name of the submitter (person who sent the invitation) |
| `activityState` | State of the diary activity record (`active`, `cancelled`) |
| `artifactState` | State of the meeting artifact in Elementary Management (`scheduled`, `cancelled`) |
| `rejected` | `true` if the diary invitation was rejected by the recipient |
| `category` | `"active"`, `"rejected"`, or `"cancelled"` |
| `meetingId` | ID of the meeting in Elementary Management |
| `isLegacy` | `true` if the item has no `meetingId` (legacy diary record) |
| `meetingBaseUri` | Base URI of the Elementary Management app instance |
| `meetingUrl` | Full URL to the meeting detail |
| `elementaryActivityStateCode` | State code of the user's elementary activity (`initial`, `accepted`, `attention`, `replanned`, …) |
| `sourceAppBaseUri` | Base URI of the source Business Territory app (used for accept/reject actions) |
| `activityRefId` | Activity reference ID (used for accept/reject actions) |
| `elementaryActivity` | Elementary activity ID (used for accept/reject actions) |
