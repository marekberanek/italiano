---
name: appbox-copy
description: Copy uuAppBoxes between app box registries using uu_cloudg02-devkit app-box-copy. Use when the user wants to copy an app box, migrate app boxes between registries, copy uuSubApp or uuApp images, or mentions app-box-copy, appbox copy, or copying app boxes between environments.
---

# AppBox Copy Assistant

Construct and execute `npx uu_cloudg02-devkit app-box-copy` commands to copy uuAppBoxes from one app box registry to another.

## Critical Rules

- **ALWAYS** confirm the constructed command with the user before executing
- **NEVER** invent or assume parameter values -- ask the user if anything is missing
- **ALWAYS** verify that referenced files (credentials, descriptors) exist before executing
- **ALWAYS** use `@latest` suffix on the package when the user does not specify a version

## Scenarios

There are two main scenarios depending on the target environment:

### Scenario 1: Same Identity Provider (e.g. prod plus4u to plus4u)

When both source and target registries share the same identity provider (typically production plus4u), only minimal parameters are needed.

**Required parameters:**
| Parameter | Description |
|-----------|-------------|
| `--environment` | Environment name (e.g. `prod`) |
| `--uuAppBoxUri` | Full URI to the source app box (with code, version, type) |
| `--targetUuAppBoxRegistryBaseUri` | Base URI of the target app box registry |

**Command pattern:**
```bash
npx uu_cloudg02-devkit@latest app-box-copy \
  --environment=prod \
  --uuAppBoxUri="<source-appbox-uri>" \
  --targetUuAppBoxRegistryBaseUri=<target-registry-uri>
```

**Example:**
```bash
npx uu_cloudg02-devkit@latest app-box-copy \
  --environment=prod \
  --uuAppBoxUri="https://uuapp.plus4u.net/uu-cloud-appboxregistryg01/666ea994668941a087a7f2e15a11e4bb/uuAppBox/get?code=uu-managementkit-maing02&version=2.26.14&type=uuSubApp&extended=true" \
  --targetUuAppBoxRegistryBaseUri=https://ume.doh-sne-uep.com/uu-cloud-appboxregistryg01/00089030210000000000000000000100
```

### Scenario 2: Cross Identity Provider (e.g. plus4u to a different environment)

When source and target use different identity providers (e.g. copying from plus4u prod to a test/private environment), additional authentication parameters are needed.

**Required parameters:**
| Parameter | Description |
|-----------|-------------|
| `--environment` | Environment name (e.g. `test1`) |
| `--identityProviderUri` | OIDC URI of the **source** identity provider |
| `--targetIdentityProviderUri` | OIDC URI of the **target** identity provider |
| `--credentialsFile` | Path to credentials file for the **source** app box registry |
| `--targetCredentialsFile` | Path to credentials file for the **target** app box registry |
| `--uuSubAppInstanceDescriptor` | Path to the uuCloud descriptor JSON for the target deployment |
| `--uuAppBoxUri` | Full URI to the source app box (with code, version, type) |
| `--targetUuAppBoxRegistryBaseUri` | Base URI of the target app box registry |
| `--targetUuAppImageRegistryUri` | URI of the target image registry (e.g. Harbor) |

**Command pattern:**
```bash
npx uu_cloudg02-devkit@latest app-box-copy \
  --environment=<env> \
  --identityProviderUri=<source-oidc-uri> \
  --targetIdentityProviderUri=<target-oidc-uri> \
  --credentialsFile=<path-to-source-credentials> \
  --targetCredentialsFile=<path-to-target-credentials> \
  --uuSubAppInstanceDescriptor=<path-to-descriptor-json> \
  --uuAppBoxUri="<source-appbox-uri>" \
  --targetUuAppBoxRegistryBaseUri=<target-registry-uri> \
  --targetUuAppImageRegistryUri=<target-image-registry-uri>
```

**Example:**
```bash
npx uu_cloudg02-devkit@latest app-box-copy \
  --environment=test1 \
  --identityProviderUri=https://uuidentity.plus4u.net/uu-oidc-maing02/bb977a99f4cc4c37a2afce3fd599d0a7/oidc \
  --targetIdentityProviderUri=https://<target-uep-host>/uu-oidc-maing02/<target-oidc-awid>/oidc \
  --credentialsFile=<path-to-source-credentials>/sourceAppBoxRegistry.pwd \
  --targetCredentialsFile=<path-to-target-credentials>/targetAppBoxRegistry.pwd \
  --uuSubAppInstanceDescriptor=<path-to-descriptor>/uucloud-test1.json \
  --uuAppBoxUri="https://uuapp.plus4u.net/uu-cloud-appboxregistryg01/<source-registry-awid>/uuAppBox/get?code=uu-managementkit-maing02&version=2.26.14&type=uuSubApp&extended=true" \
  --targetUuAppBoxRegistryBaseUri=https://<target-uep-host>/uu-cloud-appboxregistryg01/<target-registry-awid> \
  --targetUuAppImageRegistryUri=https://<target-image-registry-host>/uucloudg02
```

## Workflow

1. **Ask the user** which scenario applies:
   - Same identity provider (simple) -- Scenario 1
   - Cross identity provider (full params) -- Scenario 2

2. **Collect parameters** -- ask for any values the user hasn't provided:
   - App box code, version, and type (to construct `--uuAppBoxUri`)
   - Target registry URI
   - For Scenario 2: identity provider URIs, credentials file paths, descriptor path, image registry URI

3. **Verify files exist** -- for any `--credentialsFile`, `--targetCredentialsFile`, or `--uuSubAppInstanceDescriptor` paths, check they exist on disk before running

4. **Construct the command** and show it to the user for confirmation

5. **Execute** after the user confirms

## Constructing the uuAppBoxUri

The `--uuAppBoxUri` follows this pattern:

```
https://<host>/uu-cloud-appboxregistryg01/<awid>/uuAppBox/get?code=<app-code>&version=<version>&type=<type>&extended=true
```

| Part | Description | Example |
|------|-------------|---------|
| `host` | Source environment host | `uuapp.plus4u.net` |
| `awid` | App box registry AWID | `666ea994668941a087a7f2e15a11e4bb` |
| `code` | App code | `uu-managementkit-maing02` |
| `version` | App version to copy | `2.26.14` |
| `type` | `uuSubApp` or `uuApp` | `uuSubApp` |

If the user provides these parts separately, construct the full URI. If they provide a full URI, use it directly.

## Parameter Reference

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--environment` | Always | Target environment name |
| `--uuAppBoxUri` | Always | Full URI of the source app box |
| `--targetUuAppBoxRegistryBaseUri` | Always | Base URI of the target registry |
| `--identityProviderUri` | Scenario 2 | Source OIDC provider URI |
| `--targetIdentityProviderUri` | Scenario 2 | Target OIDC provider URI |
| `--credentialsFile` | Scenario 2 | Path to source credentials `.pwd` file |
| `--targetCredentialsFile` | Scenario 2 | Path to target credentials `.pwd` file |
| `--uuSubAppInstanceDescriptor` | Scenario 2 | Path to uuCloud descriptor JSON |
| `--targetUuAppImageRegistryUri` | Scenario 2 | Target image registry URI (e.g. Harbor) |
