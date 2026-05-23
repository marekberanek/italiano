---
name: calendar-accept
description: Accept or reject a meeting from dwg01. Uses sourceAppBaseUri, activityRefId, and elementaryActivity from calendar skill output.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Calendar Accept - Accept/Reject DWG01 Meetings

Accept or reject meetings from the Digital Workspace (dwg01).

## Prerequisites

**Authentication:** The MCP server handles authentication automatically.

**Calendar data:** First use the `calendar` skill to list meetings and get the required IDs.

## Usage via MCP

```
executeSkill({ scriptPath: "<absolute path to calendar-accept/skill.js>", params: { sourceAppBaseUri: "...", activityRefId: "...", elementaryActivity: "...", state: "accepted" } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `sourceAppBaseUri` | Yes | Base URI of the source business territory (from calendar output) |
| `activityRefId` | Yes | Activity reference ID (from calendar output) |
| `elementaryActivity` | Yes | Elementary activity ID (from calendar output) |
| `state` | Yes | Target state: `accepted`, `attention`, or `warning`. |
| `note` | No | Optional note/comment to attach when changing the meeting state (stored as `desc` on the activity). |

### Available States

| State | Meaning |
|-------|---------|
| `accepted` | Zúčastním se (will attend) |
| `attention` | Nezúčastním se (will not attend) |
| `warning` | Upozornění (warning) |

### Examples

Accept a meeting:
```
executeSkill({ scriptPath: "<absolute path to calendar-accept/skill.js>", params: { sourceAppBaseUri: "https://uuapp.plus4u.net/uu-businessterritory-maing01/{awid}", activityRefId: "abc123", elementaryActivity: "def456" } })
```

Decline a meeting (won't attend):
```
executeSkill({ scriptPath: "<absolute path to calendar-accept/skill.js>", params: { sourceAppBaseUri: "...", activityRefId: "...", elementaryActivity: "...", state: "attention" } })
```

Decline with a note:
```
executeSkill({ scriptPath: "<absolute path to calendar-accept/skill.js>", params: { sourceAppBaseUri: "...", activityRefId: "...", elementaryActivity: "...", state: "attention", note: "Překryv s CSV Konzultace" } })
```

## How It Works

1. Takes the meeting reference IDs from the `calendar` skill output
2. Calls `POST {sourceAppBaseUri}/uuArtifactIfc/activity/elementary/setState` with the activity IDs and target state
