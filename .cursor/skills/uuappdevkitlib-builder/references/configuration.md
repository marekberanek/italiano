# Configuration Guide

## Configuration File Hierarchy

```
Priority (highest to lowest):
1. Command-line flags
2. .uudck/config.json (private, local)
3. uuapp.json (shared, version-controlled)
4. Default values
```

## uuapp.json Structure

```json
{
  "product": "uu_myapp_maing01",
  "version": "1.0.0",
  "license": "License Commercial",
  "description": {
    "en": "My application description"
  },
  
  "uu_app_devkitg02-uudck-uucli": {
    "defaultEnvironment": "development",
    "remoteExecution": false,
    "environments": {
      "development": {
        "remoteExecution": false,
        "logLevel": "DEBUG",
        "workDir": "./target"
      },
      "production": {
        "logLevel": "WARN"
      }
    }
  },
  
  "plugins": {
    "uu_mylib-uudck-uucli": {
      "logLevel": "INFO",
      "environments": {
        "development": {
          "myCustomParam": "value"
        }
      }
    }
  },
  
  "devkit": {
    "development": {
      "uuScriptRepositoryBaseUri": "https://...",
      "uuAppDevkitScriptEngineBaseUri": "https://...",
      "uuConsoleBaseUri": "https://...",
      "uuCodebaseRepositoryBaseUri": "https://..."
    }
  }
}
```

## .uudck/config.json (Private)

Never commit this file. Contains personal/local settings.

```json
{
  "vendor": "uu",
  "uuApp": "myApp",
  "uuSubApp": "main",
  "generation": "g01",
  "port": "9090",
  "host": "http://localhost",
  
  "uuGatewayBaseUri": "http://localhost:9090/uu-gateway-maing02/...",
  "uuBusinessTerritoryBaseUri": "http://localhost:9090/uu-businessterritory-maing01/...",
  
  "asidMap": {
    "myAsid": {
      "initToken": "...",
      "clientSecret": "...",
      "awidMap": {
        "myAwid": {
          "clientSecret": "..."
        }
      }
    }
  }
}
```

## Environment-Specific Configuration

### env/development.json

```json
{
  "port": 8080,
  "log_level": "INFO",
  
  "asid": "11111111111111111111111111111111",
  "asid_license_owner_list": ["14-2710-1"],
  
  "uuSubAppDataStoreMap": {
    "primary": "mongodb://127.0.0.1:27017/uuMyAppPrimary"
  },
  
  "script_console_base_uri": "https://...",
  "script_engine_base_uri": "https://...",
  "script_repository_base_uri": "https://...",
  
  "uu_app_oidc_providers_oidcg02_uri": "https://..."
}
```

## Plugin Configuration

### Register Your Plugin

In your plugin's `package.json`:

```json
{
  "name": "uu_mylib-uudck-uucli",
  "version": "0.1.0",
  "description": "uuAppDevKit CLI plugin for my library",
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

### Install Plugin to uudck

```bash
cd uu_mylib-uudck-uucli
npm install
uudck plugins:link .
```

**Important:** Use `uudck plugins:link` (not `npm link`) to register the plugin with uudck.

### Plugin-Specific Settings

Add to target project's `uuapp.json`:

```json
{
  "plugins": {
    "uu_mylib-uudck-uucli": {
      "environments": {
        "development": {
          "customSetting": "value"
        }
      }
    }
  }
}
```

### Access in CLI Task

```javascript
// Get plugin config
const pluginConfig = this.config.pjson.oclif;

// Get environment-specific value
const env = this.flags.environment ?? "development";
const value = this.getConfigValue(`plugins.uu_mylib-uudck-uucli.environments.${env}.customSetting`);
```

## Remote Execution Configuration

### Required URIs

| Config Key | Purpose |
|------------|---------|
| `uuScriptRepositoryBaseUri` | Where scripts are stored |
| `uuAppDevkitScriptEngineBaseUri` | Where scripts execute |
| `uuConsoleBaseUri` | Progress and logging UI |
| `uuCodebaseRepositoryBaseUri` | Git repository |

### Example Remote Setup

```json
{
  "devkit": {
    "development": {
      "uuScriptRepositoryBaseUri": "https://uuapp-dev.plus4u.net/uu-script-repositoryg02/...",
      "uuAppDevkitScriptEngineBaseUri": "https://uuapp-dev.plus4u.net/uu-script-engineg02/...",
      "uuConsoleBaseUri": "https://uuapp.plus4u.net/uu-console-maing02/..."
    }
  }
}
```

## local-config.json

For local development automation scripts:

```json
{
  "uuIdentity": "12-3456-1",
  "uuBusinessTerritoryBaseUri": "http://localhost:9090/uu-businessterritory-maing01/...",
  
  "uuApp": {
    "vendor": "uu",
    "uuApp": "myApp",
    "uuSubApp": "main",
    "generation": "g01",
    "host": "http://localhost:9090",
    "innerPort": "8080"
  },
  
  "source": {
    "baseUri": "https://...",
    "appType": "document",
    "oid": "...",
    "fileOid": "..."
  },
  
  "asid": "...",
  "awidList": [
    {
      "awid": "...",
      "uuTerritoryBaseUri": "http://localhost:9090/uu-businessterritory-maing01/...",
      "locationId": "...",
      "name": "My AWID",
      "desc": "Development workspace"
    }
  ],
  
  "dockerEnvPath": "/path/to/uu_dockerenvg01"
}
```

## uuCloudg02 Deployment Configuration

### uucloudg02-development.json

```json
{
  "uuAppBoxDescriptor": {
    "schemaVersion": "2.0",
    "code": "uu-myapp-maing01",
    "version": "1.0.0",
    "name": "My Application",
    "description": "Application description",
    "uuAppPackList": [
      {
        "code": "uuAppPack01",
        "name": "Main Pack",
        "type": "MAIN",
        "uuSubAppList": ["main"]
      }
    ]
  },
  
  "uuAppPackRuntimeStackMap": {
    "uuAppPack01": "docker://uuapp-dev-repo.plus4u.net/runtimestacks/uu_appruntimestackg02-nodejs:0.1"
  },
  
  "uuSubAppDeploymentConfig": {
    "uuAppResourcePoolOid": "...",
    "targetSlot": "production",
    "asid": "...",
    "awidList": ["..."]
  },
  
  "uuAppServerEnvironment": {
    "uu_app_oidc_providers_oidcg02_uri": "https://...",
    "asid_license_owner_list": ["..."],
    "log_level": "INFO"
  }
}
```

## Configuration Best Practices

1. **Never commit secrets** - Use `.uudck/config.json` for tokens and secrets
2. **Use environment-specific configs** - Separate development/production settings
3. **Default to development** - Set `defaultEnvironment: "development"`
4. **Document plugin settings** - Add comments in uuapp.json or README
5. **Validate early** - Check required config values in CLI task init
