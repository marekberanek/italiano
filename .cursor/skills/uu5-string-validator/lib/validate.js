#!/usr/bin/env node
/**
 * UU5 String Validator CLI
 * Validates UU5 string content from file or stdin
 * 
 * Usage:
 *   node validate.js <file>           - Validate file
 *   node validate.js "<uu5string/>.." - Validate string directly
 *   echo "<uu5string/>..." | node validate.js -
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { validate } = require("./index.js");

// Parse arguments
const args = process.argv.slice(2);
let input = args[0];
let options = {
  verbosity: "detailed",
  level: "standard"
};

// Parse options
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--verbosity" || args[i] === "-v") {
    options.verbosity = args[i + 1] || "detailed";
    i++;
  } else if (args[i] === "--level" || args[i] === "-l") {
    options.level = args[i + 1] || "standard";
    i++;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
UU5 String Validator

Usage:
  node validate.js <file>                    Validate UU5 string from file
  node validate.js "<uu5string/>..."         Validate UU5 string directly
  echo "<uu5string/>..." | node validate.js -  Validate from stdin

Options:
  -v, --verbosity <level>   Output verbosity: minimal, standard, detailed (default: detailed)
  -l, --level <level>       Validation level: lenient, standard, strict (default: standard)
  -h, --help                Show this help

Examples:
  node validate.js content.uu5
  node validate.js "<uu5string/><Uu5Elements.Text>Hello</Uu5Elements.Text>"
  node validate.js --level strict --verbosity minimal content.uu5
`);
    process.exit(0);
  } else if (!args[i].startsWith("-")) {
    input = args[i];
  }
}

async function main() {
  let content;

  if (!input) {
    console.error("Error: No input provided. Use --help for usage.");
    process.exit(1);
  }

  // Read from stdin
  if (input === "-") {
    content = await new Promise((resolve) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { data += chunk; });
      process.stdin.on("end", () => { resolve(data); });
    });
  }
  // Read from file
  else if (fs.existsSync(input)) {
    content = fs.readFileSync(input, "utf-8");
  }
  // Treat as direct string
  else {
    content = input;
  }

  // Validate
  const result = validate(content, null, options);

  // Output results
  console.log("UU5 String Validation Results");
  console.log("=============================");
  console.log(`Content length: ${content.length} characters`);
  console.log(`Validation level: ${options.level}`);
  console.log(`Verbosity: ${options.verbosity}`);
  console.log("");

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log("SUCCESS: No issues found");
    process.exit(0);
  }

  if (result.errors.length > 0) {
    console.log(`ERRORS (${result.errors.length}):`);
    console.log("-".repeat(40));
    result.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
      console.log("");
    });
  }

  if (result.warnings.length > 0) {
    console.log(`WARNINGS (${result.warnings.length}):`);
    console.log("-".repeat(40));
    result.warnings.forEach((warn, i) => {
      console.log(`${i + 1}. ${warn}`);
      console.log("");
    });
  }

  // Exit with error code if there are errors
  process.exit(result.errors.length > 0 ? 1 : 0);
}

// Only run if executed directly (not when require'd)
if (require.main === module) {
  main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}

// Export for programmatic use
module.exports = { validate: require("./index.js").validate };
