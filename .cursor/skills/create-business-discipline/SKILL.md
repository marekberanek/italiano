---
name: create-business-discipline
description: Create a Business Discipline section of a uuApp Business Model Kit (BMK) — the high-level overview page with dictionary, uuP classification, uuBml stencil, and concept sub-pages. Use when the user asks to create or update a business discipline, write concept pages (Authorization, Time Validity, etc.), or design the high-level view of a uuApp domain.
---

# Create uuApp Business Discipline

Generate the **Business Discipline** section of a uuApp Business Model Kit (BMK), following uuP methodology standards and the official uuApp business modeling methodology.

## Scope: What This Skill Covers

The **Business Discipline** is ONE section of the BMK. It provides the **high-level view** of the solution — what it does, how it's structured, and key cross-cutting concepts.

```
BMK (the whole book)
├── Control Panel
├── ▶ Business Discipline  ◄── THIS SKILL GENERATES THIS SECTION
│     ├── Main page (overview, dictionary, classification, stencil)
│     ├── {Concept: Authorization}
│     ├── {Concept: Time Validity}
│     ├── {Concept: References/Dependencies}
│     └── ... (other concept sub-pages)
├── Processes              ◄── NOT this skill
├── Business Actors        ◄── NOT this skill
├── Products               ◄── NOT this skill
├── Business Use Cases     ◄── NOT this skill
├── Business Scenarios     ◄── NOT this skill
└── ...
```

### What IS a Business Discipline?

A **Business Discipline** describes **how the vision will be fulfilled**. It is:
- A **high-level view** of the business area, its structure, and the main parts of the solution
- Typically written as a concise document (roughly **one A4 page**) with text and diagrams
- The place to "see the elephant" — the big picture of the solution, its decomposition, its interaction with other systems
- Different from a vision: vision = problem/needs/benefits; discipline = **the realization** of the solution

It sits at the top of the business model hierarchy:

```
Business Discipline
├── can be further specified by → Concepts (sub-pages of the discipline)
└── is decomposed into → Processes → Business Use Cases → Products
```

### What Are Concepts?

**Concepts** are sub-pages of the Business Discipline used when an area is too complex or needs further elaboration. They help clarify requirements, reduce uncertainty, or support discussions with stakeholders.

One common concept is the **High-Level Concept (HLC)** — a simple, overall idea of the whole discipline with more detail than the main page but without all the specifics.

**A concept's structure is NOT rigidly defined** — it should be adjusted according to current needs, based on the nature of the described thing.

## Modeling Approach (from official methodology)

- **No single recipe** — adapt the approach depending on context, people, and the type of problem
- **Two perspectives** — the **static** view (what exists — products/entities) and **dynamic** view (what happens — processes/actions). The discipline page should convey both at a high level
- **Iterative process** — constantly revisit earlier decisions and refine as new insights emerge
- **Systems thinking** — the solution is a set of smaller, connected modules; understand what is inside vs outside scope
- **Keep the big picture** — the discipline IS the big picture

## CRITICAL: Business Language Rule

**The Business Discipline and its Concept pages are written for non-technical stakeholders** — customers, managers, product owners, business analysts. NOT developers. Imagine explaining the solution to someone who has never seen the codebase and never will.

**The writing test**: before writing any sentence, ask: "Would a non-technical manager understand this?" If not, rewrite it in business terms.

### FORBIDDEN in Business Discipline and Concept pages

The following MUST NEVER appear in generated content:

- **API command references** — `entityItem/list`, `entityDefinition/create`, `{useCase}/notAuthorized`, etc. Describe WHAT happens, not which command does it.
- **JSON / code examples** — no `dtoIn`, no `const dtoIn = {...}`, no JS code blocks. Use tables, bullet lists, or plain-text illustrative examples instead.
- **Internal property paths** — `entityDefinitionAuthorization.authorizationStrategy`, `profileMap`, `artifactIdAttributeKey`, etc. Translate to business terms.
- **Backend service names** — `uuObc/authorizeMe`, `uuArtifactIfc/authorizeMeToArtifactIdList`, etc. Describe the business outcome, not the service call.
- **Implementation-detail table columns** — columns named "Configuration", "Backend", "API endpoint" that expose internal names. Use business-facing columns: "Capability", "Benefit", "Who uses it", "When to use".
- **Technical jargon without translation** — `profileMap`, `profiles.json`, `authorizationStrategy`. Either translate to a business term ("permission mapping", "access control method") or ask the user for the right business term.
- **"This page describes..." opening** — never start a section with meta-descriptions like "This page describes..." or "This page contains the description of...". Start directly with the business content: the problem, the motivation, or what the solution does.

### ALLOWED alternatives

- Simple tables with business-facing columns ("What / When / Who / Benefit")
- Diagrams showing relationships, flows, and structures
- Bullet-point descriptions in plain language
- Illustrative text-based examples (scenarios, not code)

### When technical depth IS needed

If a concept genuinely requires technical detail (e.g., for a developer audience), push it to a dedicated concept sub-page and mark it explicitly as a "Technical Concept" for a developer audience. Even then, keep content concise and illustrative — not specification-grade. The default assumption is always: business audience.

## Execution Modes

Choose one mode explicitly at the start of work. **All modes require Phase 0 (research) first.**

- **`guided-discovery` (default)**  
  Run Phase 0 research → present fact sheet to user → discuss structure → generate content.
- **`draft-generation`**  
  Run Phase 0 research → generate discipline page + concept pages → mark assumptions where sources were insufficient.
- **`publish-ready`**  
  Run Phase 0 research → generate content ready for BookKit upload (clean UU5 form, no placeholders). Only viable when Phase 0 produces a complete fact sheet.

## CRITICAL: Research Before Generation

**The #1 failure mode is generating from templates without researching the actual domain.**

The discipline page is the HIGH-LEVEL VIEW of the entire solution. To write it well, you must understand the products, actors, processes, and use cases — even though you're not generating those sections. You cannot write a good overview of something you don't understand.

The fix: **research first, generate second**. Every fact in the output must trace back to a real source (code, BMK page, user statement). If you cannot trace it, do not write it.

## CRITICAL: Never Invent Vocabulary

**The #2 failure mode is making up definitions for terms found in the codebase.**

When you encounter abbreviations, product names, or domain-specific terms in code whose meaning is NOT explicitly documented in a source you have read:

1. **NEVER guess or invent a definition.** The BMK is treated as an authoritative source — a fabricated definition will propagate and cause confusion.
2. **Mark the term as unknown** in the fact sheet: `[DEFINITION UNKNOWN - ask user]`
3. **ASK the user**: "I found the term '{X}' in the code. What does it mean in business terms?"
4. **Do NOT include undefined terms in the Dictionary section** — only include terms with confirmed definitions from documentation, existing BMK pages, or explicit user statements.

This applies especially to:
- External system/product names (e.g., uuAtc, uuObc, uuBt) — these have specific meanings; do not guess
- Domain abbreviations that are not self-explanatory
- Profile names or role names that may have domain-specific meaning
- Any term where you are even slightly uncertain about the definition

**It is always better to have a gap in the output and ask than to publish a fabricated definition.**

## Phase 0: Mandatory Context Research (BEFORE any generation)

**Do NOT skip this phase. Do NOT generate any content until all available sources are read.**

### Step 0a: Read the codebase (if available)

Run these in parallel using explore agents or direct reads:

| Source | What to extract | Where to find it |
|--------|----------------|------------------|
| `mappings.json` | All API commands → understand what operations exist | `src/config/mappings.json` |
| `profiles.json` | All actor profiles → understand who uses the system | `src/config/profiles.json` |
| `index.js` | Exported modules → understand what domain objects exist | `src/index.js` |
| Service files | Business logic, validation rules, object relationships | `src/components/*.js` |
| Error files | Error codes and their contexts | `src/api/errors/*.js` |
| ABL files | Use-case implementations | `src/abl/**/*.js` |

### Step 0b: Read existing BMK documentation (if available)

- Use `bookkit-read` or `bookkit-list-pages` to read existing BMK pages
- Read the EXISTING discipline page and concepts if they exist (you may be updating, not creating from scratch)
- Extract: real terminology, object names, established patterns, existing diagrams
- If a BMK already exists, match its style and vocabulary

### Step 0c: Build a fact sheet (mandatory output before generating)

Before writing ANY content, produce this internal fact sheet:

```
DOMAIN: {name}
SOURCES READ: [list of files/pages actually read]

DOMAIN OBJECTS (from code/docs):
- {ObjectName}: {what it actually does}
- ...

KEY ACTORS (from profiles.json/docs):
- {ProfileName}: {what they can do}
- ...

KEY PROCESSES (from mappings.json/docs):
- {ProcessArea}: {what it covers}
- ...

DEPENDENCIES (external systems/disciplines):
- {Dependency}: {how this discipline interacts with it}
- ...

CROSS-CUTTING CONCERNS (potential concept pages):
- {Concern}: {why it needs elaboration, what's complex about it}
- ...

DICTIONARY TERMS (every term MUST have a confirmed source):
- {term}: {definition from docs/code} | SOURCE: {file or page where definition was found}
- {term}: [DEFINITION UNKNOWN - ask user] | FOUND IN: {filename where term appears but definition is missing}
- ...
```

**If the fact sheet is mostly empty, ask the user for sources before generating.**
Do NOT fill gaps with generic descriptions. Mark unknowns as `[UNKNOWN - needs source]`.
**For dictionary terms specifically**: no source = no definition = ask the user. Never invent definitions.

### Step 0d: Ask the user ONLY for what cannot be found

If the codebase and docs don't answer these, then ask:
- "What is the high-level purpose of this discipline — what problem does it solve?"
- "Which external systems/disciplines does it depend on?"
- "Are there any cross-cutting concerns that need concept pages (authorization, time validity, etc.)?"
- "What terms should go in the dictionary?"
- "Who is the audience for this discipline page — architects, product owners, developers?"

## Step 1: Write the Business Discipline Main Page

The main page provides the **high-level view** of the solution. It must be understandable by someone who has never seen the codebase — a customer, a manager, a product owner. No technical details. No code. No API references.

### Required Sections

#### Overview (A4)

**HARD LENGTH CONSTRAINT: The entire Overview section MUST fit on roughly one A4 page including any diagrams.** If it exceeds this, you are writing too much — cut ruthlessly. This is the ONE page someone reads to understand what this discipline is about.

Structure the Overview with two sub-sections (inspired by the uuEnelane BMK pattern):

**Motivation** (1-2 paragraphs)
- What business problem or need motivated this solution
- Why it exists, who benefits, what value it brings

**What is {DisciplineName}** (1-2 paragraphs + bullet list)
- What the solution does — in business terms, not technical terms
- Key capabilities as a short bullet list (3-5 items maximum)
- How it fits into the broader ecosystem (dependencies, integrations) — one sentence

**NEVER start the Overview with "This page describes..." or "This page contains...".** Start directly with the motivation or the description of the solution.

**NO tables with implementation-detail columns** (Configuration, Backend, API endpoint). If a summary table is needed, use business-facing columns such as "Capability | Benefit | Who uses it".

**NO code examples** on the main page — not even simple ones.

#### Dictionary

**An important and often overlooked part.** Define every business-specific term, abbreviation, or concept that a newcomer to the project or business would need to understand.

Include:
- Domain-specific terms that could be ambiguous (e.g., "ID" might mean "identifier" in IT but "intraday" in energy)
- Abbreviations used in the discipline
- Terms that required even brief discussion to clarify
- The agreed-upon names for things in the solution

**When in doubt, add the term.** It is better to over-document the dictionary than to have team members use inconsistent terminology.

As the official materials note: even "commonly known" terms can mean different things in different contexts. If someone from outside this project or business could misunderstand a term, define it.

#### uuP Classification Diagram

Shows the discipline's position in the uuP methodology ecosystem.

Elements:
- `uuP` icon (methodology2, importance: normal)
- `{DisciplineName}` icon (methodology2, importance: objective)
- `{DisciplineName}` icon (uuapp, importance: highest)
- Dependency icons (methodology2, importance: high) for each dependency

Connections:
- Dashed connector: discipline → uuP (association)
- Solid connector: discipline → uuApp
- Dashed multi-connector: discipline → dependencies

#### uuBml Stencil (Domain Object Model)

All domain objects in a tiered/organized layout showing the overall structure of the discipline. This gives readers a quick visual map of what entities this discipline manages.

- One icon per domain object using the discipline's uuBml stencil
- Organize spatially by logical grouping (structural objects, business data, supporting objects, etc.)
- No connectors needed — spatial grouping conveys relationships at this level
- Use discipline stencil icons if available, otherwise `special/missingIcon`

## Step 2: Write Concept Sub-Pages

Concepts are sub-pages that elaborate on specific areas of the discipline. Create them when:
- The business area is too complex for the main discipline page
- Stakeholders need alignment on a specific aspect before proceeding
- New functionality impacts existing parts of the system
- A cross-cutting concern affects multiple products or processes

### Common Concept Types

| Concept | When to create it | What it covers |
|---------|------------------|----------------|
| **High-Level Concept (HLC)** | Always useful as a first concept | Simple overall idea of the whole discipline — more detail than the main page but without all specifics |
| **Authorization** | When the permission model is non-trivial | Who can do what, permission inheritance, bound artifacts |
| **Time Validity** | When entities have temporal aspects | How time intervals work, querying by time, boundary semantics |
| **Object Identification** | When identification is complex | Multiple ways to identify objects (id, code, composite keys) |
| **References/Dependencies** | When integrating with other disciplines | How this discipline depends on and interacts with others |
| **Events** | When the discipline publishes/consumes events | Event types, payloads, triggers, consumers |
| **Multilingual Support** | When localization matters | How localized strings are handled across the discipline |
| **Versioning/Revisioning** | When objects have version history | How historical versions are tracked and queried |

### Concept Page Structure

**A concept's structure is NOT rigidly defined** — adapt it based on the nature of what you're describing. However, the default assumption is that concept pages are **business-facing documents**, not technical specifications.

**Length guidance**: a concept page should be readable in 5-10 minutes. If it takes longer, it is too detailed for this level — move technical details to a separate technical concept or product documentation.

#### Tier 1: Business-Facing Concept (DEFAULT)

This is the default for ALL concept pages unless the user explicitly requests technical depth.

1. **Description** — 1-2 short paragraphs: what the concept is and why it matters in this discipline. **Never start with "This page describes..."** — start with the substance.
2. **Overview** — Summary table or classification diagram showing the concept's variants/modes
3. **Per-variant sections** — Each with:
   - Description of the variant in business terms (1-2 paragraphs)
   - Diagram (when it genuinely aids understanding — see Diagram guidance below)
   - **Business rules** as explicit numbered list (not buried in prose)
   - **Simple illustrative example** — a text-based scenario, a table, or a short description with concrete data. NOT a JSON code block.
4. **Summary** (optional) — Comparison table across variants, or key takeaways

**What does NOT belong in a Tier 1 concept:**
- JSON / code examples (`dtoIn`, `const x = {...}`, JS code blocks)
- Validation schemas (`shape({...})` code)
- Error code tables with internal error identifiers
- Configuration property paths
- API command references

#### Tier 2: Technical Concept (ONLY when user explicitly requests)

Use this tier ONLY when the user explicitly says the audience is developers or requests technical depth. Even then, keep it concise — this is a business model, not API documentation.

Everything from Tier 1, PLUS (used sparingly):
- Concise data structure examples with comments (illustrative, not exhaustive)
- Configuration overview (what can be configured, not every property)
- Error scenarios table (main errors, not every edge case)

**Mark the page explicitly** as targeting a technical audience in the description.

### Diagram Guidance for Concept Pages

**Generate diagrams IN THE SAME PASS as the text content** — never generate all text first and add diagrams later. This ensures diagrams match the text structure and prevents them from being skipped.

#### When diagrams are required vs. recommended

- **Overview / Classification section** — MUST have a diagram (taxonomy/hierarchy showing variants)
- **Variant / mechanism sections** — SHOULD have a diagram when it genuinely aids understanding. A well-written paragraph with a bullet list can be sufficient for simple variants.
- **Summary / error sections** — No diagram needed (tables suffice)

**Keep diagrams concise** — 3-5 main elements per diagram. A diagram that tries to show everything becomes unreadable. Focus on the key relationships or flow.

**Section structure with diagram (when used):**
```
Section Header
├── 1-2 paragraph description (what this section covers)
├── Diagram (with caption explaining what it shows)
├── Business rules as numbered list
└── Simple illustrative example (text/table, not code)
```

### Diagram Content Rules

**Every diagram MUST include callout icons** (see bml-diagram skill Rule 16):
- Use low-importance icons (`type: 'activityCondition', importance: 'low'`) as step labels
- Place callouts in the left or right margin, numbered "1. ", "2. ", "3. " for sequential flows
- Each callout explains what happens at that stage of the diagram
- 3-5 callouts per diagram is the sweet spot — enough to guide the reader without cluttering

**Every diagram MUST avoid line crossings** (see bml-diagram skill Rule 15):
- Place parent icons 2-3 rows above children for vertical fan-outs
- Never use horizontal multi-connector trunks that pass through occupied columns
- Align each source directly above its primary target for straight vertical connections

Three types of diagrams for concept pages:

**Type 1: Structure/Classification diagrams**
- Visual taxonomy showing the concept's variants
- Entity-to-entity relationships with multiplicity labels (1:1, 1:N)
- **Add callout labels for each group** (e.g., "Workspace Level", "Item Level", "Cross-cutting")

**Type 2: Data flow diagrams**
- How data moves between components during operations — described in BUSINESS terms
- 3-4 component icons connected with labeled arrows: "stores", "validates", "queries", "creates"
- **Add numbered step callouts in business language** (e.g., "1. Check user permissions", "2. Filter accessible items", "3. Return result")

**Type 3: State/Timeline diagrams**
- How data changes over time, before/after states
- Show state transitions, gap detection, error scenarios
- **Add callout labels explaining what changed** (e.g., "Gap detected", "Boundary shifted")

### Concept Quality Indicators

A concept page is complete when it has:
- A classification/taxonomy diagram in the overview section
- **Diagrams include callout icons** explaining each step or group
- **No line crossings** in any diagram
- Concrete examples with realistic data — as text/table scenarios, not code blocks
- Clear business rules (numbered list, not buried in prose)
- Every paragraph says something specific to THIS discipline (no generic filler)
- **Business language throughout** — no CMD references, no JSON, no internal property paths
- **Readable in 5-10 minutes** — if it takes longer, it is too detailed

Use the **bml-diagram** skill to generate all diagrams programmatically.
Follow bml-diagram Rules 15 (no crossing) and 16 (callout icons) for every diagram.

## Step 3: Generate uuBML Diagrams

Generate diagram JSON for each diagram. See [reference.md](reference.md) for full uuBML JSON patterns.

### Required Diagrams for the Business Discipline Section

#### Main Page Diagrams
1. **uuP Classification** — Discipline's place in uuP methodology and its dependencies
2. **Domain Object Model (uuBml Stencil)** — All domain objects in organized layout

#### Concept Page Diagrams (as needed per concept)
3. **Structure/Classification diagrams** — Entity relationships, taxonomy of variants
4. **Data flow diagrams** — How operations work, component interactions
5. **State/Timeline diagrams** — How data evolves, before/after states

### Diagram Script Capability (Required for Complex Concept Pages)

For concept pages with multiple diagrams, generate a reusable `diagrams/generate-all.js` script with:
- One function per diagram + one main runner
- Adaptive fit sizing per diagram (content-based, not fixed)
- Compact layout avoiding unnecessary vertical space

## Step 4: Validate

### Structural Checklist
- [ ] Business Discipline main page has Overview (A4), Dictionary, uuP Classification, uuBml Stencil
- [ ] Dictionary covers all domain-specific terms and abbreviations
- [ ] uuP Classification includes all dependencies on other disciplines
- [ ] Domain Object Model includes all domain objects
- [ ] Each concept sub-page has description, overview, diagrams, and examples
- [ ] Concepts that need elaboration have dedicated sub-pages

### Content Substance Checklist (CRITICAL)
- [ ] **Zero filler** — every paragraph says something specific that could only be true of THIS discipline
- [ ] **Real names everywhere** — object names match the codebase, actor names match `profiles.json`
- [ ] **No duplicate information** — the discipline overview doesn't repeat what's on product/process/BUC pages; it provides the BIG PICTURE
- [ ] **Diagrams show real structures** — object relationships from actual service code, not generic labels
- [ ] **Dictionary is populated** — all domain-specific terms are defined, each with a confirmed source
- [ ] **No invented vocabulary** — every term in the dictionary has a confirmed definition from documentation or user statement
- [ ] **Every sentence has a source** — if you can't point to where you learned it (code, BMK page, user statement), delete it
- [ ] **Business language throughout** — no CMD references, no JSON examples, no internal property paths, no backend service names
- [ ] **No "This page describes..." openings** — every section starts with actual business content
- [ ] **Concise** — main page fits on one A4, concept pages readable in 5-10 minutes

### Anti-Patterns (things that ALWAYS produce bad output)

| Anti-Pattern | What Goes Wrong | Fix |
|-------------|----------------|-----|
| **Generic overview** | "Standardizes how organizations define business objects" (could describe anything) | State what THIS discipline ACTUALLY does specifically |
| **Missing dictionary** | Team members use inconsistent terminology | Populate dictionary from domain research |
| **Concepts as summaries** | Concept page just repeats what's on the main page with slightly more words | Each concept page should elaborate on something that DOESN'T fit on the main page |
| **Made-up object hierarchies** | "Business Layer" and "Content Layer" when the code has no such separation | Use actual object hierarchy from service code and mappings |
| **Copying from other disciplines** | Reusing text/structure from another discipline's BMK verbatim | Research THIS discipline; use other BMKs only as structural reference, not content source |
| **Concepts without diagrams** | Wall of text explaining a complex system without visuals | Add a diagram at least in the overview section; add more where they genuinely aid understanding |
| **Text-first, diagrams later** | Generating all text content first, then adding diagrams as afterthought. Results in diagrams that don't match text structure, and often diagrams get skipped entirely | Generate each section's diagram IN THE SAME PASS as its text. Write the diagram generator function alongside the section content |
| **Diagrams without callouts** | Diagram has icons and connectors but no explanatory labels. Reader can't understand the flow without reading surrounding text | Every diagram must have 3-5 callout icons (low-importance activityCondition) explaining steps or groups. See bml-diagram Rule 16 |
| **Lines crossing through icons** | Multi-connector trunk lines cut through icons because parent and children are on the same row or too close | Place parent 2-3 rows above children. Use vertical fan-outs, never horizontal trunks through occupied space. See bml-diagram Rule 15 |
| **Template-first generation** | Filling in template placeholders without understanding the domain | Read the code and existing docs first; generate second |
| **"This page describes..." opening** | Meta-description wastes space and adds no value. Reads like boilerplate. Every evangelist flags this as an anti-pattern. | Start directly with the business content: the problem, the motivation, or what the solution does. |
| **Implementation-detail table columns** | Columns like "Configuration", "Backend", "API endpoint" expose internal names that mean nothing to business readers. | Use business-facing columns: "Capability", "Benefit", "Who uses it", "When to use". |
| **CMD/API references in content** | `entityItem/list`, `entityDefinition/create` are developer-level details. Business stakeholders cannot act on this information. | Describe WHAT happens in business terms, not which command does it. |
| **JSON/code examples** | `dtoIn` examples, JS code blocks are developer documentation, not business modeling. They do not belong in a business discipline or its concepts. | Use simple tables, bullet lists, or text-based illustrative examples. Push code to technical documentation if needed. |
| **Made-up vocabulary** | Defining abbreviations (e.g., "uuAtc") without a confirmed source. Readers trust the BMK as authoritative — fabricated definitions propagate and cause confusion. | Mark unknown terms as `[DEFINITION UNKNOWN]`, ask the user for the correct definition. Never guess. |
| **Technical jargon without translation** | Using internal names like "profileMap", "authorizationStrategy", "artifactIdAttributeKey" directly in business content. | Translate to business terms: "permission mapping", "access control method". Or ask the user for the right business term. |
| **Specification-grade concepts** | Concept page reads like API documentation: every error code, every config property, every edge case. Way too long and detailed for business audience. | Concepts explain the IDEA, not the implementation. Keep focused on what matters to business stakeholders. Target 5-10 minute read time. |
| **All content in one BookKit section** | Everything dumped into a single body section. No visual separation, not independently editable, overwhelming wall of content. | Split into separate BookKit body sections: one per major topic. Use `bookkit-update` `add` action for each new section. |
| **Nested `<uu5string/>` in diagram embeds** | Diagram tag includes `<uu5string/><UuBml.Draw.Diagram .../>` inside a section that already starts with `<uu5string/>`. The nested prefix breaks rendering. | Strip `<uu5string/>` prefix from `DiagramBuilder.toUu5String()` before embedding: `builder.toUu5String().replace(/^<uu5string\/>/, "")`. |
| **Text-heavy sections without diagrams** | Long prose descriptions of each authorization approach with no visual aids. Business readers lose interest and understanding. | Every concept variant section MUST have a diagram. Keep text to 1-2 paragraphs + punchy business rules. The diagram does the heavy lifting. |
| **Verbose example blocks** | Multi-paragraph example scenarios that repeat what the description and diagram already convey. Adds length without clarity. | Remove separate Example blocks. The diagram IS the example. If prose examples are needed, keep them to 2-3 sentences inside a styled block. |

For `publish-ready` mode, run a short precision pass:
- [ ] Terminology matches existing domain naming conventions
- [ ] Error codes and API names are aligned with known sources
- [ ] No placeholder examples that contradict discovered behavior

## UU5 Formatting

For UU5 page content formatting rules (code blocks, section blocks, inline code), see the **bml-diagram** skill's "UU5 Page Content Formatting" section. Those rules apply to ALL generated page content.

### CRITICAL: Use uu5g05 Components Only

**NEVER use uu5g04 components (`UU5.Bricks.*`).** Always use uu5g05 equivalents:

| uu5g04 (NEVER use) | uu5g05 (ALWAYS use) | Notes |
|---------------------|---------------------|-------|
| `UU5.Bricks.Section` | `Uu5Bricks.Section` | Section with `card="none"`, `headerType="heading"` by default |
| `UU5.Bricks.Header` | `Uu5Elements.Header` | Use `level` prop for heading hierarchy |
| `UU5.Bricks.P` | `Uu5Elements.Text` | Prefer direct Text blocks for prose |

| `UU5.Bricks.Code` | `Uu5Bricks.Code` | Inline code |
| `UU5.Bricks.Table.*` | `Uu5TilesBricks.Table` | Use `columnList` + `data` props |
| `UU5.Bricks.Pre + Code` | `Uu5CodeKitBricks.Code` | Code blocks with syntax highlighting |

### Section Component (`Uu5Bricks.Section` + `Uu5RichTextBricks.Block`)

Use `Uu5Bricks.Section` with `Uu5RichTextBricks.Block` for text content. Each BookKit body section contains one top-level `Uu5Bricks.Section`.

```xml
<!-- Simple section -->
<Uu5Bricks.Section headerSeparator=false header="Section Title">
  <Uu5RichTextBricks.Block uu5String="<uu5string/><p>Paragraph content.</p>"/>
</Uu5Bricks.Section>

<!-- Section with sub-sections -->
<Uu5Bricks.Section headerSeparator=false header="Main Section">
  <Uu5RichTextBricks.Block uu5String="<uu5string/><p>Introduction text.</p>"/>
  <Uu5Bricks.Section headerSeparator=false header="Sub-section Title">
    <Uu5RichTextBricks.Block uu5String="<uu5string/><p>Sub-section content.</p>"/>
  </Uu5Bricks.Section>
</Uu5Bricks.Section>
```

**Key rules:**
- The hierarchy is: `Uu5Bricks.Section` → `Uu5RichTextBricks.Block`
- Always set `headerSeparator=false` on `Uu5Bricks.Section`
- **CRITICAL: `Uu5RichTextBricks.Block uu5String` MUST start with `<uu5string/>`** — without this prefix the content will not render
- Sub-sections use nested `Uu5Bricks.Section` elements inside the outer section
- One top-level `Uu5Bricks.Section` per BookKit body section
- **Always validate with the uu5-string-validator before uploading**

### Lists

**Simple lists** use `UU5.Bricks.Ul/Ol` + `UU5.Bricks.Li`.
**Numbered lists:**

```xml
<Uu5RichTextBricks.Block uu5String="<uu5string/><ol><li>Step one</li><li>Step two</li><li>Step three</
li></ol>"/>
```
**Algorithm-style step lists** use `UuApp.DesignKit.BulletList` (placed inside `Uu5Bricks.Section`, alongside `Uu5RichTextBricks.Block` elements):

```xml
<UuApp.DesignKit.BulletList data="<uu5json/>{
  \"itemList\": [
    {\"type\":\"bulletItem\",\"id\":\"s01\",\"name\":\"Step title\",\"desc\":\"<uu5string /><UU5.Bricks.Div>Step description.</UU5.Bricks.Div>\",\"customIcon\":\"mdi-chevron-right\"}
  ],
  \"name\":\"Procedure Title\",
  \"desc\":\"\"
}"/>
```

**CRITICAL: Inside BulletList `data`, use `\"` (backslash-escaped quotes), NEVER `&quot;`.**

### Diagrams in Concept Pages

**The overview section MUST include a classification/taxonomy diagram.** Every concept variant section MUST also include a diagram — diagrams are not optional for variant sections.

**Section diagram placement:**
1. Place 1-2 concise paragraphs of description first
2. Embed the BML diagram tag directly after the description (NO sub-section wrapper, NO `<uu5string/>` prefix — just the raw `<UuBml.Draw.Diagram>` tag)
3. Follow with business rules as `UuApp.DesignKit.BulletList`
4. NO separate "Example" blocks — the diagram serves as the visual example

**CRITICAL: Do NOT wrap the diagram in a `<uu5string/>` prefix.** The diagram tag from `DiagramBuilder.toUu5String()` includes a `<uu5string/>` prefix that must be stripped before embedding inside another section. Use: `builder.toUu5String().replace(/^<uu5string\/>/, "")`

**All diagrams MUST have:**
- Callout icons explaining each step (see bml-diagram Rule 16)
- No line crossings through icons (see bml-diagram Rule 15)
- Vertical fan-outs with 2-3 row gaps between parent and children
- **Business-language labels** — no CMD names, no internal service names

Use the **bml-diagram** skill to generate all diagrams programmatically.

### Other Formatting Defaults

- Prefer `significance="distinct"` over `highlighted` for callout blocks
- Prefer `card="content"` for nested helper blocks
- For `Uu5CodeKitBricks.Code`, keep raw code quotes. **CRITICAL: `value='...'` must NOT contain literal single quotes**
- For `Uu5TilesBricks.Table`, use `data` as array of row arrays and `columnList` with `header` props
- Prefer direct `Uu5Elements.Text` paragraphs for prose
- For sections, use `Uu5Bricks.Section` with `Uu5RichTextBricks.Block` (see Section Component above)
- Keep diagrams compact with adaptive fit sizing

## Output Format

Present each section as structured UU5 string content for uuBookKit pages. For uuBML diagrams, output the JSON structure that can be imported into uuBmlDraw.

## CRITICAL: BookKit Page Section Architecture

### Rule: One BookKit Section per Top-Level Topic

**NEVER put all content into a single BookKit body section.** BookKit pages are composed of multiple body sections (each independently editable). Each major topic MUST be its own BookKit body section.

```
BookKit page body[] array:
  section 0: Comments (system)
  section 1: BasicInfo (system)
  section 2: Activity List (system)
  section 3: Overview (intro + overview table + diagrams)     ← one body section
  section 4: Authorization Approach 1                         ← separate body section
  section 5: Authorization Approach 2                         ← separate body section
  section 6: ...                                              ← each is a separate body section
  section N: Summary                                          ← separate body section
  section N+1: Artifact relations (system)
```

**Why:** A single giant section is not independently editable, has no visual separation in the page, and makes the page hard to navigate. Each body section gets its own edit button and visual card in BookKit.

**How to upload:** Use `bookkit-update` with:
- `action: "update"` for the existing Description section (overview content)
- `action: "add"` with sequential `order` values for each new section
- Use `operations` array or `batchExecuteSkill` for parallel upload

### Rule: Strip `<uu5string/>` Prefix from Embedded Diagrams

When embedding a BML diagram inside a BookKit section, the diagram tag must NOT have its own `<uu5string/>` prefix. The section already starts with `<uu5string/>`.

**BAD** (nested `<uu5string/>` breaks rendering):
```xml
<uu5string/>
<Uu5Bricks.Section header="My Section">
  <uu5string/><UuBml.Draw.Diagram value="<uu5json/>..."/>
</Uu5Bricks.Section>
```

**GOOD** (diagram tag directly inside section):
```xml
<uu5string/>
<Uu5Bricks.Section header="My Section">
  <UuBml.Draw.Diagram value="<uu5json/>..."/>
</Uu5Bricks.Section>
```

**In the generation script**, strip the prefix from `DiagramBuilder.toUu5String()`:
```javascript
function getDiagramTag(builder) {
  return builder.toUu5String().replace(/^<uu5string\/>/, "");
}
```

### Rule: Every Concept Variant Section MUST Have a Diagram

Do NOT generate text-only concept variant sections. Each variant/approach section should follow this structure:

```xml
<uu5string/>
<Uu5Bricks.Section headerSeparator=false header="Variant Name" contentEditable>
  <Uu5RichTextBricks.Block uu5String="<uu5string/><p>1-2 concise paragraphs.</p>"/>
  <!-- BML diagram showing how this variant works -->
  <UuBml.Draw.Diagram value="<uu5json/>..."/>
  <!-- Business rules as BulletList -->
  <UuApp.DesignKit.BulletList data="<uu5json/>..."/>
</Uu5Bricks.Section>
```

**Text should be minimal** — the diagram does the heavy lifting. Keep descriptions to 1-2 short paragraphs that set context for the diagram. Business rules should be punchy one-liners.

### Rule: Prefer Concise Text Over Verbose Explanations

**The #3 failure mode is over-explaining in text what the diagram already shows.**

- Description: 1-2 short paragraphs maximum
- Business rules: short, punchy names with 1-sentence descriptions
- NO separate "Example" blocks with long prose scenarios — the diagram IS the example
- If a concept needs a prose example, make it 2-3 sentences maximum inside a `Uu5Bricks.Block`

## References

- uuBML diagram JSON patterns: [reference.md](reference.md)
- Page content templates: [templates.md](templates.md)
- Official business modeling methodology: [Business Design Course](https://uuapp.plus4u.net/uu-bookkit-maing01/280dfaad97f741fba646fba476613280/book/page?code=35531550)
- Official business modeling tutorial: [Business Modeling Tutorial](https://uuapp.plus4u.net/uu-bookkit-maing01/405353a583394efd9d1d37da3c4e2630/book/page?code=18384370)
