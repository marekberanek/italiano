# Script Task Template

## Complete Template

```javascript
/*@@viewOn:imports*/
const path = require("node:path");
const fs = require("node:fs/promises");
const { UseCaseError } = require("uu_appg01_server").AppServer;

const CommonUtils = uuScriptRequire("uu_app_devkitg02-uudck-uuscriptlib/utils/common");
const Task = uuScriptRequire("uu_app_devkitg02-uudck-uuscriptlib/uudck/task");
const FileUtils = uuScriptRequire("uu_app_devkitg02-uudck-uuscriptlib/uudck/file");
/*@@viewOff:imports*/

/*@@viewOn:schema*/
const dtoInSchema = `shape({
  name: string().isRequired(),
  output: string(),
  force: boolean(),
  profiles: array(string()),
  runInRemote: boolean()
})`;

const dtoInSchemaType = "dtoInType";
/*@@viewOff:schema*/

/*@@viewOn:constants*/
const CONSTANTS = {
  DEFAULT_OUTPUT: "./output",
};
/*@@viewOff:constants*/

/*@@viewOn:errors*/
const Errors = {
  ERROR_PREFIX: "uu_mylib-uudck-uuscriptlib/uudck/my-task/",
  
  InvalidDtoIn: class extends UseCaseError {
    constructor(params) {
      super({
        code: `${Errors.ERROR_PREFIX}invalidDtoIn`,
        message: "Invalid dtoIn",
        ...params,
      });
    }
  },
  
  FileAlreadyExists: class extends UseCaseError {
    constructor(params) {
      super({
        code: `${Errors.ERROR_PREFIX}fileAlreadyExists`,
        message: "File already exists and force flag is not set",
        ...params,
      });
    }
  },
  
  OperationFailed: class extends UseCaseError {
    constructor(params) {
      super({
        code: `${Errors.ERROR_PREFIX}operationFailed`,
        message: "Operation failed",
        ...params,
      });
    }
  },
};
/*@@viewOff:errors*/

/*@@viewOn:scriptBody*/
class MyTask extends Task {
  /*@@viewOn:init*/
  async init(dtoIn) {
    this.name = dtoIn.name;
    this.output = dtoIn.output ?? CONSTANTS.DEFAULT_OUTPUT;
    this.force = dtoIn.force ?? false;
    this.profiles = dtoIn.profiles ?? [];
    this.runInRemote = dtoIn.runInRemote ?? false;
    
    // Read project configuration
    this.workDir = this.taskContext.get("workDir");
    this.uuappConfig = await FileUtils.readFile(path.join(this.workDir, "uuapp.json"));
  }
  /*@@viewOff:init*/

  /*@@viewOn:run*/
  async run(dtoIn) {
    await this.console.info("Starting task...");
    const dtoOut = { dtoIn };

    // Validate input
    await this.console.info("Validating dtoIn...");
    dtoOut.uuAppErrorMap = CommonUtils.validateDtoIn({
      dtoInSchema,
      dtoInSchemaType,
      dtoInToValidate: dtoIn,
      errorPrefix: Errors.ERROR_PREFIX,
    });

    // Initialize
    await this.init(dtoIn);

    // Execute business logic
    await this.console.info(`Processing entity: ${this.name}`);
    
    const outputPath = path.join(this.workDir, this.output);
    await this.#ensureOutputDirectory(outputPath);
    
    const result = await this.#generateFiles(outputPath);
    dtoOut.generatedFiles = result.files;

    await this.console.info(`Generated ${result.files.length} files`);
    return dtoOut;
  }
  /*@@viewOff:run*/

  /*@@viewOn:private*/
  async #ensureOutputDirectory(outputPath) {
    const exists = await FileUtils.pathExists(outputPath);
    if (!exists) {
      await fs.mkdir(outputPath, { recursive: true });
      await this.console.info(`Created directory: ${outputPath}`);
    }
  }

  async #generateFiles(outputPath) {
    const files = [];
    
    // Example: Generate a JSON file
    const configFile = path.join(outputPath, `${this.name}.json`);
    
    if (await FileUtils.pathExists(configFile) && !this.force) {
      throw new Errors.FileAlreadyExists({ cause: { path: configFile } });
    }
    
    const content = {
      name: this.name,
      profiles: this.profiles,
      createdAt: new Date().toISOString(),
    };
    
    await FileUtils.createFile(configFile, JSON.stringify(content, null, 2));
    files.push(configFile);
    
    return { files };
  }
  /*@@viewOff:private*/
}

module.exports = MyTask;
/*@@viewOff:scriptBody*/
```

## DtoIn Schema Syntax

```javascript
// Basic types
const schema = `shape({
  name: string().isRequired(),
  count: number(),
  enabled: boolean(),
  items: array(string()),
  config: shape({
    key: string(),
    value: string()
  })
})`;
```

### Common Validators

| Validator | Description |
|-----------|-------------|
| `.isRequired()` | Field is mandatory |
| `.min(n)` | Minimum value/length |
| `.max(n)` | Maximum value/length |
| `.oneOf([...])` | Must be one of values |
| `.matches(/regex/)` | Must match pattern |

## FileUtils API

### Read File

```javascript
// Read JSON file (auto-parsed)
const config = await FileUtils.readFile("uuapp.json");

// Read text file
const content = await FileUtils.readFile("README.md");
```

### Write File

```javascript
// Write content to file
await FileUtils.createFile("output.json", JSON.stringify(data, null, 2));

// Write with encoding
await FileUtils.createFile("output.txt", content, { encoding: "utf8" });
```

### Check Existence

```javascript
const exists = await FileUtils.pathExists("package.json");
```

### List Directory

```javascript
// Get directory entries
const entries = await FileUtils.listFilesWithFolders(workDir);

// Filter folders
const folders = entries.filter(e => e.isDirectory()).map(e => e.name);

// Filter files
const files = entries.filter(e => e.isFile()).map(e => e.name);
```

### Copy Files

```javascript
await FileUtils.copyFile(sourcePath, destPath);
```

## Console Logging

```javascript
await this.console.info("Information message");
await this.console.warning("Warning message");
await this.console.error("Error message");
await this.console.debug("Debug message");  // Only shown with DEBUG level
```

## Task Context

```javascript
// Get working directory
const workDir = this.taskContext.get("workDir");

// Get other context values
const value = this.taskContext.get("key");

// Set context value
this.taskContext.set("key", value);
```

## Error Handling

```javascript
try {
  await this.#riskyOperation();
} catch (error) {
  await this.console.error(`Operation failed: ${error.message}`);
  throw new Errors.OperationFailed({
    cause: { originalError: error.message },
  });
}
```

## Using External Tools

### Child Process

```javascript
const ChildProcess = require("node:child_process");

// Sync execution
const output = ChildProcess.execSync("npm install", {
  cwd: workDir,
  encoding: "utf8",
});

// With error handling
try {
  ChildProcess.execSync("npm run build", { cwd: workDir });
} catch (error) {
  await this.console.error("Build failed");
  throw new Errors.OperationFailed({ cause: { error: error.message } });
}
```

### Template Manager

```javascript
const TemplateManager = uuScriptRequire("uu_templatemanagerg01-uulib");

const tm = new TemplateManager();
await tm.renderToDirectory({
  source: templatePath,
  target: outputPath,
  data: {
    name: this.name,
    version: "1.0.0",
  },
  onExists: {
    ".json": "merge",
    "*": "overwrite",
  },
});
```

## Pattern: Multi-Folder Processing

```javascript
async #processAllFolders() {
  const entries = await FileUtils.listFilesWithFolders(this.workDir);
  const folders = entries.filter(e => e.isDirectory()).map(e => e.name);
  
  for (const folder of folders) {
    await this.console.info(`Processing folder: ${folder}`);
    const folderPath = path.join(this.workDir, folder);
    
    // Check if folder has package.json
    const hasPackage = await FileUtils.pathExists(
      path.join(folderPath, "package.json")
    );
    
    if (hasPackage) {
      await this.#processFolder(folderPath);
    }
  }
}
```

## Pattern: Configuration Merge

```javascript
async #mergeConfig(existingPath, newConfig) {
  let existing = {};
  
  if (await FileUtils.pathExists(existingPath)) {
    existing = await FileUtils.readFile(existingPath);
  }
  
  const merged = {
    ...existing,
    ...newConfig,
    nested: {
      ...existing.nested,
      ...newConfig.nested,
    },
  };
  
  await FileUtils.createFile(existingPath, JSON.stringify(merged, null, 2));
}
```
