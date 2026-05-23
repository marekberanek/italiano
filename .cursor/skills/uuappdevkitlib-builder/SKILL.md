---
name: uuappdevkitlib-builder
description: Build custom uuAppDevKitg02 plugins (uuAppDevKitLib) for automating uuApp development tasks. Use when creating DevKit plugins, CLI tasks, script tasks, or extending uudck functionality. Guides through plugin design, task creation, configuration, and testing.
---

# uuAppDevKitLib Builder

Build custom uuAppDevKitg02 plugins to extend `uudck` with project-specific automation tasks.

## Overview

A uuAppDevKitLib consists of two components:
- **CLI Task** (`*-uucli`) - Command-line interface, user interaction, flags
- **Script Task** (`*-uuscriptlib`) - Business logic that runs locally or remotely

## Action: Create a New uuAppDevKitLib

When the user asks to create a new uuAppDevKitLib, follow these steps:

### Step 1: Gather Required Information

Ask the user for:
1. **Name** - The plugin name (e.g., `uu_mylib_maing01-uuappdevkitlib`)
2. **Execution type** - Local only or remote execution?
3. **Working directory** - Where to create the project (defaults to current directory)

If remote execution is needed, also ask for:
- **uuCodebaseRepositoryUri** - Repository location in Codebase application
- **sshPrivateKeyUri** - URI of the SSH private key for Git authentication
- **uuConsoleBaseUri** - Base URI of the uuConsole application

### Step 2: Generate the Project Structure

Execute the `uudck uuappdevkitlib create` command:

**For local execution (default, no remote flags needed):**
```bash
uudck uuappdevkitlib create --name=<plugin-name> --workDir=<target-directory>
```

**For remote execution:**
```bash
uudck uuappdevkitlib create \
  --name=<plugin-name> \
  --workDir=<target-directory> \
  --remoteExecution \
  --uuCodebaseRepositoryUri="<repository-uri>" \
  --sshPrivateKeyUri="<ssh-key-uri>" \
  --uuConsoleBaseUri="<console-uri>"
```

**Available flags:**
| Flag | Description |
|------|-------------|
| `-n, --name` | Name of the uuAppDevkitLibrary (required) |
| `--workDir` | Target directory for the project (default: current directory) |
| `--remoteExecution` | Enable remote execution via uuScriptEngine |
| `--uuCodebaseRepositoryUri` | Repository location in Codebase application |
| `--sshPrivateKeyUri` | SSH key for secure repository access |
| `--uuConsoleBaseUri` | Console application for logging and monitoring |
| `--gitBranchName` | Branch where changes will be committed |
| `--parentBranchName` | Parent branch for new feature branch |
| `-e, --environment` | Environment settings (default: development) |
| `--logLevel` | Log verbosity: debug, warn, error, info, trace |
| `--verbose` | Enable detailed logging output |

### Step 3: Verify the Generated Structure

After running the command, verify the generated structure:

```
<plugin-name>/
├── <plugin-name>-uudck-uucli/          # CLI package
│   ├── package.json
│   └── src/
│       └── commands/
│           └── <module>/
│               └── <task>.js           # CLI task
├── <plugin-name>-uudck-uuscriptlib/    # Script package
│   ├── package.json
│   └── src/
│       └── uudck/
│           └── <task>.js               # Script task
└── uuapp.json
```

### Step 4: Install and Link the Plugin

```bash
cd <plugin-name>/<plugin-name>-uudck-uucli
npm install
uudck plugins:link .
uudck plugins  # Verify installation
```

---

## Reference: Plugin Design

Before generating code, define:

| Aspect | Questions to Answer |
|--------|---------------------|
| **Purpose** | What task does this automate? |
| **Parameters** | What inputs does it need? (flags, config) |
| **Execution** | Local only or also remote (via uuAiChat)? |
| **Git Integration** | Does it need branching/committing? |
| **Output** | What files/reports does it produce? |

### Choose Task Type

See [references/task-types.md](references/task-types.md) for the inheritance hierarchy.

| Task Type | Use When |
|-----------|----------|
| `UuAppDevkitTask` | Local-only operations, no script execution |
| `ScriptTask` | Local script execution |
| `ScriptRemoteTask` | Remote execution with progress monitoring |
| `ScriptRemoteGitTask` | Remote execution with Git branching/commits |

---

## Reference: Implementing CLI Task

The CLI task handles:
- Flag definitions and validation
- User prompts for required inputs
- Script execution via `runScript()`
- Progress display (spinners, messages)

See [references/cli-task-template.md](references/cli-task-template.md) for complete template.

### Minimal CLI Task

```javascript
import { Flags } from "@oclif/core";
import { UuAppDevkitRemoteScriptTask } from "uu_app_devkitg02-uudck-core-uucli";
import crypto from "node:crypto";

class MyTask extends UuAppDevkitRemoteScriptTask {
  static flags = {
    ...UuAppDevkitRemoteScriptTask.flags,
    myParam: Flags.string({
      char: "p",
      description: "My parameter description",
      required: false,
    }),
  };

  static description = "Description of what this task does";

  constructor(argv, config, progressCode = crypto.randomUUID().slice(0, 8)) {
    super(argv, config, progressCode);
  }

  async init() {
    this.git.setCommitMessage("Task completed");
    this.git.setBranchName(`feature/uuAppDevkit-${this.progressCode}`);
    this.scriptData.setScriptPaths({
      scriptCode: "uu_<name>g01-uudck-uuscriptlib/uudck/my-task",
      scriptPath: ["uu_<name>g01-uudck-uuscriptlib", "src", "uudck", "my-task.js"],
    });
    await super.init();
  }

  async run() {
    await this.askUserForRequiredFlags();
    const spinner = this.startSpinner("Running task...\n");
    const result = await this.runScript();
    this.successSpinner(spinner, "Task completed successfully.");
    return result;
  }

  async askUserForRequiredFlags() {
    this.setParamFromConfigIfExists("myParam");
    const myParam = this.flags.myParam ?? "default";
    const runInRemote = this.flags.runInRemote ?? false;
    this.scriptData.setTaskDtoIn({ myParam, runInRemote });
  }
}

export { MyTask };
```

---

## Reference: Implementing Script Task

The script task contains the business logic. It:
- Validates input (`dtoIn`)
- Performs file operations
- Calls external tools if needed
- Returns results (`dtoOut`)

See [references/script-task-template.md](references/script-task-template.md) for complete template.

### Minimal Script Task

```javascript
const path = require("node:path");
const { UseCaseError } = require("uu_appg01_server").AppServer;

const CommonUtils = uuScriptRequire("uu_app_devkitg02-uudck-uuscriptlib/utils/common");
const Task = uuScriptRequire("uu_app_devkitg02-uudck-uuscriptlib/uudck/task");
const FileUtils = uuScriptRequire("uu_app_devkitg02-uudck-uuscriptlib/uudck/file");

const dtoInSchema = `shape({
  myParam: string()
})`;

const Errors = {
  ERROR_PREFIX: "uu_<name>g01-uudck-uuscriptlib/uudck/my-task/",
  InvalidDtoIn: class extends UseCaseError {
    constructor(params) {
      super({ code: `${Errors.ERROR_PREFIX}invalidDtoIn`, message: "Invalid dtoIn", ...params });
    }
  },
};

class MyTask extends Task {
  async init(dtoIn) {
    this.myParam = dtoIn.myParam ?? "default";
  }

  async run(dtoIn) {
    await this.console.info("Starting task...");
    const dtoOut = { dtoIn };

    await this.console.info("Validating dtoIn...");
    dtoOut.uuAppErrorMap = CommonUtils.validateDtoIn({
      dtoInSchema,
      dtoInSchemaType: "dtoInType",
      dtoInToValidate: dtoIn,
      errorPrefix: Errors.ERROR_PREFIX,
    });

    await this.init(dtoIn);

    // Your business logic here
    const workDir = this.taskContext.get("workDir");
    await this.console.info(`Working in: ${workDir}`);

    // Example: Read a file
    const packageJson = await FileUtils.readFile(path.join(workDir, "package.json"));
    await this.console.info(`Package: ${packageJson.name}`);

    // Example: Create a file
    await FileUtils.createFile(
      path.join(workDir, "output.json"),
      JSON.stringify({ result: "success" }, null, 2)
    );

    return dtoOut;
  }
}

module.exports = MyTask;
```

---

## Reference: Configuration

### uuapp.json Configuration

Add your plugin configuration to the project's `uuapp.json`:

```json
{
  "uu_<name>g01-uuappdevkitlib": {
    "development": {
      "uu_<name>g01-uuappdevkitlib.uuScriptRepositoryBaseUri": "https://uuapp-dev.plus4u.net/uu-script-repositoryg02/..."
    }
  }
}
```

### package.json for CLI Package

```json
{
  "name": "uu_<name>g01-uudck-uucli",
  "version": "0.1.0",
  "description": "uuAppDevKit CLI plugin for <description>",
  "main": "src/index.js",
  "type": "module",
  "license": "UNLICENSED",
  "dependencies": {
    "@oclif/core": "^4.0.0",
    "uu_app_devkitg02-uudck-core-uucli": "^0.1.0"
  },
  "oclif": {
    "bin": "uudck",
    "dirname": "uudck",
    "commands": {
      "strategy": "pattern",
      "target": "./src/commands"
    }
  },
  "files": ["src"],
  "keywords": ["oclif", "uudck", "uuappdevkit"]
}
```

See [references/configuration.md](references/configuration.md) for all configuration options.

---

## Reference: Testing the Plugin

### Run the Task

```bash
uudck <module> <task> --help           # Show help
uudck <module> <task>                  # Run locally (default)
uudck <module> <task> --runInRemote    # Run on script engine
```

### Manage Plugins

```bash
uudck plugins                          # List installed plugins
uudck plugins:link .                   # Link local plugin (development)
uudck plugins:unlink <plugin-name>     # Unlink a plugin
uudck plugins:install <path-or-npm>    # Install from path or npm
```

### Debug Tips

- Add `--logLevel=DEBUG` for verbose output
- Check `uuProgress` for remote execution logs
- Validate script independently before full integration

---

## Reference: Common Utilities

### FileUtils

```javascript
const FileUtils = uuScriptRequire("uu_app_devkitg02-uudck-uuscriptlib/uudck/file");

// Read JSON file
const config = await FileUtils.readFile("uuapp.json");

// Write file
await FileUtils.createFile("output.txt", content);

// Check existence
const exists = await FileUtils.pathExists("package.json");

// List directory
const files = await FileUtils.listFilesWithFolders(workDir);
```

### Console Logging

```javascript
await this.console.info("Information message");
await this.console.warning("Warning message");
await this.console.error("Error message");
```

### Git Operations (in CLI task)

```javascript
this.git.setCommitMessage("My commit message");
this.git.setBranchName("feature/my-branch");
// Git operations happen automatically for ScriptRemoteGitTask
```

---

## Reference: Examples

### Security Scanner Plugin

A plugin that scans for vulnerabilities:
- CLI: `uudck securitykit scan-vulnerabilities`
- Generates SBOM (`.cdx.json`) and VEX (`.vex.json`) files
- Uses Trivy for scanning

### Entity Generator Plugin

A plugin that generates CRUD code:
- CLI: `uudck businessbrick entity-create`
- Creates ABL, DAO, controller, validation types
- Uses TemplateManager for file generation

## Additional Resources

- [Task Types Reference](references/task-types.md) - Inheritance hierarchy and when to use each
- [CLI Task Template](references/cli-task-template.md) - Complete CLI task examples
- [Script Task Template](references/script-task-template.md) - Complete script task examples
- [Configuration Guide](references/configuration.md) - All configuration options
