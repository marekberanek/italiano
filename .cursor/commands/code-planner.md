## Command Component Planning

This section outlines the planned implementation for a new command in accordance with the `@command.mdc` rule. The process strictly follows the mandatory steps and structure required for uuApp command development.

---

### 1. Command Specification (To Be Confirmed with User)

**a. Command Name and Purpose**
- Entity: `<entity>` (e.g., "product", "topic", etc.)
- Operation: `<operation>` (e.g., "create", "get", "update", "delete", "list")
- Full Command: `<entity>/<operation>` (e.g., "product/create")
- Purpose: _[Describe the business purpose of the command, to be confirmed with user]_

**b. Input Structure (dtoIn)**
- List all required and optional fields, types, and constraints.
- Example:
  - `name` (string, required)
  - `description` (string, optional)
  - _[To be confirmed with user]_

**c. Output Structure (dtoOut)**
- List all returned fields and their types.
- Must include `uuAppErrorMap`.
- Example:
  - `id` (string)
  - `name` (string)
  - `uuAppErrorMap` (object)
  - _[To be confirmed with user]_

**d. Data Persistence**
- DAO required: `<yes|no>` (to be confirmed)
- Data to be stored: _[Describe fields, to be confirmed]_
- Relationships: _[Describe if any, to be confirmed]_

**e. Special Considerations**
- Authorization: `<profileList>` (e.g., "Authorities,Executives")
- External calls: `<yes|no>` (if yes, request appmodel/design)
- Complex logic: _[Describe if any, to be confirmed]_

---

### 2. DevKit Command Parameters (To Be Confirmed with User)

- `--useCase=<entity>/<operation>`
- `--entity=<entity>`
- `--httpMethod=<GET|POST>`
- `--profileList=<profileList>`
- `--daoStub=<true|false>`
- `--testStub=<true|false>`
- `--privileged` (if required)
- `--twoPhase=<true|false>` (if required)
