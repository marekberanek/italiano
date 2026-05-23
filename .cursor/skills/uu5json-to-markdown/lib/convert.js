#!/usr/bin/env node
/**
 * Converts UU5 JSON representation to Markdown
 *
 * UU5 JSON format: array or single object with { uu5Tag, props, children }
 * where children is an array of strings or nested UU5 JSON objects.
 *
 * Usage: echo '[{"uu5Tag":"UU5.Bricks.P","props":{},"children":["Hello world"]}]' | node convert.js
 * Or: node convert.js < content.json
 */

/**
 * Extracts text content from an LSI props object ({ en: "...", cs: "..." })
 */
function extractLsiText(lsi) {
  if (!lsi || typeof lsi !== "object") return "";
  return lsi.en || lsi.cs || Object.values(lsi)[0] || "";
}

/**
 * Converts a single UU5 JSON node (or string) to Markdown
 */
function convertNode(node, listContext = null) {
  if (typeof node === "string") {
    return node;
  }

  if (!node || typeof node !== "object") {
    return "";
  }

  const tag = node.uu5Tag || node.tag || "";
  const props = node.props || {};
  const children = node.children || [];

  const childText = (ctx = null) =>
    children
      .map((c) => convertNode(c, ctx))
      .join("")
      .trim();

  // Headers
  if (tag === "UU5.Bricks.Header" || tag === "Uu5Elements.Heading") {
    const level = parseInt(props.level || "1", 10);
    const hashes = "#".repeat(Math.min(Math.max(level, 1), 6));
    return `${hashes} ${childText()}\n`;
  }

  // Sections with header attribute
  if (tag === "Uu5Bricks.Section" || tag === "UuDocKit.Bricks.Section") {
    const header = props.header || "";
    const level = parseInt(props.level || "2", 10);
    const hashes = "#".repeat(Math.min(Math.max(level, 1), 6));
    const content = childText();
    return header ? `${hashes} ${header}\n\n${content}\n` : `${content}\n`;
  }

  // Paragraphs
  if (tag === "UU5.Bricks.P" || tag === "Uu5Elements.Paragraph") {
    return `${childText()}\n\n`;
  }

  // Divs
  if (tag === "UU5.Bricks.Div" || tag === "div") {
    return `${childText()}\n`;
  }

  // Text wrapper (no extra whitespace)
  if (tag === "Uu5Elements.Text") {
    return childText();
  }

  // Bold / Strong
  if (tag === "UU5.Bricks.Strong" || tag === "UU5.Bricks.B" || tag === "strong") {
    return `**${childText()}**`;
  }

  // Italic / Emphasis
  if (tag === "UU5.Bricks.Em" || tag === "UU5.Bricks.I" || tag === "em" || tag === "i") {
    return `*${childText()}*`;
  }

  // Strikethrough
  if (tag === "s") {
    return `~~${childText()}~~`;
  }

  // Links
  if (
    tag === "UU5.Bricks.Link" ||
    tag === "Uu5Bricks.Link" ||
    tag === "Uu5Elements.Link" ||
    tag === "a"
  ) {
    const href = props.href || "";
    const text = childText();
    return `[${text}](${href})`;
  }

  // ECC artifact link
  if (tag === "UuTBricks.Artifact.Link") {
    const label = props.altText || "Link";
    const url = props.oid ? (props.baseUri || "") + "/userGate?oid=" + props.oid : null;
    return url ? `[${label}](${url})` : `[${label}]`;
  }

  // ECC content kit link
  if (tag === "UuContentKit.Links.Link") {
    const label = childText() || props.src || "Link";
    const url = props.src || "";
    return url ? `[${label}](${url})` : label;
  }

  // Inline code
  if (tag === "UU5.Bricks.Code") {
    return `\`${childText()}\``;
  }

  // Code blocks
  if (
    tag === "UU5.CodeKit.CodeViewer" ||
    tag === "Uu5CodeKit.CodeViewer" ||
    tag === "Uu5CodeKitBricks.Code"
  ) {
    const lang = props.codeStyle || "";
    const code = props.value || childText();
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
  }

  // Unordered lists
  if (tag === "UU5.Bricks.Ul" || tag === "ul") {
    const items = children.map((c) => convertNode(c, "ul")).join("");
    return `${items}\n`;
  }

  // Ordered lists
  if (tag === "UU5.Bricks.Ol" || tag === "ol") {
    let index = 1;
    const items = children
      .map((c) => {
        if (typeof c === "object" && (c.uu5Tag === "UU5.Bricks.Li" || c.tag === "li")) {
          return `${index++}. ${convertNode(c, "ol").replace(/^- /, "").trimEnd()}\n`;
        }
        return convertNode(c, "ol");
      })
      .join("");
    return `${items}\n`;
  }

  // List items
  if (tag === "UU5.Bricks.Li" || tag === "li") {
    if (listContext === "ol") {
      return childText();
    }
    return `- ${childText()}\n`;
  }

  // LSI - language string internationalization
  if (tag === "UU5.Bricks.Lsi") {
    // Children are LSI.Item nodes or props contains lsi object
    if (props.lsi) {
      return extractLsiText(props.lsi);
    }
    // Find English child first
    const enItem = children.find(
      (c) => typeof c === "object" && (c.props || {}).language === "en",
    );
    if (enItem) {
      return convertNode(enItem);
    }
    return childText();
  }

  if (tag === "UU5.Bricks.Lsi.Item") {
    return childText();
  }

  // Blockquotes
  if (tag === "UU5.Bricks.Blockquote") {
    return `> ${childText()}\n`;
  }

  // InfoBlock
  if (tag === "Uu5Bricks.InfoBlock") {
    const colorScheme = props.colorScheme;
    const content = childText();
    if (colorScheme) {
      return `\n> **[${colorScheme}]**\n> ${content.trim()}\n`;
    }
    return `\n> ${content}\n`;
  }

  // InfoGroup
  if (tag === "Uu5Bricks.InfoGroup") {
    return `${childText()}\n`;
  }

  if (tag === "Uu5Bricks.InfoGroup.Item") {
    const title = props.title || childText();
    return `- ${title}\n`;
  }

  // Line breaks
  if (tag === "br" || tag === "UU5.Bricks.Br") {
    return "\n";
  }

  // RichText.Block — uu5string can be an array of JSON nodes (ECC) or a UU5 string
  if (tag === "UU5.RichText.Block" || tag === "Uu5RichTextBricks.Block") {
    const uu5String = props.uu5String || props.uu5string;
    if (Array.isArray(uu5String)) {
      return uu5String.map((c) => convertNode(c)).join("").trim() + "\n";
    }
    if (uu5String) {
      return convertUu5StringFallback(uu5String);
    }
    return childText();
  }

  // Span - unwrap content
  if (tag === "span") {
    return childText();
  }

  // Unknown / generic component — just render children
  return childText();
}

/**
 * Minimal inline fallback for uu5string content embedded in uu5json
 * (strips XML tags, keeps text)
 */
function convertUu5StringFallback(uu5String) {
  let text = uu5String
    .replace(/<uu5string\s*\/?>/gi, "")
    .replace(/<\/uu5string>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\u200B/g, "")
    .trim();
  return text ? `${text}\n` : "";
}

/**
 * Converts UU5 JSON content to Markdown
 * Accepts an array of UU5 JSON nodes or a single node
 */
function convertUu5JsonToMarkdown(input) {
  if (!input) return "";

  let nodes;
  if (Array.isArray(input)) {
    nodes = input;
  } else if (typeof input === "object") {
    nodes = [input];
  } else if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      nodes = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return "";
    }
  } else {
    return "";
  }

  let markdown = nodes.map((node) => convertNode(node)).join("\n");

  // Collapse 3+ consecutive newlines to 2
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  return markdown.trim();
}

module.exports = { convertUu5JsonToMarkdown };

if (require.main === module) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("readable", () => {
    let chunk;
    while ((chunk = process.stdin.read()) !== null) {
      input += chunk;
    }
  });
  process.stdin.on("end", () => {
    const markdown = convertUu5JsonToMarkdown(input.trim());
    console.log(markdown);
  });
}
