"use strict";

const ParserUtils = require("../parser/parser-utils.js");
const ErrorMessageFormatter = require("../error-message-formatter.js");

/**
 * Structure validator - validates JSX/HTML structure using AST
 * Checks: tag matching, nesting, void elements, self-closing components
 */
class StructureValidator {
  /**
   * Validates structure of the AST
   * @param {RootNode} ast The AST to validate
   * @param {String} originalContent Original content for error context
   * @param {String} verbosity Verbosity level: "minimal", "standard", "detailed"
   * @returns {Object} Object with errors and warnings arrays
   */
  validate(ast, originalContent, verbosity = "detailed") {
    const errors = [];
    const warnings = [];
    this.verbosity = verbosity;

    // Check for forbidden </uu5string> closing tag
    if (/<\/uu5string>/.test(originalContent)) {
      const match = /<\/uu5string>/.exec(originalContent);
      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "forbidden_closing_tag",
            message: "Forbidden closing tag </uu5string> found",
            position: match.index,
            problem: "uu5String only uses the opening <uu5string/> prefix and NEVER has a closing tag",
            solutions: ["Remove the </uu5string> closing tag"],
            note:
              'Correct usage: uu5String="<uu5string/><div>Content</div>"\n' +
              '  Incorrect: uu5String="<uu5string/><div>Content</div></uu5string>"',
          },
          this.verbosity,
        ),
      );
    }

    this._validateNode(ast, originalContent, errors, warnings);

    return { errors, warnings };
  }

  /**
   * Recursively validates a node and its children
   * @param {AstNode} node Node to validate
   * @param {String} originalContent Original content
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateNode(node, originalContent, errors, warnings) {
    if (node.type === "Element") {
      this._validateElement(node, originalContent, errors, warnings);
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
          // Recursively validate nested uu5String
          this._validateNode(attr.value.nestedAst, originalContent, errors, warnings);
        }
      }
    }
  }

  /**
   * Validates an element node
   * @param {ElementNode} element Element to validate
   * @param {String} originalContent Original content
   * @param {Array} errors Errors array
   * @param {Array} warnings Warnings array
   * @private
   */
  _validateElement(element, originalContent, errors, warnings) {
    // Check void elements
    if (element.voidElement && !element.selfClosing) {
      const tagSnippet = this._extractTagSnippet(originalContent, element.start, element.openTagEnd);
      const attrContent = this._extractAttributeContent(element);

      errors.push(
        ErrorMessageFormatter.formatError(
          {
            type: "void_element_not_self_closed",
            message: `Self-closing HTML tag "${element.tagName}" is not properly closed`,
            position: element.start,
            found: tagSnippet,
            problem: `HTML void elements like <${element.tagName}> must be self-closed with a trailing slash in JSX`,
            solutions: [`Use <${element.tagName}${attrContent}/> instead of <${element.tagName}${attrContent}>`],
            note: `Common void elements: ${Array.from(ParserUtils.VOID_ELEMENTS).join(", ")}`,
          },
          this.verbosity,
        ),
      );
      return;
    }

    // Check if component should be self-closing (when it has no children or only whitespace)
    if (!element.selfClosing && !element.voidElement && ParserUtils.shouldBeSelfClosing(element.tagName)) {
      const hasNonWhitespaceChildren = element.children.some(
        (child) => child.type !== "Text" || child.content.trim().length > 0,
      );

      if (!hasNonWhitespaceChildren) {
        const tagSnippet = this._extractTagSnippet(originalContent, element.start, element.openTagEnd);
        const attrContent = this._extractAttributeContent(element);
        const closingTag =
          element.closeTagStart !== -1
            ? this._extractTagSnippet(originalContent, element.closeTagStart, element.end)
            : "";

        errors.push(
          ErrorMessageFormatter.formatError(
            {
              type: "component_should_be_self_closed",
              message: `Component "${element.tagName}" should be self-closing`,
              position: element.start,
              found: `${tagSnippet}...${closingTag}`,
              problem: "Self-closing components should use /> syntax when they have no children",
              solutions: [`Use <${element.tagName}${attrContent}/>`],
              note: "Components like Image, Icon, and other leaf components should be self-closed.",
            },
            this.verbosity,
          ),
        );
      }
    }

    // Check for unclosed tags (missing closing tag when not self-closing)
    if (!element.selfClosing && !element.voidElement && element.closeTagStart === -1) {
      const tagSnippet = this._extractTagSnippet(originalContent, element.start, element.openTagEnd);

      // Check if this might be a self-closing component
      if (ParserUtils.shouldBeSelfClosing(element.tagName)) {
        const attrContent = this._extractAttributeContent(element);
        errors.push(
          ErrorMessageFormatter.formatError(
            {
              type: "component_should_be_self_closed",
              message: `Component "${element.tagName}" should be self-closing`,
              position: element.start,
              found: tagSnippet,
              problem: "Self-closing components should use /> syntax and not have a closing tag",
              solutions: [`Use <${element.tagName}${attrContent}/>`],
              note: "Components like Image, Icon, and other leaf components should be self-closed.",
            },
            this.verbosity,
          ),
        );
      } else {
        errors.push(
          ErrorMessageFormatter.formatError(
            {
              type: "tag_not_closed",
              message: `Tag ${element.tagName} is not closed`,
              position: element.start,
            },
            this.verbosity,
          ),
        );
      }
    }
  }

  /**
   * Extracts tag snippet for error messages
   * @param {String} content Original content
   * @param {Number} start Start position
   * @param {Number} end End position
   * @returns {String} Tag snippet
   * @private
   */
  _extractTagSnippet(content, start, end) {
    const snippet = content.substring(start, end + 1);
    return snippet.length > 80 ? snippet.substring(0, 77) + "..." : snippet;
  }

  /**
   * Extracts attribute content for error messages
   * @param {ElementNode} element Element
   * @returns {String} Attribute content string (e.g., " className='foo'")
   * @private
   */
  _extractAttributeContent(element) {
    if (element.attributes.length === 0) {
      return "";
    }

    const attrStrings = element.attributes.map((attr) => {
      return ` ${attr.name}=${attr.rawValue}`;
    });

    const combined = attrStrings.join("");
    return combined.length > 50 ? " " + combined.substring(0, 47).trim() + "..." : combined;
  }
}

module.exports = new StructureValidator();
