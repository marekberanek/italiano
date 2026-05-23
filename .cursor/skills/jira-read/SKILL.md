---
name: jira-read
description: Read JIRA issues from jira.unicorn.com using Personal Access Token. Returns formatted summaries or full details.
---

# JIRA Issue Reader

Read JIRA issues from Unicorn's JIRA instance.

## Setup

Add `JIRA_PAT` to your MCP config (`~/.cursor/mcp.json`):

```json
{
  "env": {
    "LOG_LEVEL": "info",
    "JIRA_PAT": "your-personal-access-token"
  }
}
```

## Usage

```
jira-read { issueKey: "AUTOMATION-412" }
jira-read { issueKey: "AUTOMATION-412", summary: true }
jira-read { jql: "project = AUTOMATION AND status = Open" }
jira-read { jql: "project = AUTOMATION", summary: false }
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `url` | Full JIRA URL |
| `issueKey` | Issue key (e.g., `AUTOMATION-412`) |
| `jql` | JQL query for searching |
| `host` | JIRA host (default: `jira.unicorn.com`) |
| `maxResults` | Max results for JQL (default: 50) |
| `summary` | Return formatted summary (default: true for JQL, false for single issue) |

## Summary Response (default for JQL)

For each issue, returns:
- `key`, `url`, `summary` (name)
- `status`, `statusCategory`
- `assignee`
- `timeTracking`: logged, estimated, progress %
- `labels`, `customFields`
- `linkedIssues`: type, key, summary
- `recentComments`: last 3 comments with author, date, excerpt
- `priority`, `created`, `updated`

## Full Response (summary: false)

- `key`, `summary`, `description`
- `status`, `priority`, `issueType`
- `assignee`, `reporter`, `creator`
- `timeTracking` (estimate, spent, remaining)
- `labels`, `customFields`
- `issueLinks`, `parent`, `subtasks`
- `comments`, `worklog`, `attachments`
