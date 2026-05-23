"use strict";

const {
  RootNode,
  ElementNode,
  AttributeNode,
  StringValue,
  ExpressionValue,
  BooleanValue,
  TextNode,
  CommentNode,
  JsonNode,
} = require("./ast-nodes.js");
const ParserUtils = require("./parser-utils.js");

/**
 * Parser for uu5String content
 * Converts uu5String content into an Abstract Syntax Tree (AST)
 */
class Uu5Parser {
  constructor(nestingLevel = 0, quoteHistory = []) {
    this.content = "";
    this.pos = 0;
    this.errors = [];
    this.nestingLevel = nestingLevel; // Track total nesting depth
    this.quoteHistory = quoteHistory; // Track which quote char was used at each level: ['"', "'", '"', ...]
  }

  /**
   * Parses uu5String content into an AST
   * @param {String} content The uu5String content to parse
   * @returns {RootNode} Root AST node
   */
  parse(content) {
    this.content = content;
    this.pos = 0;
    this.errors = [];

    // Remove <uu5string/> prefix if present
    const trimmed = content.trim();
    if (trimmed.startsWith("<uu5string/>")) {
      this.content = trimmed.substring(12);
    }

    const root = new RootNode(0, this.content.length);
    this._parseChildren(root);

    return root;
  }

  /**
   * Parses children nodes until end or closing tag
   * @param {ElementNode|RootNode} parent Parent node
   * @param {String} stopTag Optional tag name to stop at (for closing tags)
   * @private
   */
  _parseChildren(parent, stopTag = null) {
    while (this.pos < this.content.length) {
      const char = this.content[this.pos];

      // Check for tag
      if (char === "<") {
        // Check for comment
        if (this.content.substr(this.pos, 4) === "<!--") {
          const comment = this._parseComment();
          if (comment) {
            parent.children.push(comment);
          }
          continue;
        }

        // Check for closing tag
        if (this.content[this.pos + 1] === "/") {
          const closingTagName = this._peekClosingTagName();
          if (stopTag && closingTagName === stopTag) {
            // Found matching closing tag, stop parsing children
            return;
          }
          // Mismatched closing tag - will be caught by validator
          // Skip it and continue
          const tagEnd = ParserUtils.findTagEnd(this.content, this.pos);
          if (tagEnd !== -1) {
            this.pos = tagEnd + 1;
          } else {
            this.pos++;
          }
          continue;
        }

        // Opening tag or self-closing tag
        const element = this._parseElement();
        if (element) {
          parent.children.push(element);
        }
        continue;
      }

      // Text content
      const text = this._parseText(stopTag);
      if (text && text.content.length > 0) {
        parent.children.push(text);
      }
    }
  }

  /**
   * Parses an HTML/JSX element
   * @returns {ElementNode|null} Parsed element or null
   * @private
   */
  _parseElement() {
    const start = this.pos;
    const tagEnd = ParserUtils.findTagEnd(this.content, start);

    if (tagEnd === -1) {
      this.errors.push({ type: "unclosed_tag", position: start });
      this.pos++;
      return null;
    }

    const tagContent = this.content.substring(start + 1, tagEnd);
    const isSelfClosing = this.content[tagEnd - 1] === "/";

    const element = new ElementNode(start, tagEnd);
    element.tagName = ParserUtils.extractTagName(tagContent);
    element.selfClosing = isSelfClosing;
    element.voidElement = ParserUtils.isVoidElement(element.tagName);
    element.openTagEnd = tagEnd;

    // Parse attributes
    this._parseAttributes(element, tagContent);

    this.pos = tagEnd + 1;

    // If self-closing or void element, no children to parse
    if (isSelfClosing || element.voidElement) {
      element.end = tagEnd;
      return element;
    }

    // Parse children until closing tag
    const childrenStart = this.pos;
    this._parseChildren(element, element.tagName);

    // Look for closing tag
    const closingTagStart = this.pos;
    if (this.content[this.pos] === "<" && this.content[this.pos + 1] === "/") {
      const closingTagEnd = ParserUtils.findTagEnd(this.content, this.pos);
      if (closingTagEnd !== -1) {
        element.closeTagStart = closingTagStart;
        element.end = closingTagEnd;
        this.pos = closingTagEnd + 1;
      } else {
        element.end = this.content.length;
      }
    } else {
      // No closing tag found
      element.end = this.pos;
    }

    return element;
  }

  /**
   * Parses attributes from tag content
   * @param {ElementNode} element Element to add attributes to
   * @param {String} tagContent Tag content (between < and >)
   * @private
   */
  _parseAttributes(element, tagContent) {
    // Find where attributes start (after tag name)
    const tagNameEnd = tagContent.search(/[\s/>]/);
    if (tagNameEnd === -1) {
      return; // No attributes
    }

    let attrContent = tagContent.substring(tagNameEnd);
    // Remove trailing / if self-closing
    if (attrContent.trim().endsWith("/")) {
      attrContent = attrContent.substring(0, attrContent.lastIndexOf("/"));
    }

    let pos = 0;
    while (pos < attrContent.length) {
      // Skip whitespace
      pos = ParserUtils.skipWhitespace(attrContent, pos);
      if (pos >= attrContent.length) break;

      // Extract attribute name
      const nameMatch = /^([a-zA-Z][a-zA-Z0-9]*)\s*=\s*/.exec(attrContent.substring(pos));
      if (!nameMatch) {
        pos++;
        continue;
      }

      const attrName = nameMatch[1];
      pos += nameMatch[0].length;

      const attrStart = element.start + tagNameEnd + pos - nameMatch[0].length;
      const attribute = new AttributeNode(attrStart, -1);
      attribute.name = attrName;

      // Parse attribute value
      const delimiter = attrContent[pos];

      if (delimiter === "{") {
        // JSX expression
        const exprEnd = ParserUtils.findMatchingBrace(attrContent, pos);
        if (exprEnd === -1) {
          this.errors.push({ type: "unclosed_expression", position: attrStart, attribute: attrName });
          pos++;
          continue;
        }

        const exprContent = attrContent.substring(pos + 1, exprEnd);
        const exprValue = new ExpressionValue(
          attrStart + nameMatch[0].length,
          attrStart + nameMatch[0].length + (exprEnd - pos) + 1,
        );
        exprValue.content = exprContent;

        // Check for <uu5json/> prefix
        if (ParserUtils.hasPrefix(exprContent, "<uu5json/>")) {
          exprValue.hasUu5JsonPrefix = true;
          const jsonContent = ParserUtils.removePrefix(exprContent, "<uu5json/>");
          exprValue.jsonContent = this._parseJson(
            jsonContent,
            exprValue.start,
            exprValue.end,
            null,
            this.nestingLevel,
            this.quoteHistory,
          );
        }

        attribute.value = exprValue;
        attribute.rawValue = attrContent.substring(pos, exprEnd + 1);
        attribute.end = attrStart + nameMatch[0].length + (exprEnd - pos) + 1;
        pos = exprEnd + 1;
      } else if (delimiter === '"' || delimiter === "'") {
        // String value
        const valueStart = pos + 1;
        const valueEnd = ParserUtils.findQuotedValueEnd(attrContent, valueStart, delimiter);

        if (valueEnd === -1) {
          this.errors.push({ type: "unclosed_attribute", position: attrStart, attribute: attrName });
          pos++;
          continue;
        }

        const stringContent = ParserUtils.extractQuotedContent(attrContent, valueStart, valueEnd);
        const stringValue = new StringValue(
          attrStart + nameMatch[0].length,
          attrStart + nameMatch[0].length + (valueEnd - pos) + 1,
        );
        stringValue.value = stringContent;
        stringValue.quoteChar = delimiter;

        // Check for <uu5json/> prefix
        if (ParserUtils.hasPrefix(stringContent, "<uu5json/>")) {
          stringValue.hasUu5JsonPrefix = true;
          const jsonContent = ParserUtils.removePrefix(stringContent, "<uu5json/>");
          stringValue.jsonContent = this._parseJson(
            jsonContent,
            stringValue.start,
            stringValue.end,
            delimiter,
            this.nestingLevel,
            this.quoteHistory,
          );
        }

        // Check for <uu5string/> prefix (nested uu5String)
        if (ParserUtils.hasPrefix(stringContent, "<uu5string/>")) {
          stringValue.hasUu5StringPrefix = true;
          const nestedContent = ParserUtils.removePrefix(stringContent, "<uu5string/>");
          // Recursively parse nested uu5String with incremented nesting level
          // Add current quote character to history
          const newQuoteHistory = [...this.quoteHistory, delimiter];
          const nestedParser = new Uu5Parser(this.nestingLevel + 1, newQuoteHistory);
          stringValue.nestedAst = nestedParser.parse(nestedContent);
          // Propagate errors from nested parser
          this.errors.push(...nestedParser.errors);
        }

        attribute.value = stringValue;
        attribute.rawValue = delimiter + stringContent + delimiter;
        attribute.end = attrStart + nameMatch[0].length + (valueEnd - pos) + 1;
        pos = valueEnd + 1;
      } else if (/^(true|false)\b/.test(attrContent.substring(pos))) {
        // Boolean value (unquoted true/false)
        const boolMatch = /^(true|false)\b/.exec(attrContent.substring(pos));
        const boolValue = new BooleanValue(
          attrStart + nameMatch[0].length,
          attrStart + nameMatch[0].length + boolMatch[0].length,
        );
        boolValue.value = boolMatch[1] === "true";

        attribute.value = boolValue;
        attribute.rawValue = boolMatch[1];
        attribute.end = boolValue.end;
        pos += boolMatch[0].length;
      } else if (/^\d/.test(attrContent.substring(pos))) {
        // Numeric value (unquoted number)
        const numMatch = /^(\d+(\.\d+)?)\b/.exec(attrContent.substring(pos));
        if (numMatch) {
          // Treat as string value for simplicity
          const stringValue = new StringValue(
            attrStart + nameMatch[0].length,
            attrStart + nameMatch[0].length + numMatch[0].length,
          );
          stringValue.value = numMatch[1];
          stringValue.quoteChar = ""; // No quotes

          attribute.value = stringValue;
          attribute.rawValue = numMatch[1];
          attribute.end = stringValue.end;
          pos += numMatch[0].length;
        } else {
          pos++;
          continue;
        }
      } else {
        // Unknown attribute value format
        pos++;
        continue;
      }

      element.attributes.push(attribute);
    }
  }

  /**
   * Parses JSON content from uu5json blocks
   * @param {String} jsonContent JSON content (after <uu5json/>)
   * @param {Number} start Start position
   * @param {Number} end End position
   * @param {String} quoteChar Optional quote character for context-aware unescaping
   * @param {Number} nestingLevel Current nesting level (0 = root, 1 = first nested, etc.)
   * @param {Array} quoteHistory History of quote characters used at each nesting level
   * @returns {JsonNode} Parsed JSON node
   * @private
   */
  _parseJson(jsonContent, start, end, quoteChar = null, nestingLevel = 0, quoteHistory = []) {
    const jsonNode = new JsonNode(start, end);
    jsonNode.rawContent = jsonContent.trim();

    // Detect escape level
    // The quote character context helps determine the expected escape level:
    // - Single quotes ('): JSON typically has 1 backslash escaping (\" -> ")
    // - Double quotes ("): JSON typically has 3 backslashes escaping (\\\" -> \" -> ")
    // However, we still detect from content to catch errors
    jsonNode.escapeLevel = ParserUtils.detectEscapeLevel(jsonNode.rawContent, quoteChar, nestingLevel, quoteHistory);

    // Unescape JSON if needed
    jsonNode.unescapedContent = ParserUtils.unescapeJson(jsonNode.rawContent, jsonNode.escapeLevel);

    // Try to parse JSON
    try {
      jsonNode.parsed = JSON.parse(jsonNode.unescapedContent);
      jsonNode.isValid = true;
    } catch (e) {
      jsonNode.isValid = false;
      jsonNode.parseError = e.message;
    }

    return jsonNode;
  }

  /**
   * Parses a text node
   * @param {String} stopTag Optional tag name to stop at
   * @returns {TextNode} Parsed text node
   * @private
   */
  _parseText(stopTag) {
    const start = this.pos;
    let content = "";

    while (this.pos < this.content.length) {
      const char = this.content[this.pos];

      if (char === "<") {
        // Check if this is the stop tag
        if (stopTag && this.content[this.pos + 1] === "/") {
          const closingTagName = this._peekClosingTagName();
          if (closingTagName === stopTag) {
            break;
          }
        }
        // Other tag - stop text parsing
        break;
      }

      content += char;
      this.pos++;
    }

    const text = new TextNode(start, this.pos);
    text.content = content;
    return text;
  }

  /**
   * Parses a comment node
   * @returns {CommentNode|null} Parsed comment or null
   * @private
   */
  _parseComment() {
    const start = this.pos;
    const commentEnd = this.content.indexOf("-->", start + 4);

    if (commentEnd === -1) {
      this.errors.push({ type: "unclosed_comment", position: start });
      this.pos++;
      return null;
    }

    const comment = new CommentNode(start, commentEnd + 3);
    comment.content = this.content.substring(start + 4, commentEnd);
    this.pos = commentEnd + 3;

    return comment;
  }

  /**
   * Peeks at the closing tag name without advancing position
   * @returns {String} Tag name or empty string
   * @private
   */
  _peekClosingTagName() {
    if (this.content[this.pos] !== "<" || this.content[this.pos + 1] !== "/") {
      return "";
    }

    const tagEnd = ParserUtils.findTagEnd(this.content, this.pos);
    if (tagEnd === -1) {
      return "";
    }

    const tagContent = this.content.substring(this.pos + 2, tagEnd);
    return ParserUtils.extractTagName(tagContent);
  }
}

module.exports = Uu5Parser;
