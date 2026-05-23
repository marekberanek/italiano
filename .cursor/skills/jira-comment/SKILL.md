---
name: jira-comment
description: Add, update, or delete comments on JIRA issues. Use when user wants to comment on a JIRA ticket.
---

# JIRA Comment Manager

Manage comments on JIRA issues in Unicorn's JIRA instance.

## Setup

Requires `JIRA_PAT` in your MCP config (`~/.cursor/mcp.json`):

```json
{
  "env": {
    "JIRA_PAT": "your-personal-access-token"
  }
}
```

## MANDATORY: Confirmation Workflow

**CRITICAL: The agent MUST follow this workflow for add/update/delete actions:**

1. **First call with `dryRun: true`** - Get proposed content without applying
2. **Show proposed content to user** - Display the `proposedComment` or action in a readable format
3. **Ask for user confirmation** - Wait for explicit approval
4. **Only then call with `dryRun: false`** - Apply the confirmed action

**NEVER skip the dry run step. NEVER add/update/delete without user confirmation.**

### Example Workflow

```javascript
// Step 1: Dry run to preview comment
jira-comment { 
  issueKey: "PROJ-123", 
  action: "add",
  body: "h2. Summary\n\nComment text with *formatting*",
  dryRun: true  // ALWAYS start with dry run
}

// Step 2: Show user the proposedComment from response
// Step 3: Ask "Do you want to add this comment?"
// Step 4: If confirmed, execute without dryRun
jira-comment { 
  issueKey: "PROJ-123", 
  action: "add",
  body: "h2. Summary\n\nComment text with *formatting*",
  dryRun: false  // Only after confirmation
}
```

## Usage

```
jira-comment { issueKey: "AUTOMATION-412", action: "list" }
jira-comment { issueKey: "AUTOMATION-412", action: "add", body: "New comment", dryRun: true }
jira-comment { issueKey: "AUTOMATION-412", action: "update", commentId: "12345", body: "Updated text", dryRun: true }
jira-comment { issueKey: "AUTOMATION-412", action: "delete", commentId: "12345", dryRun: true }
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | No | Full JIRA URL |
| `issueKey` | Yes* | Issue key (e.g., `AUTOMATION-412`) |
| `host` | No | JIRA host (default: `jira.unicorn.com`) |
| `action` | Yes | `add`, `update`, `delete`, or `list` |
| `body` | For add/update | Comment text (JIRA wiki markup) |
| `commentId` | For update/delete | Comment ID from list action |
| `dryRun` | For add/update/delete | **IMPORTANT**: Preview changes without applying |

*Either `url` or `issueKey` is required.

## Actions

### list

List all comments on an issue. No confirmation needed.

```
jira-comment { issueKey: "PROJ-123", action: "list" }
```

Returns array of comments with id, author, body, created, updated.

### add

Add a new comment.

```javascript
// Step 1: Preview
jira-comment { 
  issueKey: "PROJ-123", 
  action: "add", 
  body: "This is my comment with *bold* and _italic_",
  dryRun: true
}
// Step 2: Show proposedComment to user
// Step 3: Ask for confirmation
// Step 4: Execute with dryRun: false
```

### update

Update an existing comment (get commentId from list action).

```javascript
// Step 1: Preview
jira-comment { 
  issueKey: "PROJ-123", 
  action: "update", 
  commentId: "12345", 
  body: "Updated comment text",
  dryRun: true
}
// Step 2: Show proposedBody to user
// Step 3: Ask for confirmation
// Step 4: Execute with dryRun: false
```

### delete

Delete a comment.

```javascript
// Step 1: Preview
jira-comment { 
  issueKey: "PROJ-123", 
  action: "delete", 
  commentId: "12345",
  dryRun: true
}
// Step 2: Confirm deletion with user
// Step 3: Execute with dryRun: false
```

## JIRA Wiki Markup

Comments support JIRA wiki markup:

```
h1. Heading 1
h2. Heading 2

*bold* _italic_ -strikethrough-
[link text|http://example.com]
{color:red}colored text{color}
{quote}quoted text{quote}
{code}code block{code}

||Header 1||Header 2||
|Cell 1|Cell 2|

{panel:title=Title|borderStyle=solid}
Panel content
{panel}

Mentioning users:
[~username] or [~accountId:123456]
```

## Workflow

1. Use `action: "list"` to see existing comments and get IDs
2. Use `action: "add"` with `dryRun: true` to preview new comments
3. Show preview to user and get confirmation
4. Execute with `dryRun: false` after confirmation
