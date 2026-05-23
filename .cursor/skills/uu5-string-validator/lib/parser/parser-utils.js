"use strict";

/**
 * Shared parsing utilities for uu5String parser
 */
class ParserUtils {
  /**
   * HTML void elements that must be self-closing in JSX
   */
  static VOID_ELEMENTS = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);

  /**
   * Checks if element is a void HTML element
   * @param {String} tagName Tag name
   * @returns {Boolean} True if void element
   */
  static isVoidElement(tagName) {
    return this.VOID_ELEMENTS.has(tagName.toLowerCase());
  }

  /**
   * Checks if component should be self-closing based on naming patterns
   * @param {String} componentName Component name
   * @returns {Boolean} True if should be self-closing
   */
  static shouldBeSelfClosing(componentName) {
    const selfClosingPatterns = [
      /Image$/i, // Uu5ImagingBricks.Image, etc.
      /Icon$/i, // Icon components
      /Input$/i, // Input components
      /^Link$/, // Standalone Link
    ];

    return selfClosingPatterns.some((pattern) => pattern.test(componentName));
  }

  /**
   * Finds the end position of a tag (position of '>')
   * Handles quotes and JSX expressions properly
   * @param {String} content Content to search
   * @param {Number} startPos Start position (at '<')
   * @returns {Number} Position of '>' or -1 if not found
   */
  static findTagEnd(content, startPos) {
    let pos = startPos + 1;
    let inString = false;
    let stringChar = null;
    let inExpression = false;
    let braceDepth = 0;
    let escaped = false;

    while (pos < content.length) {
      const char = content[pos];

      // If previous character was backslash, this character is escaped
      if (escaped) {
        escaped = false;
        pos++;
        continue;
      }

      // Check for escape character
      if (char === "\\") {
        escaped = true;
        pos++;
        continue;
      }

      // Handle string literals in attributes
      if (!inExpression && (char === '"' || char === "'")) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      }

      // Handle JSX expressions in attributes
      if (!inString && char === "{") {
        inExpression = true;
        braceDepth++;
      } else if (!inString && char === "}") {
        braceDepth--;
        if (braceDepth === 0) {
          inExpression = false;
        }
      }

      // Found tag end if not in string or expression
      if (!inString && !inExpression && char === ">") {
        return pos;
      }

      pos++;
    }

    return -1;
  }

  /**
   * Extracts tag name from tag content
   * @param {String} tagContent Tag content (between < and >)
   * @returns {String} Tag name
   */
  static extractTagName(tagContent) {
    const trimmed = tagContent.trim();
    // Handle closing tags
    if (trimmed.startsWith("/")) {
      const nameMatch = /^\/([^\s/>]+)/.exec(trimmed);
      return nameMatch ? nameMatch[1] : "";
    }
    // Handle opening/self-closing tags
    const nameMatch = /^([^\s/>]+)/.exec(trimmed);
    return nameMatch ? nameMatch[1] : "";
  }

  /**
   * Finds the end of a quoted string value
   * @param {String} content Content to search
   * @param {Number} startPos Start position (after opening quote)
   * @param {String} quoteChar Quote character (' or ")
   * @returns {Number} End position (at closing quote) or -1 if not found
   */
  static findQuotedValueEnd(content, startPos, quoteChar) {
    let pos = startPos;
    let escaped = false;

    while (pos < content.length) {
      const char = content[pos];

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

      if (char === quoteChar) {
        return pos;
      }

      pos++;
    }

    return -1;
  }

  /**
   * Extracts content from quoted string
   * @param {String} content Content to search
   * @param {Number} startPos Start position (after opening quote)
   * @param {Number} endPos End position (at closing quote)
   * @returns {String} Extracted content (with escape sequences preserved)
   */
  static extractQuotedContent(content, startPos, endPos) {
    return content.substring(startPos, endPos);
  }

  /**
   * Finds the matching closing brace for a JSX expression
   * @param {String} content Content to search
   * @param {Number} startPos Start position (at opening brace '{')
   * @returns {Number} Position of matching closing brace or -1 if not found
   */
  static findMatchingBrace(content, startPos) {
    let depth = 1;
    let pos = startPos + 1;
    let inString = false;
    let stringChar = null;
    let escaped = false;

    while (pos < content.length && depth > 0) {
      const char = content[pos];

      if (escaped) {
        escaped = false;
        pos++;
        continue;
      }

      if (inString && char === "\\") {
        escaped = true;
        pos++;
        continue;
      }

      // Handle string literals inside expressions
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = null;
      }

      if (!inString) {
        if (char === "{") depth++;
        if (char === "}") {
          depth--;
          if (depth === 0) {
            return pos;
          }
        }
      }

      pos++;
    }

    return -1;
  }

  /**
   * Checks if content starts with a specific prefix
   * @param {String} content Content to check
   * @param {String} prefix Prefix to look for
   * @returns {Boolean} True if content starts with prefix
   */
  static hasPrefix(content, prefix) {
    return content.trim().startsWith(prefix);
  }

  /**
   * Removes prefix from content
   * @param {String} content Content
   * @param {String} prefix Prefix to remove
   * @returns {String} Content without prefix
   */
  static removePrefix(content, prefix) {
    const trimmed = content.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.substring(prefix.length);
    }
    return content;
  }

  /**
   * Unescapes a string value (removes backslash escapes)
   * @param {String} value Escaped value
   * @returns {String} Unescaped value
   */
  static unescape(value) {
    return value.replace(/\\(.)/g, "$1");
  }

  /**
   * Detects the level of JSON escaping based on independent quote character doubling
   *
   * CORE PRINCIPLE:
   * Each quote character (" and ') has its own independent escape counter.
   * When you nest with ", you need to escape " characters.
   * When you nest with ', you need to escape ' characters.
   * But JSON always uses " for strings, so we always count " escaping.
   *
   * Escape formula: 2^level - 1 backslashes
   * - Level 0: 0 backslashes (no escaping)
   * - Level 1: 1 backslash   (\")
   * - Level 2: 3 backslashes (\\\")
   * - Level 3: 7 backslashes (\\\\\\\")
   *
   * Examples:
   * - attr="<uu5json/>{\"k\":\"v\"}"                    → " used 1x → level 1 → 1 backslash
   * - attr="<uu5string/>...attr=\"<uu5json/>..."       → " used 2x → level 2 → 3 backslashes
   * - attr='<uu5string/>...attr='<uu5json/>..."        → ' used 2x → level 2 → 3 backslashes
   * - attr="<uu5string/>...attr='<uu5json/>{\"k\":\"v\"}'  → ' used 1x, but JSON uses " → level 1 → 1 backslash
   *
   * @param {String} jsonContent JSON content to analyze
   * @param {String} quoteChar Quote character used for the attribute (' or ")
   * @param {Number} nestingLevel Current total nesting level (0 = root, 1+ = nested uu5String)
   * @param {Array} quoteHistory History of quote characters used: ['"', "'", '"', ...]
   * @returns {Number} Escape level (0 for unescaped, 1-n for nested levels, -1 for invalid)
   */
  static detectEscapeLevel(jsonContent, quoteChar = null, nestingLevel = 0, quoteHistory = []) {
    // JSON always uses double quotes (") for property names and string values
    // So we need to count how many times " appears in the nesting history
    // regardless of whether the current attribute uses " or '

    // Count how many times DOUBLE QUOTE (") appears in the nesting history
    const doubleQuoteCount = quoteHistory.filter((q) => q === '"').length;

    // The escape level for JSON (which uses ") is based on " count
    let expectedEscapeLevel = doubleQuoteCount;

    // If the current attribute ALSO uses ", we need to add 1 more level
    if (quoteChar === '"') {
      expectedEscapeLevel = doubleQuoteCount + 1;
    }

    // Special case: single quote at root level (no nesting)
    if (quoteChar === "'" && nestingLevel === 0 && quoteHistory.length === 0) {
      return 0; // No escaping needed for JSON
    }

    // Detect actual backslash count in the content
    const matches = jsonContent.match(/\\+"/g);
    if (!matches || matches.length === 0) {
      // No escaped quotes found - valid if expectedEscapeLevel is 0
      return expectedEscapeLevel;
    }

    const backslashCount = matches[0].length - 1; // Subtract the quote character

    // Calculate expected backslashes: 2^expectedEscapeLevel - 1
    const expectedBackslashes = expectedEscapeLevel > 0 ? Math.pow(2, expectedEscapeLevel) - 1 : 0;

    // Check if actual matches expected
    if (backslashCount === expectedBackslashes) {
      return expectedEscapeLevel;
    }

    // Mismatch between expected and actual escaping
    return -1;
  }

  /**
   * Unescapes JSON content based on escape level
   * Performs iterative unescaping to handle multiple escape levels correctly
   *
   * Follows the uu5String nesting rule where each level halves the backslashes:
   * - Level 1: \" -> " (1 backslash -> 0)
   * - Level 2: \\\" -> \" -> " (3 -> 1 -> 0)
   * - Level 3: \\\\\\\" -> \\\" -> \" -> " (7 -> 3 -> 1 -> 0)
   * - Level n: Requires n passes, each halving backslashes: (2^n - 1) -> ... -> 1 -> 0
   *
   * @param {String} jsonContent JSON content
   * @param {Number} escapeLevel Escape level (-1 for invalid, 0 for none, 1-n for valid levels)
   * @returns {String} Unescaped JSON content
   */
  static unescapeJson(jsonContent, escapeLevel) {
    // Handle invalid escape level - return content as-is so JSON parsing will fail
    if (escapeLevel < 0) {
      return jsonContent;
    }

    if (escapeLevel === 0) {
      return jsonContent; // No unescaping needed
    }

    let result = jsonContent;

    // Perform iterative unescaping
    // Each pass transforms: 2^(n-i) - 1 backslashes -> 2^(n-i-1) - 1 backslashes
    // Example for level 3:
    //   Pass 0: 7 (\\\\\\") -> 3 (\\\")
    //   Pass 1: 3 (\\\")     -> 1 (\")
    //   Pass 2: 1 (\")       -> 0 (")

    for (let i = 0; i < escapeLevel; i++) {
      const currentLevel = escapeLevel - i;
      const backslashCount = Math.pow(2, currentLevel) - 1;

      // Build the regex pattern for current backslash count
      // We need to match backslashCount backslashes followed by a quote
      const backslashes = "\\\\".repeat(backslashCount);
      const pattern = new RegExp(backslashes + '"', "g");

      // Calculate replacement: half the backslashes (rounded down) + quote
      const nextBackslashCount = Math.pow(2, currentLevel - 1) - 1;
      const replacement = "\\".repeat(nextBackslashCount) + '"';

      result = result.replace(pattern, replacement);
    }

    return result;
  }

  /**
   * Checks if a character is whitespace
   * @param {String} char Character to check
   * @returns {Boolean} True if whitespace
   */
  static isWhitespace(char) {
    return /\s/.test(char);
  }

  /**
   * Skips whitespace characters
   * @param {String} content Content
   * @param {Number} startPos Start position
   * @returns {Number} Position after whitespace
   */
  static skipWhitespace(content, startPos) {
    let pos = startPos;
    while (pos < content.length && this.isWhitespace(content[pos])) {
      pos++;
    }
    return pos;
  }
}

module.exports = ParserUtils;
