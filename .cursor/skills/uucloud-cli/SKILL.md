---
name: uucloud-cli
description: Work with uucloud-cli to list deployed apps, download logs, and view gantt charts from uuCloud environments. Use when the user wants to get logs, list deployments, view access log gantt, check deployed instances, or interact with uuCloud CLI. Also use when the user mentions uucloud, uuCloud logs, cloud logs, deployment list, or gantt view.
---

# uuCloud CLI Assistant

Construct and execute `uucloud` commands based on the user's existing local configuration. The CLI is already installed and configured on the machine.

## Critical Rules

- **NEVER** modify `~/.uucloud-cli/config.json` or run `uucloud use`
- **NEVER** create, invent, or suggest new configuration, presets, or resource pool URIs
- **NEVER** load log file content into the context window unless the user explicitly asks to see it
- **ALWAYS** output logs to files using `--output <dir>` or shell redirect `> file`
- **ALWAYS** use existing presets from the user's config via `-p <preset-name>`
- **ALWAYS** discover configuration first before constructing any command

## Workflow: Discover Configuration

Before constructing any command, read the user's config to discover available presets and shortcuts:

```bash
cat ~/.uucloud-cli/config.json
```

From the config, extract:
- `presents` -- named presets with resource pools, log-store URIs, universe URIs
- `shortcuts` -- command aliases
- `authentication` -- configured auth method

When the user mentions an environment name, match it against preset names. If no match is found, ask the user which preset to use.

## Workflow: List Deployed Apps (ps)

Use `uucloud ps` to show what is deployed in an environment.

**Command pattern:**
```bash
uucloud ps -p <preset> [app-filter...]
```

**Examples:**
```bash
# List all apps in a preset environment
uucloud ps -p my-env

# Filter by app code
uucloud ps -p my-env uu-scriptengine

# Filter by tag
uucloud ps -p my-env dev1

# Raw JSON output
uucloud ps -p my-env --codec raw
```

**App filtering works by:**
- App code or part of it (e.g., `scriptengine`, `console`)
- Tags: comma = AND, space = OR (e.g., `dev1,odm dev1,control`)
- ASID or start of it (e.g., `a5b3`)
- Full appDeploymentUri

**Important:** The `ps` output is safe to show in context (it is a small table). Use it to help the user identify the correct app name/tag/asid for log commands.

## Workflow: Download Logs to File

Use `uucloud logs` with `--output` to save logs to a directory. Never stream log content into the context.

**Command pattern:**
```bash
uucloud logs -p <preset> --since <time> --until <time> --output <dir> [options] <app-filter>
```

**Time translation rules:**
| User says | --since value | --until value |
|-----------|---------------|---------------|
| "yesterday" | Calculate ISO timestamp for yesterday 00:00:00 | Calculate ISO timestamp for yesterday 23:59:59 |
| "last 2 hours" | `2h` | (omit) |
| "last 30 minutes" | `30m` | (omit) |
| "today" | Calculate ISO timestamp for today 00:00:00 | (omit) |
| "between 9am and 10am today" | ISO timestamp `YYYY-MM-DDT09:00:00` | ISO timestamp `YYYY-MM-DDT10:00:00` |

Relative time values: `Nh` for hours, `Nm` for minutes (e.g., `24h`, `42m`).
Absolute timestamps: ISO format `YYYY-MM-DDTHH:mm:ss` (e.g., `2025-01-15T09:00:00`).

**Codec options for file output:**
- `--codec jsonstream` -- line-delimited JSON, best for later processing with `jq`
- `--codec json` -- full JSON per record
- (default `formatted`) -- human-readable text

**Server-side criteria filtering** (efficient, runs on server):
```bash
# Only access logs
-c recordType:ACCESS_LOG

# Only errors
-c logLevel:ERROR

# Multiple criteria
-c recordType:TRACE_LOG -c logLevel:ERROR
```

**Client-side filtering** (runs locally after download, filtrex syntax):
```bash
--filter "responseTime > 1000"
--filter "logLevel == \"ERROR\""
--filter "not (urlPath ~= \"sys/getHealth\")"
```

**Multi-app log download** (requires `--allow-multi-app`):
```bash
uucloud logs -p <preset> --since 2h --output ./logs --allow-multi-app app1 app2
```

**Examples:**
```bash
# Download last 24h of scriptengine logs
uucloud logs -p my-env --since 24h --output ./logs --codec jsonstream uu-scriptengine

# Download yesterday's error logs
uucloud logs -p my-env --since "2025-01-14T00:00:00" --until "2025-01-14T23:59:59" --output ./logs -c logLevel:ERROR console-app

# Download access logs from specific time window
uucloud logs -p my-env --since "2025-01-15T09:00:00" --until "2025-01-15T10:00:00" --output ./logs -c recordType:ACCESS_LOG my-app
```

**After running:** Report the output directory path to the user. Do NOT read the log files unless the user explicitly asks.

**Recovery:** If a download was interrupted, resume with `--recover` (requires `--codec jsonstream`, `--output`, and time interval).

## Workflow: Gantt View

Use gantt codec to visualize ACCESS_LOG records as a timeline chart. This runs interactively in the terminal.

**Constraints:**
- Requires `--codec gantt`
- Requires `-c recordType:ACCESS_LOG`
- Only works for a single app (no multi-app)
- Cannot use `--follow`
- Cannot use `--disable-resolving` (`-n`)

**Command pattern:**
```bash
uucloud logs -p <preset> -c recordType:ACCESS_LOG --since <time> --until <time> --codec gantt <single-app>
```

**Optional filtering to clean up the view:**
```bash
--filter "not (urlPath ~= \"sys/getHealth\")"
```

**Example:**
```bash
uucloud logs -p my-env -c recordType:ACCESS_LOG --since "2025-05-28T09:00:00" --until "2025-05-28T09:05:00" --codec gantt --filter "not (urlPath ~= \"sys/getHealth\")" uu-scriptengine
```

**Important:** The gantt view is interactive in the terminal. Run it with `block_until_ms: 0` or let the user interact with it directly. Do NOT try to capture its output.

## Workflow: Follow Live Logs

Use `--follow` to tail logs in real-time.

**Constraints:**
- Cannot use `--since`, `--until`, or `--output` with `--follow`
- To save followed logs to a file, pipe through `tee`

**Command pattern:**
```bash
# Follow in terminal (run backgrounded)
uucloud logs -p <preset> -f <app-filter>

# Follow and save to file
uucloud logs -p <preset> -f --color=always <app-filter> | tee logs-output.txt
```

**Important:** Run follow commands with `block_until_ms: 0` as they are long-running. Never try to load the streaming output into context.

## Quick Command Reference

### ps options
| Option | Short | Description |
|--------|-------|-------------|
| `--present` | `-p` | Use named preset |
| `--resource-pool` | `-r` | Resource pool URI/OID (prefer preset) |
| `--universe-uri` | | uuCloudUniverse URI |
| `--codec` | | `table` (default) or `raw` (JSON) |
| `--verbose` | `-v` | Debug output |

### logs options
| Option | Short | Description |
|--------|-------|-------------|
| `--present` | `-p` | Use named preset |
| `--follow` | `-f` | Tail live logs |
| `--output` | `-o` | Save to directory |
| `--since` | | Start time (ISO or relative like `2h`) |
| `--until` | | End time (ISO or relative) |
| `--codec` | | `formatted`, `json`, `jsonstream`, `gantt` |
| `--criteria` | `-c` | Server-side filter `key:value` |
| `--filter` | | Client-side filtrex expression |
| `--format` | | Custom Handlebars output format |
| `--time-window-type` | | `timeStamp` (default), `time`, `eventTime` |
| `--allow-multi-app` | | Download from multiple apps |
| `--recover` | | Resume interrupted download |
| `--disable-resolving` | `-n` | Skip app code/tag resolution |
| `--log-store-uri` | | Override log store URI |
| `--color` | | `auto`, `always`, `never` |
