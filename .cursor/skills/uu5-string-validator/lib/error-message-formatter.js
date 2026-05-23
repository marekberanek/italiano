"use strict";

/**
 * Error message formatter for validation messages
 * Supports three verbosity levels: minimal, standard, detailed
 */
class ErrorMessageFormatter {
  /**
   * Formats an error message based on verbosity level
   * @param {Object} options Error message options
   * @param {String} options.type Error type (for categorization)
   * @param {String} options.message Main error message
   * @param {Number} options.position Position in content
   * @param {String} options.found What was found (optional)
   * @param {String} options.problem Problem explanation (optional)
   * @param {Array<String>} options.solutions Array of solution strings (optional)
   * @param {String} options.note Additional note/rule (optional)
   * @param {String} verbosity Verbosity level: "minimal", "standard", "detailed"
   * @returns {String} Formatted error message
   */
  formatError(options, verbosity = "detailed") {
    switch (verbosity) {
      case "minimal":
        return this._formatMinimal(options);
      case "standard":
        return this._formatStandard(options);
      case "detailed":
      default:
        return this._formatDetailed(options);
    }
  }

  /**
   * Formats a minimal error message (50-100 tokens)
   * @param {Object} options Error options
   * @returns {String} Minimal error message
   * @private
   */
  _formatMinimal(options) {
    const { message, position, solutions } = options;
    const mainSolution = solutions && solutions.length > 0 ? solutions[0] : null;

    if (mainSolution) {
      return `Error at position ${position}: ${message}. ${mainSolution}`;
    }
    return `Error at position ${position}: ${message}`;
  }

  /**
   * Formats a standard error message (100-200 tokens)
   * @param {Object} options Error options
   * @returns {String} Standard error message
   * @private
   */
  _formatStandard(options) {
    const { message, position, found, solutions } = options;
    const parts = [`${message} at position ${position}.`];

    if (found) {
      parts.push(`  Found: ${found}`);
    }

    if (solutions && solutions.length > 0) {
      parts.push(`  Solution: ${solutions[0]}`);
    }

    return parts.join("\n");
  }

  /**
   * Formats a detailed error message (200-400 tokens)
   * @param {Object} options Error options
   * @returns {String} Detailed error message
   * @private
   */
  _formatDetailed(options) {
    const { message, position, found, problem, solutions, note } = options;
    const parts = [`${message} at position ${position}.`];

    if (found) {
      parts.push(`  Found: ${found}`);
    }

    if (problem) {
      parts.push(`  Problem: ${problem}`);
    }

    if (solutions && solutions.length > 0) {
      solutions.forEach((solution, index) => {
        const label = solutions.length > 1 ? `Solution ${index + 1}` : "Solution";
        parts.push(`  ${label}: ${solution}`);
      });
    }

    if (note) {
      parts.push(`  \n  ${note}`);
    }

    return parts.join("\n");
  }

  /**
   * Truncates a string to maximum length
   * @param {String} str String to truncate
   * @param {Number} maxLength Maximum length
   * @returns {String} Truncated string
   */
  truncate(str, maxLength = 100) {
    if (!str || str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + "...";
  }
}

module.exports = new ErrorMessageFormatter();
