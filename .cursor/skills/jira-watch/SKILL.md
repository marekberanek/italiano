---
name: jira-watch
description: Start or stop watching JIRA issues. List current watchers. Use when user wants to subscribe to issue notifications.
---

# JIRA Watch Manager

Manage issue watchers in Unicorn's JIRA instance.

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
jira-watch { issueKey: "AUTOMATION-412", action: "list" }
jira-watch { issueKey: "AUTOMATION-412", action: "watch" }
jira-watch { issueKey: "AUTOMATION-412", action: "unwatch" }
jira-watch { issueKey: "AUTOMATION-412", action: "watch", user: "John Doe" }
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | No | Full JIRA URL |
| `issueKey` | Yes* | Issue key (e.g., `AUTOMATION-412`) |
| `host` | No | JIRA host (default: `jira.unicorn.com`) |
| `action` | Yes | `watch`, `unwatch`, or `list` |
| `user` | No | User display name or username. Defaults to current user. |

*Either `url` or `issueKey` is required.

## Actions

### list

List all watchers on an issue.

```
jira-watch { issueKey: "PROJ-123", action: "list" }
```

Returns:
- `isWatching` - Whether current user is watching
- `watchCount` - Total number of watchers
- `watchers` - Array of watchers with name, displayName, email

### watch

Start watching an issue (current user).

```
jira-watch { issueKey: "PROJ-123", action: "watch" }
```

Add another user as watcher:

```
jira-watch { issueKey: "PROJ-123", action: "watch", user: "Jan Novak" }
```

### unwatch

Stop watching an issue (current user).

```
jira-watch { issueKey: "PROJ-123", action: "unwatch" }
```

Remove another user from watchers:

```
jira-watch { issueKey: "PROJ-123", action: "unwatch", user: "Jan Novak" }
```

## What Watchers Receive

When you watch an issue, you receive notifications for:
- Status changes
- New comments
- Field updates
- Attachments
- Work logged

## Workflow

1. Use `action: "list"` to see who's watching and if you're watching
2. Use `action: "watch"` to start receiving notifications
3. Use `action: "unwatch"` to stop notifications

## Notes

- User names are automatically resolved (display names work)
- Current user is used by default for watch/unwatch
- Watching is idempotent (watching twice has no effect)
