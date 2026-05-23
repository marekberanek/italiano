# Task Types Reference

## Inheritance Hierarchy

```
UuAppDevkitTask (base)
    │
    ├── config, logging, parameters
    │
    └─► ScriptTask
        │
        ├── + local script execution
        │
        └─► ScriptRemoteTask
            │
            ├── + remote execution
            ├── + uuProgress monitoring
            ├── + uuConsole integration
            │
            └─► ScriptRemoteGitTask
                │
                ├── + Git branching
                ├── + automatic commits
                └── + push to remote
```

## Task Type Summary

| Task Type | Script | Remote | Git | Use Case |
|-----------|--------|--------|-----|----------|
| `UuAppDevkitTask` | No | No | No | Basic local operations, logging, config |
| `ScriptTask` | Yes (local) | No | No | Local task execution |
| `ScriptRemoteTask` | Yes | Yes | No | Remote execution with monitoring |
| `ScriptRemoteGitTask` | Yes | Yes | Yes | Remote execution with Git integration |

## UuAppDevkitTask

Base class for all DevKit tasks. Use when you only need:
- Configuration reading
- Logging
- Parameter handling
- No script execution

```javascript
import { UuAppDevkitTask } from "uu_app_devkitg02-uudck-core-uucli";

class MyTask extends UuAppDevkitTask {
  static description = "Basic task without script";
  
  async run() {
    const config = this.getConfig();
    this.log("Config loaded:", config);
    // Direct operations, no script
  }
}
```

## ScriptTask

Adds local script execution. Use when:
- Business logic should run locally
- No remote execution needed
- No Git integration needed

```javascript
import { ScriptTask } from "uu_app_devkitg02-uudck-core-uucli";

class MyTask extends ScriptTask {
  async init() {
    this.scriptData.setScriptPaths({
      scriptCode: "my-lib/uudck/my-task",
      scriptPath: ["my-lib", "src", "uudck", "my-task.js"],
    });
    await super.init();
  }

  async run() {
    // Script runs locally only
    const result = await this.runScript();
    return result;
  }
}
```

## ScriptRemoteTask

Adds remote execution via uuScriptEngine. Use when:
- Task should run on server infrastructure
- Need progress monitoring via uuProgress
- Need console output via uuConsole
- No Git operations needed

```javascript
import { UuAppDevkitRemoteScriptTask } from "uu_app_devkitg02-uudck-core-uucli";

class MyTask extends UuAppDevkitRemoteScriptTask {
  async init() {
    this.scriptData.setScriptPaths({
      scriptCode: "my-lib/uudck/my-task",
      scriptPath: ["my-lib", "src", "uudck", "my-task.js"],
    });
    await super.init();
  }

  async run() {
    const runInRemote = this.flags.runInRemote ?? false;
    this.scriptData.setTaskDtoIn({ runInRemote });
    
    const spinner = this.startSpinner("Running...\n");
    const result = await this.runScript();
    this.successSpinner(spinner, "Done.");
    return result;
  }
}
```

## ScriptRemoteGitTask

Full-featured task with Git integration. Use when:
- Task modifies files that should be committed
- Need automatic branching
- Need push to remote repository
- Running via uuAiChat

```javascript
import { UuAppDevkitRemoteScriptTask } from "uu_app_devkitg02-uudck-core-uucli";
import crypto from "node:crypto";

class MyTask extends UuAppDevkitRemoteScriptTask {
  constructor(argv, config, progressCode = crypto.randomUUID().slice(0, 8)) {
    super(argv, config, progressCode);
  }

  async init() {
    // Configure Git operations
    this.git.setCommitMessage("Generated files via MyTask");
    this.git.setBranchName(`feature/uuAppDevkit-${this.progressCode}`);
    
    this.scriptData.setScriptPaths({
      scriptCode: "my-lib/uudck/my-task",
      scriptPath: ["my-lib", "src", "uudck", "my-task.js"],
    });
    await super.init();
  }

  async run() {
    const spinner = this.startSpinner("Generating files...\n");
    const result = await this.runScript();
    // Git commit and push happen automatically
    this.successSpinner(spinner, "Files generated and committed.");
    return result;
  }
}
```

## Choosing the Right Task Type

### Decision Tree

```
Does the task execute a script?
├── No → UuAppDevkitTask
└── Yes
    │
    Does it need to run remotely (via uuAiChat)?
    ├── No → ScriptTask
    └── Yes
        │
        Does it modify files that should be committed?
        ├── No → ScriptRemoteTask
        └── Yes → ScriptRemoteGitTask
```

### Examples by Use Case

| Use Case | Task Type |
|----------|-----------|
| Read configuration and display info | `UuAppDevkitTask` |
| Generate files locally | `ScriptTask` |
| Run security scan on server | `ScriptRemoteTask` |
| Generate code and commit to Git | `ScriptRemoteGitTask` |
| Deploy to uuCloud | `ScriptRemoteTask` |
| Initialize new uuApp project | `ScriptRemoteGitTask` |
