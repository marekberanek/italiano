#!/usr/bin/env node
/**
 * Generates slide-templates.json from correct building blocks.
 * Run: node build-templates.js
 */
const fs = require("fs");
const path = require("path");

// ─── Building Blocks ──────────────────────────────────────────────────────

function uu5(text, size, color, bold) {
  const styleObj = {};
  if (color) styleObj.color = color;
  if (size) styleObj.fontSize = size;
  const style = JSON.stringify(styleObj).replace(/"/g, '\\"');
  const inner = `<span style="<uu5json/>${style}">${text}</span>`;
  return `<uu5string/>${bold ? `<strong>${inner}</strong>` : inner}`;
}

function richBlock(text, size, color, bold, extraStyle) {
  const props = { uu5String: uu5(text, size, color, bold) };
  if (extraStyle) props.style = extraStyle;
  return { uu5Tag: "Uu5RichTextBricks.Block", props };
}

function subtitle(text) { return richBlock(text, "16px", "#1976D2", true); }
function title(text) { return richBlock(text, "32px", "rgb(0, 0, 0)", true); }
function heading(text) { return richBlock(text, "18px", undefined, true); }
function body(text) { return richBlock(text, "16px"); }
function caption(text) { return richBlock(text, "15px"); }
function statValue(text) { return richBlock(text, "32px", "#1976D2", true); }
function placeholder(text) { return richBlock(text, "16px", "#757575"); }

function iconBlock(iconPlaceholder) {
  return {
    uu5Tag: "Uu5RichTextBricks.Block",
    props: {
      style: "margin-bottom:16px;",
      uu5String: `<uu5string/><Uu5Elements.Icon icon="${iconPlaceholder}" style="<uu5json/>{\\"fontSize\\":\\"32px\\", \\"color\\":\\"#1976D2\\"}" />`
    }
  };
}

function header(sub, ttl) {
  return {
    uu5Tag: "Uu5Bricks.Section",
    props: { headerSeparator: false, margin: "0 0 40px 0", contentPadding: 0 },
    children: [subtitle(sub), title(ttl)]
  };
}

function section(children, margin = "0 0 24px 0") {
  return {
    uu5Tag: "Uu5Bricks.Section",
    props: { headerSeparator: false, margin, contentPadding: 0 },
    children
  };
}

function columns(children, extra = {}) {
  return {
    uu5Tag: "Uu5Bricks.Layout",
    props: { type: "columns", margin: 0, padding: 0, ...extra },
    children
  };
}

function colItem(span, children, extra = {}) {
  return {
    uu5Tag: "Uu5Bricks.Layout.Item",
    props: { colSpan: span, ...extra },
    children
  };
}

function card(children) {
  return {
    uu5Tag: "Uu5Bricks.Card",
    props: { headerSeparator: false, significance: "distinct", margin: 0, contentPadding: "b c", colorScheme: "primary" },
    children
  };
}

function infoItem(iconPlaceholder) {
  return {
    uu5Tag: "Uu5Bricks.InfoItem",
    props: { icon: iconPlaceholder, size: "l", colorScheme: "primary", margin: 0, significance: "highlighted" }
  };
}

function bluePanel(children) {
  return {
    uu5Tag: "Uu5Bricks.Background",
    props: { background: "soft", color: "#E3F2FD", borderRadius: "elementStandard", padding: "c", style: "height:100%" },
    children
  };
}

function wrapLight(contentChildren) {
  return {
    uu5Tag: "Uu5Bricks.Slide",
    props: { contentEditable: true, padding: "0px" },
    children: [{
      uu5Tag: "Uu5Bricks.Background",
      props: {
        gradient: "linear-gradient(to bottom, #CAE6FC 0.5%, #FFFFFF 40%)",
        background: "soft", style: "height:100%; width:100%;",
        margin: 0, padding: 0, borderRadius: "none"
      },
      children: [{
        uu5Tag: "Uu5Bricks.Section",
        props: { style: "height: 100%", contentPadding: "40px 40px 0px 40px", margin: 0, headerSeparator: false },
        children: contentChildren
      }]
    }]
  };
}

function wrapDark(contentChildren) {
  return {
    uu5Tag: "Uu5Bricks.Background",
    props: { borderRadius: "none", margin: 0, gradient: "linear-gradient(to bottom, #001659 0%, #00154A 100%)" },
    children: [{
      uu5Tag: "Uu5Bricks.Slide",
      props: { contentEditable: true, padding: "<uu5json/>{}" },
      children: [{
        uu5Tag: "Uu5Bricks.Section",
        props: { style: "height:100%", contentPadding: "40px 40px 40px 40px", margin: 0, headerSeparator: false },
        children: contentChildren
      }]
    }]
  };
}

function wrapGradient(contentChildren) {
  return {
    uu5Tag: "Uu5Bricks.Slide",
    props: { contentEditable: true, padding: "0px" },
    children: [{
      uu5Tag: "Uu5Bricks.Background",
      props: {
        gradient: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #E8F5E9 100%)",
        style: "height:100%; width:100%;",
        margin: 0, padding: 0, borderRadius: "none"
      },
      children: [{
        uu5Tag: "Uu5Bricks.Section",
        props: { style: "height: 100%", contentPadding: "40px", margin: 0, headerSeparator: false },
        children: contentChildren
      }]
    }]
  };
}

// ─── Reusable content patterns ────────────────────────────────────────────

function keyPointBlock(n) {
  return section([
    heading(`{{BLOCK_${n}_TITLE}}`),
    body(`{{BLOCK_${n}_BULLET_1}}`),
    body(`{{BLOCK_${n}_BULLET_2}}`)
  ]);
}

function infoBlockRow(n) {
  return columns([
    colItem("m: 1; s: 1; xs: 1; l: 1; xl: 1;", [infoItem(`{{ICON_${n}}}`)]),
    colItem("m: 11; xs: 11; s: 11; l: 11; xl: 11;", [{
      uu5Tag: "Uu5Bricks.Section",
      props: { margin: 0, contentPadding: 0, headerSeparator: false, padding: "0 0 0 16px" },
      children: [heading(`{{BLOCK_${n}_HEADING}}`), body(`{{BLOCK_${n}_DESCRIPTION}}`)]
    }])
  ], { rowGap: "d", alignItems: "start", columnGap: "d", margin: "xs: 0px 0 24px;", padding: "xs: 0;" });
}

function cardBlock(n) {
  return card([iconBlock(`{{CARD_${n}_ICON}}`), heading(`{{CARD_${n}_HEADING}}`), caption(`{{CARD_${n}_TEXT}}`)]);
}

function statBlock(n) {
  return section([statValue(`{{STAT_${n}_VALUE}}`), caption(`{{STAT_${n}_LABEL}}`)], 0);
}

function keyPointGroup(n) {
  return section([
    heading(`{{GROUP_${n}_TITLE}}`),
    body(`{{GROUP_${n}_BULLET_1}}`),
    body(`{{GROUP_${n}_BULLET_2}}`)
  ]);
}

// ─── Template definitions ─────────────────────────────────────────────────

const templates = [];

// 1. Welcome
templates.push({
  id: "slide_01", name: "Welcome", category: "system",
  description: "Opening title slide with surtitle, title, and presenter on dark gradient background.",
  keywords: ["welcome", "intro", "opening", "title", "presenter", "first"],
  placeholders: ["{{SURTITLE}}", "{{TITLE}}", "{{PRESENTER_NAME}}", "{{PRESENTER_TITLE}}"],
  template: wrapDark([
    columns([
      colItem("m: 12;", [], { alignSelf: "center" }),
      colItem("m: 12;", [{
        uu5Tag: "Uu5Bricks.Section",
        props: { headerSeparator: false, margin: 0, contentPadding: 0 },
        children: [
          richBlock("{{SURTITLE}}", "16px", "#90CAF9", true),
          richBlock("{{TITLE}}", "32px", "#FFFFFF", true),
          columns([colItem("m: 6;", [{
            uu5Tag: "Uu5Bricks.InfoItem",
            props: { title: "{{PRESENTER_NAME}}", subtitle: "{{PRESENTER_TITLE}}", size: "xl", colorScheme: "primary", significance: "highlighted" }
          }])], { minTileWidth: "200px", tileLastRowJustify: "start", margin: "24px 0 0 0" })
        ]
      }], { alignSelf: "end" })
    ], { style: "height:100%;" })
  ])
});

// 2. Demo
templates.push({
  id: "slide_02", name: "Demo", category: "system",
  description: "Static transition slide for live demo. Centered 'Demo' text on dark gradient.",
  keywords: ["demo", "live", "transition"],
  placeholders: [],
  template: wrapDark([
    columns([
      colItem("m: 12;", [richBlock("Demo", "32px", "#FFFFFF", true)], { alignSelf: "center", style: "text-align:center;" })
    ], { style: "height:100%;" })
  ])
});

// 3. Thank You
templates.push({
  id: "slide_03", name: "Thank You", category: "system",
  description: "Closing slide. Centered 'Thank you for your attention' on dark gradient.",
  keywords: ["thank", "closing", "end", "final", "outro"],
  placeholders: [],
  template: wrapDark([
    columns([
      colItem("m: 12;", [richBlock("Thank you for your attention", "32px", "#FFFFFF", true)], { alignSelf: "center", style: "text-align:center;" })
    ], { style: "height:100%;" })
  ])
});

// 4. Key Points + Chart 1:1
templates.push({
  id: "slide_04", name: "Key Points + Chart 1:1", category: "split",
  description: "Left blue panel with subtitle, title, 3 key point blocks. Right side for chart.",
  keywords: ["key points", "chart", "split", "1:1", "status", "progress"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{BLOCK_1_TITLE}}", "{{BLOCK_1_BULLET_1}}", "{{BLOCK_1_BULLET_2}}", "{{BLOCK_2_TITLE}}", "{{BLOCK_2_BULLET_1}}", "{{BLOCK_2_BULLET_2}}", "{{BLOCK_3_TITLE}}", "{{BLOCK_3_BULLET_1}}", "{{BLOCK_3_BULLET_2}}", "{{CHART_PLACEHOLDER}}"],
  template: wrapLight([
    columns([
      colItem("m: 6;", [bluePanel([header("{{SUBTITLE}}", "{{TITLE}}"), keyPointBlock(1), keyPointBlock(2), keyPointBlock(3)])]),
      colItem("m: 6;", [placeholder("{{CHART_PLACEHOLDER}}")])
    ])
  ])
});

// 5. Info Blocks + Chart 1:1
templates.push({
  id: "slide_05", name: "Info Blocks + Chart 1:1", category: "split",
  description: "Left blue panel with subtitle, title, 3 icon-led info blocks. Right side for chart.",
  keywords: ["info blocks", "chart", "split", "1:1", "categories", "capabilities"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{ICON_1}}", "{{BLOCK_1_HEADING}}", "{{BLOCK_1_DESCRIPTION}}", "{{ICON_2}}", "{{BLOCK_2_HEADING}}", "{{BLOCK_2_DESCRIPTION}}", "{{ICON_3}}", "{{BLOCK_3_HEADING}}", "{{BLOCK_3_DESCRIPTION}}", "{{CHART_PLACEHOLDER}}"],
  template: wrapLight([
    columns([
      colItem("m: 6;", [bluePanel([header("{{SUBTITLE}}", "{{TITLE}}"), infoBlockRow(1), infoBlockRow(2), infoBlockRow(3)])]),
      colItem("m: 6;", [placeholder("{{CHART_PLACEHOLDER}}")])
    ])
  ])
});

// 6. Description + Chart 1:1
templates.push({
  id: "slide_06", name: "Description + Chart 1:1", category: "split",
  description: "Left blue panel with subtitle, title, 1-2 description paragraphs. Right side for chart.",
  keywords: ["description", "chart", "split", "1:1", "summary", "narrative"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{DESCRIPTION_1}}", "{{DESCRIPTION_2}}", "{{CHART_PLACEHOLDER}}"],
  template: wrapLight([
    columns([
      colItem("m: 6;", [bluePanel([header("{{SUBTITLE}}", "{{TITLE}}"), body("{{DESCRIPTION_1}}"), body("{{DESCRIPTION_2}}")])]),
      colItem("m: 6;", [placeholder("{{CHART_PLACEHOLDER}}")])
    ])
  ])
});

// 7. Key Points + Image 1:1
templates.push({
  id: "slide_07", name: "Key Points + Image 1:1", category: "split",
  description: "Left white area with subtitle, title, 3 key point blocks. Right blue panel for image.",
  keywords: ["key points", "image", "split", "1:1", "screenshot", "product"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{BLOCK_1_TITLE}}", "{{BLOCK_1_BULLET_1}}", "{{BLOCK_1_BULLET_2}}", "{{BLOCK_2_TITLE}}", "{{BLOCK_2_BULLET_1}}", "{{BLOCK_2_BULLET_2}}", "{{BLOCK_3_TITLE}}", "{{BLOCK_3_BULLET_1}}", "{{BLOCK_3_BULLET_2}}", "{{IMAGE_PLACEHOLDER}}"],
  template: wrapLight([
    columns([
      colItem("m: 6;", [header("{{SUBTITLE}}", "{{TITLE}}"), keyPointBlock(1), keyPointBlock(2), keyPointBlock(3)]),
      colItem("m: 6;", [bluePanel([placeholder("{{IMAGE_PLACEHOLDER}}")])])
    ])
  ])
});

// 8. Info Blocks + Image 1:1
templates.push({
  id: "slide_08", name: "Info Blocks + Image 1:1", category: "split",
  description: "Left white area with subtitle, title, 3 icon-led info blocks. Right blue panel for image.",
  keywords: ["info blocks", "image", "split", "1:1", "capabilities", "screenshot"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{ICON_1}}", "{{BLOCK_1_HEADING}}", "{{BLOCK_1_DESCRIPTION}}", "{{ICON_2}}", "{{BLOCK_2_HEADING}}", "{{BLOCK_2_DESCRIPTION}}", "{{ICON_3}}", "{{BLOCK_3_HEADING}}", "{{BLOCK_3_DESCRIPTION}}", "{{IMAGE_PLACEHOLDER}}"],
  template: wrapLight([
    columns([
      colItem("m: 6;", [header("{{SUBTITLE}}", "{{TITLE}}"), infoBlockRow(1), infoBlockRow(2), infoBlockRow(3)]),
      colItem("m: 6;", [bluePanel([placeholder("{{IMAGE_PLACEHOLDER}}")])])
    ])
  ])
});

// 9. Description + Image 1:1
templates.push({
  id: "slide_09", name: "Description + Image 1:1", category: "split",
  description: "Left white area with subtitle, title, description paragraphs. Right blue panel for image.",
  keywords: ["description", "image", "split", "1:1", "summary", "screenshot"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{DESCRIPTION_1}}", "{{DESCRIPTION_2}}", "{{IMAGE_PLACEHOLDER}}"],
  template: wrapLight([
    columns([
      colItem("m: 6;", [header("{{SUBTITLE}}", "{{TITLE}}"), body("{{DESCRIPTION_1}}"), body("{{DESCRIPTION_2}}")]),
      colItem("m: 6;", [bluePanel([placeholder("{{IMAGE_PLACEHOLDER}}")])])
    ])
  ])
});

// 10. Key Points + Image Gradient
templates.push({
  id: "slide_10", name: "Key Points + Image Gradient", category: "split",
  description: "Full gradient background with subtitle, title, 3 key point blocks left, image right.",
  keywords: ["key points", "image", "gradient", "split", "visual", "branded"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{BLOCK_1_TITLE}}", "{{BLOCK_1_BULLET_1}}", "{{BLOCK_1_BULLET_2}}", "{{BLOCK_2_TITLE}}", "{{BLOCK_2_BULLET_1}}", "{{BLOCK_2_BULLET_2}}", "{{BLOCK_3_TITLE}}", "{{BLOCK_3_BULLET_1}}", "{{BLOCK_3_BULLET_2}}", "{{IMAGE_PLACEHOLDER}}"],
  template: wrapGradient([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    columns([
      colItem("m: 6;", [keyPointBlock(1), keyPointBlock(2), keyPointBlock(3)]),
      colItem("m: 6;", [placeholder("{{IMAGE_PLACEHOLDER}}")])
    ])
  ])
});

// 13. 2 Cards
templates.push({
  id: "slide_13", name: "2 Cards", category: "cards",
  description: "Subtitle, title, 2-column grid with icon cards. Moderate content per card.",
  keywords: ["cards", "2", "two", "comparison", "priorities"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{CARD_1_ICON}}", "{{CARD_1_HEADING}}", "{{CARD_1_TEXT}}", "{{CARD_2_ICON}}", "{{CARD_2_HEADING}}", "{{CARD_2_TEXT}}"],
  template: wrapLight([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    columns([
      colItem("m: 6;", [cardBlock(1)]),
      colItem("m: 6;", [cardBlock(2)])
    ], { columnGap: "d" })
  ])
});

// 14. 3 Cards
templates.push({
  id: "slide_14", name: "3 Cards", category: "cards",
  description: "Subtitle, title, 3-column grid with icon cards. Compressed content per card.",
  keywords: ["cards", "3", "three", "priorities", "capabilities"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{CARD_1_ICON}}", "{{CARD_1_HEADING}}", "{{CARD_1_TEXT}}", "{{CARD_2_ICON}}", "{{CARD_2_HEADING}}", "{{CARD_2_TEXT}}", "{{CARD_3_ICON}}", "{{CARD_3_HEADING}}", "{{CARD_3_TEXT}}"],
  template: wrapLight([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    columns([
      colItem("m: 4;", [cardBlock(1)]),
      colItem("m: 4;", [cardBlock(2)]),
      colItem("m: 4;", [cardBlock(3)])
    ], { columnGap: "d" })
  ])
});

// 44. 4 Cards
templates.push({
  id: "slide_44", name: "4 Cards", category: "cards",
  description: "Subtitle, title, 2x2 grid with icon cards. One short line per card.",
  keywords: ["cards", "4", "four", "grid", "priorities", "status"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{CARD_1_ICON}}", "{{CARD_1_HEADING}}", "{{CARD_1_TEXT}}", "{{CARD_2_ICON}}", "{{CARD_2_HEADING}}", "{{CARD_2_TEXT}}", "{{CARD_3_ICON}}", "{{CARD_3_HEADING}}", "{{CARD_3_TEXT}}", "{{CARD_4_ICON}}", "{{CARD_4_HEADING}}", "{{CARD_4_TEXT}}"],
  template: wrapLight([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    columns([
      colItem("m: 6;", [cardBlock(1)]),
      colItem("m: 6;", [cardBlock(2)]),
      colItem("m: 6;", [cardBlock(3)]),
      colItem("m: 6;", [cardBlock(4)])
    ], { columnGap: "d", rowGap: "d" })
  ])
});

// 15. 6 Cards
templates.push({
  id: "slide_15", name: "6 Cards", category: "cards",
  description: "Subtitle, title, 3x2 grid with icon cards. Overview-level, very compact.",
  keywords: ["cards", "6", "six", "grid", "overview", "capabilities"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{CARD_1_ICON}}", "{{CARD_1_HEADING}}", "{{CARD_1_TEXT}}", "{{CARD_2_ICON}}", "{{CARD_2_HEADING}}", "{{CARD_2_TEXT}}", "{{CARD_3_ICON}}", "{{CARD_3_HEADING}}", "{{CARD_3_TEXT}}", "{{CARD_4_ICON}}", "{{CARD_4_HEADING}}", "{{CARD_4_TEXT}}", "{{CARD_5_ICON}}", "{{CARD_5_HEADING}}", "{{CARD_5_TEXT}}", "{{CARD_6_ICON}}", "{{CARD_6_HEADING}}", "{{CARD_6_TEXT}}"],
  template: wrapLight([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    columns([
      colItem("m: 4;", [cardBlock(1)]), colItem("m: 4;", [cardBlock(2)]), colItem("m: 4;", [cardBlock(3)]),
      colItem("m: 4;", [cardBlock(4)]), colItem("m: 4;", [cardBlock(5)]), colItem("m: 4;", [cardBlock(6)])
    ], { columnGap: "d", rowGap: "d" })
  ])
});

// 17. 3 Info Blocks
templates.push({
  id: "slide_17", name: "3 Info Blocks", category: "content",
  description: "Subtitle, title, 3 stacked icon-led info blocks without card containers.",
  keywords: ["info blocks", "3", "three", "open", "icon", "items"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{ICON_1}}", "{{BLOCK_1_HEADING}}", "{{BLOCK_1_DESCRIPTION}}", "{{ICON_2}}", "{{BLOCK_2_HEADING}}", "{{BLOCK_2_DESCRIPTION}}", "{{ICON_3}}", "{{BLOCK_3_HEADING}}", "{{BLOCK_3_DESCRIPTION}}"],
  template: wrapLight([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    infoBlockRow(1), infoBlockRow(2), infoBlockRow(3)
  ])
});

// 19. 2 Images + Description
templates.push({
  id: "slide_19", name: "2 Images + Description", category: "media",
  description: "Subtitle, title, 2-column grid with image placeholder + heading + description per image.",
  keywords: ["images", "2", "two", "gallery", "comparison", "screenshots"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{IMAGE_1_PLACEHOLDER}}", "{{IMAGE_1_HEADING}}", "{{IMAGE_1_DESCRIPTION}}", "{{IMAGE_2_PLACEHOLDER}}", "{{IMAGE_2_HEADING}}", "{{IMAGE_2_DESCRIPTION}}"],
  template: wrapLight([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    columns([
      colItem("m: 6;", [placeholder("{{IMAGE_1_PLACEHOLDER}}"), heading("{{IMAGE_1_HEADING}}"), body("{{IMAGE_1_DESCRIPTION}}")]),
      colItem("m: 6;", [placeholder("{{IMAGE_2_PLACEHOLDER}}"), heading("{{IMAGE_2_HEADING}}"), body("{{IMAGE_2_DESCRIPTION}}")])
    ], { columnGap: "d" })
  ])
});

// 27. Statistics + Key Points
templates.push({
  id: "slide_27", name: "Statistics + Key Points 1:1", category: "data",
  description: "Left blue panel with subtitle, title, 4 KPIs in 2x2 grid. Right side with 3 key point groups.",
  keywords: ["statistics", "KPI", "metrics", "key points", "dashboard", "numbers"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{STAT_1_VALUE}}", "{{STAT_1_LABEL}}", "{{STAT_2_VALUE}}", "{{STAT_2_LABEL}}", "{{STAT_3_VALUE}}", "{{STAT_3_LABEL}}", "{{STAT_4_VALUE}}", "{{STAT_4_LABEL}}", "{{GROUP_1_TITLE}}", "{{GROUP_1_BULLET_1}}", "{{GROUP_1_BULLET_2}}", "{{GROUP_2_TITLE}}", "{{GROUP_2_BULLET_1}}", "{{GROUP_2_BULLET_2}}", "{{GROUP_3_TITLE}}", "{{GROUP_3_BULLET_1}}", "{{GROUP_3_BULLET_2}}"],
  template: wrapLight([
    columns([
      colItem("m: 6;", [bluePanel([
        header("{{SUBTITLE}}", "{{TITLE}}"),
        columns([
          colItem("m: 6;", [statBlock(1)]), colItem("m: 6;", [statBlock(2)]),
          colItem("m: 6;", [statBlock(3)]), colItem("m: 6;", [statBlock(4)])
        ])
      ])]),
      colItem("m: 6;", [keyPointGroup(1), keyPointGroup(2), keyPointGroup(3)])
    ])
  ])
});

// 28. Statistics + Chart
templates.push({
  id: "slide_28", name: "Statistics + Chart 1:1", category: "data",
  description: "Left blue panel with subtitle, title, 4 KPIs in 2x2 grid. Right side for chart.",
  keywords: ["statistics", "KPI", "chart", "metrics", "trend", "numbers"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{STAT_1_VALUE}}", "{{STAT_1_LABEL}}", "{{STAT_2_VALUE}}", "{{STAT_2_LABEL}}", "{{STAT_3_VALUE}}", "{{STAT_3_LABEL}}", "{{STAT_4_VALUE}}", "{{STAT_4_LABEL}}", "{{CHART_PLACEHOLDER}}"],
  template: wrapLight([
    columns([
      colItem("m: 6;", [bluePanel([
        header("{{SUBTITLE}}", "{{TITLE}}"),
        columns([
          colItem("m: 6;", [statBlock(1)]), colItem("m: 6;", [statBlock(2)]),
          colItem("m: 6;", [statBlock(3)]), colItem("m: 6;", [statBlock(4)])
        ])
      ])]),
      colItem("m: 6;", [placeholder("{{CHART_PLACEHOLDER}}")])
    ])
  ])
});

// 30. Quote
templates.push({
  id: "slide_30", name: "Quote", category: "text",
  description: "Centered attributed quote (italic) with author attribution below.",
  keywords: ["quote", "testimonial", "attribution", "centered"],
  placeholders: ["{{QUOTE_TEXT}}", "{{QUOTE_AUTHOR}}"],
  template: wrapLight([{
    uu5Tag: "Uu5Bricks.Section",
    props: { headerSeparator: false, margin: "auto", contentPadding: "80px 60px", style: "text-align:center; max-width:800px;" },
    children: [
      richBlock(`"{{QUOTE_TEXT}}"`, "32px", undefined, false),
      richBlock("— {{QUOTE_AUTHOR}}", "15px", "#757575")
    ]
  }])
});

// 32. Statement
templates.push({
  id: "slide_32", name: "Statement", category: "text",
  description: "Centered bold business statement with optional supporting line.",
  keywords: ["statement", "declaration", "message", "centered", "finding"],
  placeholders: ["{{STATEMENT_TEXT}}", "{{SUPPORTING_TEXT}}"],
  template: wrapLight([{
    uu5Tag: "Uu5Bricks.Section",
    props: { headerSeparator: false, margin: "auto", contentPadding: "80px 60px", style: "text-align:center; max-width:800px;" },
    children: [
      richBlock("{{STATEMENT_TEXT}}", "32px", undefined, true),
      body("{{SUPPORTING_TEXT}}")
    ]
  }])
});

// 35. Title + Desc + Chart
templates.push({
  id: "slide_35", name: "Title + Description + Chart", category: "content",
  description: "Subtitle, title, short description, then full-width chart below.",
  keywords: ["title", "description", "chart", "trend", "performance", "full width"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{DESCRIPTION}}", "{{CHART_PLACEHOLDER}}"],
  template: wrapLight([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    body("{{DESCRIPTION}}"),
    section([placeholder("{{CHART_PLACEHOLDER}}")], "24px 0 0 0")
  ])
});

// 37. Title + Desc + Image
templates.push({
  id: "slide_37", name: "Title + Description + Image", category: "content",
  description: "Subtitle, title, short description, then full-width image below.",
  keywords: ["title", "description", "image", "screenshot", "full width", "visual"],
  placeholders: ["{{SUBTITLE}}", "{{TITLE}}", "{{DESCRIPTION}}", "{{IMAGE_PLACEHOLDER}}"],
  template: wrapLight([
    header("{{SUBTITLE}}", "{{TITLE}}"),
    body("{{DESCRIPTION}}"),
    section([placeholder("{{IMAGE_PLACEHOLDER}}")], "24px 0 0 0")
  ])
});

// ─── Write output ─────────────────────────────────────────────────────────

const outPath = path.join(__dirname, "data", "slide-templates.json");
fs.writeFileSync(outPath, JSON.stringify(templates, null, 2), "utf8");
console.log(`Written ${templates.length} templates to ${outPath}`);
console.log("Templates:", templates.map(t => `${t.id} (${t.name})`).join(", "));
