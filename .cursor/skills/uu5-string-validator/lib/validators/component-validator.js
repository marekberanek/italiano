"use strict";

const ColorSchemeValues = require("../constants/color-scheme-values.js");
const ErrorMessageFormatter = require("../error-message-formatter.js");

// Legacy uu5g04 components that are NOT in the modern catalog but ARE valid at runtime
// (uu5g04 is loaded by BookKit / MngKit alongside uu5g05). They are flagged as informational
// warnings so the author knows to prefer the modern Uu5Bricks.* equivalent when possible.
// Match by prefix: anything starting with "UU5." is legacy g04 namespace.
const LEGACY_G04_PREFIX = "UU5.";

const LEGACY_G04_HINTS = {
  "UU5.Bricks.Div": "Uu5Bricks.Div (only margin/padding) or Uu5Bricks.Box for styled wrapper",
  "UU5.Bricks.Span": "UU5.Bricks.Span is fine inside UU5.RichText.Block uu5string",
  "UU5.Bricks.P": "UU5.RichText.Block (modern rich text) or Uu5Bricks.Box",
  "UU5.RichText.Block": "the modern equivalent is Uu5RichTextBricks.Block, but UU5.RichText.Block remains the standard for inline-formatted text inside hosts",
};

function isLegacyG04Tag(tagName) {
  return typeof tagName === "string" && tagName.startsWith(LEGACY_G04_PREFIX);
}

/**
 * Component validator - validates brick existence, naming, and required attributes using AST
 */
class ComponentValidator {
  /**
   * Validates components in the AST
   * @param {RootNode} ast The AST to validate
   * @param {String} originalContent Original content for error context
   * @param {Map} availableBrickTags Optional Map of brick tag names to brick definitions
   * @param {String} verbosity Verbosity level: "minimal", "standard", "detailed"
   * @returns {Object} Object with errors and warnings arrays
   */
  validate(ast, originalContent, availableBrickTags = null, verbosity = "detailed") {
    const errors = [];
    const warnings = [];
    this.verbosity = verbosity;

    const foundBricks = new Set();
    this._validateNode(ast, originalContent, availableBrickTags, foundBricks, errors, warnings);

    return { errors, warnings };
  }

  /**
   * Recursively validates a node for components
   * @param {AstNode} node Node to validate
   * @param {String} originalContent Original content
   * @param {Map} availableBrickTags Available brick tags
   * @param {Set} foundBricks Set of already validated bricks
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateNode(node, originalContent, availableBrickTags, foundBricks, errors, warnings) {
    // Validate element if it's a component (contains dots) and we have brick tags
    if (availableBrickTags && node.type === "Element" && node.tagName.includes(".")) {
      this._validateComponent(node, originalContent, availableBrickTags, foundBricks, errors, warnings);
    }

    // Validate inline style syntax globally (runs even without brick tags)
    if (node.type === "Element" && node.attributes) {
      this._validateInlineStyle(node, originalContent, errors, warnings);
    }

    // Recursively validate children
    if (node.children) {
      for (const child of node.children) {
        this._validateNode(child, originalContent, availableBrickTags, foundBricks, errors, warnings);
      }
    }

    // Validate nested uu5String in attributes
    if (node.attributes) {
      for (const attr of node.attributes) {
        if (attr.value && attr.value.nestedAst) {
          this._validateNode(attr.value.nestedAst, originalContent, availableBrickTags, foundBricks, errors, warnings);
        }
      }
    }
  }

  /**
   * Validates a component element
   * @param {ElementNode} element Element to validate
   * @param {String} originalContent Original content
   * @param {Map} availableBrickTags Available brick tags
   * @param {Set} foundBricks Set of already validated bricks (for existence checks only)
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateComponent(element, originalContent, availableBrickTags, foundBricks, errors, warnings) {
    const brickTag = element.tagName;

    // Check brick existence only once per brick type
    if (!foundBricks.has(brickTag)) {
      foundBricks.add(brickTag);

      // Check if brick exists
      if (!availableBrickTags.has(brickTag)) {
        const isLegacy = isLegacyG04Tag(brickTag);
        const isNestedComponent = (brickTag.match(/\./g) || []).length > 1;

        if (isLegacy) {
          const hint = LEGACY_G04_HINTS[brickTag];
          warnings.push(
            ErrorMessageFormatter.formatError(
              {
                type: "legacy_g04_component",
                message: `Component "${brickTag}" is a legacy uu5g04 component (works at runtime, but not in the modern Uu5Bricks catalog)`,
                position: element.start,
                problem: "Modern (uu5g05) catalog is preferred for new content. Legacy components keep working but mix old + new behaviour.",
                solutions: hint
                  ? [`Modern equivalent: ${hint}`, "If you need inline style on a wrapper, legacy UU5.Bricks.Div with style is acceptable"]
                  : ["Search the modern catalog (uu5-components brickSearch) for an equivalent", "If no equivalent exists, the legacy component is acceptable"],
              },
              this.verbosity,
            ),
          );
        } else if (isNestedComponent) {
          warnings.push(
            ErrorMessageFormatter.formatError(
              {
                type: "nested_component_not_found",
                message: `Nested component "${brickTag}" is used but not found in the available bricks`,
                position: element.start,
                problem: "This may be a child component that needs to be used within the correct parent component",
                solutions: [
                  "Verify it's used within the correct parent component",
                  "Check if the component name is correct",
                ],
              },
              this.verbosity,
            ),
          );
        } else {
          warnings.push(
            ErrorMessageFormatter.formatError(
              {
                type: "component_not_found",
                message: `Component "${brickTag}" is used but not found in the available bricks`,
                position: element.start,
                problem: "The component may not exist, have an incorrect name, or bricks may not be synchronized",
                solutions: [
                  "Verify the component tag name exists and is correct",
                  "Check if the bricks are synchronized with the current codebase",
                ],
              },
              this.verbosity,
            ),
          );
        }
        return;
      }
    }

    // Get brick definition (needed for every instance)
    const brick = availableBrickTags.get(brickTag);
    if (!brick || !brick.properties) return;

    // Validate required attributes (for every instance)
    this._validateRequiredAttributes(element, brick.properties, errors);

    // Validate attribute values (for every instance - includes colorScheme)
    this._validateAttributeValues(element, brick.properties, errors, warnings);
  }

  /**
   * Validates required attributes for a component
   * @param {ElementNode} element Element
   * @param {Object} properties Component properties definition
   * @param {Array} errors Errors array
   * @private
   */
  _validateRequiredAttributes(element, properties, errors) {
    // Find required properties
    const requiredProps = [];
    for (const [propName, propDef] of Object.entries(properties)) {
      if (propDef.required === "true") {
        requiredProps.push(propName);
      }
    }

    if (requiredProps.length === 0) return;

    // Get present attributes
    const presentAttributes = new Set(element.attributes.map((attr) => attr.name));

    // Check which required attributes are missing
    const missingAttributes = requiredProps.filter((reqProp) => !presentAttributes.has(reqProp));

    if (missingAttributes.length > 0) {
      const attrContent = this._extractAttributeContent(element);
      const tagSnippet = attrContent.length > 60 ? attrContent.substring(0, 60) + "..." : attrContent;

      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "missing_required_attributes",
            message: `Component "${element.tagName}" is missing required attribute(s)`,
            position: element.start,
            found: `<${element.tagName}${tagSnippet}>`,
            problem: `Missing required attributes: ${missingAttributes.join(", ")}`,
            solutions: [`Add the missing attribute(s) to the component: ${missingAttributes.join(", ")}`],
          },
          this.verbosity,
        ),
      );
    }
  }

  /**
   * Validates component-specific attribute values
   * @param {ElementNode} element Element
   * @param {Object} properties Component properties definition
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateAttributeValues(element, properties, errors, warnings) {
    for (const attr of element.attributes) {
      const propDef = properties[attr.name];
      if (!propDef || !propDef.type) continue;

      const propType = propDef.type.toLowerCase();

      // Check for incorrect usage of curly braces for primitive types
      const usesJsxExpression = attr.value && attr.value.type === "ExpressionValue";

      // 0. Check for colorScheme type with invalid value
      if (this._isColorSchemeType(propType)) {
        this._validateColorSchemeValue(element, attr, errors);
      }

      // 1. Check for unit or number types with curly braces
      if (this._isPrimitiveNumberType(propType) && usesJsxExpression) {
        const attrContent = this._extractAttributeContent(element);
        const tagSnippet = attrContent.length > 60 ? attrContent.substring(0, 60) + "..." : attrContent;

        warnings.push(
          ErrorMessageFormatter.formatError(
            {
              type: "primitive_number_type_with_braces",
              message: `Component "${element.tagName}" has incorrect value for primitive type attribute "${attr.name}"`,
              position: element.start,
              found: `<${element.tagName}${tagSnippet}>`,
              problem: `Attribute "${attr.name}" has type "${propDef.type}" and should NOT use curly braces {}. Current (WRONG): ${attr.name}=${attr.rawValue}`,
              solutions: [
                `Use direct number: ${attr.name}=300 - CORRECT`,
                `Use string with unit: ${attr.name}="300px" - CORRECT`,
                `Use string expression: ${attr.name}="8px 12px" - CORRECT`,
              ],
              note:
                `Correct usage for unit/number types:\n` +
                `  - With curly braces: ${attr.name}={300} - WRONG (causes zero value)\n` +
                `  - Direct number: ${attr.name}=300 - CORRECT\n` +
                `  - String with unit: ${attr.name}="300px" - CORRECT\n` +
                `  - String expression: ${attr.name}="8px 12px" - CORRECT\n` +
                `  \n` +
                `  Rule: Primitive number/unit values should be unquoted numbers or quoted strings, NOT JSX expressions.`,
            },
            this.verbosity,
          ),
        );
      }

      // 2. Check for boolean types with quotes or curly braces
      if (this._isPrimitiveBooleanType(propType)) {
        const usesQuotes = attr.value && attr.value.type === "StringValue" && attr.value.quoteChar;

        if (usesJsxExpression || usesQuotes) {
          const attrContent = this._extractAttributeContent(element);
          const tagSnippet = attrContent.length > 60 ? attrContent.substring(0, 60) + "..." : attrContent;

          warnings.push(
            ErrorMessageFormatter.formatError(
              {
                type: "primitive_boolean_type_with_quotes",
                message: `Component "${element.tagName}" has incorrect value for boolean attribute "${attr.name}"`,
                position: element.start,
                found: `<${element.tagName}${tagSnippet}>`,
                problem: `Attribute "${attr.name}" has type "${propDef.type}" and should NOT use quotes or curly braces. Current (WRONG): ${attr.name}=${attr.rawValue}`,
                solutions: [`Use direct value: ${attr.name}=true - CORRECT`],
                note:
                  `Correct usage for boolean types:\n` +
                  `  - Quoted: ${attr.name}="true" - WRONG\n` +
                  `  - JSX expression: ${attr.name}={true} - WRONG\n` +
                  `  - Direct value: ${attr.name}=true - CORRECT\n` +
                  `  \n` +
                  `  Rule: Boolean values should be unquoted: true or false, NOT {true} or "true".`,
              },
              this.verbosity,
            ),
          );
        }
      }
    }
  }

  /**
   * Validates inline style syntax for HTML elements
   * @param {ElementNode} element Element
   * @param {String} originalContent Original content
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateInlineStyle(element, originalContent, errors, warnings) {
    const styleAttr = element.attributes.find((attr) => attr.name === "style");
    if (!styleAttr || !styleAttr.value) return;

    // Skip if this is a React component (has dot notation)
    if (element.tagName.includes(".")) return;

    // Skip if this is a custom component (starts with capital letter)
    if (/^[A-Z]/.test(element.tagName)) return;

    // Skip if already uses <uu5json/>
    if (styleAttr.value.hasUu5JsonPrefix) return;

    // Check if it's a string value with CSS-style syntax
    if (styleAttr.value.type === "StringValue") {
      const styleValue = styleAttr.value.value;

      // Check if it contains CSS-style syntax (property: value; pairs)
      if (styleValue.includes(":") && styleValue.trim().length > 0) {
        errors.push(
          ErrorMessageFormatter.formatError(
            {
              type: "css_inline_style",
              message: `Inline style attribute (in <${element.tagName}>) uses CSS string syntax`,
              position: styleAttr.start,
              problem: "HTML inline styles in React require JavaScript objects with camelCase properties",
              solutions: [
                'Use <uu5json/> with React-style properties: style="<uu5json/>{\\"fontSize\\": \\"18px\\", \\"color\\": \\"red\\"}"',
                'NOT CSS syntax: style="font-size: 18px; color: red;"',
              ],
            },
            this.verbosity,
          ),
        );
      }
    }
  }

  /**
   * Checks if property type is a primitive number/unit type
   * @param {String} propType Property type string (lowercased)
   * @returns {Boolean} True if it's a number/unit type
   * @private
   */
  _isPrimitiveNumberType(propType) {
    const numberKeywords = ["number", "unit"];
    return numberKeywords.some((keyword) => propType.includes(keyword));
  }

  /**
   * Checks if property type is a primitive boolean type
   * @param {String} propType Property type string (lowercased)
   * @returns {Boolean} True if it's a boolean type
   * @private
   */
  _isPrimitiveBooleanType(propType) {
    return propType.includes("boolean");
  }

  /**
   * Checks if property type is a colorScheme type
   * @param {String} propType Property type string (lowercased)
   * @returns {Boolean} True if it's a colorScheme type
   * @private
   */
  _isColorSchemeType(propType) {
    return propType.includes("colorscheme");
  }

  /**
   * Validates colorScheme attribute value
   * @param {ElementNode} element Element
   * @param {AttributeNode} attr Attribute
   * @param {Array} errors Errors array
   * @private
   */
  _validateColorSchemeValue(element, attr, errors) {
    if (!attr.value) return;

    // Extract the colorScheme value
    let colorSchemeValue = null;

    if (attr.value.type === "StringValue") {
      colorSchemeValue = attr.value.value;
    } else if (attr.value.type === "UnquotedValue") {
      colorSchemeValue = attr.value.value;
    }

    // Skip validation if we couldn't extract a value
    if (!colorSchemeValue) return;

    // Check if the value is valid
    if (!ColorSchemeValues.isValidColorScheme(colorSchemeValue)) {
      const attrContent = this._extractAttributeContent(element);
      const tagSnippet = attrContent.length > 60 ? attrContent.substring(0, 60) + "..." : attrContent;

      // Try to suggest a valid alternative
      const suggestion = ColorSchemeValues.suggestColorScheme(colorSchemeValue);
      const suggestionText = suggestion ? `\n  Did you mean: colorScheme="${suggestion}"?` : "";

      const solutions = [`Use one of the predefined colorScheme values`];
      if (suggestion) {
        solutions.unshift(`Use colorScheme="${suggestion}"`);
      }

      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "invalid_color_scheme",
            message: `Component "${element.tagName}" has invalid colorScheme value`,
            position: element.start,
            found: `<${element.tagName}${tagSnippet}>`,
            problem: `colorScheme="${colorSchemeValue}" is not a valid value${suggestionText}`,
            solutions,
            note: "Rule: Use one of the predefined colorScheme values. Invalid values will cause components to not render properly.",
          },
          this.verbosity,
        ),
      );
    }
  }

  /**
   * Extracts attribute content for error messages
   * @param {ElementNode} element Element
   * @returns {String} Attribute content string
   * @private
   */
  _extractAttributeContent(element) {
    if (element.attributes.length === 0) {
      return "";
    }

    const attrStrings = element.attributes.map((attr) => {
      return ` ${attr.name}=${attr.rawValue}`;
    });

    return attrStrings.join("");
  }
}

module.exports = new ComponentValidator();
