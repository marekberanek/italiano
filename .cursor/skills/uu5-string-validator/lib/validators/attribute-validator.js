"use strict";

const ErrorMessageFormatter = require("../error-message-formatter.js");

/**
 * Attribute validator - validates attributes using AST
 * Checks: quote escaping, unescaped quotes, JSX expression syntax
 */
class AttributeValidator {
  /**
   * Validates attributes in the AST
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
   * Recursively validates a node and its attributes
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
        this._validateAttribute(attr, originalContent, errors, warnings);
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
   * Validates a single attribute
   * @param {AttributeNode} attr Attribute to validate
   * @param {String} originalContent Original content
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateAttribute(attr, originalContent, errors, warnings) {
    if (!attr.value) return;

    if (attr.value.type === "StringValue") {
      this._validateStringValue(attr, originalContent, errors, warnings);
    } else if (attr.value.type === "ExpressionValue") {
      this._validateExpressionValue(attr, originalContent, errors, warnings);
    }
  }

  /**
   * Validates string attribute value
   * @param {AttributeNode} attr Attribute
   * @param {String} originalContent Original content
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateStringValue(attr, originalContent, errors, warnings) {
    const stringValue = attr.value;
    const value = stringValue.value;
    const quoteChar = stringValue.quoteChar;

    // Skip validation if no quote character (numeric values)
    if (!quoteChar) return;

    // Check for unescaped quotes in the value
    const unescapedQuotes = this._findUnescapedQuotes(value, quoteChar);

    if (unescapedQuotes.sameQuote !== -1) {
      // Found unescaped same quote
      const oppositeQuote = quoteChar === '"' ? "'" : '"';
      const snippet = value.length > 50 ? value.substring(0, 50) + "..." : value;
      const preContext = value.substring(0, Math.min(unescapedQuotes.sameQuote, value.length));
      const postContext = value.substring(
        unescapedQuotes.sameQuote + 1,
        Math.min(unescapedQuotes.sameQuote + 20, value.length),
      );
      const truncatedValue = this._truncate(value, 100);
      const truncatedEscaped = this._truncate(value.replace(new RegExp(quoteChar, "g"), "\\" + quoteChar), 100);
      const truncatedEntities = this._truncate(
        value.replace(new RegExp(quoteChar, "g"), quoteChar === '"' ? "&quot;" : "&apos;"),
        100,
      );

      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "unescaped_quote",
            message: `Unescaped ${quoteChar === '"' ? "double" : "single"} quote detected in attribute "${attr.name}"`,
            position: attr.start + unescapedQuotes.sameQuote,
            found: `${attr.name}=${quoteChar}${snippet}${quoteChar}`,
            problem: `Quote appears at: "${preContext}[HERE]${postContext}"`,
            solutions: [
              `Use ${oppositeQuote} to wrap the value: ${attr.name}=${oppositeQuote}${truncatedValue}${oppositeQuote}`,
              `Escape the quote: ${attr.name}=${quoteChar}${truncatedEscaped}${quoteChar}`,
              `Use HTML entities: ${attr.name}=${quoteChar}${truncatedEntities}${quoteChar}`,
            ],
          },
          this.verbosity,
        ),
      );
      return;
    }

    // Check for quote conflicts (both quote types present)
    if (unescapedQuotes.sameQuote !== -1 && unescapedQuotes.oppositeQuotes.length > 0) {
      const oppositeQuote = quoteChar === '"' ? "'" : '"';
      const snippet = value.length > 50 ? value.substring(0, 50) + "..." : value;
      const truncatedEntities = this._truncate(value.replace(/"/g, "&quot;").replace(/'/g, "&apos;"), 100);
      const truncatedEscaped = this._truncate(value.replace(new RegExp(quoteChar, "g"), "\\" + quoteChar), 100);
      const truncatedTemplate = this._truncate(value, 100);

      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "quote_conflict",
            message: `Quote conflict detected in attribute "${attr.name}"`,
            position: attr.start,
            found: `${attr.name}=${quoteChar}${snippet}${quoteChar}`,
            problem: `Attribute contains both ${quoteChar === '"' ? "double" : "single"} and ${oppositeQuote === '"' ? "double" : "single"} quotes. This makes it impossible to switch quote styles.`,
            solutions: [
              `Use HTML entities: ${attr.name}=${quoteChar}${truncatedEntities}${quoteChar}`,
              `Escape the quotes: ${attr.name}=${quoteChar}${truncatedEscaped}${quoteChar}`,
              `Use JSX expression with template literals: ${attr.name}={\`${truncatedTemplate}\`}`,
            ],
          },
          this.verbosity,
        ),
      );
    }
  }

  /**
   * Validates JSX expression attribute value
   * @param {AttributeNode} attr Attribute
   * @param {String} originalContent Original content
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateExpressionValue(attr, originalContent, errors, warnings) {
    const exprValue = attr.value;
    const content = exprValue.content.trim();

    if (!content) return;

    // Check if it has <uu5json/> prefix
    const hasUu5JsonPrefix = content.startsWith("<uu5json/>");

    // Check if content looks like JSON
    const looksLikeJson = content.startsWith("[") || content.startsWith("{");

    if (looksLikeJson && !hasUu5JsonPrefix) {
      const hasJsonCharacteristics =
        (content.includes('"') || content.includes("'")) && (content.includes(":") || content.includes(","));

      if (hasJsonCharacteristics) {
        const contentSnippet = content.length > 50 ? content.substring(0, 50) + "..." : content;
        errors.push(
          ErrorMessageFormatter.formatError(
            {
              type: "missing_uu5json_prefix",
              message: `JSX expression in attribute "${attr.name}" appears to contain JSON but is missing the <uu5json/> prefix`,
              position: attr.start,
              found: `${attr.name}={${contentSnippet}}`,
              solutions: [`Use: ${attr.name}={<uu5json/>${contentSnippet}}`],
            },
            this.verbosity,
          ),
        );
      }
    }
  }

  /**
   * Finds unescaped quotes in a value
   * @param {String} value Value to check
   * @param {String} quoteChar Quote character used to wrap the value
   * @returns {Object} Object with sameQuote position and oppositeQuotes array
   * @private
   */
  _findUnescapedQuotes(value, quoteChar) {
    const oppositeQuote = quoteChar === '"' ? "'" : '"';
    let pos = 0;
    let escaped = false;
    let sameQuote = -1;
    const oppositeQuotes = [];

    while (pos < value.length) {
      const char = value[pos];

      if (escaped) {
        escaped = false;
        pos++;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        pos++;
        continue;
      }

      if (char === quoteChar && sameQuote === -1) {
        sameQuote = pos;
      }

      if (char === oppositeQuote) {
        oppositeQuotes.push(pos);
      }

      pos++;
    }

    return { sameQuote, oppositeQuotes };
  }

  /**
   * Truncates a string to a maximum length
   * @param {String} str String to truncate
   * @param {Number} maxLength Maximum length
   * @returns {String} Truncated string
   * @private
   */
  _truncate(str, maxLength = 100) {
    if (!str || str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + "...";
  }
}

module.exports = new AttributeValidator();
