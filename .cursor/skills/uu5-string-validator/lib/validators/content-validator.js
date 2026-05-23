"use strict";

const ErrorMessageFormatter = require("../error-message-formatter.js");

/**
 * Content validator - validates special characters, patterns, and nested prefixes using AST
 */
class ContentValidator {
  /**
   * Validates content in the AST
   * @param {RootNode} ast The AST to validate
   * @param {String} originalContent Original content for error context
   * @param {String} level Validation level ("strict", "standard", "lenient")
   * @param {String} verbosity Verbosity level: "minimal", "standard", "detailed"
   * @returns {Object} Object with errors and warnings arrays
   */
  validate(ast, originalContent, level = "standard", verbosity = "detailed") {
    const errors = [];
    const warnings = [];
    this.verbosity = verbosity;

    this._validateNode(ast, originalContent, level, errors, warnings);
    this._validateNestedUu5StringEntities(originalContent, level, errors, warnings);

    return { errors, warnings };
  }

  /**
   * Detects display-style HTML entities (e.g. &bull;, &mdash;) inside the value
   * of any `uu5string="..."` / `uu5string='...'` attribute. The inner uu5string
   * parser does NOT decode them, so they render as literal text on the page.
   *
   * Structural entities (&lt;, &gt;, &amp;, &quot;, &apos;) are intentionally
   * left alone — replacing them with literal characters would break parsing.
   *
   * Emits warnings in standard mode, errors in strict mode.
   *
   * @param {String} source Original uu5string source
   * @param {String} level Validation level
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateNestedUu5StringEntities(source, level, errors, warnings) {
    if (!source || typeof source !== "string") return;

    const STRUCTURAL = new Set(["lt", "gt", "amp", "quot", "apos"]);
    const SUGGESTIONS = {
      bull: { unicode: "•", name: "U+2022 BULLET" },
      mdash: { unicode: "—", name: "U+2014 EM DASH" },
      ndash: { unicode: "–", name: "U+2013 EN DASH" },
      hellip: { unicode: "…", name: "U+2026 HORIZONTAL ELLIPSIS" },
      middot: { unicode: "·", name: "U+00B7 MIDDLE DOT" },
      nbsp: { unicode: "\u00A0", name: "U+00A0 NON-BREAKING SPACE" },
      laquo: { unicode: "«", name: "U+00AB LEFT-POINTING ANGLE QUOTE" },
      raquo: { unicode: "»", name: "U+00BB RIGHT-POINTING ANGLE QUOTE" },
      copy: { unicode: "©", name: "U+00A9 COPYRIGHT SIGN" },
      reg: { unicode: "®", name: "U+00AE REGISTERED SIGN" },
      trade: { unicode: "™", name: "U+2122 TRADE MARK SIGN" },
      times: { unicode: "×", name: "U+00D7 MULTIPLICATION SIGN" },
      divide: { unicode: "÷", name: "U+00F7 DIVISION SIGN" },
      deg: { unicode: "°", name: "U+00B0 DEGREE SIGN" },
      plusmn: { unicode: "±", name: "U+00B1 PLUS-MINUS SIGN" },
      micro: { unicode: "µ", name: "U+00B5 MICRO SIGN" },
      para: { unicode: "¶", name: "U+00B6 PILCROW SIGN" },
      sect: { unicode: "§", name: "U+00A7 SECTION SIGN" },
      ldquo: { unicode: "“", name: "U+201C LEFT DOUBLE QUOTATION MARK" },
      rdquo: { unicode: "”", name: "U+201D RIGHT DOUBLE QUOTATION MARK" },
      lsquo: { unicode: "‘", name: "U+2018 LEFT SINGLE QUOTATION MARK" },
      rsquo: { unicode: "’", name: "U+2019 RIGHT SINGLE QUOTATION MARK" },
    };

    const attrMatches = source.matchAll(/\buu5string\s*=\s*(["'])/g);
    for (const m of attrMatches) {
      const quote = m[1];
      const valueStart = m.index + m[0].length;
      let valueEnd = -1;
      for (let i = valueStart; i < source.length; i++) {
        if (source[i] === "\\" && source[i + 1] === quote) {
          i++;
          continue;
        }
        if (source[i] === quote) {
          valueEnd = i;
          break;
        }
      }
      if (valueEnd === -1) continue;

      const value = source.slice(valueStart, valueEnd);
      const seen = new Map();
      for (const em of value.matchAll(/&([a-zA-Z][a-zA-Z0-9]*);/g)) {
        const name = em[1];
        if (STRUCTURAL.has(name)) continue;
        const absPos = valueStart + em.index;
        if (!seen.has(name)) seen.set(name, []);
        seen.get(name).push(absPos);
      }

      for (const [name, positions] of seen) {
        const suggestion = SUGGESTIONS[name];
        const replacement = suggestion
          ? ` Use the literal character '${suggestion.unicode}' (${suggestion.name}) instead.`
          : " Use the literal Unicode character instead.";
        const message =
          `HTML entity '&${name};' inside nested uu5string attribute at position(s) ${positions.join(", ")}. ` +
          `Inner uu5string parser does NOT decode HTML entities — it will render as literal text.${replacement}`;
        if (level === "strict") {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }
  }

  /**
   * Recursively validates a node for content issues
   * @param {AstNode} node Node to validate
   * @param {String} originalContent Original content
   * @param {String} level Validation level
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateNode(node, originalContent, level, errors, warnings) {
    // Validate text nodes in strict mode
    if (node.type === "Text" && level === "strict") {
      this._validateTextNode(node, errors, warnings);
    }

    // Validate attributes for nested uu5string prefix issues
    if (node.type === "Element" && node.attributes) {
      for (const attr of node.attributes) {
        this._validateAttributeContent(attr, originalContent, level, errors, warnings);
      }
    }

    // Recursively validate children
    if (node.children) {
      for (const child of node.children) {
        this._validateNode(child, originalContent, level, errors, warnings);
      }
    }

    // Validate nested uu5String in attributes
    if (node.attributes) {
      for (const attr of node.attributes) {
        if (attr.value && attr.value.nestedAst) {
          this._validateNode(attr.value.nestedAst, originalContent, level, errors, warnings);
        }
      }
    }
  }

  /**
   * Validates text node content
   * @param {TextNode} textNode Text node to validate
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateTextNode(textNode, errors, warnings) {
    const content = textNode.content;

    // Check for unescaped special characters (strict mode)
    const patterns = [
      { char: "&", entity: "&amp;", regex: /&(?![a-zA-Z]+;|#\d+;)/ },
      { char: "<", entity: "&lt;", regex: /<(?![A-Za-z/!])/ },
      { char: ">", entity: "&gt;", regex: /(?<![A-Za-z/])>(?!\s*<)/ },
    ];

    for (const { char, entity, regex } of patterns) {
      if (regex.test(content)) {
        warnings.push(
          `Unescaped special character '${char}' found in content at position ${textNode.start}. In strict XML/HTML mode, use ${entity} instead.`,
        );
      }
    }
  }

  /**
   * Validates attribute content for JSX expression errors
   * @param {AttributeNode} attr Attribute to validate
   * @param {String} originalContent Original content
   * @param {String} level Validation level
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateAttributeContent(attr, originalContent, level, errors, warnings) {
    if (!attr.value) return;

    // Standard and strict modes
    if (level === "standard" || level === "strict") {
      // Check for string literals in JSX expressions (unnecessary braces)
      if (attr.value.type === "ExpressionValue") {
        const content = attr.value.content.trim();

        // Check if it's a simple quoted string (not uu5json)
        if (!content.startsWith("<uu5json/>")) {
          const quotedStringMatch = /^(['"])([^'"{}]*)\1$/.exec(content);
          if (quotedStringMatch) {
            const quote = quotedStringMatch[1];
            const value = quotedStringMatch[2];

            errors.push(
              ErrorMessageFormatter.formatError(
                {
                  type: "unnecessary_jsx_expression",
                  message: `Unnecessary JSX expression for string literal in prop "${attr.name}"`,
                  position: attr.start,
                  solutions: [
                    `Use ${attr.name}=${quote}${value}${quote} instead of ${attr.name}={${quote}${value}${quote}}`,
                  ],
                },
                this.verbosity,
              ),
            );
          }
        }

        // Check for double opening braces
        if (content.startsWith("{")) {
          errors.push(
            ErrorMessageFormatter.formatError(
              {
                type: "double_opening_braces",
                message: `Syntax error in prop "${attr.name}": Double opening braces detected`,
                position: attr.start,
                problem: "Did you mean to use a single brace for the JSX expression?",
              },
              this.verbosity,
            ),
          );
        }
      }
    }

    // Strict mode: Check for unsafe patterns
    if (level === "strict" && attr.value.type === "StringValue") {
      this._checkUnsafePatterns(attr, warnings);
    }
  }

  /**
   * Checks for potentially unsafe HTML patterns (strict mode)
   * @param {AttributeNode} attr Attribute to check
   * @param {Array} warnings Warnings array
   * @private
   */
  _checkUnsafePatterns(attr, warnings) {
    const value = attr.value.value;

    // Check for inline event handlers
    if (/^on[a-z]+$/i.test(attr.name)) {
      warnings.push(
        `Inline event handler detected: "${attr.name}" at position ${attr.start}. Consider using React-style event handlers instead.`,
      );
    }

    // Check for javascript: protocol in href
    if (attr.name === "href" && /javascript:/i.test(value)) {
      warnings.push(`Potentially unsafe "javascript:" protocol detected in href attribute at position ${attr.start}.`);
    }

    // Check for eval
    if (/\beval\s*\(/.test(value)) {
      warnings.push(
        `Use of eval() detected at position ${attr.start}, which can be unsafe. Consider alternative approaches.`,
      );
    }
  }
}

module.exports = new ContentValidator();
