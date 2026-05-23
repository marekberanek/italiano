# Code Review — Unified Quality Assurance for uuApp

## Purpose & Scope
Deliver actionable, minimal diffs that improve correctness, security, performance, reliability, and maintainability while respecting uuApp layering and team conventions.

**Target**: Controllers/commands, ABL, DAO, DTO schemas (in `app/api/validation_types`), migrations/initialization ABLs, integration code, tests.

## Output Format (Always Required)

### 1) Quick Summary (2–5 bullets)
Brief overview of key findings and overall code quality

### 2) Verdict
**Approve** / **Request changes** (1-line reason)

### 3) Findings Table
| Severity | Layer | File:Line | Finding | Why it matters | Suggested fix |
|---|---|---|---|---|---|

**CRITICAL**: File references must be specific (e.g., `dao/joke-mongo.js` `createSchema()` method, not `dao/*.js` or `app/**/*.js`). Use line numbers only for specific code snippets or when exact positioning is critical.

### 4) Inline Suggestions
Using unified diffs with specific file:line references and exact code examples

### 5) Checklist Status
See Universal Checklist section below

### 6) Questions (≤3 only if essential context is missing)

**Severity legend:** Blocker (bug/security/API break) • Major • Minor • Nit

## Specificity Requirements (CRITICAL)

### ALWAYS Provide:
- **Specific examples** instead of vague statements
- **Specific file and line numbers** when identifying issues or improvements
- **Exact code examples** when suggesting improvements
- **Specific validation rules** when pointing out security issues
- **Concrete performance metrics** when discussing optimizations

### NEVER Use Phrases Like:
- ❌ "Database queries could benefit from optimization"
- ❌ "Indexing needs review"
- ❌ "Performance could be improved"
- ❌ "Could benefit from analysis"
- ❌ "Needs review"
- ❌ "Should be optimized"

### ALWAYS Use Phrases Like:
- ✅ "Add compound index `{ awid: 1, categoryId: 1, visibility: 1 }` in `dao/joke-mongo.js:25` for category-based joke listing"
- ✅ "Cache category list results in `abl/category/list-abl.js:30` using uuApp cache to avoid repeated database calls"
- ✅ "Add input size validation `max: 1000` in `api/validation_types/joke-types.js:15`"

### All Findings MUST Include:
- Specific file and method references (e.g., `dao/joke-mongo.js` `createSchema()` method)
- Exact code examples or specific implementation details
- Concrete impact descriptions (e.g., "reduces database calls from 3 to 1")
- Actionable fixes with specific code changes

## Universal Checklist

- **Correctness**: null/undefined, error paths, idempotency of commands & migrations, timezones, concurrency (parallel calls, retries)
- **Security**: input validation at boundaries; parameterized queries; secrets never logged; safe file & URL handling; strict CORS where applicable
- **Performance**: N+1 patterns, missing indexes, unnecessary JSON stringify/parse, blocking I/O in hot paths
- **Tests**: new/changed logic has unit tests (happy + 1 failure path); deterministic; isolated from real services
- **Observability**: structured logs (no PII/secrets), correlation id propagation, actionable messages
- **Docs/Change**: README/ADR/CHANGELOG updated on behavior or public API changes
- **CI/Build**: reproducible scripts; multi-arch builds keep cache per platform if used; no secret leakage
- **Quality Gates**: SonarQube gate status; ESLint errors/warnings in changed files

## uuApp Architecture Guardrails

### Layering
- **Controller/Command**: pass `ucEnv.getDtoIn()` and other context to ABL; avoid business logic here
- **ABL**: business rules, transactions/orchestration, idempotency where needed
- **DAO**: persistence only; no business rules; return normalized shapes

### Command & Schema Conventions
- Command names & schema camelCase for attributes
- Do not reach across services' databases; interact via contracts/events

### Error Model
- Use specific error classes/codes; no `throw new Error(...)` for domain issues
- Do not leak internals or stack traces to clients; log them, return safe codes/messages

### Validation
- Validate dtoIn in ABL using `Validator.load().validate(<dtoInTypeName>, dtoIn)` and process via `ValidationHelper.processValidationResult` with appropriate warnings for unsupported keys and an `InvalidDtoIn` error
- DTO type definitions live in `app/api/validation_types/*.js` using uuApp validation DSL (`shape`, `uu5String`, `id`, `array`, `binary`, ...)
- Unknown keys should be handled explicitly (warn or reject) and size limits enforced via dto types and ABL checks

### Workspace/Instance & State checks
- Ensure uuApp workspace/instance exists and is in an allowed state for the executing profiles/roles using application helpers

### Authorization
- Use `ucEnv.getAuthorizationResult()` and user identity from `session` within ABLs (e.g., ownership checks, role-based permissions)
- Authorization is handled by middleware, so usage of `ucEnv.getAuthorizationResult()` is only in specific cases and should be commented
- **`Public` profile usage policy**: `Public` means unauthenticated access and must be minimized and reviewed. In `*-server/app/config/profiles.json`, only the following use cases may be `Public`: `defaultUve`, `sys/uuAppWorkspace/initUve`, `sys/uuAppWorkspace/loadBasicData`, `getProductInfo`, `getProductLogo`. Severity guidance for anything else: read-only endpoints → Minor (require justification), write operations → Major, administrative or data-exposing use cases (e.g., configuration, migrations, PII) → Blocker. Prefer `Readers` or higher profiles.

### Versioned Data & Migrations
- Define indexes in DAO `createSchema()`; keep them rerunnable and aligned with query patterns

## JavaScript (CommonJS) Conventions

- Use `require` / `module.exports`; avoid hybrid ESM unless the project explicitly supports it
- Prefer async/await; never drop promise rejections
- Keep runtime validation at boundaries; avoid "loose" data flows
- Pure, small functions; clear names; comments explain why, not what
- Avoid side effects at module top-level (safe to `require` without running logic)
- **Bundled libraries (policy)**: Do not use pre-bundled artifacts (UMD/IIFE/minified `*.bundle.js`, `dist/*.min.js`) directly in the project. Always import the package's module entry (`main`/`exports`) via `require` and let the platform/build handle bundling. If a dependency only ships a bundle, escalate and do not integrate without explicit approval.

## Data Access (uuApp + Mongo-style DAOs)

- Scope every query by `awid`
- New query patterns must have supporting indexes; propose specific single/compound indexes and keep them in sync with DAO filters/sorts
- Ensure DAO filters/sorts align with indexes defined in `createSchema()` (e.g., `{ awid, categoryIdList }`, `{ awid, name }` with collation, `{ awid, averageRating }`)
- Convert string ids to database-native types (e.g., `ObjectId`) and before `$in` usage to leverage indexes
- Use projections to limit fields; avoid large payloads by default
- Bulk ops for batch behavior; avoid per-item DB roundtrips
- Consistent unique keys where business rules require uniqueness; handle duplicate key errors gracefully

## Security (OWASP-lite for Node)

- Sanitize and validate all input (path/query/body/headers/files)
- Parameterized queries only; no string-concatenated filters
- Output encoding for any templated content (if applicable)
- Size limits (body, files), content-type checks, allowlisted file extensions
- Redact secrets/PII in logs; never print tokens or credentials
- **Secret management (general)**: No secrets (passwords, tokens, API keys, private keys, certificates) anywhere in the repository (code, configs, tests, CI). Use the Secret Store and reference via `uu_app_secretstore_*` (or env-provided secret refs). Any hardcoded/inline secret → Blocker.
- Reasonable defaults: strict CORS, CSRF where stateful, security headers if serving HTTP
- Binary/image handling: if using a binary store, validate MIME/content type for uploads and translate storage-layer errors to domain errors
- Dependency security: no known vulnerable packages (Sonar/OWASP). Flag outdated high-severity packages
- External integrations: enforce timeouts, retries, input sanitization; no SSRF/path traversal risks
- **Deployment/config secrets policy**: Files matching `*-server/env/uucloudg02-*.json` must not contain plain secrets. The only allowed secret-related entries are references via keys named `uu_app_secretstore_*`. Store all sensitive values in the Secret Store and reference them; any other tokens/passwords/private keys in these files → Blocker.

## Performance & Reliability

- Avoid synchronous CPU work on request thread; if heavy, offload/queue
- Use connection pooling; timeouts and retries with backoff at integration boundaries
- Cache hot, pure computations with explicit invalidation (document the policy)
- Streaming for large responses; compression where useful
- Ensure sorts use index-backed fields (e.g., locale-aware collation indexes for names). If API exposes friendly fields, map to underlying DB fields
- Default paging should be validated and bounded; limit `pageSize` (e.g., <= 1000 unless justified) and validate in ABL
- I/O: avoid blocking calls in request cycle; use async I/O; stream large payloads
- Memory: avoid unbounded arrays/maps
- CPU: avoid synchronous crypto/compression in hot paths
- Concurrency: avoid `await` in loops; prefer `Promise.allSettled` and use `p-limit` for controlled parallelism; handle retries idempotently
- Logging: avoid excessive logs in hot paths; minimize structured logging overhead
- Caching: memoize repeatable heavy operations; define explicit invalidation
- Static Analysis: flag performance-related rules (e.g., `no-await-in-loop`)

**CRITICAL**: When suggesting performance improvements, ALWAYS provide:
- Specific file:line references
- Exact code examples
- Concrete performance metrics or expected improvements
- Specific implementation details

**Example**: "Add uuApp cache in `abl/joke/list-abl.js:45` for `getTopRatedJokes()` to reduce database calls from 3 to 1 per request"

## Testing Requirements

- Unit tests for new or changed logic: success + 1 failure/edge case
- DAO tests use ephemeral DB/fixtures; do not rely on global state
- For concurrency-sensitive code, include a race/retry scenario or explain non-applicability
- Snapshots only for stable, intentional contracts

## Static Analysis & Quality Gates (ESLint + SonarQube)

### Inputs to read
- SonarQube results (local or PR decoration): Quality Gate, coverage on new code, code smells, vulnerabilities
- ESLint summary from local runs
- Config files if present: `.eslintrc.*` / `eslint.config.*`, `tools/sonar-project.*`, coverage reports (`coverage/lcov.info`, `coverage/coverage-summary.json`), `reports/*.json`/`*.sarif`

> If these signals aren't visible, ask for local Sonar/ESLint outputs or artifact paths and mark absence as a process gap (Minor).

### Decision policy (new/changed code)
- **Quality Gate**:
  - Fail → Blocker (Request changes) with quoted failing conditions + link
  - Pass but coverage on new code < 80% → Major (→ Blocker if change touches critical paths: auth, payments, migrations)
- **Vulnerabilities / Security Hotspots**:
  - Any Vulnerability → Blocker
  - Unreviewed Security Hotspot → Major (ask for review/mitigation)
- **Bugs / Code Smells**:
  - Bug (reliability Blocker/Critical) → Blocker
  - Code Smell with effort > 30 min or severity ≥ Major → Major; otherwise Minor with inline fix
- **Duplications** on new code > 3% → Major (propose extraction/refactor)
- **ESLint**:
  - Any error → Blocker
  - > 5 warnings in changed files → Major; require fix or justified suppression
  - `// eslint-disable*` without justification → Major
  - Suppressions must be minimal and justified. Include the exact rule name and a short reason, and scope to a single line when possible:
    - ESLint: `// eslint-disable-next-line <rule> -- reason (JIRA-123)`
    - SonarQube: `// NOSONAR: reason (JIRA-123)`
    - Blanket/file-level disables or rule groups without strong rationale/approval → Blocker. Line-level suppressions without a reason → Major
  - `TODO` / `FIXME` comments must include a concrete action and reference (e.g., ticket/owner/date). Bare markers without explanation → Major. Prefer resolving immediately or creating/tracking an issue.
    - Good: `// TODO (JIRA-123): validate dtoIn size in jokes/list`
    - Bad: `// TODO` or `// FIXME`

### Review output expectations
- Quick Summary must include a one-liner, e.g.: `Sonar: Gate PASS (cov-new 83%, smells 0, vulns 0), ESLint: 0 errors, 2 warnings.`
- Findings should quote exact rule keys/IDs and propose diffs:
  - Sonar: `javascript:S1481` (unused var)
  - ESLint: `no-return-await`

### Coverage nudges (backend JS/CommonJS)
- If cov-new < 80%, request 1–2 focused tests on failure path, boundary logic, and one DAO happy path
- Accept down to 70% only for trivial glue code with rationale

### Process gaps
- If Sonar/ESLint signals are missing from PR, mark Minor and ask for links or artifact paths

## Severity Rules (domain-specific)

### Security
- **Blocker**: Potential exploit (injection, auth bypass, secret leak)
- **Major**: Security misconfiguration, missing validation, logging PII without masking
- **Minor**: Weak defaults, missing headers, lack of tests for error cases
- **Nit**: Documentation/comments

### Performance
- **Blocker**: Query without index on large collection, blocking I/O in hot path, unbounded memory growth
- **Major**: Inefficient loop/algorithm, excessive logging, missing batch ops
- **Minor**: Small optimization, redundant code paths
- **Nit**: Style-related micro-optimizations

## Example Findings (uuApp-flavored)

| Severity | Layer | File:Line | Finding | Why it matters | Suggested fix |
|---|---|---|---|---|---|
| Blocker | Controller | `cmd/contract/import.js:28` | Missing dtoIn validation & size limit | Unsafe input → DoS/injection risk | Validate with schema (`max: 5000 rows`), reject unknown keys |
| Blocker | DAO | `dao/contract-dao.js:74` | Query on `{name, ownerId}` w/o index | Collection scan under load | Add compound index `{ name: 1, ownerId: 1 }` and use it |
| Major | ABL | `abl/contract-abl.js:112` | Non-idempotent retry of import | Double writes on retry | Use upsert with stable key; store operationId dedupe |
| Minor | Logs | `abl/contract-abl.js:45` | Logs raw customerId | PII in logs | Log hashed/truncated ID + correlationId |
| Nit | Style | `helpers/date.js` | Mix of snake/camel | Inconsistent code style | Standardize to camelCase; rename helpers |

## Review Checklist Status (example)
- Correctness ✅ · Security ❌ · Performance ❌ · Tests ❌ · Observability ⚠️ · Docs ❌