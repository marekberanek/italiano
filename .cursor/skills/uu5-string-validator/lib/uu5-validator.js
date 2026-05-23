"use strict";

const Uu5Parser = require("./parser/uu5-parser.js");
const StructureValidator = require("./validators/structure-validator.js");
const AttributeValidator = require("./validators/attribute-validator.js");
const JsonValidator = require("./validators/json-validator.js");
const ComponentValidator = require("./validators/component-validator.js");
const ContentValidator = require("./validators/content-validator.js");

/**
 * Main uu5String validator orchestrator
 * Coordinates parsing and validation with recursive nested uu5String support
 */
class Uu5Validator {
  /**
   * Validates uu5String content using a two-pass system:
   * Pass 1: Parse content into AST
   * Pass 2: Run validators on AST
   *
   * Validation runs in optimized order:
   * 1. Structure - JSX tag matching, void elements, self-closing components
   * 2. Attributes - Quote validation, JSX expression syntax
   * 3. JSON - JSON syntax in all contexts (root-level and nested)
   * 4. Components - Component existence, naming, and required attributes
   * 5. Content - Nested prefixes, JSX patterns, content rules
   *
   * @param {String} uu5String The uu5String to validate
   * @param {Map} availableBrickTags Optional Map of brick tag names to brick definitions
   * @param {Object} options Optional validation options
   * @param {String} options.level Validation level: "strict", "standard" (default), or "lenient"
   * @param {String} options.verbosity Message verbosity: "minimal", "standard", or "detailed" (default)
   * @returns {Object} Validation result with errors and warnings arrays
   */
  validate(uu5String, availableBrickTags = null, options = {}) {
    const errors = [];
    const warnings = [];

    // Set default validation level and verbosity
    const level = options.level || "standard";
    const verbosity = options.verbosity || "detailed";

    // Check if uu5String is provided
    if (!uu5String || typeof uu5String !== "string") {
      errors.push("uu5String must be a non-empty string");
      return { errors, warnings };
    }

    // PASS 1: Parse content into AST
    const parser = new Uu5Parser();
    const ast = parser.parse(uu5String);

    // Add parser errors (unclosed tags, etc.)
    if (parser.errors && parser.errors.length > 0) {
      for (const error of parser.errors) {
        errors.push(this._formatParserError(error));
      }
    }

    // PASS 2: Validate AST using validators
    const originalContent = uu5String.trim().startsWith("<uu5string/>")
      ? uu5String.trim().substring(12)
      : uu5String.trim();

    // 1. Structure Validation
    const structureResult = StructureValidator.validate(ast, originalContent, verbosity);
    errors.push(...structureResult.errors);
    warnings.push(...structureResult.warnings);

    // 2. Attribute Validation
    const attributeResult = AttributeValidator.validate(ast, originalContent, verbosity);
    errors.push(...attributeResult.errors);
    warnings.push(...attributeResult.warnings);

    // 3. JSON Validation
    const jsonResult = JsonValidator.validate(ast, originalContent, verbosity);
    errors.push(...jsonResult.errors);
    warnings.push(...jsonResult.warnings);

    // 4. Component Validation (runs always, brick-specific checks only if tags provided)
    const componentResult = ComponentValidator.validate(ast, originalContent, availableBrickTags, verbosity);
    errors.push(...componentResult.errors);
    warnings.push(...componentResult.warnings);

    // 5. Content Validation
    const contentResult = ContentValidator.validate(ast, originalContent, level, verbosity);
    errors.push(...contentResult.errors);
    warnings.push(...contentResult.warnings);

    return { errors, warnings };
  }

  /**
   * Formats parser error for display
   * @param {Object} error Parser error object
   * @returns {String} Formatted error message
   * @private
   */
  _formatParserError(error) {
    switch (error.type) {
      case "unclosed_tag":
        return `Unclosed tag starting at position ${error.position}`;
      case "unclosed_comment":
        return `Unclosed HTML comment starting at position ${error.position}`;
      case "unclosed_expression":
        return `Unclosed JSX expression in attribute "${error.attribute}" at position ${error.position}`;
      case "unclosed_attribute":
        return `Unclosed attribute "${error.attribute}" at position ${error.position}`;
      default:
        return `Parse error at position ${error.position}`;
    }
  }
}

module.exports = new Uu5Validator();
