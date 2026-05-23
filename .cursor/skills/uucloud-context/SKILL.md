# uuCloud — Domain Context

You are an expert investigator for the **uuCloud PaaS platform** - the full Universe Managed Environment (UME) stack. This skill gives you everything needed to investigate deployments, debug resource issues, trace service failures, and navigate the entire UME infrastructure.

## Safety Rules

**READ-ONLY by default.** All Kubernetes and API operations MUST be non-destructive unless the user explicitly approves.

- Kubernetes: Only `get`, `describe`, `logs`, `top` commands. NEVER `delete`, `scale`, `patch`, `edit`, `apply`, `exec` without explicit user approval.
- uuApp/Universe commands: Only GET commands (health, list, get, load) by default. POST/mutation commands require user confirmation.
- When in doubt, show the user what you plan to do and ask before executing.

---

## Architecture Overview

UME is the managed hosting platform for all Unicorn Universe applications. Every service below runs as a uuApp deployed on Kubernetes.

```
Universe (Orchestrator - the brain)
  |
  +-- Manages resource pools, workloads, deployments, sizing
  |
  +-- AppBox Registry ---- stores deployment images (Docker-like packages)
  +-- Gateway ------------ HTTP routing (sync + async) to deployed apps
  +-- ScriptEngine ------- executes operator scripts during deploy/lifecycle
  +-- ScriptRepository --- stores operator scripts referenced by ScriptEngine
  +-- AsyncJob ----------- background task execution
  +-- Console ------------ admin UI + progress bus (deployment tracking)
  +-- OIDC --------------- authentication (OpenID Connect provider)
  +-- IDM ---------------- identity management (users, groups)
  +-- BT ----------------- org structure, workspace permissions, artifacts
  +-- BinaryStore -------- file/binary storage (ABS)
  +-- LibraryRegistry ---- UU5 frontend library hosting
  +-- CloudLogStore ------ centralized log aggregation
  +-- Grafana/Prometheus -- metrics and monitoring
  +-- Graylog ------------ log search and alerting
```

**How they work together:**
- **Universe** is the single source of truth for what is deployed where. It owns resource pools, workloads, and orchestrates the deploy pipeline.
- **AppBox Registry** holds versioned application packages. Universe pulls from it during deployment.
- **Gateway** routes incoming HTTP requests to the correct Kubernetes service based on routing rules defined in Universe.
- **ScriptEngine** runs operator scripts (e.g., init scripts, migration scripts) triggered by Universe during deployment. Scripts come from **ScriptRepository**.
- **Console** provides the admin UI and the **progress bus** - the real-time deployment progress tracker.
- **AsyncJob** handles deferred/scheduled work for any UME service.

---

## Deployment Flow (Step by Step)

This is the critical path. Most investigation starts here.

```
1. uuSubAppInstanceWorkload/create
   └─ Creates a workload record in Universe (state: created)

2. uuSubAppInstanceWorkload/prepareForDeployment
   └─ Allocates resources from pool, assigns slots (state: preparedForDeployment)

3. uuSubAppInstanceWorkload/deploy
   ├─ a. Validates universe, workload, resource pool states
   ├─ b. Creates progress bus entry on Console
   ├─ c. Sets workload state to "pending"
   ├─ d. For each resource in uuAppResourceMap:
   │      └─ Calls UuAppResourceFactory.activate()
   │         └─ Creates a Process record, POSTs to operator:
   │            ├─ operator type=uuScriptLibrary → ScriptEngine engine/runScript
   │            └─ operator type=uuSubApp → direct use case call
   ├─ e. Returns immediately with progressBusCode (async from here)
   ├─ f. finishDeploy polls process completion, updates states
   ├─ g. Operator calls back → uuAppResourceIfc/acknowledgeActive
   ├─ h. On success: process deleted, resource → active
   └─ i. On failure: process state=problem, workload state=problem
```

**Key insight:** Deploy is async. The caller gets a `progressBusCode` immediately. Track progress via Console `progressBus/progress/get`.

---

## Entity Model (Universe Hierarchy)

```
Universe (uuAwsc - root workspace)
├── uuCloudResourcePool (provider capacity pool)
│   ├── limitMap (vcpu, memory, AOS, ABS, routing rules, uu5 lib repo storage)
│   └── uuCloudResource (physical/logical cluster slots)
│       ├── type: uuNodeCluster, uuGatewayCluster, etc.
│       ├── subType: cmdSync, cmdAsync
│       └── slot: default, preview
│
├── uuAppResourcePool (customer pool - consumes CloudResources)
│   ├── limitMap, resourceAllocationStrategyMap
│   ├── trustedRegistryList (which AppBox registries are allowed)
│   ├── uuConsoleBaseUri
│   ├── secret (pool-scoped secrets)
│   └── uuSubAppInstanceWorkload (deployable unit)
│       ├── uuAppBoxUri (what to deploy)
│       ├── asid, urlPath, version
│       ├── slotMap (default, preview)
│       ├── uuAppResourceMap (what resources it needs)
│       │   ├── uuNodeResource (compute) → has uuNodeVolumeResource, secretList
│       │   ├── uuGatewayResource (routing) → uuAppRoutingList
│       │   ├── uuAppObjectStoreResource (MongoDB) → osid
│       │   ├── uuAppBinaryStoreResource (file storage)
│       │   └── uuAppAnyResource (generic)
│       └── awidCard (AWID assignments)
│
└── uuAppResourceSize (sizing definitions: vCPU, memory, storage specs)
```

### State Machines

**Workload states:**
```
created → preparedForDeployment → pending → active
                                         → problem
                                  active → suspended → cancelled | closed
```

**Resource states:**
```
created → allocated → assigned → active
                              → *Problem variants
                       active → suspended → cancelled | closed
```

---

## Complete API Reference (Safe GET Endpoints)

All endpoints below are safe for investigation - no state changes.

### Universe Core
| Endpoint | Use |
|----------|-----|
| `universe/get` | Universe metadata, version, state |
| `universe/getUuAppSecretValue` | Read a secret value |

### Cloud Resource Pool (provider capacity)
| Endpoint | Use |
|----------|-----|
| `uuCloudResourcePool/list` | All provider pools |
| `uuCloudResourcePool/get` | Pool detail + limitMap |
| `uuCloudResourcePool/load` | Full pool with nested data |

### Cloud Resource (cluster slots)
| Endpoint | Use |
|----------|-----|
| `uuCloudResource/list` | Slots in a pool |
| `uuCloudResource/get` | Slot detail |

### App Resource Pool (customer pools)
| Endpoint | Use |
|----------|-----|
| `uuAppResourcePool/list` | All customer pools |
| `uuAppResourcePool/get` | Pool detail + limitMap |
| `uuAppResourcePool/load` | Full pool data |
| `uuAppResourcePool/loadEffective` | Merged/effective config |
| `uuAppResourcePool/getAvailableSlotMap` | Available deployment slots |

### SubApp Instance Workload (deployments)
| Endpoint | Use |
|----------|-----|
| `uuSubAppInstanceWorkload/list` | All workloads in pool |
| `uuSubAppInstanceWorkload/get` | Workload detail + state |
| `uuSubAppInstanceWorkload/load` | Full workload + resources |
| `uuSubAppInstanceWorkload/listHistory` | State change history |
| `uuSubAppInstanceWorkload/listByUniverseProvider` | Cross-pool lookup |
| `uuSubAppInstanceWorkload/awidCard/list` | AWID assignments |

### Node Resource (compute)
| Endpoint | Use |
|----------|-----|
| `uuNodeResource/list` | Nodes in workload |
| `uuNodeResource/get` | Node detail |
| `uuNodeResource/listHistory` | Node state history |

### Node Volume Resource
| Endpoint | Use |
|----------|-----|
| `uuNodeVolumeResource/list` | Volumes on node |
| `uuNodeVolumeResource/get` | Volume detail |
| `uuNodeVolumeResource/listHistory` | Volume history |

### Gateway Resource (routing)
| Endpoint | Use |
|----------|-----|
| `uuGatewayResource/list` | Gateway resources |
| `uuGatewayResource/get` | Routing rules detail |
| `uuGatewayResource/listHistory` | Gateway history |

### Object Store Resource (MongoDB)
| Endpoint | Use |
|----------|-----|
| `uuAppObjectStoreResource/list` | Object stores |
| `uuAppObjectStoreResource/get` | Store detail + osid |
| `uuAppObjectStoreResource/listHistory` | Store history |

### Other Safe Endpoints
| Endpoint | Use |
|----------|-----|
| `uuAppBinaryStoreResource/list`, `get`, `listHistory` | Binary store resources |
| `uuAppResourceSize/list`, `get` | Sizing definitions |
| `secret/list`, `get` | Pool secrets |
| `awidCard/list`, `get` | AWID cards |
| `uu5LibraryRepositoryWorkload/list`, `get`, `load`, `listHistory` | UU5 lib repo workloads |
| `uu5LibraryRepositoryResource/list`, `get`, `listHistory` | UU5 lib repo resources |
| `uuAppAnyResource/list`, `get`, `listHistory` | Generic resources |
| `uuAppResourceIfc/list` | Resource interface processes |

---

## Other UME Services - Key Investigation Endpoints

### AppBox Registry
| Endpoint | Use |
|----------|-----|
| `sys/getHealth` | Service health |
| `appBox/list` | List available AppBoxes |
| `appBox/get` | AppBox detail (versions, signatures) |
| `appBoxPack/list` | Packages within an AppBox |

### ScriptEngine
| Endpoint | Use |
|----------|-----|
| `sys/getHealth` | Service health |
| `sys/getStatistics` | Execution stats |
| `script/list` | Running/recent scripts |

### ScriptRepository
| Endpoint | Use |
|----------|-----|
| `sys/getHealth` | Service health |
| `script/list` | Available scripts |
| `scriptCategory/list` | Script categories |

### Console
| Endpoint | Use |
|----------|-----|
| `sys/getHealth` | Service health |
| `progressBus/progress/get` | Deployment progress (use progressBusCode) |

### AsyncJob
| Endpoint | Use |
|----------|-----|
| `sys/getHealth` | Service health |
| `asyncJob/list` | Pending/running async jobs |

### Gateway
| Endpoint | Use |
|----------|-----|
| `sys/getHealth` | Service health |
| `sys/getStatistics` | Request routing stats |

### Other Services
| Service | Key Endpoint |
|---------|-------------|
| OIDC | `sys/getHealth` |
| IDM | `sys/getHealth` |
| CloudLogStore | `sys/getHealth` |
| BinaryStore | `sys/getHealth` |
| LibraryRegistry | `sys/getHealth`, `uu5Library/list` |

---

## Investigation Flow (Proven Step-by-Step)

This is the primary investigation method. **Always start with Universe API, then Console progress bus.** kubectl is a supplement, not the starting point.

**Two cluster contexts to keep straight:**
- **UME cluster** — where Universe, Console, Gateway, ScriptEngine and other platform services run. `uuapp-commands` with `config=<ume-config>` target this. `kubectl` with the UME kubeconfig inspects platform pods.
- **Application cluster** — where deployed customer apps (workloads) run. `kubectl` with the app cluster kubeconfig inspects app pods, logs, events. The app cluster kubeconfig is separate from UME.

Ask the user which configs/kubeconfigs to use if not already known from prior context.

### Step 1: List all workloads and find problems

```
uuapp-commands: callCommand config=<ume-config> environment=<ume-env> app=uu-cloud-universe command=uuSubAppInstanceWorkload_list
```

> **Note:** `<ume-config>` and `<ume-env>` refer to the UME (Universe Managed Environment) cluster where Universe and platform services run. Ask the user which config/environment to use if not known.

Parse the response, filter for `state !== "active"`. Key states to watch:
- `problem` - deploy failed or app crashed after deploy
- `createdProblem` - failed during initial creation
- `preparedForDeployment` - stuck, deploy never triggered or failed early
- `pending` - deploy in progress (may be stuck if old)

### Step 2: Get workload detail

Use `asid` (not `oid` from list - those may be scoped to a different context):
```
uuapp-commands: callUuAppCommand config=<ume-config> ... useCase=uuSubAppInstanceWorkload/get method=GET dtoIn={"asid":"<workload-asid>"}
```

From the response extract:
- `state` - current workload state
- `version` - what version is deployed
- `uuAppBoxUri` - what image was used
- `uuAppResourceMap` - list of resources (node, gateway, objectStore) with OIDs
- `uuAppServerEnvironment` - env vars, OIDC config, database connection

### Step 3: Check deployment progress on Console

Progress code pattern: `uuSubAppInstanceWorkload_{ASID}`

```
uuapp-commands: callCommand config=<ume-config> ... app=uu-console command=progressGet dtoIn={"code":"uuSubAppInstanceWorkload_{ASID}"}
```

The progress response contains:
- `state` - `completed`, `completedWithError`, `inProgress`, `error`
- `message` - human-readable summary of what happened
- `data.doneStepList` - steps that completed successfully
- `data.remainingStepList` - steps that didn't run
- `data.errorMap` - **THE KEY INFO** - what exactly failed:
  - `uuAppResourcesActivationFailed.problemUuAppResourceList` - which resources failed
  - Each resource identified by `identifier` (e.g. `uuNodeSetMap/nodeSet01`)

### Step 4: Check sub-progress for the failed resource

Each resource has its own progress. Code pattern: `uuSubAppInstanceWorkload_{ASID}_{resourceOid}`

```
uuapp-commands: callUuAppCommand config=<ume-config> ... app=uu-console useCase=progress/get method=GET dtoIn={"code":"uuSubAppInstanceWorkload_{ASID}_{resourceOid}"}
```

This gives you the **exact error** from the operator script:
- `data.errorMap.scriptFailed.error.exceptionCode` - error code (e.g. `uu_cloud_nodearog01/Activate/applicationNotStarted`)
- `data.errorMap.scriptFailed.error.exceptionMessage` - human-readable error
- `data.errorMap.scriptFailed.error.uuAppErrorMap` - nested error details with `paramMap` containing:
  - `reason` - K8s reason (e.g. `BackOff`, `ImagePullBackOff`, `CrashLoopBackOff`)
  - `message` - K8s event message with pod name
- `data.doneStepList` - shows which operator steps passed (validation, k8s init, namespace, secrets, PVCs, configMap, deployment, validate...)

### Step 5: (Optional) Check k8s for more detail

Only if progress doesn't give enough info. Use the pod name from the progress error:
```bash
# UME cluster kubeconfig — path depends on your local setup
KUBECONFIG=~/.kube/<ume-cluster>.yaml kubectl logs {pod-name} -n {namespace} --tail=100
```

Common k8s error patterns:
- `MODULE_NOT_FOUND` - missing npm dependency in appbox image
- `ProfilesMergeDuplicateKeyError` - conflicting profiles config between libraries
- `OOMKilled` - needs more memory (check resource sizing)
- `ImagePullBackOff` - appbox image not found in registry

---

## Progress Bus Code Patterns

Understanding these patterns lets you go directly to the right progress:

| Pattern | What it tracks |
|---------|---------------|
| `uuSubAppInstanceWorkload_{ASID}` | Main deployment progress for a workload |
| `uuSubAppInstanceWorkload_{ASID}_{resourceOid}` | Resource-level progress (node/gateway/objectStore activate) |
| `uuAppResourcePool_{poolOid}` | Resource pool operations |
| `uu5LibraryRepositoryWorkload_{oid}` | UU5 library deployment |
| `uu5LibraryRepositoryWorkload_{oid}_{resourceOid}` | UU5 library resource activation |

---

## Investigation Playbooks

### Deployment Failed / Workload in `problem` state

Follow the Investigation Flow above (Steps 1-5). The progress bus will tell you exactly which resource failed and why.

**Common root causes from progress errorMap:**
- `applicationNotStarted` (reason: `BackOff`) → app crashes on start, check app logs
- `loadUuAppPackFailed` → appbox image not found or registry credentials wrong
- `failedToScheduleToNode` → cluster has no capacity or nodeSelector mismatch
- `scriptFailed` without specific code → operator script itself crashed, check ScriptEngine logs

### AppBox Not Found / Wrong Version

1. Check `uuAppBoxUri` on the workload - does it point to the correct registry?
2. Check AppBox Registry: `appBox/list` filtered by code
3. Verify `trustedRegistryList` on `uuAppResourcePool` includes the registry
4. Check `appBoxSignatureVerificationStrategy` on the pool
5. If cross-registry: verify the AppBox was copied (`appBoxCopy` in devkit)

### Resource Pool Capacity Exhausted

1. `uuCloudResourcePool/get` → compare `limitMap` vs current usage
2. `uuAppResourcePool/get` → check pool-level `limitMap`
3. `uuNodeResource/list` → see all allocated nodes and their sizes
4. `uuAppResourcePool/recalculateCapacities` - **POST, ask user first!**

### Gateway / Routing Problem (502/503)

1. `uuGatewayResource/get` → inspect `uuAppRoutingList` entries
2. Check gateway pod health in UME k8s
3. Check gateway logs: `uucloud-cli logs` or `kubectl logs`
4. Verify slot routing (default vs preview)

### Script / Async Job Stuck

1. Check progress bus for the workload - is a resource stuck in `inProgress`?
2. ScriptEngine: check running scripts via `sys/getStatistics`
3. Universe: `uuAppResourceIfc/list` for orphaned process records
4. ScriptEngine pod logs in UME k8s as last resort

### Authentication / Permission Issue in UME

1. Check OIDC `sys/getHealth`
2. Check IDM `sys/getHealth`
3. Verify BT permissions on the resource pool artifact
4. Check workspace permissions via Universe `universe/get`

### Workload Stuck in `createdProblem` State

Happens when deploy fails during resource creation (e.g. K8s service name > 63 chars). The workload is NOT accepted by close, cancel, or delete directly.

**Recovery: `suspend(force) → close(force) → delete`**

```
uuapp-commands config=<ume-config>:
1. uuSubAppInstanceWorkload/suspend  POST  { oid: "<workload_oid>", force: true }
2. uuSubAppInstanceWorkload/close    POST  { oid: "<workload_oid>", force: true }
3. uuSubAppInstanceWorkload/delete   POST  { oid: "<workload_oid>" }
```

**Root cause K8s name limit:** service name = appbox `code` + `-` + OID (25 chars). Max 63 total. If `code` > 38 chars → K8s createService fails → `createdProblem`. Fix: shorten `code` in uuAppBoxDescriptor (not `urlPath`, that's routing only).

### Node Resource Assign/Unassign Scripts

These scripts run on **uuScriptEngine** in UME (from uuScriptRepository), NOT locally:
- `uu_cloud_nodearog01/Assign` — creates K8s namespace, service, validates, builds resourceUris
- `uu_cloud_nodearog01/Unassign` — tears down K8s resources
- K8s service name generated from `dtoIn.data.uuSubAppCode` (= appbox code) + OID suffix

---

## Environment Discovery

### From Installer Inventory File (universe-*.js)
- `host` - Universe base URI
- `asyncHost` - Async endpoint
- `subApps` map with AWID codes for each UME service

### From random-generated-values (installer secrets)
- Access codes, passwords, OIDC client secrets

### From kubectl (UME cluster)
```bash
# Find all ingress endpoints
kubectl get ingress --all-namespaces

# Find all services
kubectl get svc --all-namespaces | grep -v kube-system

# Find Universe pods
kubectl get pods --all-namespaces | grep universe
```

### From uucloud-cli config (~/.uucloud-cli/config.json)
- Presets with `universe-uri`, `log-store-uri`, resource pool references

---

## Documentation References

BookKit books for deep-dive research:

| Book | AWID | Key Pages |
|------|------|-----------|
| uuCloudUniverseg02 AppModel | `587ffda7d94e44af9dbdd4aceb8af5dc` | `00018530` (universe), `00972067` (uuCommand List), `00536565` (Architecture), `04956189` (uuAppBoxRegistry) |
| uuCloud Overview | `2039b0d58d364ae587d95e18c78c0319` | `12836629` (Universe), `86327274` (uuAppBox Registry), `53751430` (uuAppBox registry) |
| uuCloudg01C3K8 | `479ae27c98cd4dde9cabedcb8ce8f585` | General cloud infrastructure |

Use the `bookkit-read` skill with these AWIDs and page codes to read documentation.

---

## Tool Reference

| Need | Tool | How |
|------|------|-----|
| Call Universe API | `uuapp-commands` | `config=ume-{env}, app=universe` |
| Call any UME service | `uuapp-commands` | `config=ume-{env}, app={service}` |
| List deployed apps | `uucloud-cli` | `ps` command with preset |
| Get app logs | `uucloud-cli` | `logs` command |
| Check k8s pods | `kubectl` | with KUBECONFIG for UME cluster |
| Read documentation | `bookkit-read` | Use AWIDs/pages from Documentation References |
| Search source code | `ai-code-search` | `library=uu_cloud_universeg01` |
| Check BT permissions | `uubt` skill | On resource pool BT artifact |
| Create/copy AppBox | `uuCloud DevKit CLI` | `appBox`, `appBoxCopy` commands |
| Deploy/undeploy apps | `uuCloud DevKit CLI` | `deploy`, `undeploy` commands |

---

## uuCloud DevKit CLI Reference

Available commands via `uu_cloudg02-devkit`:

| Command | Description |
|---------|-------------|
| `appBox` | Create uuAppBox from built artifacts |
| `appBoxCopy` | Copy AppBox between registries |
| `appBoxExport` | Export AppBox as zip file |
| `appBoxImport` | Import AppBox from zip file |
| `deploy` | Deploy app to a resource pool |
| `undeploy` | Undeploy app from a resource pool |
| `deployList` | List deployed apps in a pool |
| `swap` | Blue/green swap between default and preview slots |
| `cleanResources` | Remove unused/orphaned resources |
| `logExport` | Export application logs |
| `verifySignature` | Verify AppBox signature integrity |
| `vulnerabilityScan` | Run security vulnerability scan |
