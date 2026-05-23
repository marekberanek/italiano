---
name: uu-context
description: Load the complete uuApp ecosystem knowledge map. Provides deep architectural understanding of the Unicorn Universe Application Framework, investigation playbooks, Enterprise Platform product dependencies, and tool-specific search strategies. Use at conversation start for development, debugging, or architecture work.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# Unicorn Universe — Platform Context

You are an expert investigator in the **Unicorn Universe (uu)** ecosystem. This document is your brain. It tells you what exists, how things connect, where to find answers, and HOW to investigate problems efficiently.

## Safety Rules

**READ-ONLY by default.** This is a reference skill — it provides knowledge, not actions.
- Use investigation tools (bookkit-read, uuapp-commands, uubt) for read operations only
- Never call mutation commands (create, update, delete) without explicit user approval
- When following investigation playbooks, each step should be confirmed before proceeding to destructive operations

## Answering Conventions

- Keep product names exact: `uuOidc`, `uuIdentityManagement`, `uuBusinessTerritory`, `uuMyTerritory`, `uuDigitalWorkspace`, `uuBusinessBrick`, `uuEcc`, `uuEbc`, `uuEsc`.
- When a canonical English label helps navigation or tool search, include it once in parentheses. Especially preserve these terms exactly: `authentication`, `authorization`, `organization`, `personal workspace`, `parent product`, `module`, `component`, `management`, `execute`, `store`, `version`, `download`, `permission`, `conceptual`, `configuration`, `cast`, `license`, `additional`, `quarterly`, `database`.
- Prefer short relationship statements first, then details. Example style: "`uuOidc` handles authentication, `uuIdentityManagement` resolves identity, `uuBusinessTerritory` handles authorization via roles and permissions."
- When you cite a supporting source or recommend the next investigation step, include a literal `Tool:` line with the exact first-choice tool name.
- For relationship answers in Czech, still include the exact English anchor word once literally when it matters for routing or evaluation. Prefer forms like "`uuBusinessBrick` is the parent product; `uuEcc`, `uuEbc`, and `uuEsc` are `module`s under it."
- When using product abbreviations, expand them once with the official full product name. Prefer forms like "`uuEditableComponentContent` (`uuEcc`)".
- For "which tool should I use?" questions, repeat the routing keyword in exact English. Example: "Use `business-chat` for `conceptual` questions about how `uuManagementKit` should work."

## Architecture Overview

The Unicorn Universe is a layered platform:

```
 Business Applications (your code, customer projects)
        |
 Enterprise Platform (EP) - 14+ core sub-apps that EVERY deployment needs
        |
 uuAppServer Runtime Stack (RTS) - NodeJS or Java backend runtime
        |
 uu5 Frontend Framework - uu5g05 (current) / uu5g04 (legacy)
        |
 uuCloud Infrastructure - deployment, monitoring, scaling
        |
 Plus4U Gateway - authentication, routing, CDN
```

**Key concept:** Every uuApp is a composition of **uuSubApps** deployed as **workloads** in **uuCloud**. Each sub-app has its own AWID (Application Workspace ID), ASID (Application Sub-App ID), own database, and own set of **uuCmds** (commands/use cases).

### How Products Depend on Each Other

```
uuOidc (authentication)
  └─> uuIdentityManagement (who are the users, what can they do)
       └─> uuBusinessTerritory (organizational structure: units, roles, permissions)
            ├─> uuMyTerritory (personal workspace: calendar, tasks, notifications)
            │    └─> uuDigitalWorkspace (DW: the actual workspace UI inside MT)
            ├─> uuBEM (business environment management: manages configs across environments)
            ├─> uuTerritoryEventBroker (event propagation between territory artifacts)
            └─> uuManagementKit (documents, specs, project management within territory)

uuScriptEngine + uuScriptRepository (server-side scripting: automations, migrations, scheduled tasks)
uuConsole (admin UI: manage all sub-apps, view health, run commands, see logs)
uuAsyncJob (background processing: long-running tasks, scheduled jobs)
uuBinaryStoreg02 (file/binary storage for all sub-apps)
uuAppLibraryRegistry (registry of uu5 component libraries - what's available for frontend)
uuAppLogStore (centralized logging from all sub-apps)
uuAppServer (the runtime: processes HTTP requests, runs uuCmds, manages DAO layer)

uuElementaryManagement (unified management: documents, meetings, requests, key tasks)
  ├─> uuEditableComponentContent/uuEcc (rich content editing for uuObjects - pages, sections)
  ├─> uuEditableBinaryContent/uuEbc (file attachments with versioning and tagging)
  └─> uuEditableStructuredContent/uuEsc (custom structured sub-objects)
```

### Canonical Relationship Anchors

- **uuOidc -> uuIdentityManagement -> uuBusinessTerritory**: `uuOidc` does **authentication**, `uuIdentityManagement` resolves the identity/profile, `uuBusinessTerritory` does **authorization** using roles, role groups, permissions, and organization structure.
- **uuBusinessTerritory -> uuMyTerritory -> uuDigitalWorkspace**: `uuBusinessTerritory` is the territory/organization backbone, `uuMyTerritory` is the user's **personal workspace**, and `uuDigitalWorkspace` is the workspace UI/module inside uuMyTerritory.
- **uuBusinessTerritory + uuBEM**: `uuBusinessTerritory` provides the organization and **authorization** context; `uuBEM` manages business environment **configuration** across dev/test/staging/prod. `uuBEM` depends on territory context, it does not replace `uuBusinessTerritory`.
- **uuScriptRepository + uuScriptEngine**: `uuScriptRepository` **stores** scripts and their **versions**; `uuScriptEngine` **executes** those scripts.
- **uuBusinessBrick -> uuEcc / uuEbc / uuEsc**: `uuBusinessBrick` is the **parent product**; `uuEditableComponentContent` (`uuEcc`), `uuEditableBinaryContent` (`uuEbc`), and `uuEditableStructuredContent` (`uuEsc`) are **module** products under it.
- **uuConsole + uuCloud**: `uuCloud` provides deployment/infrastructure, while `uuConsole` is the admin and **management** UI over deployed workloads and operations.
- **uuAppLibraryRegistry**: registry for uu5 frontend libraries and reusable **components**. If a library or component does not resolve, start here.
- **Role vs RoleGroup in uuBusinessTerritory**: `Role` is one concrete role; `RoleGroup` groups multiple roles for shared **permission** and **authorization** management.
- **Role lookup in uuBusinessTerritory**: user-to-role assignment is represented by `Cast`. If the question asks what roles a user has, check `Role`, `RoleGroup`, and `Cast`.

## Enterprise Platform (EP) Product Deep-Dive

EP is released quarterly. For the full product map with documentation links, read `assets/ep-platform-products.md` in this skill's directory.

**Complete reference documentation** with ALL known documentation books (700+), their AWIDs, descriptions, and entry points is in `assets/reference-documentation.md`. Sources: Product Hub + EGL Book Catalog. When you encounter an unknown product or book, search this file first.

### Authentication & Identity Layer

**uuOidc** - OpenID Connect authentication provider. Every API call goes through OIDC token validation. When you see auth errors (401, 403, token expired, "user not authorized"), start here.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/78462435-5f5810e76a464b38b9c5e814763ed01a/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/78462435-5f5810e76a464b38b9c5e814763ed01a/book/page?code=43401842`

**uuIdentityManagement (uuIdM)** - Manages user identities, profiles, and the mapping between OIDC subjects and uuIdentity. When users can't log in, profiles are wrong, or identity federation fails.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/b07bfd4c517f4cd9972913656ea08ab5/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/b07bfd4c517f4cd9972913656ea08ab5/book/page?code=10970654`
- uu5Lib docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/2ec7b6a4dfd8458bae0286f25c27378b/book`

### Territory Layer (organizational backbone)

**uuBusinessTerritory (uuBT)** - THE core product. Manages the entire organizational structure: units, roles, role groups, permissions, artifacts. Every business app integrates with BT for authorization. When you see permission issues, role problems, or need to understand organizational structure, start here.
- ai-code-search: `uu_businessterritoryg01` (server), `uu_territoryg01_java` (Java impl)
- Server docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/7d750f202fcd48098811cab4e759b594/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/7d750f202fcd48098811cab4e759b594/book/page?code=83870522`
- uu5Lib - uuTerritory bricks: `https://uuapp.plus4u.net/uu-bookkit-maing01/e281941c906141748626e24f451c5b74/book`
- uu5Lib - uuT library: `https://uuapp.plus4u.net/uu-bookkit-maing01/1a445498a55647d880098e13f2d9d239/book`
- Textbook: `https://uuapp.plus4u.net/uu-bookkit-maing01/c38b123ccaf043fb91e4243b0a722202/book` ("Introduction to uuBusinessTerritory")
- Key concepts: Unit, Role, RoleGroup, Artifact, ArtifactIfc, Permission, Cast, ResponsibleRole

**uuTerritoryEventBroker** - Propagates events between territory artifacts. When artifact state changes need to trigger actions elsewhere.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/78e1529f7335434abad55589d38c1414/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/78e1529f7335434abad55589d38c1414/book/page?code=05466228`

**uuMyTerritory (uuMT)** - Personal workspace. Calendar, task list, notification center, activity log. When users report issues with their personal workspace, notifications not arriving, or calendar problems.
- Server docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/07bedd5d4f6b4cb49a4193382a8063e6/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/07bedd5d4f6b4cb49a4193382a8063e6/book/page?code=73787744`
- uu5Lib docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/07bedd5d4f6b4cb49a4193382a8063e6/book/page?code=21319345`

**uuDigitalWorkspace (uuDW)** - The actual workspace UI that lives inside MyTerritory. Manages workspace layouts, widgets, and the day-to-day working interface.
- Docs (same book as uuMT): `https://uuapp.plus4u.net/uu-bookkit-maing01/07bedd5d4f6b4cb49a4193382a8063e6/book/page?code=70058270`
- uu5Lib docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/07bedd5d4f6b4cb49a4193382a8063e6/book/page?code=13531195`

**uuBEM (Business Environment Manager)** - Manages business environments and their configurations. Each "environment" (dev, test, staging, prod) has its own BEM configuration. When environment-specific configs are wrong or missing.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/3b846b084ff84766b6a467612b4c6722/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/3b846b084ff84766b6a467612b4c6722/book/page?code=91500967`
- uu5Lib docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/b21e3499843f4444935d0a85f90950ba/book`

### Scripting & Automation Layer

**uuScriptEngine** - Executes server-side scripts. Used for automations, data migrations, scheduled tasks, and one-off operations. Scripts run in a sandboxed environment with access to uuApp APIs. When scripts fail, timeout, or produce unexpected results.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/78462435-d541da2a594a41ad90505c95882d0db7/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/78462435-d541da2a594a41ad90505c95882d0db7/book/page?code=rn_0`
- "Basics of Creating uuScript": `https://uuapp.plus4u.net/uu-bookkit-maing01/cd6c2f556815442ea494af1dab147292/book`
- Local rules: `cursor/docs/script/` (script-engine.md, script-context.md, script-require.md, script-testing.md)

**uuScriptRepository** - Stores and versions scripts. Scripts are organized in categories and can be shared across environments. When you need to find, create, or debug scripts.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/901a98e666254a8b9a1b29fd9a8e9fa1/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/901a98e666254a8b9a1b29fd9a8e9fa1/book/page?code=23598356`

### Admin & Operations Layer

**uuConsole** - The admin dashboard. View and manage all deployed sub-apps, check health, run uuCmds, view logs and metrics. When you need to check what's deployed, view app state, or run admin commands.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/b2afa9d54244471a9b0415db3411de11/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/b2afa9d54244471a9b0415db3411de11/book/page?code=69134639`
- uu5Lib docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/2cd3f8d029be4c44b97585aa5967b8ef/book`

**uuAsyncJob** - Manages background/async job execution. Long-running tasks, scheduled jobs, job queues. When background jobs fail, are stuck, or need monitoring.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/8c2763c40d2e4389823efa085728a65f/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/8c2763c40d2e4389823efa085728a65f/book/page?code=rn_2`

**uuAppLogStore** - Centralized logging. All sub-apps can write logs here. When you need to trace errors across multiple sub-apps.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/926da88d2adb4449b69d3a57b81f189e/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/926da88d2adb4449b69d3a57b81f189e/book/page?code=33914224`

### Storage & Registry Layer

**uuBinaryStoreg02** - Binary/file storage service. All sub-apps that need to store files (documents, images, attachments) use this. When file uploads fail, binaries are missing, or storage quota issues.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/cf5546b7c6cb4064b676706bde2d75bf/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/cf5546b7c6cb4064b676706bde2d75bf/book/page?code=90684547`
- Also: uuAppBinaryStore g01 docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/6d2a6b4272c24da9bfb3f6df5de558bf/book`
- Also: uuAppBinaryStore g02 uu5Lib: `https://uuapp.plus4u.net/uu-bookkit-maing01/59cb57d67f124011b650142130764562/book`

**uuAppLibraryRegistry (uuALR)** - Registry of all available uu5 frontend component libraries. When a library is missing on frontend, component can't be resolved, or you need to check what libraries are available.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/d7a56a17285748f7a5a743898958af23/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/d7a56a17285748f7a5a743898958af23/book/page?code=rn_3`
- uu5Lib docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/d7a56a17285748f7a5a743898958af23/book/page?code=87156454`

### Additional Products (extra license needed)

Products in this section are **additional** to the 14 core EP products and typically require an extra **license**.
Canonical short answer: `Additional Products require extra license.`

**uuWebKit** - Web content management and publishing. Product portals, websites.
- App model docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/5b3f4907c74c44e8a96f71d856b18dd7/book`
- Release notes v5: `https://uuapp.plus4u.net/uu-bookkit-maing01/5b3f4907c74c44e8a96f71d856b18dd7/book/page?code=65507457`
- uu5Lib docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/78462435-117d424849e1486aa89e160996b7b9d5/book`
- User guide: `https://uuapp.plus4u.net/uu-bookkit-maing01/117d424849e1486aa89e160996b7b9d5/book`

**uuManagementKit (uuMngKit)** - Document management, project management, specs, reports. Replaced uuDocKit. When working with project documents, specifications, reports.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/67e1f3330b0140b2b886057618bc82ce/book`
- Release notes: `https://uuapp.plus4u.net/uu-bookkit-maing01/67e1f3330b0140b2b886057618bc82ce/book/page?code=61090594`
- uu5Lib docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/96c357040e384b0e84cf1ec0d19e9561/book`

**uuEnelane-MessageRegistry** - Message registration and routing for the Enelane integration platform. Energy sector message processing.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/c250fdbbe5af44c28cdbdd050c5febf4/book`
- Release notes v6.3: `https://uuapp.plus4u.net/uu-bookkit-maing01/c250fdbbe5af44c28cdbdd050c5febf4/book/page?code=60390944`
- Local rules: `cursor/docs/enelane/` (transformers, extractors, recognizers, validators)

**uuTimeSeries** - Time series data management.
- uuTsCalc docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/99923616732505139-736e989d9599445691b08ac7bbf95219/book`
- uuTsMetamodel docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/106a46f7f59346a99aba91b991e3bf48/book`
- uuTsStore docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/99923616732505139-59c56125a8b3416e8499691059262717/book`

**uuTestmanRounds/Cases** - Test management system. Test rounds planning and test case management.
- Docs: `https://uuapp.plus4u.net/uu-bookkit-maing01/48f350f7c3a9450bb3941c4d9ecbd874/book`

**uuBusinessBrick (uuBb)** - Parent product containing ECC, EBC, ESC libraries. Provides reusable business building blocks for content management, file attachments, and structured data in any uuApp. Located under Business Products > Business Components.
- Product page: `https://uuapp.plus4u.net/uu-webkit-maing02/642dcb3a580343d8870d92dca90ad2dc`
- A4/Vision: `https://uuapp.plus4u.net/uu-bookkit-maing01/c2c9496b1fa443428ab62d91a77a70d7/book/page?code=vision`
- Docs (g02): `https://uuapp.plus4u.net/uu-bookkit-maing01/2ff5d9325f9549fb90ae6fc1892c84f0/book`
- uuBranchKitg01: `https://uuapp.plus4u.net/uu-bookkit-maing01/ba951ad11e704471b35dd3fa64ccb304/book`

**uuElementaryManagement** - Unified management layer for documents, meetings, requests, key tasks. Integrates ECC, EBC, ESC as business bricks. When working with document management, attachments, or structured content in any uuApp.
- Docs (old g01): `https://uuapp.plus4u.net/uu-bookkit-maing01/bb296a07669f4e5abbf4db3c07d1b7a8/book`

**uuEditableComponentContent (uuEcc)** - Module of uuBusinessBrick for managing editable page/section content attached to uuObjects. Provides rich content editing with components like Image Gallery, Discussion.
- Docs g04 (current): `https://uuapp.plus4u.net/uu-bookkit-maing01/54964ad0f14441c1b97110b81819cecf/book`
- Docs g03: `https://uuapp.plus4u.net/uu-bookkit-maing01/dd5a90c454104925a8edeb99c75b2dda/book`
- Docs g02: `https://uuapp.plus4u.net/uu-bookkit-maing01/9ef0bd22bb9243429a78dfad2a1543a2/book`
- Key components: `UuEcc.PageManagement.Provider`, `UuEcc.PageEditButton`, `UuEcc.Page`
- Import: `import UuEcc from "uu_editablecomponentcontentg04";`

**uuEditableBinaryContent (uuEbc)** - Module of uuBusinessBrick for managing file attachments of any uuObject. Files organized in Versions (with Labels) and Tags for filtering.
- Docs g02 (current): `https://uuapp.plus4u.net/uu-bookkit-maing01/de2afae3cae446d8b968be7ba545e5f1/book`
- Docs g01: `https://uuapp.plus4u.net/uu-bookkit-maing01/1fa26a8363f242eeb2249b76c8b15d75/book`
- Key components: `UuEbc.FileManager`
- Import: `import UuEbc from "uu_editablebinarycontentg02";`

**uuEditableStructuredContent (uuEsc)** - Module of uuBusinessBrick for creating custom structured objects associated to a main object (e.g. page sections).
- Docs g02 (current): `https://uuapp.plus4u.net/uu-bookkit-maing01/6247c97fe0584197993fca4859cd8e8f/book`
- Docs g01: `https://uuapp.plus4u.net/uu-bookkit-maing01/b8563d6055fb45849032fa850bece266/book`

### Tool Choice by Question Type

| Question type | First tool | Fallback / follow-up |
|---------------|-----------|----------------------|
| "What is deployed / what version is running / download logs?" | `uucloud-cli` | `uuConsole` docs for concepts, `uuCloud g02` docs for deployment procedures. |
| "Who has the role / why 403 / permission mapping?" | `uubt` | Then `bookkit-read` on BT / IdM / Oidc docs and `ai-code-search` for app profile mapping. Mention `Cast` when describing how a user gets a role. |
| "Where are the docs / what book / what AWID / what release notes?" | `bookkit-read` or `bookkit-list-pages` | Say the chosen tool name verbatim in the answer. Use `assets/reference-documentation.md` first if you do not know the book. |
| "How are products related / what does this concept mean?" | `business-chat` | Say `conceptual` literally once in the answer, then jump to the concrete book from the table above or the textbook/business model book. |
| "What commands/components/routes exist in this product?" | `bookkit-read` on the product's `uuSubApp` / `uu5Route List` / `uuCommand List` page | `bookkit-list-pages` if you only know the book, not the page code. |
| "How does it work in code?" | `ai-code-search` | Match the library from the ai-code-search map below before searching. |

## Investigation Playbooks

### "Something is broken in Console / ScriptEngine / ScriptRepo"

1. **Check what's deployed:** Use `uucloud-cli` to list deployed instances and their status
2. **Read logs:** Use `uucloud-cli` to download logs for the specific sub-app
3. **Check EP compatibility:** Read EP User Guide / release notes at `awid=9af773a3912e417f9b7d8bc532831f86` and `code=43160492`
4. **Read product docs:** Use `bookkit-read` with the product's AWID (see section above)
5. **Search source:** Use `ai-code-search` on relevant library:
   - Console issues -> no direct lib, check `uu_appg01_server-server-javascript` for server patterns
   - ScriptEngine issues -> check `uu_app_server_assistantscriptsg01` for script helpers
6. **Check uuApp health:** Use `uuapp-commands` to call sys/health or similar endpoints
7. **Ask business-chat:** For conceptual questions about how the product should work

### "Frontend component doesn't render / UI issue"

1. **Identify framework version:** uu5g05 (current) or uu5g04 (legacy)?
2. **Search code:** `ai-code-search` on `uu_uu5g05` or `uu_uu5g04`
3. **Read local rules:** `cursor/docs/uu5/` has component guides (visual, form, list, detail, route, create)
4. **Check library registry:** Is the component library registered in uuALR?
5. **Get latest docs:** `context7` for up-to-date uu5 documentation
6. **Check BookKit:** "uu5g05" docs at `awid=05ecbf4e8bca405290b1a6d4cee8813a`

### "Permission / authorization error"

1. **Understand the flow:** uuOidc authenticates -> uuIdM resolves identity -> uuBT checks roles/permissions
2. **Check user's roles:** Which uuBT unit? What role? What role group? What `Cast` binds the user to that role?
3. **Read BT docs:** `awid=7d750f202fcd48098811cab4e759b594` or textbook `awid=c38b123ccaf043fb91e4243b0a722202`
4. **Search code:** `ai-code-search` on `uu_businessterritoryg01` for permission model
5. **Check the app's profile mapping:** Each uuApp maps BT roles to app-level profiles in its configuration

### "Deployment / infrastructure problem"

1. **EP User Guide:** `awid=9af773a3912e417f9b7d8bc532831f86` - installation, configuration, troubleshooting
2. **Check cloud state:** `uucloud-cli` for deployment list, logs, gantt view
3. **uuCloud docs:** Search `ai-code-search` on `uu_cloud_universeg01` or `uu_cloudg02-devkit-javascript`
4. **Monitoring:** `ai-code-search` on `uu_cloud_monitoringg02` for monitoring setup
5. **Node sizing:** EP release notes have default sizing tables per product
6. **Secret Store:** `bookkit-read` at `awid=9af773a3912e417f9b7d8bc532831f86, code=28024429`

### "Need to understand uuCmd / backend pattern"

1. **Local rules first:** `cursor/docs/command/` for command implementation patterns
2. **AppModelKit rules:** `cursor/docs/appmodelkit/` for app model structure, DAO specs
3. **Search runtime code:** `ai-code-search` on:
   - `uu_appg01_server-server-javascript` - uuAppServer NodeJS (main server runtime)
   - `uu_appg01_core-server-javascript` - core server module
   - `uu_appruntimestackg02-javascript` - runtime stack g02 JS
   - `uu_appg01_server-server-java` / `uu_appg01_core-server-java` - Java variants
4. **CRUD patterns:** BookKit at `awid=b133d45016894da7b119d45346686838`
5. **DevKit:** `ai-code-search` on `uu_app_devkitg02` or `uu_appg01_devkit-javascript`
6. **DAO wording:** When explaining DAO, say that it is the data-access layer between `uuAppServer` logic and the `database` / `ObjectStore`.

### "Data migration / init data issue"

1. **Local rules:** `cursor/docs/initdata/` for command structure and examples
2. **EP tools:** `uu_envtoolg01` docs at `awid=9af773a3912e417f9b7d8bc532831f86, code=29071531`
3. **Init data loader:** `usy_initdata_loaderg01` docs at same book, code `56263489`
4. **Migration datasets:** Check EP release notes for migration scripts between versions
5. **Search code:** `ai-code-search` on `app-init` for Enterprise Platform init scripts

## ai-code-search Library Map

What to search for WHERE. Use `mcp__ai-code-search__question({ library: "NAME", prompt: "your question" })`.

### Frontend
| Library | What's inside |
|---------|--------------|
| `uu_uu5g05` | Current UI framework. Components, hooks (useRoute, useData, useCall), forms, elements, bricks. **Start here for any uu5 question.** |
| `uu_uu5g04` | Legacy UI framework. Still used in many apps. Similar API but older patterns. |

### Backend Runtime
| Library | What's inside |
|---------|--------------|
| `uu_appg01_server-server-javascript` | **Main NodeJS server runtime.** uuCmd handling, middleware, request/response processing, app lifecycle. Start here for server questions. |
| `uu_appg01_core-server-javascript` | Core server module. Lower-level than server-server. ObjectStore (MongoDB) DAO, validation, error handling. |
| `uu_appruntimestackg02-javascript` | Runtime stack g02 for JS. Builds on top of core/server. |
| `uu_app_runtimestackg02-java` | Runtime stack g02 for Java. |
| `uu_appg01_server-server-java` | Main Java server runtime. |
| `uu_appg01_core-server-java` | Core Java server module. |
| `uu_appg01_stack_openjdk-java` | OpenJDK stack for Java apps. |
| `uu_appg01_workspace-java` | Java workspace utilities. |

### DevKit & Build
| Library | What's inside |
|---------|--------------|
| `uu_app_devkitg02` | DevKit g02. Build system, testing framework, deployment tools, code generation. |
| `uu_appg01_devkit-javascript` | DevKit g01 JS. Older devkit, still in use. |
| `uu_cloudg02-devkit-javascript` | Cloud DevKit. Deployment scripts, app-box management, cloud CLI tools. |

### Cloud & Infrastructure
| Library | What's inside |
|---------|--------------|
| `uu_cloud_universeg01` | uuCloud operations. Resource pools, gateways, workload management, scaling. |
| `uu_cloud_monitoringg02` | Cloud monitoring core. Metrics collection, alerting. |
| `uu_cloud_monitoringdashboardg02` | Monitoring dashboard UI. |
| `uu_cloud_monitoring-poc` | Monitoring proof-of-concept. |
| `uu_cloud_monitoringg02-scripts` | Monitoring automation scripts. |

### Business Territory
| Library | What's inside |
|---------|--------------|
| `uu_businessterritoryg01` | BT server implementation. Organizational structure, roles, permissions, artifacts. |
| `uu_territoryg01_java` | Territory Java implementation. |

### Messaging & Integration
| Library | What's inside |
|---------|--------------|
| `uu_app_messagebrokerg01-java` | Message broker Java implementation. |
| `uu_appg01_messagebroker-java` | App-level message broker Java. |
| `uu_appg01_messagebroker-javascript` | App-level message broker JS. |

### Other
| Library | What's inside |
|---------|--------------|
| `app-init` | **Enterprise Platform init scripts.** Deployment configs, init-data, migration datasets. Essential for EP installation/upgrade. |
| `uu_app_perfmong01-java` / `uu_app_perfmong01-javascript` | Performance monitoring library. |
| `uu_app_server_assistantscriptsg01` | Helper scripts for server operations. |
| `uu_appserver_testscripts-javascript` | Test scripts for app server. |
| `uu_app_initg01-java` | Java app initialization. |
| `usy_cap_cmg01` | Configuration management. |

## EGL Skill Mapping

When encountering EGL skill references from external catalogs, map them to our skills:

| EGL Skill | Our Equivalent | Purpose |
|-----------|---------------|---------|
| `egl-tools-read` | `bookkit-read` | Read BookKit documentation |
| `bookkit` | `bookkit-read`, `bookkit-list-pages` | BookKit operations |
| `uaf-plan-blueprint` | `superpowers:writing-plans` | Implementation planning |
| `uaf-intake-appspec` | `appmodelkit`, `command` | App model specification |
| `framework-graph-router` | `uu-context` | Knowledge map routing |
| `uaf-app-polish` | `simplify` | Code review and polish |
| `uaf-generate-hi-vertical` | `uu5-*` skills | Frontend component generation |
| `uubt` | `uubt` | Business Territory operations |
| `uuem` | (none - use `bookkit-read`) | Elementary Management |
| `uuwebkit` / `uuwebkit-read` | `bookkit-read` | WebKit content reading |
| `uaf-triad-publish` | `bookkit-update`, `mngkit-update` | Content publishing |

## Tools Reference

**ALWAYS authenticate first:**
```
mcp__skilled-plus4u-mcp__login()
```

### Primary Investigation Tools

**ai-code-search** - Search source code of 32 indexed libraries. Best for "how does X work in the code?"
```
mcp__ai-code-search__list_libraries()
mcp__ai-code-search__question({ library: "uu_appg01_server-server-javascript", prompt: "How does uuCmd error handling work?" })
```

**business-chat** - AI-powered search across ALL Plus4U documentation (692 books). Best for **conceptual** and architectural questions when you do not know the exact book yet.
```
executeSkill({ scriptPath: "<absolute path to business-chat/skill.js>", params: { message: "How does uuBT role assignment work?" } })
// Use conversationId for follow-ups
executeSkill({ scriptPath: "<absolute path to business-chat/skill.js>", params: { message: "Give me an example", conversationId: "..." } })
```

**bookkit-read** - Read a specific documentation page. Use when you know the exact page.
```
executeSkill({ scriptPath: "<absolute path to bookkit-read/skill.js>", params: { url: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code={pageCode}" } })
```

**bookkit-list-pages** - List all pages in a book. Use to discover the book's structure before reading.
```
executeSkill({ scriptPath: "<absolute path to bookkit-list-pages/skill.js>", params: { url: "https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code=home", outputFile: "/tmp/pages.json" } })
// Then grep through the file to find the right page
```

**mngkit-read** - Read ManagementKit documents (project specs, reports).
```
executeSkill({ scriptPath: "<absolute path to mngkit-read/skill.js>", params: { url: "https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={oid}" } })
```

**context7** - Up-to-date documentation for registered libraries.
```
mcp__plugin_context7_context7__resolve-library-id({ libraryName: "uu5g05" })
mcp__plugin_context7_context7__query-docs({ context7CompatibleLibraryID: "...", topic: "forms validation" })
```

### Operations Tools

**uuapp-commands** - Call uuApp APIs across environments. Health checks, use case calls.
```
executeSkill({ scriptPath: "<absolute path to uuapp-commands/skill.js>", params: { action: "list" } })
```

**uucloud-cli** - Cloud operations. Best for deployment **list**, workload **version** checks, and log **download** from deployed uuApps.
```
executeSkill({ scriptPath: "<absolute path to uucloud-cli/skill.js>", params: { command: "list", resourcePool: "..." } })
```

**uubt** - Business Territory operations (direct BT API calls).

### Content & Documentation Skills

| Skill | Use for |
|-------|---------|
| `bookkit-update` | Edit a BookKit page |
| `bookkit-add-page` | Add new page to a book |
| `mngkit-update` | Edit ManagementKit documents |
| `markdown-to-uu5` | Convert Markdown -> UU5 string (for writing content) |
| `uu5-to-markdown` | Convert UU5 string -> readable Markdown (for reading content) |
| `uu5-string-validator` | Validate UU5 string syntax before saving |
| `bml-diagram` | Generate UuBml architecture diagrams |
| `uu5-chart` | Generate chart components |
| `uu5-presentation` | Create slide presentations |
| `sls-read` | Read SLS support tickets |
| `appbox-copy` | Copy uuAppBoxes between registries |
| `create-business-discipline` | Create BMK business discipline documentation |
| `uuappdevkitlib-builder` | Build custom DevKit plugins |

## Knowledge Base Navigation

### uuVooDoo Portal (central index)

Base URL: `https://uuapp-dev.plus4u.net/uu-egl-tools/90f6dd9d85454cc6ae5a3a07b3293782/`

| Section | Content | Count |
|---------|---------|-------|
| `/books` | All documentation books | 692 |
| `/products` | All products with family/hub taxonomy | 249 |
| `/codebase` | Source code repositories (g01) | - |
| `/codebaseg02` | Source code repositories (g02) | - |
| `/release-notes` | Cross-product release notes | - |

### Product Families

**Technical Products Hub:**
- **uuCloud** - Cloud infrastructure, deployment, resource management
- **uuHumanInterface** - Frontend: uu5g05, uu5g04, uu5Tiles, uu5Bricks, uu5Charts, uu5Forms, uu5DnD, uu5Editing, uu5RichText, uu5String, uu5Maps, uu5Imaging, uu5Loader, uu5Extras, uu5Calendar, uu5CodeKit, uu5Tree, uu5Animation, uu5Math, uu5OpenLayers, uu5DevKit
- **uuServerKit** - Backend: uuAppServer (NodeJS/Java), uuAppDevKit, uuAppBinaryStore
- **uuIdentity** - Authentication and identity services
- **uuDigitalConstructionKit** - Construction domain tools

**Business Products Hub:**
- **Business Components** - uuAiChat, etc.
- **Production Tools** - uuAppDesignKit (g01/g02), uuAppBusinessModelKit
- **Common Services** - Shared services across products
- **Management & Communication** - Management tools
- **Finance**, **Sales**, **Education/gamification**, **People & Reservation**, **Central Services**, **Digital Content Unit**, **Consultation & Certification Unit**, **uuChargeUp**, **Documentation**

### Key Documentation Entry Points

| Topic | BookKit AWID | Description |
|-------|-------------|-------------|
| EP User Guide | `9af773a3912e417f9b7d8bc532831f86` | Installation, configuration, upgrade, tools, FAQ |
| CRUD Patterns | `b133d45016894da7b119d45346686838` | Core design and development patterns |
| CRUD Patterns (alt) | `c0d8799fe2de47b7816679d54f955315` | Alternative CRUD patterns book |
| uuBT Textbook | `c38b123ccaf043fb91e4243b0a722202` | Introduction to Business Territory |
| uuAppServer NodeJS | `2590bf997d264d959b9d6a88ee1d0ff5` | NodeJS server runtime documentation |
| uuAppServer Java | `99c939a08e0849c68df5ee339c94054b` | Java server runtime documentation |
| uuCloud Business Model | `01bda7669a5e412bb8d9326cce588742` | Cloud resource sizing, pricing |
| uuCloud Automation | `22bb138cf19549729c9e05194cdebcc4` | Cloud automation guide |
| AI Patterns | `559ac927984f404bab5fc1b706eb6f4d` | AI integration patterns |
| Local Docker Env | `63d0f03c73cc42b1b67b3e780cc4aad9` | Local development environment setup |
| Operations Security | `ef466d21b0a1463fa1075e0ad950a4fe` | Security operations knowledge base |
| Digital Twin | `547882a96adb4850b748929327b25146` | Digital twin guidelines |
| uu5g05 docs | `05ecbf4e8bca405290b1a6d4cee8813a` | uu5 g05 framework documentation |
| uuAppDevKit g01 | `e884539c8511447a977c7ff070e7f2cf` | DevKit g01 documentation |
| uuAppDevKit g02 | `9aa68648f3814e3a9dd20ba69adcdab0` | DevKit g02 documentation |
| Licensing Overview | `993fff06903f48a3a18489f6009e7ce6` | Product licensing model |
| Security Guideline | `0dba3d0f7a364a2dab84e5ea4cecbe15` | uuAppFramework security guideline |
| uuApp Architecture | `5cbf7f86d2e046b98d29ce7527d903cb` | "Unicorn Mobile-First IoT-Ready Cloud Architecture" |
| uuEcc (g02) | `54964ad0f14441c1b97110b81819cecf` | Editable Component Content - rich content editing library |
| uuEbc (g01) | `1fa26a8363f242eeb2249b76c8b15d75` | Editable Binary Content - file attachments with versioning |
| uuEsc (g01) | `b8563d6055fb45849032fa850bece266` | Editable Structured Content - custom structured sub-objects |
| uuElementaryMgmt | `bb296a07669f4e5abbf4db3c07d1b7a8` | Elementary Management (documents, meetings, requests) - old g01 |

### Local Development Rules

In `uu_app_aicodingg01-prompts/cursor/docs/`:

| Directory | Content |
|-----------|---------|
| `uu5/` | uu5 component development: visual-component-guide, form-component, list-component, detail-component, route-guide, create-component, uu5string-guide, lsi-guide, spacing-guide, sizing-guide, grid-guide, content-container-guide, uu5-test-guide, uu5elements-components, uu5forms-components, uu5_library_textbook |
| `appmodelkit/` | App model: appmodel-structure, dao-specifications, variable-usage, appmodel-statement-types, server-component-method-link-internal |
| `enelane/` | Enelane integration: transformers, extractors, recognizers, validators, message-input-processing |
| `script/` | Scripting: script-engine, script-context, script-require, script-testing, generic-script-helper |
| `initdata/` | Init data: command-structure, examples |
| `command/` | uuCmd implementation patterns |

### Code Repositories

Source code search is available via the `ai-code-search` MCP server (see ai-code-search Library Map above). It indexes 32+ libraries and is the primary way to search code.

**Optional: local repo index.** If you have the `ai-code-search` MCP server configured and want a local index of all git repositories, you can export one to e.g. `~/Documents/work/repos/repo-list.json`. Common prefixes in the Unicorn Universe:
- `uu_*` - Core Unicorn Universe
- `usy_*` - Unicorn System
- `uumt_*` - MyTerritory
- `vig_*` - Various integrations
- `plus4u_*` - Plus4U platform

## General Investigation Protocol

1. **Understand the problem domain first.** Which layer is it? Frontend (uu5)? Backend (uuAppServer)? Infrastructure (uuCloud)? Platform (EP product)?
2. **Don't read GUI component docs when investigating a server problem.** Match tools to domain.
3. **Use the right tool for the job:**
   - Know which code? -> `ai-code-search` with the specific library
   - Don't know where to look? -> `business-chat` to ask across all docs
   - Know the book but not the page? -> `bookkit-list-pages` then `bookkit-read`
   - Need to check deployed state? -> `uucloud-cli` or `uuapp-commands`
4. **Save large outputs to files** with `outputFile` parameter, then grep.
5. **Follow dependency chains.** Auth issue? Start at uuOidc, then uuIdM, then uuBT, then the app's profile mapping.
6. **Check EP release notes** when version compatibility is in question. Products in the same EP release are tested together.

## Pages Snapshot (Local Cache)

A pre-built snapshot of pages across **BookKit AND ManagementKit** documents is available for instant local search:

- **Location**: `assets/bookkit-pages-snapshot.txt` (tab-separated, grep-friendly)
- **Format**: `AWID\tBookName\tAppType\tPageCode\tPageName`
- **Sources**: reference-documentation.md (~668 books) + uugle-database-export.json (~480 project books) + extras
- **AppType**: `bookkit` or `mngkit` - determines the correct URL pattern
- **Generated**: check the `# Generated:` header line for date
- **Generated**: 2026-03-23

### How to use the snapshot

**ALWAYS search the snapshot FIRST before calling `bookkit-list-pages`.** The snapshot is instant; the API call takes seconds per book.

```bash
# Find pages about "contingency" across ALL books
grep -i "contingency" assets/bookkit-pages-snapshot.txt

# Find all pages in a specific book
grep "d97322bc2e9e407e87746eb32ef66424" assets/bookkit-pages-snapshot.txt

# Find which book has a page about "PSCPL"
grep -i "pscpl" assets/bookkit-pages-snapshot.txt

# Find all ManagementKit documents
grep "mngkit" assets/bookkit-pages-snapshot.txt
```

Once you find the AWID, appType, and page code, read the page:
```
# For BookKit (appType=bookkit):
bookkit-read: url=https://uuapp.plus4u.net/uu-bookkit-maing01/{AWID}/book/page?code={PageCode}

# For ManagementKit (appType=mngkit):
mngkit-read: url=https://uuapp.plus4u.net/uu-managementkit-maing02/{AWID}/document?code={PageCode}
```

### Snapshot freshness

Snapshots are static files updated manually. Check the `# Generated:` header for date.

## How to Find Answers You Don't Have

**You will NOT have all answers pre-loaded. That's by design.** Your job is to FIND them efficiently.

### "I don't know what [term/product/acronym] is"

1. **Search the snapshot:** `grep -i "[term]" assets/bookkit-pages-snapshot.txt` - instant results across 665 books
2. **Ask business-chat:** `executeSkill({ scriptPath: "<absolute path to business-chat/skill.js>", params: { message: "What is [term]? What uuApp is it part of?" } })`
3. If neither helps, **ask the user** for the product URL or BookKit AWID
4. Once you have a BookKit URL, use `bookkit-read` to read relevant pages

### "I need to know how to do X with product Y"

1. **Search the snapshot** for the topic - find which book and page covers it
2. **Read the relevant page:** `bookkit-read` with the specific page URL
3. **For code-level details:** `ai-code-search` on the matching library
4. **Fallback:** `bookkit-list-pages` if snapshot is stale or book is not in snapshot

### "I need to call a specific uuApp API but don't know the endpoint"

1. **Search the snapshot** for "API", "Reference", "uuCmd" in the product's book
2. **Read the API reference page** via bookkit-read
3. **Or call it directly:** `uuapp-commands` skill can list and call configured endpoints

### NEVER do this:

- Don't guess APIs or patterns from memory - always verify from documentation
- Don't read uu5/frontend docs when investigating a backend problem
- Don't try to answer from this skill alone - this skill tells you WHERE to look, not the answers themselves
