"use strict";

const path = require("path");
const Uu5Parser = require(path.join(
  __dirname,
  "../../uu5-string-validator/lib/parser/uu5-parser.js",
));

// ── Attribute helpers ──

function getAttr(node, name) {
  const attr = node.attributes.find((a) => a.name === name);
  if (!attr || !attr.value) return undefined;
  return attr.value;
}

function getStringAttr(node, name) {
  const val = getAttr(node, name);
  if (!val) return "";
  if (val.type === "StringValue") {
    const raw = val.value || "";
    return raw.replace(/\\(.)/g, "$1");
  }
  if (val.type === "ExpressionValue") return val.content || "";
  if (val.type === "BooleanValue") return String(val.value);
  return "";
}

function getJsonAttr(node, name) {
  const val = getAttr(node, name);
  if (!val) return undefined;
  if (val.jsonContent && val.jsonContent.isValid) return val.jsonContent.parsed;
  return undefined;
}

function getUu5StringAttr(node, name) {
  const val = getAttr(node, name);
  if (!val) return null;
  if (val.type === "StringValue" && val.value && val.value.trim().startsWith("<uu5string/>")) {
    // Re-parse with unescaped content: the raw value still has escape sequences
    // from the outer attribute quoting, which break nested tag boundary detection.
    const unescaped = val.value.replace(/\\(.)/g, "$1");
    const parser = new Uu5Parser();
    return parser.parse(unescaped);
  }
  if (val.hasUu5StringPrefix && val.nestedAst) return val.nestedAst;
  return null;
}

// ── LSI text extraction from JSON attributes ──

function getLsiText(node, attrName) {
  const json = getJsonAttr(node, attrName);
  if (!json || typeof json !== "object") return "";
  return json.en || json.cs || json.uk || Object.values(json)[0] || "";
}

// ── HTML entity decoding ──

const HTML_ENTITIES = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&#39;": "'", "&apos;": "'", "&nbsp;": " ",
};

function decodeEntities(text) {
  return text.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp|#39);/g,
    (m) => HTML_ENTITIES[m] || m,
  );
}

// ── Convert a cell string that may contain uu5string ──

function convertCellContent(str) {
  if (str == null) return "";
  str = String(str);
  const trimmed = str.trim();
  if (trimmed.startsWith("<uu5string")) {
    return convertUu5StringToMarkdown(trimmed);
  }
  return trimmed;
}

// ── Core AST → Markdown ──

function astToMarkdown(node) {
  if (!node) return "";
  switch (node.type) {
    case "Text": return node.content;
    case "Comment": return "";
    case "Root": return node.children.map(astToMarkdown).join("");
    case "Element": return renderElement(node);
    default: return "";
  }
}

function renderChildren(node) {
  return (node.children || []).map(astToMarkdown).join("");
}

function renderChildrenTrimmed(node) {
  return renderChildren(node).trim();
}

function getRawText(node) {
  if (!node) return "";
  if (node.type === "Text") return node.content;
  if (node.type === "Root" || node.type === "Element") {
    return (node.children || []).map(getRawText).join("");
  }
  return "";
}

// ── Convert a header attribute (may contain uu5string markup) ──

function convertHeader(node, name) {
  const nestedAst = getUu5StringAttr(node, name);
  if (nestedAst) return astToMarkdown(nestedAst).trim();
  const raw = getStringAttr(node, name);
  if (!raw) return "";
  const trimmedRaw = raw.trim();
  if (trimmedRaw.startsWith("<uu5string")) {
    const unescaped = raw.replace(/\\(.)/g, "$1");
    return convertCellContent(unescaped);
  }
  if (trimmedRaw.startsWith("<")) {
    return convertCellContent(raw);
  }
  return raw;
}

// ── Element renderer ──

function renderElement(node) {
  const tag = node.tagName;

  // ── Headers ──
  if (tag === "UU5.Bricks.Header" || tag === "Uu5Elements.Heading") {
    const level = parseInt(getStringAttr(node, "level") || "1", 10);
    const hashes = "#".repeat(clampLevel(level));
    return `\n${hashes} ${renderChildrenTrimmed(node)}\n\n`;
  }

  // ── Sections ──
  if (
    tag === "UU5.Bricks.Section" || tag === "Uu5Bricks.Section" ||
    tag === "UuDocKit.Bricks.Section"
  ) {
    const header = convertHeader(node, "header");
    const level = parseInt(getStringAttr(node, "level") || "2", 10);
    const hashes = "#".repeat(clampLevel(level));
    const content = renderChildren(node);
    return (header ? `\n${hashes} ${header}\n\n` : "") + content;
  }

  // ── Paragraphs ──
  if (tag === "UU5.Bricks.P" || tag === "Uu5Elements.Paragraph" || tag === "p") {
    return renderChildrenTrimmed(node) + "\n\n";
  }

  // ── Divs ──
  if (tag === "UU5.Bricks.Div" || tag === "Uu5Bricks.Div" || tag === "div") {
    return renderChildrenTrimmed(node) + "\n";
  }

  // ── Span (transparent) ──
  if (tag === "UU5.Bricks.Span" || tag === "span") {
    return renderChildren(node);
  }

  // ── Text wrapper ──
  if (tag === "Uu5Elements.Text") {
    return renderChildrenTrimmed(node);
  }

  // ── Bold ──
  if (
    tag === "UU5.Bricks.Strong" || tag === "UU5.Bricks.B" ||
    tag === "strong" || tag === "b"
  ) {
    const text = renderChildrenTrimmed(node);
    return text ? `**${text}**` : "";
  }

  // ── Italic ──
  if (
    tag === "UU5.Bricks.Em" || tag === "UU5.Bricks.I" ||
    tag === "em" || tag === "i"
  ) {
    const text = renderChildrenTrimmed(node);
    return text ? `*${text}*` : "";
  }

  // ── Strikethrough ──
  if (tag === "s") {
    const text = renderChildrenTrimmed(node);
    return text ? `~~${text}~~` : "";
  }

  // ── Underline (no md equivalent, render as-is) ──
  if (tag === "u") {
    return renderChildren(node);
  }

  // ── Superscript ──
  if (tag === "sup") {
    const text = renderChildrenTrimmed(node);
    return text ? `^${text}^` : "";
  }

  // ── Links ──
  if (
    tag === "UU5.Bricks.Link" || tag === "Uu5Bricks.Link" ||
    tag === "Uu5Elements.Link" || tag === "a"
  ) {
    const href = getStringAttr(node, "href");
    const text = renderChildrenTrimmed(node) || getStringAttr(node, "altText") || href || "link";
    return href ? `[${text}](${href})` : text;
  }

  if (tag === "UuContentKit.Links.Link") {
    const src = getStringAttr(node, "src");
    const text = renderChildrenTrimmed(node) || getStringAttr(node, "altText") ||
      getLsiText(node, "tempContent") || getLsiText(node, "content") || src || "link";
    return src ? `[${text}](${src})` : text;
  }

  if (tag === "UuContentKit.Links.FileLink") {
    const src = getStringAttr(node, "src");
    const text = renderChildrenTrimmed(node) || getStringAttr(node, "altText") || "file";
    return src ? `[${text}](${src})` : text;
  }

  if (tag === "UuBookKit.Bricks.GoToPageLink") {
    const code = getStringAttr(node, "code");
    const text = renderChildrenTrimmed(node) || code || "link";
    return code ? `[${text}](page:${code})` : text;
  }

  if (tag === "UuTBricks.Artifact.Link") {
    return getStringAttr(node, "altText") || "link";
  }

  if (tag === "Plus4U5.Bricks.Plus4ULink") {
    const href = getStringAttr(node, "href");
    const text = renderChildrenTrimmed(node) || getStringAttr(node, "altText") || href || "link";
    return href ? `[${text}](${href})` : text;
  }

  if (tag === "UuEbc.File.Link") {
    return renderChildrenTrimmed(node) || getStringAttr(node, "altText") || "*[file]*";
  }

  // ── Inline code ──
  if (
    tag === "UU5.Bricks.Code" || tag === "Uu5RichText.Code" ||
    tag === "Uu5Bricks.Code"
  ) {
    const text = renderChildrenTrimmed(node);
    return text ? `\`${text}\`` : "";
  }

  // ── Code blocks ──
  if (
    tag === "UU5.CodeKit.CodeViewer" || tag === "Uu5CodeKit.CodeViewer" ||
    tag === "Uu5CodeKitBricks.Code"
  ) {
    const lang = getStringAttr(node, "codeStyle") || "";
    const code = getStringAttr(node, "value") || renderChildrenTrimmed(node);
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
  }

  // ── Unordered lists ──
  if (tag === "UU5.Bricks.Ul" || tag === "ul") {
    const items = (node.children || []).map((c) => {
      if (c.type === "Element" && isListItem(c.tagName)) {
        return `- ${renderChildrenTrimmed(c)}\n`;
      }
      return astToMarkdown(c);
    }).join("");
    return `\n${items}\n`;
  }

  // ── Ordered lists ──
  if (tag === "UU5.Bricks.Ol" || tag === "ol") {
    let index = 1;
    const items = (node.children || []).map((c) => {
      if (c.type === "Element" && isListItem(c.tagName)) {
        return `${index++}. ${renderChildrenTrimmed(c)}\n`;
      }
      return astToMarkdown(c);
    }).join("");
    return `\n${items}\n`;
  }

  // ── List items (standalone) ──
  if (tag === "UU5.Bricks.Li" || tag === "li") {
    return `- ${renderChildrenTrimmed(node)}\n`;
  }

  // ── Line breaks ──
  if (tag === "br" || tag === "UU5.Bricks.Br") {
    return "\n";
  }

  // ── Horizontal rule / separator ──
  if (tag === "UU5.Bricks.Line" || tag === "Uu5Bricks.Separator" || tag === "hr") {
    return "\n---\n\n";
  }

  // ── Blockquote ──
  if (tag === "UU5.Bricks.Blockquote") {
    const text = renderChildrenTrimmed(node);
    const lines = text.split("\n").map((l) => `> ${l}`).join("\n");
    return `\n${lines}\n\n`;
  }

  // ── LSI (language internationalization) ──
  if (tag === "UU5.Bricks.Lsi" || tag === "Uu5Bricks.Lsi") {
    const enItem = (node.children || []).find(
      (c) => c.type === "Element" && getStringAttr(c, "language") === "en",
    );
    if (enItem) return renderChildren(enItem);
    const firstElement = (node.children || []).find((c) => c.type === "Element");
    if (firstElement) return renderChildren(firstElement);
    return renderChildren(node);
  }

  if (tag === "UU5.Bricks.Lsi.Item" || tag === "Uu5Bricks.Lsi.Item") {
    return renderChildren(node);
  }

  // ── RichText.Block — nested uu5string in attribute ──
  if (tag === "UU5.RichText.Block" || tag === "Uu5RichTextBricks.Block") {
    const nestedAst = getUu5StringAttr(node, "uu5string") || getUu5StringAttr(node, "uu5String");
    if (nestedAst) return astToMarkdown(nestedAst);
    return renderChildren(node);
  }

  // ── Badge (inline icon/label) ──
  if (tag === "Uu5RichText.Badge" || tag === "UU5.RichText.Badge") {
    const state = getStringAttr(node, "state");
    const icon = getStringAttr(node, "icon");
    if (state) return `[${state}]`;
    if (icon) return `[${icon}]`;
    return "";
  }

  // ── Icon ──
  if (
    tag === "UU5.Bricks.Icon" || tag === "Uu5Elements.Icon" ||
    tag === "Uu5RichText.Icon"
  ) {
    const icon = getStringAttr(node, "icon");
    return icon ? `[${icon}]` : "";
  }

  // ── Label ──
  if (tag === "UU5.Bricks.Label") {
    return renderChildrenTrimmed(node);
  }

  // ── InfoBlock variants ──
  if (
    tag === "Uu5Bricks.InfoBlock" ||
    tag === "UuContentKit.Bricks.BlockInfo" ||
    tag === "UuContentKit.Bricks.BlockSuccess" ||
    tag === "UuContentKit.Bricks.BlockDefault" ||
    tag === "UuContentKit.Bricks.BlockHelp"
  ) {
    const text = renderChildrenTrimmed(node);
    return text ? `\n> ${text.split("\n").join("\n> ")}\n\n` : "";
  }

  // ── Tabs ──
  if (tag === "UU5.Bricks.Tabs" || tag === "Uu5Bricks.Tabs") {
    return renderChildren(node);
  }

  if (tag === "UU5.Bricks.Tabs.Item" || tag === "Uu5Bricks.Tabs.Item") {
    const label = getStringAttr(node, "label");
    const content = renderChildren(node);
    return (label ? `\n**[${label}]**\n` : "") + content;
  }

  // ── Accordion / Panel ──
  if (
    tag === "UU5.Bricks.Accordion" || tag === "Uu5Bricks.Accordion"
  ) {
    return renderChildren(node);
  }

  if (
    tag === "UU5.Bricks.Panel" || tag === "Uu5Bricks.Panel" ||
    tag === "Uu5Bricks.Accordion.Item"
  ) {
    const header = convertHeader(node, "header");
    const content = renderChildren(node);
    return (header ? `\n**${header}**\n` : "") + content;
  }

  // ── Dropdown ──
  if (tag === "Uu5Bricks.Dropdown") {
    const label = getStringAttr(node, "label");
    const content = renderChildren(node);
    return (label ? `\n**${label}**\n` : "") + content;
  }

  if (tag === "Uu5Bricks.Dropdown.Item") {
    const label = getStringAttr(node, "label");
    return label ? `- ${label}\n` : "";
  }

  // ── Layout (columns) ──
  if (tag === "Uu5Bricks.Layout") {
    return renderChildren(node);
  }

  if (tag === "Uu5Bricks.Layout.Item") {
    return renderChildren(node);
  }

  // ── InfoGroup ──
  if (tag === "Uu5Bricks.InfoGroup") {
    return renderChildren(node);
  }

  if (tag === "Uu5Bricks.InfoGroup.Item") {
    const label = getStringAttr(node, "label");
    const value = getStringAttr(node, "value");
    if (label && value) return `- **${label}:** ${value}\n`;
    if (label) return `- **${label}**\n`;
    return "";
  }

  // ── Images ──
  if (
    tag === "Uu5ImagingBricks.Image" || tag === "UuContentKit.Images.Image" ||
    tag === "UuBmlDraw.Imaging.Image" || tag === "img"
  ) {
    const src = getStringAttr(node, "src");
    const alt = getStringAttr(node, "alt") || getStringAttr(node, "altText") || "";
    return src ? `![${alt}](${src})` : (alt ? `*[${alt}]*` : "*[image]*");
  }

  // ── Gallery ──
  if (tag === "Uu5ImagingBricks.Gallery") {
    const items = (node.children || []).filter(
      (c) => c.type === "Element" && c.tagName === "Uu5ImagingBricks.Gallery.Item",
    );
    if (items.length === 0) return "*[gallery]*";
    return items.map((item) => {
      const src = getStringAttr(item, "src");
      const alt = getStringAttr(item, "alt") || "";
      return src ? `![${alt}](${src})` : "";
    }).filter(Boolean).join("\n") + "\n";
  }

  // ── Charts ──
  if (tag === "Uu5ChartsBricks.XyChart") {
    return "\n*[chart]*\n";
  }

  // ── Tables: Uu5TilesBricks.Table ──
  if (tag === "Uu5TilesBricks.Table" || tag === "UuContentKit.Tables.Table") {
    return renderTilesTable(node);
  }

  // ── Tables: UuApp.DesignKit.Table ──
  if (tag === "UuApp.DesignKit.Table") {
    return renderDesignKitTable(node);
  }

  // ── UuApp.DesignKit.DescriptionList ──
  if (tag === "UuApp.DesignKit.DescriptionList") {
    return renderDesignKitDescriptionList(node);
  }

  // ── UuApp.DesignKit.BulletList ──
  if (tag === "UuApp.DesignKit.BulletList") {
    return renderDesignKitBulletList(node);
  }

  // ── UuApp.DesignKit.EmbeddedText ──
  if (tag === "UuApp.DesignKit.EmbeddedText") {
    return renderEmbeddedText(node);
  }

  // ── UuApp.DesignKit.StateList ──
  if (tag === "UuApp.DesignKit.StateList") {
    return renderDesignKitStateList(node);
  }

  // ── UuApp.DesignKit.BusinessScenario / Scenario ──
  if (tag === "UuApp.DesignKit.BusinessScenario" || tag === "UuApp.DesignKit.Scenario") {
    return renderDesignKitBusinessScenario(node);
  }

  // ── UuApp.DesignKit.UuCommandAlgorithm ──
  if (tag === "UuApp.DesignKit.UuCommandAlgorithm") {
    return renderDesignKitCommandAlgorithm(node);
  }

  // ── UuApp.DesignKit.UuAppInfo ──
  if (tag === "UuApp.DesignKit.UuAppInfo") {
    return renderDesignKitUuAppInfo(node);
  }

  // ── Preformatted text ──
  if (tag === "uu5string.pre") {
    return renderChildren(node);
  }

  // ── BML Diagram ──
  if (tag === "UuBml.Draw.Diagram") {
    return "\n*[BML Diagram]*\n";
  }

  // ── BookKit: Quotation (invisible reference) ──
  if (tag === "UuBookKit.References.Quotation") {
    return "";
  }

  // ── BookKit: Caption ──
  if (tag === "UuBookKit.References.Caption") {
    const content = getStringAttr(node, "content");
    return content ? `\n*${content}*\n` : "";
  }

  // ── BookKit: Contents (ToC widget) ──
  if (tag === "UuBookKit.Bricks.Contents") {
    return "";
  }

  // ── BookKit: Review.CommentPoint ──
  if (tag === "UuBookKit.Review.CommentPoint") {
    return "";
  }

  // ── Forum: CommentPoint/CommentPointList/Discussion ──
  if (
    tag === "UuForum.Comments.CommentPoint" ||
    tag === "UuForum.Comments.CommentPointList" ||
    tag === "UuForum.Discussion.Discussion"
  ) {
    return "";
  }

  // ── BusinessCard ──
  if (tag === "Plus4U5.Bricks.BusinessCard" || tag === "UuPlus4UPeople.PersonalCard.BusinessCard") {
    return renderChildrenTrimmed(node) || getStringAttr(node, "altText") || "";
  }

  // ── TouchIcon ──
  if (tag === "UU5.Bricks.TouchIcon") {
    const text = renderChildrenTrimmed(node) || getStringAttr(node, "altText") || "";
    const href = getStringAttr(node, "uri") || getStringAttr(node, "href") || "";
    return href && text ? `[${text}](${href})` : text;
  }

  // ── Runtime widgets (render header attribute, nothing else) ──
  if (isRuntimeWidget(tag)) {
    const header = convertHeader(node, "header");
    if (header) return `\n**${header}**\n`;
    return `\n*[${summarizeComponent(node)}]*\n`;
  }

  // ── Authenticated block ──
  if (tag === "UU5.Bricks.Authenticated") {
    return renderChildren(node);
  }

  // ── ProgressBar ──
  if (tag === "UU5.Bricks.ProgressBar") {
    return "*[progress bar]*";
  }

  // ── SortableTree ──
  if (tag === "UU5.Tree.SortableTree") {
    return "*[sortable tree]*";
  }

  // ── Modal ──
  if (tag === "UsyWebBricks.Modal") {
    return renderChildren(node);
  }

  // ── Console Progress ──
  if (tag === "UuConsole.Progress") {
    return "*[progress]*";
  }

  // ── Login button, Support ──
  if (tag === "Plus4U5.App.LoginButton" || tag === "Plus4U5.App.Support") {
    return "";
  }

  // ── Style tag (ignore) ──
  if (tag === "style") {
    return "";
  }

  // ── uu5string propName (used for named prop slots) ──
  if (tag === "uu5string") {
    return renderChildren(node);
  }

  // ── uu5Route ──
  if (tag === "uu5Route") {
    return "";
  }

  // ── FALLBACK: unknown component ──
  return renderUnknown(node);
}

// ── Runtime widget detection ──

const RUNTIME_WIDGET_PREFIXES = [
  "UuAppBusinessModelKit.",
  "UuTerritory.",
  "UuProductCatalogue.",
  "UuMyTerritoryDw.",
];

function isRuntimeWidget(tag) {
  return RUNTIME_WIDGET_PREFIXES.some((p) => tag.startsWith(p));
}

function isListItem(tagName) {
  return tagName === "UU5.Bricks.Li" || tagName === "li";
}

function clampLevel(level) {
  return Math.min(Math.max(level, 1), 6);
}

// ── Fallback for unknown components ──

const INFO_ATTRS = ["header", "label", "altText", "content", "name", "code", "src", "href", "uri", "baseUri", "value"];

function renderUnknown(node) {
  const parts = [];

  const header = convertHeader(node, "header");
  const childContent = renderChildren(node);
  const hasVisibleContent = header || childContent.trim();

  if (!hasVisibleContent) {
    const summary = summarizeComponent(node);
    parts.push(`\n*[${summary}]*\n`);
  } else {
    if (header) parts.push(`\n**${header}**\n`);
    if (childContent.trim()) parts.push(childContent);
  }

  return parts.join("");
}

function summarizeComponent(node) {
  const tag = node.tagName;
  const attrs = [];
  for (const name of INFO_ATTRS) {
    if (name === "header") continue;
    const val = getStringAttr(node, name);
    if (val) {
      const display = val.length > 60 ? val.substring(0, 57) + "..." : val;
      attrs.push(`${name}="${display}"`);
    }
  }
  return attrs.length > 0 ? `${tag}: ${attrs.join(", ")}` : tag;
}

// ── Table: Uu5TilesBricks.Table ──

function renderTilesTable(node) {
  const data = getJsonAttr(node, "data");
  const columnList = getJsonAttr(node, "columnList");

  if (!Array.isArray(data) || data.length === 0) return "";

  const headers = Array.isArray(columnList)
    ? columnList.map((col) => {
      const raw = typeof col === "object" ? col.header || "" : String(col);
      return convertCellContent(raw);
    })
    : [];

  const hideHeader = getStringAttr(node, "hideHeader") === "true" ||
    node.attributes.some((a) => a.name === "hideHeader" && (!a.value || (a.value.type === "BooleanValue" && a.value.value)));

  const rows = data.map((row) => {
    let values;
    if (Array.isArray(row)) {
      values = row;
    } else if (row && typeof row === "object" && Array.isArray(row.value)) {
      values = row.value;
    } else {
      values = [row];
    }
    return values.map((cell) => cellToText(cell));
  });

  const colCount = Math.max(headers.length, ...rows.map((r) => r.length));
  while (headers.length < colCount) headers.push("");

  const lines = [];

  if (hideHeader) {
    const firstRow = rows[0] || headers.map(() => "");
    while (firstRow.length < colCount) firstRow.push("");
    const isFirstRowHeaders = firstRow.every((c, i) => c === headers[i]);
    if (!isFirstRowHeaders && headers.some(Boolean)) {
      lines.push("| " + headers.map(sanitizeCell).join(" | ") + " |");
      lines.push("| " + headers.map(() => "---").join(" | ") + " |");
    } else {
      lines.push("| " + headers.map(sanitizeCell).join(" | ") + " |");
      lines.push("| " + headers.map(() => "---").join(" | ") + " |");
    }
  } else {
    lines.push("| " + headers.map(sanitizeCell).join(" | ") + " |");
    lines.push("| " + headers.map(() => "---").join(" | ") + " |");
  }

  for (const row of rows) {
    while (row.length < colCount) row.push("");
    lines.push("| " + row.map(sanitizeCell).join(" | ") + " |");
  }

  return "\n" + lines.join("\n") + "\n";
}

function cellToText(cell) {
  if (cell == null) return "";
  if (typeof cell === "object" && !Array.isArray(cell)) {
    if (cell.value !== undefined) return cellToText(cell.value);
    return "";
  }
  return convertCellContent(String(cell));
}

function sanitizeCell(str) {
  return str.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

// ── DesignKit.Table ──

function renderDesignKitTable(node) {
  const header = convertHeader(node, "header");
  const data = getPreChildrenJson(node) || getJsonAttr(node, "data");

  if (!Array.isArray(data) || data.length === 0) {
    return renderUnknown(node);
  }

  const parts = [];
  if (header) parts.push(`\n**${header}**\n`);

  const colCount = Math.max(...data.map((r) => (Array.isArray(r) ? r.length : 1)));
  const rows = data.map((row) =>
    (Array.isArray(row) ? row : [row]).map((c) => sanitizeCell(convertCellContent(String(c ?? "")))),
  );

  const headerRow = rows[0] || [];
  while (headerRow.length < colCount) headerRow.push("");

  const lines = [];
  lines.push("| " + headerRow.join(" | ") + " |");
  lines.push("| " + headerRow.map(() => "---").join(" | ") + " |");
  for (let i = 1; i < rows.length; i++) {
    while (rows[i].length < colCount) rows[i].push("");
    lines.push("| " + rows[i].join(" | ") + " |");
  }
  parts.push("\n" + lines.join("\n") + "\n");

  return parts.join("");
}

// ── DesignKit.DescriptionList ──

function renderDesignKitDescriptionList(node) {
  const header = convertHeader(node, "header");
  const data = getPreChildrenJson(node) || getJsonAttr(node, "data");

  if (!Array.isArray(data) || data.length === 0) {
    return renderUnknown(node);
  }

  const parts = [];
  if (header) parts.push(`\n**${header}**\n`);

  const lines = [];
  lines.push("| Key | Value |");
  lines.push("| --- | --- |");
  for (const pair of data) {
    if (Array.isArray(pair) && pair.length >= 2) {
      const key = sanitizeCell(convertCellContent(String(pair[0] ?? "")));
      const val = sanitizeCell(convertCellContent(String(pair[1] ?? "")));
      lines.push(`| ${key} | ${val} |`);
    }
  }
  parts.push("\n" + lines.join("\n") + "\n");

  return parts.join("");
}

// ── DesignKit.BulletList ──

function renderDesignKitBulletList(node) {
  const data = getJsonAttr(node, "data");
  if (!data) return renderUnknown(node);

  const parts = [];
  if (data.name) parts.push(`\n**${data.name}**\n\n`);
  if (Array.isArray(data.itemList)) {
    for (const item of data.itemList) {
      const name = item.name || "";
      const desc = convertCellContent(item.desc || "");
      parts.push(`- **${name}**${desc ? ": " + desc : ""}\n`);
    }
    parts.push("\n");
  }

  return parts.join("") || renderUnknown(node);
}

// ── DesignKit.EmbeddedText ──

function renderEmbeddedText(node) {
  const header = getStringAttr(node, "header") || "";
  const label = getStringAttr(node, "label") || "";
  const lang = getStringAttr(node, "codeStyle") || "";

  const parts = [];

  if (header && label) {
    parts.push(`\n**${header}** (${label})\n`);
  } else if (header) {
    parts.push(`\n**${header}**\n`);
  } else if (label) {
    parts.push(`\n**${label}**\n`);
  }

  for (const child of node.children || []) {
    if (child.type === "Element" && child.tagName === "uu5string.pre") {
      const text = getRawText(child);
      parts.push(`\n\`\`\`${lang}\n${text}\n\`\`\`\n`);
    } else {
      const md = astToMarkdown(child);
      if (md.trim()) parts.push(md);
    }
  }

  return parts.join("");
}

// ── DesignKit.StateList ──

function renderDesignKitStateList(node) {
  const data = getJsonAttr(node, "data");
  if (!data) {
    const preData = getPreChildrenJson(node);
    if (preData) return renderStateListData(preData);
    return "";
  }
  return renderStateListData(data);
}

function renderStateListData(data) {
  if (!data || !Array.isArray(data.stateList)) return "";

  const parts = [];
  const lines = [];
  lines.push("| State | Description |");
  lines.push("| --- | --- |");
  for (const s of data.stateList) {
    const name = s.name || s.code || "";
    const desc = convertCellContent(s.desc || s.description || "");
    lines.push(`| ${sanitizeCell(name)} | ${sanitizeCell(desc)} |`);
  }
  parts.push("\n" + lines.join("\n") + "\n");
  return parts.join("");
}

// ── DesignKit.BusinessScenario / Scenario ──

function renderDesignKitBusinessScenario(node) {
  const data = getJsonAttr(node, "data");
  if (!data) return renderUnknown(node);

  const parts = [];
  if (data.name) parts.push(`\n### ${data.name}\n\n`);
  if (data.desc) parts.push(convertCellContent(data.desc) + "\n\n");

  if (Array.isArray(data.stepList)) {
    for (let i = 0; i < data.stepList.length; i++) {
      const step = data.stepList[i];
      const label = step.label || `${i + 1}.`;
      const desc = convertCellContent(step.desc || "");
      parts.push(`${label} ${desc}\n`);
    }
    parts.push("\n");
  }

  return parts.join("");
}

// ── DesignKit.UuCommandAlgorithm ──

function renderDesignKitCommandAlgorithm(node) {
  const data = getJsonAttr(node, "data");
  if (!data) return renderUnknown(node);

  const parts = [];
  if (data.name) parts.push(`\n### ${data.name}\n\n`);
  if (data.desc) parts.push(convertCellContent(data.desc) + "\n\n");

  const renderVarList = (title, list) => {
    if (!Array.isArray(list) || list.length === 0) return;
    parts.push(`**${title}:**\n`);
    for (const item of list) {
      const name = item.name || "";
      const def = item.defaultValue || "";
      parts.push(`- \`${name}\`${def ? ": `" + def.substring(0, 200) + (def.length > 200 ? "..." : "") + "`" : ""}\n`);
    }
    parts.push("\n");
  };

  renderVarList("Input", data.input);
  renderVarList("Input validation", data.input_validation);
  renderVarList("Output", data.output);

  if (Array.isArray(data.statementList)) {
    renderStatements(data.statementList, parts, 0);
  }

  return parts.join("");
}

function renderStatements(statements, parts, depth) {
  const indent = "  ".repeat(depth);
  for (const stmt of statements) {
    const label = stmt.label || "";
    const desc = convertCellContent(stmt.desc || "");
    if (stmt.type === "warning" || stmt.type === "error") {
      const msg = stmt.message || "";
      const code = stmt.code || "";
      parts.push(`${indent}${label} **${stmt.type}** ${code}: ${msg}\n`);
    } else {
      if (desc) parts.push(`${indent}${label} ${desc}\n`);
    }
    if (Array.isArray(stmt.statementList)) {
      renderStatements(stmt.statementList, parts, depth + 1);
    }
  }
}

// ── DesignKit.UuAppInfo ──

function renderDesignKitUuAppInfo(node) {
  const data = getJsonAttr(node, "data");
  if (!data) return renderUnknown(node);

  const parts = [];
  if (data.name) parts.push(`\n**${data.name}**\n\n`);
  if (data.description) parts.push(convertCellContent(data.description) + "\n");
  return parts.join("");
}

// ── Shared: extract JSON from uu5string.pre children ──

function getPreChildrenJson(node) {
  for (const child of node.children || []) {
    if (child.type === "Element" && child.tagName === "uu5string.pre") {
      const rawText = getRawText(child).trim();
      try {
        return JSON.parse(rawText);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

// ── Post-processing: minimal, targeted ──

function postProcess(md) {
  const mdLines = md.split("\n");
  let inCodeBlock = false;
  for (let i = 0; i < mdLines.length; i++) {
    if (mdLines[i].trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (!inCodeBlock) {
      mdLines[i] = mdLines[i].trimStart();
    }
  }
  md = mdLines.join("\n");
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

// ── Main entry point ──

function convertUu5StringToMarkdown(uu5String) {
  if (!uu5String || typeof uu5String !== "string") return "";

  const trimmed = uu5String.trim();
  if (!trimmed) return "";

  const parser = new Uu5Parser();
  const ast = parser.parse(trimmed);
  let md = astToMarkdown(ast);
  md = decodeEntities(md);
  md = postProcess(md);
  return md;
}

module.exports = { convertUu5StringToMarkdown };
