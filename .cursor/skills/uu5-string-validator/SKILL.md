---
name: uu5-string-validator
description: Validate UU5 string content for syntax errors, component issues, and formatting problems. Use when working with UU5 content from BookKit, ManagementKit, or any UU5-based application. Use before saving or updating UU5 content to prevent errors.
---

# UU5 String Validator

Validate UU5 string content before saving to BookKit, ManagementKit, or other UU5-based applications.

## Prerequisites

- Node.js (v14+)

## Quick Start

```bash
# From the skill directory (uu5-string-validator/)
# Validate a string
node validate.js "<uu5string/><Uu5Elements.Text>Hello</Uu5Elements.Text>"

# Validate a file
node validate.js content.uu5

# From stdin
cat content.uu5 | node validate.js -
```

## CLI Options

```
-l, --level <level>      Validation level: lenient, standard (default), strict
-v, --verbosity <level>  Output verbosity: minimal, standard, detailed (default)
-h, --help               Show help
```

## Programmatic Usage

```javascript
const path = require('path');
// Resolve relative to this script's location
const { validate } = require(path.join(__dirname, '../uu5-string-validator/lib/index.js'));

const result = validate('<uu5string/><Uu5Elements.Text>Hello</Uu5Elements.Text>', null, {
  level: 'standard',
  verbosity: 'detailed'
});

console.log(result.errors);   // Critical issues that must be fixed
console.log(result.warnings); // Suggestions and potential issues
```

## What is UU5 String?

UU5 string is a JSX-like markup format used in Unicorn Universe applications. All content must:
- Start with `<uu5string/>`
- Use valid component names
- Have properly closed tags
- Follow UU5 component attribute conventions

## Validation Checks

1. **Structure Validation** - JSX tag matching, void elements, self-closing syntax
2. **Attribute Validation** - Quote consistency, JSX expressions, formatting
3. **JSON Validation** - JSON syntax in attributes, nested content
4. **Component Validation** - Component existence, naming conventions
5. **Content Validation** - Nested patterns, JSX expressions

## Common Errors

### Missing uu5string prefix
```xml
<!-- WRONG -->
<Uu5Elements.Text>Hello</Uu5Elements.Text>

<!-- CORRECT -->
<uu5string/>
<Uu5Elements.Text>Hello</Uu5Elements.Text>
```

### Unclosed tags
```xml
<!-- WRONG -->
<uu5string/>
<Uu5Elements.Text>Hello

<!-- CORRECT -->
<uu5string/>
<Uu5Elements.Text>Hello</Uu5Elements.Text>
```

### Invalid JSX expressions
```xml
<!-- WRONG -->
<Uu5CodeKit.Code.Input readOnly=true />

<!-- CORRECT -->
<Uu5CodeKit.Code.Input readOnly={true} />
```

## Validation Workflow

1. **Prepare content** - Ensure it starts with `<uu5string/>`
2. **Validate** - Run the validator
3. **Fix errors** - Address all errors (warnings can be reviewed)
4. **Re-validate** - Confirm no errors remain
5. **Proceed** - Content is safe to save

## Component Validation

The validator loads the sibling `uu5-components/data/bricks.json` catalog as the single source of truth for component tags and props. When the catalog is available, it validates real component definitions, including required props and selected prop value rules such as `colorScheme`.

Do not add a separate component registry to this skill. If component metadata is wrong or missing, update the `uu5-components` skill/catalog so `brickSearch`, `brickDefinitionGet`, and this validator stay consistent.

## Tips

- Always validate before saving to avoid API errors
- Warnings are informational - errors must be fixed
- Use "strict" level for production content
- Test complex content with the validator before building templates
