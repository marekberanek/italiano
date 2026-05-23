/**
 * UU5String to Markdown Converter Skill
 *
 * Converts uu5string content to clean Markdown.
 * Accepts either a raw uu5string or a path to a JSON file containing BookKit page data.
 */

const path = require("path");
const fs = require("fs");
const { convertUu5StringToMarkdown } = require(
  path.join(__dirname, "lib/uu5string-to-markdown.js"),
);

const schema = {
  name: "uu5string-to-markdown",
  description:
    "Convert uu5string content to Markdown. Provide either a uu5string directly or a path to a BookKit JSON file.",
  parameters: {
    uu5string: {
      type: "string",
      required: false,
      description: "Raw uu5string content to convert",
    },
    jsonFile: {
      type: "string",
      required: false,
      description: "Path to a BookKit page JSON file to convert",
    },
    outputFile: {
      type: "string",
      required: false,
      description: "Path to write the Markdown output (optional, prints to result if omitted)",
    },
  },
  returns: {
    markdown: "The converted Markdown content",
    outputFile: "Path to the output file (if outputFile parameter was provided)",
  },
};

function getName(name) {
  if (typeof name === "string") return name;
  if (name && typeof name === "object") {
    return name.en || name.cs || name.uk || Object.values(name)[0] || "";
  }
  return "";
}

async function execute(params) {
  const { uu5string, jsonFile, outputFile } = params;

  if (!uu5string && !jsonFile) {
    throw new Error("Either 'uu5string' or 'jsonFile' parameter is required.");
  }

  let markdown;

  if (jsonFile) {
    const absPath = path.resolve(jsonFile);
    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found: ${absPath}`);
    }
    const pageData = JSON.parse(fs.readFileSync(absPath, "utf-8"));
    markdown = convertPageToMarkdown(pageData);
  } else {
    markdown = convertUu5StringToMarkdown(uu5string);
  }

  if (outputFile) {
    const absOutput = path.resolve(outputFile);
    fs.mkdirSync(path.dirname(absOutput), { recursive: true });
    fs.writeFileSync(absOutput, markdown, "utf-8");
    return { markdown, outputFile: absOutput };
  }

  return { markdown };
}

function convertPageToMarkdown(pageData) {
  const pageName = getName(pageData.name) || "";
  const state = pageData.state || "";
  const pageCode = pageData.code || "";

  const lines = [];
  if (pageName) lines.push(`# ${pageName}`, "");
  if (state) lines.push(`**State:** ${state}`);
  if (pageCode) lines.push(`**Page Code:** ${pageCode}`);
  if (state || pageCode) lines.push("", "---", "");

  if (pageData.desc && pageData.desc.content) {
    const descMd = convertUu5StringToMarkdown(pageData.desc.content);
    if (descMd) {
      lines.push(descMd);
      lines.push("");
    }
  }

  for (const section of pageData.body || []) {
    if (!section.content) continue;
    const md = convertUu5StringToMarkdown(section.content);
    if (md) {
      lines.push(md);
      lines.push("");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

module.exports = { execute, schema };
