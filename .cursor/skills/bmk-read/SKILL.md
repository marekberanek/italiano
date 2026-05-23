---
name: bmk-read
description: Read data from uuApp Business Model Kit (uu-uuappbusinessmodelkit-maing01) — list and load products, processes, business use cases, business scenarios, and business actors. Use when the user asks to read, list, view, or inspect business model entities, or needs BMK data for business discipline creation, product specification, or process modeling.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Business Model Kit Reader

Read and list entities from uuApp Business Model Kit (BMK).

## Prerequisites

**Authentication:** The MCP server handles authentication automatically. If no valid token exists,
a browser window will open for interactive login.

## Usage via MCP

```
executeSkill({ scriptPath: "<absolute path to bmk-read/skill.js>", params: { url: "BMK_URL" } })
```

**Batch reading** (multiple calls in parallel):
```
batchExecuteSkill({
  scriptPath: "<absolute path to bmk-read/skill.js>",
  paramsList: [
    { url: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}/product/list" },
    { url: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}/process/list" }
  ]
})
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes* | Full BMK URL (e.g., `.../product/list`). Extracts baseUri and command. |
| `baseUri` | Yes* | BMK base URI. Use with `command`. Alternative to `url`. |
| `command` | No | Command path (e.g., `product/list`). Extracted from URL if not provided. |
| `id` | No | Entity ID for `{entity}/load` commands. |
| `pageSize` | No | Results per page (default: 1000). |
| `pageIndex` | No | Page index (0-based). |

*Either `url` or `baseUri` is required.

## Available Commands

### List Commands

| Command | Description |
|---------|-------------|
| `product/list` | List all products |
| `process/list` | List all processes |
| `businessUseCase/list` | List all business use cases |
| `businessScenario/list` | List all business scenarios |
| `businessActor/list` | List all business actors |

### Load Commands (single entity by ID)

| Command | Description |
|---------|-------------|
| `product/load` | Load a single product (requires `id`) |
| `process/load` | Load a single process (requires `id`) |
| `businessUseCase/load` | Load a single business use case (requires `id`) |
| `businessActor/load` | Load a single business actor (requires `id`) |

**Note:** `{entity}/get` URLs are frontend page routes and will NOT return JSON. Always use `{entity}/list` or `{entity}/load`.

## Examples

### List all products

```
executeSkill({
  scriptPath: "<absolute path to bmk-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/84dfc35bee8260217ada19b6ffa9362b/product/list"
  }
})
```

### List processes with pagination

```
executeSkill({
  scriptPath: "<absolute path to bmk-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}/process/list",
    pageSize: 50,
    pageIndex: 0
  }
})
```

### Load a single product by ID

```
executeSkill({
  scriptPath: "<absolute path to bmk-read/skill.js>",
  params: {
    url: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}/product/load",
    id: "690a14dfaa309ec0bd11f706"
  }
})
```

### Using baseUri + command

```
executeSkill({
  scriptPath: "<absolute path to bmk-read/skill.js>",
  params: {
    baseUri: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/84dfc35bee8260217ada19b6ffa9362b",
    command: "businessUseCase/list"
  }
})
```

### Load all entity types in parallel

```
batchExecuteSkill({
  scriptPath: "<absolute path to bmk-read/skill.js>",
  paramsList: [
    { baseUri: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}", command: "product/list" },
    { baseUri: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}", command: "process/list" },
    { baseUri: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}", command: "businessUseCase/list" },
    { baseUri: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}", command: "businessActor/list" },
    { baseUri: "https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}", command: "businessScenario/list" }
  ]
})
```

## Response Structure

### List Response

```json
{
  "itemList": [
    {
      "name": { "en": "Entity Name" },
      "desc": "Description (may contain UU5 string)",
      "state": "inProgress",
      "id": "690a14dfaa309ec0bd11f706",
      "pageCode": "79102683",
      "code": "6cd3f9fbd516da9c7fa42664a647b382",
      "artifactId": "690a14df72fb104c7f8078dc",
      "uuBmlIcon": "uubmlicon-uutsmetamodel-ts-dimension",
      "uuPClassification": "standard",
      "productFlowClassification": "finalProduct",
      "sys": { "cts": "...", "mts": "...", "rev": 4 }
    }
  ],
  "pageInfo": {
    "pageIndex": 0,
    "pageSize": 1000,
    "total": 79
  },
  "uuAppBusinessModel": {
    "name": { "en": "BMK Name" },
    "bookUri": "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}",
    "btBaseUri": "https://uuapp.plus4u.net/uu-businessterritory-maing01/{awid}",
    "productsPageCode": "Products",
    "processesPageCode": "Processes",
    "businessUseCasesPageCode": "BusinessUseCases",
    "businessActorsPageCode": "BusinessActors",
    "businessScenariosPageCode": "BusinessScenarios",
    "disciplinePageCode": "uuBusinessDiscipline"
  }
}
```

### Key Fields per Entity Type

**Products** — `name`, `desc`, `state`, `pageCode`, `productFlowClassification` (finalProduct/intermediateProduct), `uuPClassification`, `uuBmlIcon`

**Processes** — `name`, `desc`, `state`, `pageCode`, `isMain`, `parentProcessId`

**Business Use Cases** — `name`, `desc`, `state`, `pageCode`, `priority` (A/B/C), `groupId`

**Business Actors** — `name`, `desc`, `state`, `pageCode`, `groupId`

**Business Scenarios** — `name`, `desc`, `state`, `pageCode`

### Load Response (single entity)

Same fields as list item, plus:
- `artifactEnvironmentData` — resolved references (unit name, responsible role name, folder name)
- `uuAppBusinessModel` — full business model metadata

## Tips

- The `uuAppBusinessModel` object in every response contains useful metadata: `bookUri` for the linked BookKit, `btBaseUri` for the Business Territory, and page codes for each section.
- Entity `pageCode` can be used with `bookkit-read` skill to read the entity's BookKit documentation page.
- Entity `id` can be used with `{entity}/load` to get full details including resolved environment data.
- For large BMKs, use `pageSize` and `pageIndex` to paginate results.
