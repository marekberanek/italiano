---
name: jira-update
description: Update JIRA issue fields (description, assignee, labels, priority, links). Use when user wants to modify a JIRA ticket.
---

# JIRA Issue Updater

Update JIRA issue fields in Unicorn's JIRA instance.

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

**CRITICAL: The agent MUST follow this workflow for ALL updates:**

1. **First call with `dryRun: true`** - Get proposed changes without applying
2. **Show proposed content to user** - Display the `proposedChanges` in a readable format
3. **Ask for user confirmation** - Wait for explicit approval
4. **Only then call with `dryRun: false`** - Apply the confirmed changes

**NEVER skip the dry run step. NEVER apply changes without user confirmation.**

### Example Workflow

```javascript
// Step 1: Dry run to preview changes
jira-update { 
  issueKey: "PROJ-123", 
  description: "New description",
  dryRun: true  // ALWAYS start with dry run
}

// Step 2: Show user the proposedChanges from response
// Step 3: Ask "Do you want to apply these changes?"
// Step 4: If confirmed, execute without dryRun
jira-update { 
  issueKey: "PROJ-123", 
  description: "New description",
  dryRun: false  // Only after confirmation
}
```

## Usage

```
jira-update { issueKey: "AUTOMATION-412", assignee: "John Doe", dryRun: true }
jira-update { issueKey: "AUTOMATION-412", description: "New description", dryRun: true }
jira-update { issueKey: "AUTOMATION-412", labels: ["bug", "priority"], dryRun: true }
jira-update { issueKey: "AUTOMATION-412", addLabels: ["new-label"], dryRun: true }
jira-update { issueKey: "AUTOMATION-412", removeLabels: ["old-label"], dryRun: true }
jira-update { issueKey: "AUTOMATION-412", priority: "High", dryRun: true }
jira-update { issueKey: "AUTOMATION-412", linkTo: "AUTOMATION-100", linkType: "Blocks", dryRun: true }
jira-update { issueKey: "AUTOMATION-412", unlinkId: "12345", dryRun: true }
jira-update { listLinkTypes: true }
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `url` | Full JIRA URL |
| `issueKey` | Issue key (e.g., `AUTOMATION-412`) |
| `host` | JIRA host (default: `jira.unicorn.com`) |
| `description` | New description (JIRA wiki markup) |
| `assignee` | User display name or username (null to unassign) |
| `labels` | Labels array (replaces all existing labels) |
| `addLabels` | Labels to add (preserves existing) |
| `removeLabels` | Labels to remove |
| `priority` | Priority name (High, Medium, Low, etc.) |
| `summary` | New issue title |
| `linkTo` | Issue key to link to |
| `linkType` | Link type (Blocks, relates to, is blocked by, etc.) |
| `unlinkId` | Link ID to remove |
| `listLinkTypes` | List available link types |
| `fields` | Alternative: wrap all updates in a fields object |
| `dryRun` | **IMPORTANT**: If true, returns proposed changes without applying |

## Alternative Parameter Format

Fields can be passed directly OR wrapped in a `fields` object:

```javascript
// Direct (preferred)
jira-update { issueKey: "PROJ-123", description: "text", dryRun: true }

// Wrapped in fields object (also works)
jira-update { issueKey: "PROJ-123", fields: { description: "text" }, dryRun: true }
```

## JIRA Wiki Markup

For description field, use JIRA wiki markup:

```
h1. Heading 1
h2. Heading 2

*bold* _italic_ -strikethrough-
[link text|http://example.com]

* bullet list
# numbered list

||Header 1||Header 2||
|Cell 1|Cell 2|

{code:java}
code block
{code}

{quote}
quoted text
{quote}

{panel:title=Title|borderStyle=solid}
Panel content
{panel}

{color:green}colored text{color}
```

## Examples

### Update description with confirmation

```javascript
// Step 1: Preview
jira-update { issueKey: "PROJ-123", description: "h2. Overview\n\n*Bold text*", dryRun: true }
// Response shows proposedChanges with the description
// Step 2: Show to user and ask for confirmation
// Step 3: If approved:
jira-update { issueKey: "PROJ-123", description: "h2. Overview\n\n*Bold text*", dryRun: false }
```

### Update multiple fields

```javascript
jira-update { 
  issueKey: "PROJ-123", 
  priority: "High",
  addLabels: ["urgent"],
  description: "Updated description with *formatting*",
  dryRun: true
}
```

### Link issues

```javascript
jira-update { 
  issueKey: "PROJ-123", 
  linkTo: "PROJ-100", 
  linkType: "Blocks",
  dryRun: true
}
```
