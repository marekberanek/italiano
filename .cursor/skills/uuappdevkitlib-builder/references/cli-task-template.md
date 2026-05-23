# CLI Task Template

## Complete Template

```javascript
/*@@viewOn:imports*/
import { Flags } from "@oclif/core";
import { UuAppDevkitRemoteScriptTask } from "uu_app_devkitg02-uudck-core-uucli";
import crypto from "node:crypto";
/*@@viewOff:imports*/

/*@@viewOn:class*/
class MyTask extends UuAppDevkitRemoteScriptTask {
  /*@@viewOn:static*/
  static flags = {
    ...UuAppDevkitRemoteScriptTask.flags,
    
    // Required parameter
    name: Flags.string({
      char: "n",
      description: "Name of the entity to create",
      required: true,
    }),
    
    // Optional parameter with default
    output: Flags.string({
      char: "o",
      description: "Output directory",
      required: false,
      default: "./output",
    }),
    
    // Boolean flag
    force: Flags.boolean({
      char: "f",
      description: "Overwrite existing files",
      default: false,
    }),
    
    // Multiple values
    profiles: Flags.string({
      char: "p",
      description: "Profile names",
      multiple: true,
    }),
  };

  static description = "Creates a new entity with the specified name";

  static examples = [
    "uudck mymodule my-task --name=User",
    "uudck mymodule my-task -n User -o ./src --force",
  ];
  /*@@viewOff:static*/

  /*@@viewOn:constructor*/
  constructor(argv, config, progressCode = crypto.randomUUID().slice(0, 8)) {
    super(argv, config, progressCode);
  }
  /*@@viewOff:constructor*/

  /*@@viewOn:init*/
  async init() {
    // Configure Git operations (for ScriptRemoteGitTask)
    this.git.setCommitMessage(`Created entity: ${this.flags.name}`);
    this.git.setBranchName(`feature/uuAppDevkit-${this.progressCode}`);
    
    // Configure script paths
    this.scriptData.setScriptPaths({
      scriptCode: "uu_mylib-uudck-uuscriptlib/uudck/my-task",
      scriptPath: ["uu_mylib-uudck-uuscriptlib", "src", "uudck", "my-task.js"],
    });
    
    await super.init();
  }
  /*@@viewOff:init*/

  /*@@viewOn:run*/
  async run() {
    // Collect and validate parameters
    await this.askUserForRequiredFlags();
    
    // Show progress
    const spinner = this.startSpinner("Creating entity...\n");
    
    try {
      // Execute the script
      const result = await this.runScript();
      
      // Success
      this.successSpinner(spinner, `Entity "${this.flags.name}" created successfully.`);
      return result;
    } catch (error) {
      this.failSpinner(spinner, "Failed to create entity.");
      throw error;
    }
  }
  /*@@viewOff:run*/

  /*@@viewOn:helpers*/
  async askUserForRequiredFlags() {
    // Try to get from config first
    this.setParamFromConfigIfExists("name");
    this.setParamFromConfigIfExists("output");
    
    // Build dtoIn for script
    const dtoIn = {
      name: this.flags.name,
      output: this.flags.output,
      force: this.flags.force,
      profiles: this.flags.profiles ?? [],
      runInRemote: this.flags.runInRemote ?? false,
    };
    
    this.scriptData.setTaskDtoIn(dtoIn);
  }
  /*@@viewOff:helpers*/
}
/*@@viewOff:class*/

export { MyTask };
```

## Flag Types

### String Flag

```javascript
name: Flags.string({
  char: "n",
  description: "Entity name",
  required: true,
  default: "default-value",  // optional
})
```

### Boolean Flag

```javascript
force: Flags.boolean({
  char: "f",
  description: "Force overwrite",
  default: false,
})
```

### Multiple Values

```javascript
profiles: Flags.string({
  char: "p",
  description: "Profile names",
  multiple: true,  // Can be used multiple times: -p Admin -p User
})
```

### Integer Flag

```javascript
count: Flags.integer({
  char: "c",
  description: "Number of items",
  default: 1,
  min: 1,
  max: 100,
})
```

### Options (Enum)

```javascript
level: Flags.string({
  char: "l",
  description: "Log level",
  options: ["debug", "info", "warn", "error"],
  default: "info",
})
```

## Spinner Methods

```javascript
// Start spinner
const spinner = this.startSpinner("Processing...\n");

// Update spinner text
spinner.text = "Still processing...";

// Success
this.successSpinner(spinner, "Completed successfully.");

// Failure
this.failSpinner(spinner, "Operation failed.");

// Warning
this.warnSpinner(spinner, "Completed with warnings.");
```

## Interactive Prompts

```javascript
import { ux } from "@oclif/core";

// Prompt for input
const name = await ux.prompt("Enter entity name");

// Confirmation
const confirmed = await ux.confirm("Are you sure?");

// Password (hidden input)
const password = await ux.prompt("Enter password", { type: "hide" });

// Select from list
const choice = await ux.prompt("Select option", {
  default: "option1",
});
```

## Configuration Access

```javascript
// Get value from config or fallback
this.setParamFromConfigIfExists("paramName");

// Access config directly
const config = this.config;
const value = config.get("key");

// Check environment
const env = this.flags.environment ?? "development";
```

## Common Inherited Flags

These flags are automatically available from `UuAppDevkitRemoteScriptTask`:

| Flag | Description |
|------|-------------|
| `--runInRemote` | Execute on uuScriptEngine |
| `--localExecution` | Execute locally |
| `--environment` | Environment (development, production) |
| `--logLevel` | Log verbosity |
| `--uuConsoleBaseUri` | Console URI for remote |
| `--parentBranchName` | Parent Git branch |
