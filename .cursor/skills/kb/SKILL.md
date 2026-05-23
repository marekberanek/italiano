---
name: kb
description: "Unified knowledge-base CLI — three-tier vault (UAF → PROJECT → PERSONAL), Obsidian-compatible. Runs without MCP (plain Node via Bash). Use when user mentions knowledge base, KB, Obsidian, wiki articles, MoC, canvas, or wants to save/search/read learned knowledge."
---

# kb — Knowledge Base Skill

One skill, one CLI, no MCP dependency. All KB operations go through `node <this-skill>/skill.js <command> [args]` via the `Bash` tool.

## When to Use

Trigger any time work touches:
- The Obsidian vault at `~/knowledge-bases/` (or `$KB_ROOT`).
- Wiki articles, MoC (Map of Content), Canvas visualizations, cross-links.
- "Save this to KB", "search my notes", "what do I know about X", "compile raw notes".

## CRITICAL RULE: CLI-Only Access

**Never** use `Read`, `Write`, `Edit`, or direct shell `cat`/`sed` on files under `$KB_ROOT`. Always call `node skill.js` — it enforces:
- Per-tier git auto-commit with descriptive messages.
- Tier-direction link policy.
- Safe path validation.
- Meta-index consistency.

## Tier Model & Link Direction

Three tiers, three separate git repository scopes. Each tier is its own repo (or, for PROJECT, one repo per project):

```
$KB_ROOT/
├── UAF/                      ← tier 0 (architecture/framework knowledge) — 1 repo
├── PROJECT/<proj-a>/         ← tier 1 — one repo per project
├── PROJECT/<proj-b>/
└── PERSONAL/                 ← tier 2 (private notes) — 1 repo
```

**Cross-tier link policy** (enforced by `cross-link` and reported by `health`):

| From \ To  | UAF | PROJECT | PERSONAL |
|------------|:---:|:-------:|:--------:|
| UAF        | ✓   | ✗       | ✗        |
| PROJECT/p  | ✓   | same-p only | ✗    |
| PERSONAL   | ✓   | ✓       | ✓        |

Mnemonic: **links flow upward only**. UAF never points at project or personal content. Projects never point at personal content.

Intra-topic `[[article]]` wikilinks are unaffected. Cross-tier links use full form: `[[UAF/topic/wiki/article]]`, `[[PROJECT/<proj>/topic/wiki/article]]`.

## Configuration

| Env var   | Default                  | Purpose                  |
|-----------|--------------------------|--------------------------|
| `KB_ROOT` | `~/knowledge-bases`      | Vault root directory     |

Nothing else to set. Node ≥ 14 and `git` must be on PATH.

## Spec Syntax

- **Topic spec:** `UAF/<topic>` | `PERSONAL/<topic>` | `PROJECT/<proj>/<topic>`
- **File spec:** `<topic-spec>/<relpath>` — e.g. `PERSONAL/notes/wiki/foo.md`

## Phases / Commands

Invoke via: `node $KB_SKILL/skill.js <cmd> [args]` where `$KB_SKILL` is this directory.

### Discover

```bash
node skill.js list                              # all topics grouped by tier
node skill.js list --tier PERSONAL              # filter
node skill.js info UAF/entity-management        # config + counts
node skill.js list-files PERSONAL/notes         # all files in topic
node skill.js compile-status PERSONAL/notes     # unprocessed raw files
```

### Read

```bash
node skill.js read PERSONAL/notes/wiki/foo.md   # prints file to stdout
```

### Search

```bash
node skill.js search PERSONAL/notes "ecc"                 # single topic, text mode
node skill.js search PERSONAL/notes "#ecc"                # tag mode (auto-detected)
node skill.js search PERSONAL/notes "[[bar]]"             # backlink mode
node skill.js search PERSONAL/notes "concept:ecc"         # concept mode
node skill.js cross-search "ecc"                          # all tiers
node skill.js cross-search "ecc" --tier UAF               # scoped to UAF
```

### Write / Ingest

```bash
# Content via --content, --file, or stdin
node skill.js write PERSONAL/notes/wiki/foo.md --content "$CONTENT"
cat body.md | node skill.js write PERSONAL/notes/wiki/foo.md
node skill.js write PERSONAL/notes/wiki/foo.md --file /tmp/body.md --message "update: foo"

node skill.js add-raw PERSONAL/notes source.md --source https://example.com --content "$TEXT"

node skill.js delete PERSONAL/notes/wiki/foo.md
node skill.js move PERSONAL/notes/wiki/foo.md PERSONAL/notes/wiki/sub/foo.md
```

Every write auto-commits to the tier's git repo.

### Graph & Visualization

```bash
node skill.js moc PERSONAL/notes                # regenerate _moc.md
node skill.js moc PERSONAL/notes --dry          # preview only
node skill.js canvas PERSONAL/notes             # topic-level Obsidian Canvas
node skill.js canvas --vault                    # whole-vault canvas (all topics + cross-links)
node skill.js fix-tags PERSONAL/notes           # normalize frontmatter tags
node skill.js fix-tags PERSONAL/notes --dry
```

### Cross-Links (meta index)

```bash
# Allowed: PERSONAL → UAF
node skill.js cross-link add \
  --from PERSONAL/notes/wiki/foo.md \
  --to   UAF/entity-management/wiki/bar.md \
  --relation related-to

# Denied with tier-violation error: UAF → PERSONAL
node skill.js cross-link add --from UAF/... --to PERSONAL/...

node skill.js cross-link remove --from ... --to ...
```

### Maintenance

```bash
node skill.js health                            # all tiers
node skill.js health PERSONAL/notes             # one topic
node skill.js sync                              # git pull all tier repos
node skill.js sync PERSONAL                     # one tier
```

`health` includes a **tier-violation check** over `_meta/index.json` in every tier.

### Lifecycle

```bash
node skill.js init PERSONAL/notes --description "Personal notes" --tags journal,daily
node skill.js init UAF/entity-management --description "Entity mgmt architecture"
node skill.js init PROJECT/demo/features

node skill.js destroy PERSONAL/old-topic --yes   # irreversible
```

## Typical Flows

### 1. Ingest raw content, then compile into wiki article

```bash
# 1. Drop source material
node skill.js add-raw PERSONAL/notes meeting-2026-04-13.md \
  --source "Meeting with X" --content "$RAW"

# 2. Compose wiki article (Claude does the summarizing)
node skill.js write PERSONAL/notes/wiki/meeting-2026-04-13.md --content "$ARTICLE"

# 3. Refresh MoC
node skill.js moc PERSONAL/notes
```

### 2. Answer user question across all KBs

```bash
node skill.js cross-search "entity command" --context 1
# pick relevant hits, then:
node skill.js read UAF/entity-management/wiki/uuCommand.md
```

### 3. Link a personal note up to architectural article

```bash
node skill.js cross-link add \
  --from PERSONAL/notes/wiki/my-learning.md \
  --to   UAF/entity-management/wiki/uuCommand.md
```

## Article Format

Every wiki article has YAML frontmatter + `## Related`:

```markdown
---
source: https://... or "conversation notes"
concepts: [concept1, concept2]
aliases: [alias1]
tags: [tag1, tag2]
---

# Title

#tag1 #tag2

Body with [[intra-topic-wikilinks]] and, when crossing tiers, full form
[[UAF/topic/wiki/article]] or [[PROJECT/<proj>/topic/wiki/article]].

## Related

- [[other-article]] — description
```

## Notes

- **No MCP needed.** This skill runs on plain Node + git. `skilled-plus4u-mcp` is not required.
- **Commits are automatic.** Every write commits to the correct tier repo. The KB repos are the documented exception to the "never auto-commit" rule.
- **Migration from flat layout.** If you have an old `~/knowledge-bases/<topic>` structure (no tier prefix), migrate manually with `git mv` into `PERSONAL/` (or the appropriate tier) — a `kb migrate` helper is planned as a follow-up.
