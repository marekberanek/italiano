---
name: find-person
description: Look up a person in Plus4U People (uu-plus4upeople-maing01) by name or uuIdentity. Returns itemList with uuIdentity, name, p4u_id, mtMainBaseUri, mtDwBaseUri. Use whenever a uuIdentity is needed (bookkit authors, mngkit recipients, meeting invites, etc.).
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Find Person

Resolve a person's uuIdentity and URIs by calling `findPerson` on the shared Plus4U People registry (`uu-plus4upeople-maing01/56ac93ddb0034de8b8e4f4b829ff7d0f`).

## Prerequisites

Call `login` on `skilled-plus4u-mcp` first (idempotent).

## Usage

```
executeSkill({ scriptPath: "<absolute path to find-person/skill.js>", params: { name: "Tomáš Trtík" } })
executeSkill({ scriptPath: "<absolute path to find-person/skill.js>", params: { uuIdentity: "2339-1" } })
```

### Parameters

| Parameter     | Required | Description |
|---------------|----------|-------------|
| `name`        | one of   | Full or partial name (fuzzy match) |
| `uuIdentity`  | one of   | Exact uuIdentity (e.g., `2339-1`) |
| `privateOnly` | No       | When searching by name, default `false` = company-wide. Set `true` to restrict to private contacts. |

Exactly one of `name` or `uuIdentity` must be provided. If both are supplied `uuIdentity` wins. The service does **not** accept an `email` parameter — resolve by name when only the email is known.

### Response

```json
{
  "itemList": [
    {
      "name": "Tomáš Trtík",
      "uuIdentity": "2339-1",
      "p4u_id": "2339-1",
      "mtMainBaseUri": "https://uuapp.plus4u.net/uu-myterritory-maing01/...",
      "mtDwBaseUri": "https://uuapp.plus4u.net/uu-myterritory-dwg01/..."
    }
  ],
  "uuAppErrorMap": {}
}
```

Multiple matches are possible on name search — disambiguate on name + any extra fields.

## Typical uses

- Resolve uuIdentity for BookKit `setAboutBook` author list
- Resolve uuIdentity for ManagementKit meeting participants, ECC invites
- Resolve dwg01 URI (via `mtDwBaseUri`) for calendar lookups
- Batch-resolve multiple people via `batchExecuteSkill`

## Implementation

Implemented by `shared/plus4upeople.js`. The `calendar` skill re-uses the same helper for dwg01 URI lookup — do not duplicate the logic.
