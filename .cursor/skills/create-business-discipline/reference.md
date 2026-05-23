# Business Discipline Diagram Patterns

This document describes the diagram layouts for the Business Discipline section of a BMK. For BML diagram generation mechanics (grid system, element types, connector routing), use the **bml-diagram** skill.

## Diagram 1: uuP Classification

Shows the discipline's position in the uuP ecosystem and its dependencies.

### Layout (5 elements, 3 connectors)

```
Row 0 (y=0):    [uuP] ---dashed--- [{Discipline}] ---solid--- [{Discipline} uuApp]
                                          |
                              dashed multi-connector
                                     /          \
Row 2 (y=256):  [uuBusinessTerritory]            [uuIdentityManagement]
```

### Element Configuration

| Element | Type | Importance | Column |
|---------|------|------------|--------|
| uuP | methodology2 | normal | col 1 |
| {Discipline} | methodology2 | objective | col 3 |
| {Discipline} uuApp | uuapp | highest | col 5 |
| uuBusinessTerritory | methodology2 | high | col 2 |
| uuIdentityManagement | methodology2 | high | col 4 |

### Connectors

- {Discipline} -> uuP: dashed association
- {Discipline} -> uuApp: solid association
- {Discipline} -> [uuBT, uuIM]: ONE `connectMulti()` call (never 2 separate connects)

## Diagram 2: Domain Object Model (uuBml Stencil)

One icon per domain object, organized in rows by logical grouping. No connectors.

```
Row 0: [structural: config, types, schemas...]
Row 2: [core: main domain objects, definitions...]
Row 4: [supporting: helpers, interfaces, views...]
```

Space icons 2 columns apart (256px). Use discipline stencil icons if available, otherwise `special/missingIcon`.

## Diagram 3: Concept — Structure/Classification

Shows entity relationships or taxonomy of concept variants. Used on concept pages.

```
[Variant A] ---"1:N"--- [Main Entity] ---"1:1"--- [Variant B]
                              |
                         "inherits"
                              |
                        [Base Entity]
```

### Key Patterns

- Use correct relation types on connectors: `associationN`, `association1`, `composition1`, `aggregation1`
- Label connectors with cardinality and/or relation name
- Use importance levels to distinguish primary vs supporting elements
- Use blocks to group related elements

## Diagram 4: Concept — Data Flow

Shows how data moves between components during operations. Used on concept pages.

```
[User] --"submits"--> [API Layer] --"validates"--> [Validation Service]
                                   --"stores"----> [DAO]
                                                     |
                                                     v
                                                 [MongoDB]
```

### Key Patterns

- 3-4 component icons connected with labeled arrows
- Use blocks as containers to group related components
- Show decision paths (conditional flows) with branching connectors
- Keep it simple — focus on the main flow and 1-2 alternative paths

## Diagram 5: Concept — State/Timeline

Shows how data changes over time. Used on concept pages, especially for Time Validity.

```
[Before block]
   |---[Item A: Jan-Mar]---|---[Item B: Apr-Jun]---|---[Item C: Jul-Dec]---|

[After block]
   |---[Item A: Jan-Feb]---|---[Item B: Mar-Jun]---|---[Item C: Jul-Dec]---|
```

### Key Patterns

- Use two side-by-side or stacked layouts: "Before" and "After"
- Use blocks to contain each state
- Show item splitting, gap detection, boundary changes
- Color-code or use importance levels to highlight what changed
- Use callouts to annotate important observations

## Diagram 6: Concept — Authorization Model

Shows how actors connect to objects through permission structures.

```
[Actor A] ---"manages"---> [Object Type 1]
[Actor A] ---"manages"---> [Object Type 2]
[Actor B] ---"reads"-----> [Object Type 1]

     [Bound Artifact Block]
     [uuOBC] --> [Bound Artifact] --> [uuAppType] --> [uuCmd]
```

### Key Patterns

- Use `connectMulti()` from each actor to the objects they manage
- Label connectors with permission descriptions
- Use blocks to show permission inheritance chains
- Space actors apart so fan-outs don't overlap
