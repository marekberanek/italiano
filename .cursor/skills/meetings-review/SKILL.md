---
name: meetings-review
description: Load and display meeting content — preparation notes, minutes, participants. Two modes — pass meeting URLs directly, or specify a date range to auto-fetch from calendar. Use when the user asks for "zápisy", "poznámky", "přípravy", "minuty", "obsah meetingů", "co se řešilo", "shrň meetingy", "review schůzek", "načti meeting". Do NOT use for simple schedule/time overview — that is the calendar skill.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Meetings Review

Load meeting content and present a structured Markdown overview. Supports two input modes.

## Prerequisites

**Authentication:** The MCP server handles authentication automatically. If no valid token exists, a browser window will open for interactive login.


## Usage via MCP

### Mode 1 — Direct URLs

Pass one or more meeting URLs. The skill calls `elemmng-read` for each URL and builds the overview.

```
executeSkill({ scriptPath: "<absolute path to meetings-review/skill.js>", params: { urls: ["https://uuapp.plus4u.net/uu-elementarymanagement-maing01/{awid}/meetingDetail?id={id1}"] } })
```

### Mode 2 — Date range (calendar)

Specify a date range. The skill calls `calendar` to get the meeting list, then `elemmng-read` for each meeting with a URL.

```
executeSkill({ scriptPath: "<absolute path to meetings-review/skill.js>", params: { dateFrom: "2026-03-27", dateTo: "2026-03-27" } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `urls` | Mode 1 | Array of meeting URLs to load |
| `dateFrom` | Mode 2 | Start date ISO (default: today) |
| `dateTo` | Mode 2 | End date ISO (default: same as `dateFrom`) |
| `uuIdentity` | No | uuIdentity for calendar lookup (passed through to calendar skill) |

If both `urls` and `dateFrom` are provided, `urls` takes priority.

## Procedure

### 1. Resolve meeting list

**Mode 1 (URLs):** For each URL, call `elemmng-read`:
```
batchExecuteSkill({ scriptPath: "<absolute path to elemmng-read/skill.js>", paramsList: [
  { url: "https://...?id=id1" },
  { url: "https://...?id=id2" }
] })
```

**Mode 2 (calendar):** Call `calendar` to obtain the meeting list:
```
executeSkill({ scriptPath: "<absolute path to calendar/skill.js>", params: { uuIdentity: "...", dateFrom: "...", dateTo: "..." } })
```
Use `meetings` and `rejected` arrays from the result. Then call `elemmng-read` in batch for all non-legacy meetings that have a `meetingUrl`. Merge each result with the corresponding meeting object by matching `meetingUrl`.

### 2. Display overview table

When processing multiple meetings, display **only the summary table first** — do NOT display full meeting content yet. The table serves as a menu for the user to choose next actions.

```markdown
# Meetings Overview — Pátek 27. 3.

| # | Čas | Schůzka | Příprava | Zápis | Účastníci |
|---|-----|---------|----------|-------|-----------|
| 1 | 09:00–10:00 CET | [Meeting X](https://...) | ✓ | ✓ | 3 |
| 2 | 11:00–12:00 CET | [Meeting Y](https://...) | ✓ | – | 5 |
| 3 | 14:00–15:00 CET | Meeting Z (legacy) | – | – | – |

### Rejected
| # | Čas | Schůzka | Příprava | Zápis | Účastníci |
|---|-----|---------|----------|-------|-----------|
| 4 | 10:00–11:00 CET | [Stand-up](https://...) | – | – | 0 |
```

Column rules:
- **#**: sequential number, continuous across active and rejected
- **Čas**: use `timeLocal` if available (calendar mode), otherwise derive from `start`/`end` (URL mode)
- **Schůzka**: wrap name in link `[Name](url)`; for legacy add `(legacy)` and omit the link
- **Příprava**: `✓` if `hasPreparation: true`, otherwise `–`
- **Zápis**: `✓` if `hasMinutes: true`, otherwise `–`
- **Účastníci**: count or `–` for legacy

If `rejected` is empty, omit the Rejected section entirely.

When processing a single meeting (one URL or one result), skip the table and display the full meeting content directly.

### 3. Offer next actions

After the table, prompt the user with available actions:

```
Co dál?
- "vypiš 2,5" — zobrazí plný obsah vybraných meetingů v chatu
- "vypiš shrnutí 4,5" — zobrazí pouze stručné shrnutí vybraných meetingů
- "ulož 1,3,5" — uloží vybrané meetingy do souborů
- "ulož všechny" — uloží všechny meetingy do souborů
- "ulož přehled" — uloží souhrnnou tabulku do souboru
```

### 4. Display selected meetings in chat

When the user asks to display specific meetings ("vypiš 2,5"), show their full content in chat using the Meeting content format below. Do NOT show meetings the user didn't ask for.

### 5. Save to files

When the user asks to save meetings, write each selected meeting to a separate `.md` file.

**Folder structure:**

Before saving, determine the target folder using this priority:

1. **Check default location first:** Look for `meetings/` directory in the workspace root. If it exists and contains `YYYY-MM-DD/` subdirectories, use it immediately — no further detection needed, no confirmation needed.

2. **Search for candidate directories:** If the default doesn't exist, search the workspace for directories whose name semantically relates to meetings (e.g. `zápisy`, `diary`, `minutes`, `notes`, `schůzky`, `meetingy`, or similar). For each candidate, check whether it contains `YYYY-MM-DD/` subdirectories and optionally `_overview.md` files inside them.

3. **Evaluate confidence:**
   - **High confidence** — the candidate has `YYYY-MM-DD/` subdirectories AND `_overview.md` or `.md` files matching meeting name patterns inside them. Save immediately without asking.
   - **Low confidence** — the candidate folder name is ambiguous or it lacks the expected inner structure. Ask the user:
     > Našel jsem adresář `<name>/` — chceš ukládat sem, nebo použít výchozí `meetings/`, případně jiný?

4. **Fallback:** If no candidate is found, use `meetings/YYYY-MM-DD/` as the default location. Save immediately, no confirmation needed.

In all cases, the final path is `<base>/YYYY-MM-DD/` (derive date from the meeting's `start` field; if meetings span multiple dates, group files by date into separate folders).

**Files:**
- `_overview.md` — summary table (when "ulož přehled" or "ulož všechny"). If the file already exists, merge the new overview rows into the existing table (add new meetings, update existing ones by matching meeting name).
- One `.md` file per selected meeting

**Meeting file naming:**
- Filename = meeting name
- Sanitize: replace characters `/ \ : * ? " < > |` with `-`, trim whitespace
- Rejected meetings get the prefix `REJECTED ` before the name

Examples:
```
Product Hub Status Assessment.md
REJECTED Monday stand-up.md
```

---

## Meeting content format

Used for both chat display and saved files.

```markdown
# [Meeting name](https://...)

**Čas:** 09:00–10:00 CET
**Místo:** HRS E3
**Koordinátor:** Jane Doe
**Účastníci:** John Doe, Jane Smith

## Shrnutí přípravy

Brief summary of preparation (3–5 bullet points capturing key topics).

## Příprava

Full verbatim preparation text...

## Shrnutí zápisu

Brief summary of minutes (3–5 bullet points capturing key decisions/action items).

## Zápis

Full verbatim minutes text...
```

Rules:
- If `preparationText` is empty, omit both **Shrnutí přípravy** and **Příprava** sections
- If `minutesText` is empty, omit both **Shrnutí zápisu** and **Zápis** sections
- Only add the **Shrnutí** section when the corresponding text is longer than 500 characters. For short texts, show only the verbatim section without a summary.
- If URL is null (legacy), use plain text heading: `# Meeting name`
- For legacy meetings (`isLegacy: true`) add note: `> Legacy record – details unavailable`
- For rejected meetings (`category: "rejected"`) add note: `> Schůzka odmítnuta`
