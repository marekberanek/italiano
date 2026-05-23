# Business Discipline Page Templates

Templates for the Business Discipline section of a BMK. Replace `{placeholders}` with actual values.

**CRITICAL RULES for all templates:**
- NEVER start a section with "This page describes..." or "This page contains the description of...". Start directly with the business content.
- NEVER include JSON code blocks, `dtoIn` examples, or JS code in business-facing pages.
- NEVER include implementation-detail table columns (Configuration, Backend, API endpoint).
- Use business language throughout — describe WHAT happens, not which command or service does it.
- Only include terms in the Dictionary that have a confirmed definition from documentation or user.

## 1. Business Discipline Main Page

```markdown
# Business Discipline - {DisciplineName}

## Overview (A4)

**Motivation**

{1-2 paragraphs: What business problem or need motivated this solution?
Why does it exist? Who benefits from it? What value does it bring?

Start directly with the substance — NEVER with "This page describes..."
or "This page contains the specification of...".}

**What is {DisciplineName}**

{1-2 paragraphs: What the solution does, described in business terms.}

Key features:

* {Feature 1 — what it does for users, in plain language}
* {Feature 2}
* {Feature 3}

{HARD CONSTRAINT: The entire Overview section MUST fit on roughly one A4 page
including any diagrams. If it exceeds this, cut ruthlessly.}

## Dictionary

{Define every important or business-specific term, abbreviation, or concept.
Include anything a newcomer to the project or business needs to understand.
When in doubt, add the term. Only include terms with CONFIRMED definitions
from documentation or explicit user statements — never guess.}

| Term | Definition |
|------|-----------|
| {Term1} | {Clear explanation of the term in the context of this discipline} |
| {Term2} | {Explanation, including why it matters or how it differs from common usage} |
| {Abbreviation} | {What it stands for and its meaning in this context} |

## uuP Classification

{uuP Classification diagram — shows the discipline's relationship to uuP methodology, the uuApp, and dependencies.}

Elements:
- uuP (methodology)
- {DisciplineName} (business discipline — objective)
- {DisciplineName} (uuApp — highest importance)
- {Dependency1} (dependency — high)
- {Dependency2} (dependency — high)

## uuBml Stencil

### Overview

{Domain Object Model diagram — shows all domain objects organized by logical grouping.}

### Design Proposal

{Detailed stencil design with all objects and their relationships.}
```

## 2. High-Level Concept (HLC)

```markdown
# High-Level Concept — {DisciplineName}

## Description

{Start directly with the substance. Simple, overall idea of the whole
business discipline. More detail than the discipline page, but without all
the tiny specifics. Enough to understand what it does, why, and how —
in business terms, without implementation details.

NEVER begin with "This page describes..." or similar.}

## Overview

{Summary diagram or table showing the main components/areas of the discipline
and how they relate. A classification diagram is ideal here.}

## {Area/Component 1}

{Description of this area — what it does, who uses it, how it connects to
other areas. Include a diagram if the area is complex. Use business language.}

## {Area/Component 2}

{Description.}

## {Integration Points}

{If the discipline connects to other systems, describe the integration at a
high level — what goes in, what comes out, what triggers the interaction.
No API names or service calls — describe in business terms.}
```

## 3. Authorization Concept

```markdown
# Authorization

{Start directly: what authorization means in this discipline and why it matters.
1-2 paragraphs explaining the purpose and scope.

NEVER begin with "This page describes..." or "This page contains the
description of...".}

## Authorization Overview

{Diagram showing the authorization model — which roles/actors can do what,
how permissions are structured. Use business-facing labels.}

| Authorization Approach | Scope | Who Uses It | When to Use |
|------------------------|-------|-------------|-------------|
| {Approach1} | {What level it controls — e.g., whole workspace, per record} | {Which roles/actors benefit} | {Business scenario} |
| {Approach2} | {Scope} | {Who} | {When} |

## {Authorization Approach 1} (e.g., Workspace-Level Access)

{Description of this approach in business terms: who gets access to what,
under what conditions. NO API commands, NO JSON, NO internal property names.}

### Business Rules

1. {Rule 1 — who can do what under this approach}
2. {Rule 2 — constraints, exceptions}
3. {Rule 3 — inheritance, delegation}

### Diagram

{Diagram showing how this approach connects roles to capabilities.
Use business-language labels, not service call names.}

### Example

{Illustrative text-based scenario with concrete data — NOT a JSON code block.
Example: "A project manager with the Editor role can view and modify all
project records, while a team member with the Viewer role can only see records
assigned to their department."}

## {Authorization Approach 2} (e.g., Record-Level Access)

{Description in business terms.}

{... same structure: business rules, diagram, example ...}

## Summary

{Comparison table across approaches, or key takeaways.
Help the reader decide which approach fits their needs.}

| Need | Recommended Approach | Why |
|------|---------------------|-----|
| {Business need 1} | {Approach} | {Brief explanation} |
| {Business need 2} | {Approach} | {Brief explanation} |
```

**Note:** Error scenarios and error code tables are NOT part of the default
business-facing template. Only include them if the user explicitly requests
technical depth (Tier 2).

## 4. Time Validity Concept

```markdown
# Time Validity

{Start directly: what time validity means in this discipline — why temporal
aspects matter, what kinds of data have time ranges, and what business
questions time validity answers.

NEVER begin with "This page describes...".}

## Overview

{Classification diagram showing the variants/modes of time validity in this discipline.}

| Variant | What It Means | When to Use It |
|---------|---------------|----------------|
| {Variant1} | {Plain-language explanation} | {Business scenario} |
| {Variant2} | {Plain-language explanation} | {Business scenario} |

## {Variant 1} (e.g., Contiguous Validity)

{What this variant means and when it's used — in business terms.}

### Business Rules

1. {Rule 1 — how boundaries work, in plain language}
2. {Rule 2 — what happens with overlaps}
3. {Rule 3 — what happens with gaps}

### Diagram

{Timeline/state diagram showing how data looks over time with this variant.}

### Example

{Text-based illustrative scenario with concrete data — NOT a JSON code block.
Example: "An electricity tariff is valid from January 1 to March 31.
When a new tariff is created starting April 1, the system automatically
ensures there is no gap between the two periods."}

## {Variant 2}

{... same structure ...}

## Summary

{Key takeaways or comparison table across variants.}
```

**Note:** Data structure code blocks, validation schemas, querying pattern
details, and error code tables are NOT part of the default business-facing
template. Only include them if the user explicitly requests technical depth
(Tier 2).

## 5. References/Dependencies Concept

```markdown
# References

{Start directly: how this discipline connects to and depends on other
systems or disciplines, and why those connections matter.

NEVER begin with "This page describes...".}

## Overview

{Diagram showing this discipline and its connections to other systems.}

## {Dependency 1} (e.g., uuBusinessTerritory)

### Purpose
{Why this discipline depends on it — what business capability it provides.}

### Integration Points
{What data or services are exchanged — described in business terms,
not API command names.}

### Impact
{What happens if this dependency is unavailable.}

## {Dependency 2}

{... same structure ...}
```

## 6. Events Concept

```markdown
# Events

{Start directly: what events this discipline uses, why event-based
communication matters for this solution, and what business outcomes
events enable.

NEVER begin with "This page describes...".}

## Event Overview

{Diagram showing event producers, consumers, and event types.}

## Published Events

| Event | What Triggers It | What It Communicates | Who Responds |
|-------|-----------------|---------------------|--------------|
| {event1} | {Business trigger} | {What information is shared} | {Which systems/actors react} |

## Consumed Events

| Event | Where It Comes From | What We Do With It |
|-------|--------------------|--------------------|
| {event1} | {Source system/discipline} | {Business action taken} |
```

## 7. Generic Concept (Flexible Template)

```markdown
# {ConceptName}

{Start directly with what this concept is and why it exists in this
discipline. 1-2 paragraphs of substance.

NEVER begin with "This page describes..." or "This page contains the
description of...".}

## Overview

{Summary table, classification diagram, or taxonomy showing the concept's
variants, modes, or components.}

## {Section 1}

{Content in business language. Structure freely based on what the concept
requires. Include diagrams where they aid understanding, business rules as
numbered lists, and illustrative text-based examples.

Do NOT include JSON code blocks, API command references, or internal
property names. Keep it readable in 5-10 minutes.}

## {Section 2}

{Continue as needed. There is no rigid structure — adapt to the concept.}

## Summary

{Key takeaways or comparison table across variants.}
```

**Note on code examples:** Code blocks and JSON examples are ONLY appropriate
when the user explicitly requests technical depth (Tier 2 concept). The default
for all concept pages is business-facing content with no code.
