"use strict";

const ErrorMessageFormatter = require("../error-message-formatter.js");

/**
 * JSON validator - validates JSON in uu5json blocks using AST
 */
class JsonValidator {
  /**
   * Validates JSON in the AST
   * @param {RootNode} ast The AST to validate
   * @param {String} originalContent Original content for error context
   * @param {String} verbosity Verbosity level: "minimal", "standard", "detailed"
   * @returns {Object} Object with errors and warnings arrays
   */
  validate(ast, originalContent, verbosity = "detailed") {
    const errors = [];
    const warnings = [];
    this.verbosity = verbosity;

    this._validateNode(ast, originalContent, errors, warnings);

    return { errors, warnings };
  }

  /**
   * Recursively validates a node for JSON content
   * @param {AstNode} node Node to validate
   * @param {String} originalContent Original content
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateNode(node, originalContent, errors, warnings) {
    // Validate element attributes
    if (node.type === "Element" && node.attributes) {
      for (const attr of node.attributes) {
        if (attr.value && attr.value.jsonContent) {
          this._validateJsonNode(attr.value.jsonContent, attr.name, attr.start, errors, warnings);
        }
      }
    }

    // Recursively validate children
    if (node.children) {
      for (const child of node.children) {
        this._validateNode(child, originalContent, errors, warnings);
      }
    }

    // Validate nested uu5String in attributes
    if (node.attributes) {
      for (const attr of node.attributes) {
        if (attr.value && attr.value.nestedAst) {
          this._validateNode(attr.value.nestedAst, originalContent, errors, warnings);
        }
      }
    }
  }

  /**
   * Validates a JSON node
   * @param {JsonNode} jsonNode JSON node to validate
   * @param {String} attrName Attribute name for error context
   * @param {Number} position Position in original content
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateJsonNode(jsonNode, attrName, position, errors, warnings) {
    // Check for empty JSON
    if (!jsonNode.rawContent || !jsonNode.rawContent.trim()) {
      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "empty_json",
            message: `Empty JSON in attribute "${attrName}"`,
            position,
          },
          this.verbosity,
        ),
      );
      return;
    }

    // Check for nested <uu5json/> prefixes (CRITICAL ERROR)
    if (/<uu5json\s*\/>/.test(jsonNode.rawContent)) {
      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "nested_uu5json_prefix",
            message: `Invalid JSON in attribute "${attrName}": Nested <uu5json/> prefix detected inside JSON content`,
            position,
            problem:
              "The <uu5json/> prefix should ONLY appear at the attribute level, not within the JSON structure itself.",
            solutions: [
              'Use pure JSON after prefix: data=\'<uu5json/>[{"style":{"bold":true}}]\' - CORRECT',
              'NOT nested prefixes: data=\'<uu5json/>[{"style":<uu5json/>{"bold":true}}]\' - WRONG',
            ],
            note: 'Rule: Once you use <uu5json/> for an attribute, write PURE JSON only - no more <uu5json/> prefixes inside. All nested objects and arrays are regular JSON: {"key": "value"}, not {"key": <uu5json/>"value"}',
          },
          this.verbosity,
        ),
      );
      return;
    }

    // Check for common JSON errors
    const commonErrors = this._checkCommonJsonErrors(jsonNode.unescapedContent, attrName, position);
    if (commonErrors.length > 0) {
      errors.push(...commonErrors);
      return;
    }

    // Check if JSON is valid (already parsed in parser)
    if (!jsonNode.isValid) {
      const errorMsg = this._formatJsonParseError(jsonNode.parseError, jsonNode.unescapedContent, attrName, position);
      errors.push(errorMsg);
    }
  }

  /**
   * Checks for common JSON syntax errors
   * @param {String} jsonStr JSON string to validate
   * @param {String} attrName Attribute name for error context
   * @param {Number} position Position in the original content
   * @returns {Array} Array of error messages
   * @private
   */
  _checkCommonJsonErrors(jsonStr, attrName, position) {
    const errors = [];

    // Check for single quotes
    if (this._hasSingleQuotedStrings(jsonStr)) {
      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "json_single_quotes",
            message: `Invalid JSON in attribute "${attrName}": JSON strings must use double quotes, not single quotes`,
            position,
          },
          this.verbosity,
        ),
      );
    }

    // Check for unquoted keys
    if (this._hasUnquotedKeys(jsonStr)) {
      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "json_unquoted_keys",
            message: `Invalid JSON in attribute "${attrName}": Object keys must be quoted with double quotes`,
            position,
          },
          this.verbosity,
        ),
      );
    }

    // Check for trailing commas
    if (/,\s*[}\]]/.test(jsonStr)) {
      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "json_trailing_comma",
            message: `Invalid JSON in attribute "${attrName}": Trailing commas are not allowed in JSON`,
            position,
          },
          this.verbosity,
        ),
      );
    }

    // Check for unbalanced brackets and braces
    const balanceResult = this._checkJsonBalance(jsonStr);
    if (!balanceResult.balanced) {
      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "json_unbalanced",
            message: `Invalid JSON in attribute "${attrName}": ${balanceResult.error}`,
            position,
          },
          this.verbosity,
        ),
      );
    }

    return errors;
  }

  /**
   * Checks if JSON string contains single-quoted strings
   * @param {String} jsonStr JSON string to check
   * @returns {Boolean} True if single quotes found
   * @private
   */
  _hasSingleQuotedStrings(jsonStr) {
    const singleQuotePattern = /'[^']*'(?=\s*[,:\]}])/;
    return singleQuotePattern.test(jsonStr);
  }

  /**
   * Checks if JSON string contains unquoted object keys
   * @param {String} jsonStr JSON string to check
   * @returns {Boolean} True if unquoted keys found
   * @private
   */
  _hasUnquotedKeys(jsonStr) {
    const unquotedKeyPattern = /\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/;
    const match = unquotedKeyPattern.exec(jsonStr);
    if (!match) return false;

    const beforeKey = jsonStr.substring(0, match.index + 1);
    const lastQuote = Math.max(beforeKey.lastIndexOf('"'), beforeKey.lastIndexOf("'"));
    const lastBrace = beforeKey.lastIndexOf("{");

    return lastQuote <= lastBrace;
  }

  /**
   * Checks if JSON has balanced brackets and braces
   * @param {String} jsonStr JSON string to check
   * @returns {Object} Object with balanced flag and error message
   * @private
   */
  _checkJsonBalance(jsonStr) {
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") braceCount++;
      if (char === "}") braceCount--;
      if (char === "[") bracketCount++;
      if (char === "]") bracketCount--;

      if (braceCount < 0) {
        return { balanced: false, error: "Unexpected closing brace '}'" };
      }
      if (bracketCount < 0) {
        return { balanced: false, error: "Unexpected closing bracket ']'" };
      }
    }

    if (braceCount > 0) {
      return { balanced: false, error: `Missing ${braceCount} closing brace${braceCount > 1 ? "s" : ""} '}'` };
    }
    if (bracketCount > 0) {
      return { balanced: false, error: `Missing ${bracketCount} closing bracket${bracketCount > 1 ? "s" : ""} ']'` };
    }

    return { balanced: true, error: null };
  }

  /**
   * Formats JSON parse error with helpful context
   * @param {String} parseError Parse error message
   * @param {String} jsonStr JSON string that failed to parse
   * @param {String} attrName Attribute name for error context
   * @param {Number} position Position in the original content
   * @returns {String} Formatted error message
   * @private
   */
  _formatJsonParseError(parseError, jsonStr, attrName, position) {
    let errorMsg = `Invalid JSON syntax in attribute "${attrName}" at position ${position}: ${parseError}`;

    const posMatch = /position (\d+)/.exec(parseError);
    if (posMatch) {
      const errorPos = parseInt(posMatch[1], 10);
      const context = this._getJsonErrorContext(jsonStr, errorPos);
      if (context) {
        errorMsg += `\n${context}`;
      }
    }

    return errorMsg;
  }

  /**
   * Gets context around JSON error position
   * @param {String} jsonStr JSON string
   * @param {Number} errorPos Error position
   * @returns {String} Context string with error indicator
   * @private
   */
  _getJsonErrorContext(jsonStr, errorPos) {
    const start = Math.max(0, errorPos - 20);
    const end = Math.min(jsonStr.length, errorPos + 20);
    const context = jsonStr.substring(start, end);
    const caretPos = errorPos - start;

    return `Near: ...${context}...\n${" ".repeat(caretPos + 10)}^`;
  }
}

module.exports = new JsonValidator();
