"use strict";

/**
 * Base AST node with position tracking
 */
class AstNode {
  constructor(type, start, end) {
    this.type = type;
    this.start = start; // Position in source string
    this.end = end; // Position in source string
  }
}

/**
 * Root node containing all parsed elements
 */
class RootNode extends AstNode {
  constructor(start, end) {
    super("Root", start, end);
    this.children = []; // Array of ElementNode, TextNode, CommentNode
  }
}

/**
 * Element/Tag node (e.g., <div>, <Uu5Bricks.Button/>)
 */
class ElementNode extends AstNode {
  constructor(start, end) {
    super("Element", start, end);
    this.tagName = ""; // e.g., "div", "Uu5Bricks.Button"
    this.attributes = []; // Array of AttributeNode
    this.children = []; // Array of child nodes
    this.selfClosing = false; // true for <img/>, <Component/>
    this.voidElement = false; // true for <br/>, <hr/>, etc.
    this.openTagEnd = -1; // Position of '>' in opening tag
    this.closeTagStart = -1; // Position of '<' in closing tag (if exists)
  }
}

/**
 * Attribute node (e.g., className="foo", data={value})
 */
class AttributeNode extends AstNode {
  constructor(start, end) {
    super("Attribute", start, end);
    this.name = ""; // Attribute name
    this.value = null; // StringValue, ExpressionValue, or BooleanValue
    this.rawValue = ""; // Original string representation
  }
}

/**
 * String attribute value (e.g., "hello", 'world')
 */
class StringValue extends AstNode {
  constructor(start, end) {
    super("StringValue", start, end);
    this.value = ""; // Unescaped string content
    this.quoteChar = '"'; // " or '
    this.hasUu5JsonPrefix = false; // true if starts with <uu5json/>
    this.hasUu5StringPrefix = false; // true if starts with <uu5string/>
    this.nestedAst = null; // For uu5String attributes, contains parsed child AST
    this.jsonContent = null; // For uu5json, contains parsed JSON structure
  }
}

/**
 * JSX expression value (e.g., {value}, {<uu5json/>{...}})
 */
class ExpressionValue extends AstNode {
  constructor(start, end) {
    super("ExpressionValue", start, end);
    this.content = ""; // Expression content (between {})
    this.hasUu5JsonPrefix = false; // true if starts with <uu5json/>
    this.jsonContent = null; // For uu5json, contains parsed JSON structure
  }
}

/**
 * Boolean attribute value (e.g., disabled=true, checked=false)
 */
class BooleanValue extends AstNode {
  constructor(start, end) {
    super("BooleanValue", start, end);
    this.value = false; // true or false
  }
}

/**
 * Text node (content between elements)
 */
class TextNode extends AstNode {
  constructor(start, end) {
    super("Text", start, end);
    this.content = ""; // Text content
  }
}

/**
 * Comment node (<!-- comment -->)
 */
class CommentNode extends AstNode {
  constructor(start, end) {
    super("Comment", start, end);
    this.content = ""; // Comment content
  }
}

/**
 * JSON structure node (parsed from <uu5json/> blocks)
 */
class JsonNode extends AstNode {
  constructor(start, end) {
    super("Json", start, end);
    this.rawContent = ""; // Raw JSON string (before unescaping)
    this.unescapedContent = ""; // Unescaped JSON string
    this.parsed = null; // Parsed JavaScript object (if valid)
    this.escapeLevel = 0; // Number of escape levels detected (0, 1, 3, etc.)
    this.isValid = false; // Whether JSON is valid
    this.parseError = null; // Parse error if invalid
  }
}

module.exports = {
  AstNode,
  RootNode,
  ElementNode,
  AttributeNode,
  StringValue,
  ExpressionValue,
  BooleanValue,
  TextNode,
  CommentNode,
  JsonNode,
};
