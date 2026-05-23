---
name: sls-read
description: List and load SLS issues from uu-sls-maing01. Use when the user wants to read, list, view, or inspect SLS tickets, issues, or support requests. Handles authentication via skilled-plus4u-mcp and supports filtering by state, type, priority, topic, and more. Includes a catalog of 112 SLS instances across the UU ecosystem — consult assets/sls-catalog.md to find the right SLS AWID and topic for any product.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# SLS Issue Reader

Read and list SLS issues from uu-sls-maing01.

## IMPORTANT: Finding the Right SLS

**Before calling the skill**, you MUST know the correct SLS AWID and (optionally) topic code for the product the user is asking about. If the user says "show me SLS issues for entity management" or "read uuOidc SLS", you need to resolve that to a concrete URL.

**How to resolve:** Read the file `assets/sls-catalog.md` (relative to this skill's directory). It contains:
- **112 SLS instances** organized by category (Infrastructure, Identity, Territory, DevTools, Content, Finance, etc.)
- A **Quick Reference** table mapping product names to SLS AWIDs and topic codes
- A **Full Catalog** with all AWIDs grouped by category

The catalog file path is: `{this_skill_directory}/assets/sls-catalog.md`

**Always read the catalog first** when the user asks about a product you don't see in the quick lookup below. The catalog has the complete mapping.

### Quick Lookup — Most Common SLS Instances

| Product | SLS AWID | Known Topics |
|---|---|---|
| **Contribution Hub** | `e0d7bd173d5a4638a6a5f540fcd34f7e` | `entitymanagement`, `uu_process_management`, `bpmEngine`, `uu_securitykit`, `uu_perfmon`, `uuPipeline`, `uuGitLab`, `uuNotifications`, `uuAppMessageBroker-Kafka`, `uuCloudg02automation`, `uuAppLogStore`, `eidm`, `uu_energy_common` |
| **uuCloud g02** | `33053d4f7504459f8ada5cf96500548a` | `appBoxRegistry`, `cdn`, `devKit`, `forwarder`, `gateway`, `logStore`, `monitoring`, `technologyPlatform`, `threatDetection`, `universe`, `uuCloudStandard`, `workloadHub`, `uuCloudg01` |
| **uuAppServer NodeJS** | `93748ca422c44cf5b2184a0e8981bb72` | `uuappobjectstore`, `uuappruntimestack`, `uuappworkspace`, `uuapptelemetry`, `uuappmessagebroker`, `uuappoidc`, `uuappstatus`, `uuapprepresentation`, `uuappauditlog`, `uuappcache` |
| **uuManagementKit** | `9746cde8c40548e08bc476ab2615a87c` | `meeting`, `Email`, `allTypes` |
| **uuBusinessTerritory** | `4af63c9bf8f3486f84e894c4de740e87` | `nodeJs` |
| **uuMyTerritory** | `db486d76a8ba432fbca1821d6a7578c2` | `uuMyTerritorynewstructure` |
| **uuOidc** | `9df53aba7b4e4eef92073740ae522220` | — |
| **uuIdentityManagement** | `7760ddd97ba34835b8504225eb3ac453` | — |
| **uuConsole** | `805720ebdd98478c833af6fc59d421f5` | — |
| **uuBEM** | `efc9412a1e0d4ff4bb46edc6bf4455bf` | — |
| **uuScriptEngine** | `049eaa6dc80f4723b33dc6a3e9e2ecdb` | — |
| **uuBookKit** | `d127521164ef4a689e37fe6968d1c7ab` | — |
| **uuWebKit** | `21c3be65d70e49dcae91ce6c270a2313` | — |
| **uuAppDevKit** | `f34e4c65a9c84ea0baf50017c43fc97d` | — |
| **uu5/HumanInterface** | `e80acdfaeb5d46748a04cfc7c10fdf4e` | — |
| **uuEnelane** | `f7d9caed0c054382a366f85148809108` | — |

For the full list of 112 SLS instances (organized by category), see `assets/sls-catalog.md`.

## Prerequisites

**Authentication:** The MCP server handles authentication automatically. If no valid token exists,
a browser window will open for interactive login. No need to call the `login` tool manually.

## Usage via MCP

Use the `skilled-plus4u-mcp` MCP server to execute this skill:

```
executeSkill({ scriptPath: "<absolute path to sls-read/skill.js>", params: { url: "SLS_URL", ... } })
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | SLS URL (e.g., `https://uuapp.plus4u.net/uu-sls-maing01/{awid}/...`) |
| `issueId` | No | Load a single issue by ID instead of listing |
| `topicCode` | No | Filter by topic code (e.g., `entitymanagement`, `gateway`). Maps to `filterMap.topicCode` in the API. |
| `states` | No | Filter by states array |
| `types` | No | Filter by types array |
| `priorities` | No | Filter by priorities array |
| `slsProduct` | No | Filter by product code |
| `slsComponent` | No | Filter by component code |
| `assignedTo` | No | Filter by assigned user |
| `reportedBy` | No | Filter by reporter |
| `pageSize` | No | Results per page (default: 100, max: 10000) |
| `pageIndex` | No | Page index (0-based) |
| `sortBy` | No | Sort field (e.g., "dateCreated desc") |

### Available States

- `initial` - Initial state
- `sent` - Sent to support
- `inProgress` - Being worked on
- `waitingForInformation` - Waiting for info from reporter
- `reactivated` - Reactivated after waiting
- `resolved` - Resolved
- `rejected` - Rejected
- `closed` - Closed

### Available Types

- `request` - Service request
- `error` - Error report

### Available Priorities

- `low`
- `normal`
- `high`
- `critical`

## Examples

### Read SLS issues for uuOidc

```
executeSkill({
  scriptPath: "<absolute path to sls-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-sls-maing01/9df53aba7b4e4eef92073740ae522220/issue/list",
    pageSize: 50
  }
})
```

### List open Entity Management issues (Contribution Hub, topic filter)

```
executeSkill({
  scriptPath: "<absolute path to sls-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-sls-maing01/e0d7bd173d5a4638a6a5f540fcd34f7e/issue/list",
    topicCode: "entitymanagement",
    states: ["sent", "inProgress"],
    pageSize: 100
  }
})
```

### List uuCloud Gateway issues

```
executeSkill({
  scriptPath: "<absolute path to sls-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-sls-maing01/33053d4f7504459f8ada5cf96500548a/issue/list",
    topicCode: "gateway",
    states: ["sent", "inProgress", "waitingForInformation"]
  }
})
```

### List high-priority uuAppServer NodeJS ObjectStore issues

```
executeSkill({
  scriptPath: "<absolute path to sls-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-sls-maing01/93748ca422c44cf5b2184a0e8981bb72/issue/list",
    topicCode: "uuappobjectstore",
    priorities: ["high", "critical"]
  }
})
```

### List all open issues across all topics in uuBusinessTerritory SLS

```
executeSkill({
  scriptPath: "<absolute path to sls-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-sls-maing01/4af63c9bf8f3486f84e894c4de740e87/issue/list",
    states: ["sent", "inProgress", "waitingForInformation", "reactivated", "initial"],
    pageSize: 200
  }
})
```

### Load a single issue by ID

```
executeSkill({
  scriptPath: "<absolute path to sls-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-sls-maing01/e0d7bd173d5a4638a6a5f540fcd34f7e/issue/load",
    issueId: "65abc123def456..."
  }
})
```

### List uuManagementKit meeting-related issues

```
executeSkill({
  scriptPath: "<absolute path to sls-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-sls-maing01/9746cde8c40548e08bc476ab2615a87c/issue/list",
    topicCode: "meeting",
    pageSize: 50
  }
})
```

## Response Structure

### List Response

Each issue in `itemList` contains:
- `name` - Issue subject/title
- `topicCode` - The topic this issue belongs to (e.g., `entitymanagement`, `gateway`)
- `state` - Current state (`sent`, `inProgress`, `solved`, `duplicated`, `transferred`, etc.)
- `priority` - Priority level (`"1"` = critical, `"2"` = high, `"3"` = normal, `"?"` = unset)
- `severity` - Severity (`"A"`, `"B"`, `"C"`, `"?"`)
- `authorTitle` / `authorCode` - Who reported the issue
- `solver` / `solverName` - Who is assigned
- `tagList` - Freeform tags for categorization
- `dateCreated`, `dateModified` - Timestamps

```json
{
  "itemList": [
    {
      "name": "ObjectStore query timeout on large collections",
      "topicCode": "uuappobjectstore",
      "state": "inProgress",
      "priority": "2",
      "severity": "B",
      "authorTitle": "John Doe",
      "solver": "12345-1",
      "solverName": "Jane Smith",
      "tagList": ["bug", "performance"],
      "dateCreated": "2026-01-15T10:30:00Z"
    }
  ],
  "pageInfo": {
    "pageIndex": 0,
    "pageSize": 100,
    "total": 42
  }
}
```

### Single Issue Response

Contains full issue details including `desc` (description in UU5 string format), `attachmentList`, `commentPointUri`, and all fields from the list response.
