---
name: jira-worklog
description: Log work time on JIRA issues. Add, update, delete, or list worklog entries. Use when user wants to log work or track time.
---

# JIRA Worklog Manager

Log and manage work time entries on JIRA issues.

## Setup

Requires `JIRA_PAT` in your MCP config (`~/.cursor/mcp.json`):

```json
{
  "env": {
    "JIRA_PAT": "your-personal-access-token"
  }
}
```

## Usage

```
jira-worklog { issueKey: "AUTOMATION-412", action: "list" }
jira-worklog { issueKey: "AUTOMATION-412", action: "add", timeSpent: "2h" }
jira-worklog { issueKey: "AUTOMATION-412", action: "add", timeSpent: "4h", comment: "Implementation" }
jira-worklog { issueKey: "AUTOMATION-412", action: "update", worklogId: "12345", timeSpent: "3h" }
jira-worklog { issueKey: "AUTOMATION-412", action: "delete", worklogId: "12345" }
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | No | Full JIRA URL |
| `issueKey` | Yes* | Issue key (e.g., `AUTOMATION-412`) |
| `host` | No | JIRA host (default: `jira.unicorn.com`) |
| `action` | Yes | `add`, `update`, `delete`, or `list` |
| `timeSpent` | For add | Time in JIRA format (see below) |
| `started` | No | Start datetime (ISO 8601). Defaults to now. |
| `comment` | No | Work description |
| `worklogId` | For update/delete | Worklog ID from list action |

*Either `url` or `issueKey` is required.

## Time Format

JIRA time notation:
- `30m` - 30 minutes
- `2h` - 2 hours
- `1d` - 1 day (8 hours)
- `1w` - 1 week (5 days)
- `1d 4h` - 1 day and 4 hours
- `2h 30m` - 2 hours and 30 minutes

## Actions

### list

List all worklog entries on an issue.

```
jira-worklog { issueKey: "PROJ-123", action: "list" }
```

Returns array of worklogs with id, author, timeSpent, timeSpentSeconds, started, comment.

### add

Add a new worklog entry.

```
jira-worklog { 
  issueKey: "PROJ-123", 
  action: "add", 
  timeSpent: "4h",
  comment: "Backend implementation"
}
```

With specific start time:

```
jira-worklog { 
  issueKey: "PROJ-123", 
  action: "add", 
  timeSpent: "2h",
  started: "2026-02-07T09:00:00.000+0100",
  comment: "Morning work"
}
```

### update

Update an existing worklog entry.

```
jira-worklog { 
  issueKey: "PROJ-123", 
  action: "update", 
  worklogId: "12345",
  timeSpent: "3h",
  comment: "Updated description"
}
```

### delete

Delete a worklog entry.

```
jira-worklog { 
  issueKey: "PROJ-123", 
  action: "delete", 
  worklogId: "12345" 
}
```

## Workflow

1. Use `action: "list"` to see existing worklogs and get IDs
2. Use `action: "add"` to log new work time
3. Use `action: "update"` with worklogId to correct entries
4. Use `action: "delete"` with worklogId to remove entries

## Safety Notes

- List worklogs first to see current time tracking
- Verify timeSpent format before adding
- Ask for user confirmation before deleting worklogs
