---
name: implement-unit-tests
description: "Automatically generates, writes, and verifies Jest unit tests for uuApp Node.js server projects. Covers the ABL layer and files containing business logic. Use when the user wants to implement, write, or generate unit tests."
---

# Implement Unit Tests

This skill implements Jest unit tests for uuApp Node.js server projects using a two-phase approach: first it explores the project structure and source code, then it generates a complete test file, runs the tests, and fixes any errors.

## When to Use

- User wants to write / implement / generate unit tests
- User provides a file path or a verbal description of a use case

## Input

The skill accepts:
1. **A file path:** `app/abl/my-feature-abl.js`
2. **A verbal description:** `unit tests for the sendToXbid use case`

## Process

Follow the steps below exactly. Do not skip any step.

### Phase 1: Project Exploration

#### 1.1 Project Detection

1. Find `package.json` in the current workspace. Look for a file that contains the `scripts.test` key. Prioritize the server package (`*-server/package.json`).
2. Read `scripts.test` — determine the command for running tests. Examples:
   - `"uu_appg01_devkit test"` → run as `npm test`
   - `"jest"` → run as `npm test`
3. Find the `test/` folder (or `__tests__/`) in the same package.
4. Record the path to `test/` — this is where generated tests will be written.

#### 1.2 Locating the File Under Test

**If the user provided a file path:**
- Read the file at the given path.
- Derive the test file path: replace the `app/` prefix with `test/`, add `.test` before `.js`.
  - Example: `app/abl/already-allocated-capacity-abl.js` → `test/abl/already-allocated-capacity-abl.test.js`

**If the user provided a verbal description:**
- Search the `app/` folder — look for files whose name or content matches the description.
- Prioritize ABL files (`app/abl/`), then service (`app/service/`), then helper (`app/helper/`).
- If multiple candidates are found, pick the most relevant one and proceed with it.

#### 1.3 Test Infrastructure

1. Look in `test/` for a file that:
   - Sets up `Config` or the project environment
   - Mocks DB connections (`DaoFactory`, `DbConnection`)
   - Mocks `AuthenticationService`
   - Example names: `TestDataHolder.js`, `TestHelper.js`, `test-setup.js`
2. Read this file in full. Record:
   - How it is imported: `const testDataHolder = require("../TestDataHolder")`
   - How setup is called: `testDataHolder.setUp()` or another method
   - Whether it is a singleton (`module.exports = new TestDataHolder()`) or a class
3. Look for a `test/__mocks__/` folder — record available mocks.
4. Look for shared utilities (`server-root-utils.js`, etc.) — read them if they exist.

#### 1.4 Error Classes

1. Look for the `app/api/errors/` folder (or `app/api/errors.js`).
2. Read the files inside — record:
   - File names (e.g. `common-error.js`, `aac-capacity-error.js`)
   - Exported error classes and their structure (namespaces like `Validation.InvalidDtoIn`, `Init.CreateAwscFailed`, etc.)
3. Determine which error files are relevant for the module under test:
   - `common-error.js` is always relevant (contains `Validation.InvalidDtoIn`)
   - Match specific error files to the module name (e.g. `aac-capacity-error.js` for `already-allocated-capacity-abl.js`)

#### 1.5 Sample Tests

1. Find 2 existing test files of the same category as the file under test:
   - ABL file under test → look in `test/abl/`
   - Service file → look in `test/service/`
2. Read both files in full.
3. Record patterns:
   - How `AppClient.post`, `Config.get`, and external clients are mocked
   - Whether the project uses `jest.spyOn` vs `jest.mock` vs direct assignment (`AppClient.post = jest.fn()`)
   - How helper functions look (`getDtoIn`, `createUri`, `initialMocks`)
   - How NDS tests look (try/catch pattern, `expect.hasAssertions()`)

#### 1.6 Source File Analysis

Read the file under test and for each exported function build a scenario map:

**For each exported function identify:**

1. **Name and parameters** — `async sendToXbid(uri, dtoIn)`
2. **DtoIn validation** — if the function calls `ValidationHelper.validate` or similar → there is an NDS `InvalidDtoIn` scenario
3. **Called dependencies** — list all external calls that need to be mocked:
   - `AppClient.post`, `AppClient.get`
   - Imported clients (`masterDataClient.entityItemList`, `tsStoreClient.tsDataList`, etc.)
   - `Config.get`
   - `authenticationService.authenticate`
   - Other service methods
4. **Logic branching** — `if/else`, `try/catch` blocks, conditional calls → each branch is a potential HDS2 or NDS scenario
5. **Error throws** — every `throw new SomeError()` → NDS scenario
6. **Return value** — what the function returns (for HDS assertions)

**Output: scenario map (internal)**

```
sendToXbid:
  HDS: borders found, ts data loaded, EGW calls successful → result.uuAppErrorMap = {}, result.egwSendMessageDtoInList.length = N
  NDS - InvalidDtoIn: dtoIn.businessDay missing or invalid format
  NDSBorderNotFound: border from ts data not found in border entity list
  NDSRestApiCallFailed: AppClient.post throws on EGW call
```

Use this map as the basis for test generation in Phase 2.

### Phase 2: Generation and Verification

#### 2.1 Test File Generation

Based on the exploration from Phase 1, generate the test file. Follow this structure exactly:

**Test file template:**

```javascript
"use strict";

// TOP-LEVEL MOCKS: Modules that cannot be spyOn-ed (external clients initialized at require time)
// Use jest.mock() only if sample tests in the project do the same for this client
// Example:
// jest.mock("../../../app/client/bt-client", () => ({
//   subscribeForEvent: jest.fn().mockResolvedValue({}),
// }));

const testDataHolder = require("<relative path to TestDataHolder from this test file>");
// Import only the error classes you actually use in tests
const CommonErrors = require("<path to common-error>");
// const SpecificErrors = require("<path to specific error file>");

// Lazy declarations — modules are loaded in beforeAll AFTER setUp()
let moduleUnderTest;
let depClientA; // add all dependencies you will spyOn

describe("<ModuleName>/<functionName>", () => {
  beforeAll(() => {
    testDataHolder.setUp();
    initialMocks(); // if you need setup that must happen before require()
    moduleUnderTest = require("<path to module under test>");
    depClientA = require("<path to dependency A>");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === HDS ===
  test("HDS - <brief happy path description>", async () => {
    // Arrange
    jest.spyOn(depClientA, "methodName").mockResolvedValue(getExpectedData());
    // ... additional spyOn calls

    // Act
    const result = await moduleUnderTest.functionName(createUri(), getDtoIn());

    // Assert
    expect(result.uuAppErrorMap).toEqual({});
    expect(result).toHaveProperty("<key>");
    // or: expect(result.<field>).toHaveLength(N);
  });

  // Add HDS2, HDS3 for alternative happy-path branches (if they exist)

  // === NDS ===
  test("NDS - InvalidDtoIn", async () => {
    expect.hasAssertions();
    try {
      await moduleUnderTest.functionName(createUri(), {});
    } catch (e) {
      expect(e).toBeInstanceOf(CommonErrors.Validation.InvalidDtoIn);
    }
  });

  // Add NDS for each error throw found in the analysis
  test("NDS<ErrorName> - <description>", async () => {
    expect.hasAssertions();
    jest.spyOn(depClientA, "methodName").mockRejectedValue(new Error("simulated failure"));
    try {
      await moduleUnderTest.functionName(createUri(), getDtoIn());
    } catch (e) {
      expect(e).toBeInstanceOf(SpecificErrors.ErrorClassName);
      // or: expect(e.code).toBe(new SpecificErrors.ErrorClassName().code);
    }
  });
});

// === HELPER FUNCTIONS (outside describe block) ===

function getDtoIn() {
  return {
    // minimal valid dtoIn for the function under test
  };
}

function createUri() {
  const awid = testDataHolder.TEST_AWID || "123";
  return {
    getAwid: () => awid,
    getBaseUri: () => "http://localhost/app/main/",
    toString: () => `http://localhost/app/main/${awid}`,
    getUri: () => `http://localhost/app/main/${awid}`,
  };
}

function initialMocks() {
  // Set up mocks that must exist before require() of the module under test
  // Example:
  // const { AppClientTokenService, UuAppWorkspace } = require("uu_appg01_server").Workspace;
  // AppClientTokenService.createToken = jest.fn().mockResolvedValue("dummy-token");
}

// Add functions for test data
// function getExpectedData() { return { ... }; }
```

**Scenario naming rules:**

| Type | Format | Example |
|------|--------|---------|
| Happy path (basic) | `HDS - <description>` | `HDS - fetches data and sends to EGW` |
| Happy path (alternative) | `HDS2 - <description>` | `HDS2 - application already connected` |
| Validation error | `NDS - InvalidDtoIn` | always this exact format |
| Business error | `NDS<PascalCase> - <description>` | `NDSBorderNotFound - throws when border missing` |

**Mocking rules:**

- Use `jest.spyOn(dep, "method").mockResolvedValue(data)` for async methods
- Use `jest.spyOn(dep, "method").mockReturnValue(data)` for sync methods
- Use `jest.spyOn(dep, "method").mockRejectedValue(new Error("..."))` to simulate errors
- If the project uses `AppClient.post = jest.fn()` (direct assignment) — use the same style
- Use top-level `jest.mock()` only for modules that the project's sample tests also mock at the top level
- Comment every `mockResolvedValueOnce` to describe what it simulates (see project sample tests)

**Relative paths:**

- From `test/abl/feature-abl/` to `test/TestDataHolder.js` → `../../TestDataHolder`
- From `test/abl/feature-abl/` to `app/abl/feature-abl.js` → `../../../app/abl/feature-abl`
- From `test/service/` to `test/TestDataHolder.js` → `../TestDataHolder`
- Always verify nesting depth against the actual file path

#### 2.2 Writing the Test File

1. Create the folder for the test file if it does not exist
2. Write the generated test file to the correct path (from step 1.2)
3. Verify that the file was written correctly

#### 2.3 Running the Tests

1. Run tests only for the newly created file:
   ```bash
   cd <package root where package.json with the test script lives>
   npm test -- --testPathPattern="<test file name without path>"
   ```
   Example: `npm test -- --testPathPattern="already-allocated-capacity-abl.test"`

2. Wait for the result.

3. **If all tests passed:** proceed to `#### 2.4 Result`.

4. **If tests are failing:** proceed to `#### 2.3a Iteration`.

#### 2.3a Iteration on Failure (max 3 attempts)

For each failure:

1. Read the full error output.
2. Identify the error type from the output:

   **`TypeError: Cannot read properties of undefined`**
   - Cause: mocked method does not exist or mock is not set up before require()
   - Action: verify that spyOn targets the correct object and method; or move the mock to `initialMocks()` if it must exist before require()

   **`Cannot find module '...'`**
   - Cause: wrong relative path in require()
   - Action: recalculate the correct relative path based on the actual file location

   **`Expected: {} / Received: { someError: {...} }`**
   - Cause: assertion expects an empty `uuAppErrorMap`, but the ABL adds a warning
   - Action: either fix the expected value, or re-read the source code to understand when warnings are added

   **`expect(received).toBeInstanceOf(expected)` fail**
   - Cause: wrong error class, or the ABL throws a different error
   - Action: read the source code and find the exact throw statement; use the correct error class

   **`No tests ran` or `0 tests found`**
   - Cause: wrong `--testPathPattern`
   - Action: try `npm test -- --testPathPattern="<more specific name>"` or verify the file path

3. Fix the identified problem in the test file.
4. Run the tests again.
5. Repeat until tests pass or until the limit of 3 iterations is reached.

**After 3 unsuccessful iterations:**
Stop. Summarize:
- What was created and written
- Which tests are failing and with what error
- What you tried to fix
- What is likely causing the problem

Let the user decide how to proceed.

#### 2.4 Result

Once all tests pass, report to the user:

```
✓ Unit tests implemented and verified.

File: test/abl/feature-abl/function-name.test.js
Tests: X passed (HDS: Y, NDS: Z)
```

State the exact count and names of the tests that were created.

## Key Principles

- **Always lazy-load the module under test** — call `require()` in `beforeAll` AFTER `testDataHolder.setUp()`
- **Never call the real DB** — `DaoFactory.getDao` must be mocked (TestDataHolder does this automatically)
- **`jest.clearAllMocks()` in every `beforeEach`** — never `jest.resetAllMocks()` (that would also clear top-level mocks)
- **Helper functions outside `describe`** — `getDtoIn`, `createUri`, `initialMocks`, data functions
- **`expect.hasAssertions()`** — use in every NDS test where you assert inside a catch block
- **Relative paths** — always calculate from the test file location, not from the project root
- **Do not add a `localStorage` shim** — if the project already has one in `TestDataHolder`, it is redundant; if not and tests fail because of it, add it at the top of the test file
