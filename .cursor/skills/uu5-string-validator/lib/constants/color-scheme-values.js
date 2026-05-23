"use strict";

/**
 * Valid colorScheme values for uu5 components
 * Based on uu5g05 framework specifications
 */

// Semantic color schemes - most commonly used
const SEMANTIC_COLOR_SCHEMES = [
  "primary",
  "secondary",
  "dim",
  "neutral",
  "important",
  "positive",
  "warning",
  "negative",
];

// Basic color schemes - color palette
const BASIC_COLOR_SCHEMES = [
  "dark-blue",
  "blue",
  "light-blue",
  "cyan",
  "dark-green",
  "green",
  "light-green",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "dark-purple",
  "brown",
  "grey",
  "steel",
];

// State color schemes - for state indicators
const STATE_COLOR_SCHEMES = [
  "created",
  "initial",
  "active",
  "final",
  "alternative",
  "problem",
  "passive",
  "failed",
  "cancelled",
];

// Priority color schemes - for priority indicators
const PRIORITY_COLOR_SCHEMES = ["highest", "high", "normal", "low", "lowest", "objective"];

// Additional color schemes found in production usage
const ADDITIONAL_COLOR_SCHEMES = [
  "building", // Used in various components
  "contrast", // Used in charts
];

// All valid colorScheme values combined
const ALL_COLOR_SCHEMES = [
  ...SEMANTIC_COLOR_SCHEMES,
  ...BASIC_COLOR_SCHEMES,
  ...STATE_COLOR_SCHEMES,
  ...PRIORITY_COLOR_SCHEMES,
  ...ADDITIONAL_COLOR_SCHEMES,
];

// Create a Set for fast lookup
const VALID_COLOR_SCHEMES_SET = new Set(ALL_COLOR_SCHEMES);

/**
 * Checks if a colorScheme value is valid
 * @param {String} value The colorScheme value to check
 * @returns {Boolean} True if valid, false otherwise
 */
function isValidColorScheme(value) {
  if (!value || typeof value !== "string") {
    return false;
  }
  return VALID_COLOR_SCHEMES_SET.has(value.trim());
}

/**
 * Gets a formatted list of valid colorScheme values for error messages
 * @returns {String} Formatted list of valid values
 */
function getValidColorSchemesFormatted() {
  return (
    `\n  Semantic (most common): ${SEMANTIC_COLOR_SCHEMES.join(", ")}` +
    `\n  Basic colors: ${BASIC_COLOR_SCHEMES.join(", ")}` +
    `\n  State indicators: ${STATE_COLOR_SCHEMES.join(", ")}` +
    `\n  Priority indicators: ${PRIORITY_COLOR_SCHEMES.join(", ")}` +
    `\n  Additional: ${ADDITIONAL_COLOR_SCHEMES.join(", ")}`
  );
}

/**
 * Suggests the closest valid colorScheme value
 * @param {String} invalidValue The invalid value
 * @returns {String|null} Suggested value or null
 */
function suggestColorScheme(invalidValue) {
  if (!invalidValue || typeof invalidValue !== "string") {
    return null;
  }

  const normalized = invalidValue.toLowerCase().trim();

  // Direct mapping for common mistakes (incl. real production crashes — see
  // shared/uu5-render-rules.md §4 "Known crashers").
  const commonMistakes = {
    success: "positive",
    error: "negative",
    danger: "negative",
    info: "neutral",
    default: "neutral",
    disabled: "dim",
    "light-gray": "grey",
    "dark-gray": "grey",
    gray: "grey",
    violet: "purple",
    indigo: "dark-blue",
    magenta: "pink",
    teal: "cyan",
    lime: "light-green",
    amber: "orange",
    crimson: "red",
  };

  if (commonMistakes[normalized]) {
    return commonMistakes[normalized];
  }

  // Find closest match by checking if any valid value contains the input or vice versa
  for (const validValue of ALL_COLOR_SCHEMES) {
    if (validValue.includes(normalized) || normalized.includes(validValue)) {
      return validValue;
    }
  }

  // Check for partial matches with semantic values (most commonly used)
  for (const validValue of SEMANTIC_COLOR_SCHEMES) {
    if (validValue.startsWith(normalized.substring(0, 3))) {
      return validValue;
    }
  }

  return null;
}

module.exports = {
  SEMANTIC_COLOR_SCHEMES,
  BASIC_COLOR_SCHEMES,
  STATE_COLOR_SCHEMES,
  PRIORITY_COLOR_SCHEMES,
  ADDITIONAL_COLOR_SCHEMES,
  ALL_COLOR_SCHEMES,
  VALID_COLOR_SCHEMES_SET,
  isValidColorScheme,
  getValidColorSchemesFormatted,
  suggestColorScheme,
};
