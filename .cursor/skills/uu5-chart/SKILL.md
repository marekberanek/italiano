---
name: uu5-chart
description: Generate UU5 chart components (PieChart, RadarChart, RadialBarChart, BarChart, XyChart, LineChart, AreaChart, GaugeChart) using the ChartBuilder library. Use when creating data visualizations, charts, or graphs for UU5/BookKit/ManagementKit content.
---

> **Note on `scriptPath`:** The MCP server requires an absolute path to the skill's `skill.js`. The host agent (Claude Code, Cursor, Codex, …) provides each skill's base directory when it loads a `SKILL.md`. Substitute `<absolute path to <skill-name>/skill.js>` placeholders below with the real path (e.g. `/Users/me/.claude/skills/<skill-name>/skill.js`).

# UU5 Chart Generation

Generate UU5 chart components for data visualization in BookKit, ManagementKit, and other UU5 applications.

## CRITICAL: Mandatory Library Usage

**NEVER create chart UU5 components manually.** Always use the `lib/chart-builder.js` library:

- The library handles proper JSON escaping and UU5 string formatting
- Manual component creation WILL result in JSON parse errors
- The library output is the ONLY valid way to generate charts
- Agent MUST use `require('./lib/chart-builder')` in all chart generation scripts

## CRITICAL: File-Based Generation (Context Optimization)

**NEVER load generated UU5 chart content into the chat context.** The chart JSON can be large and will:
- Bloat context and increase API costs
- Risk truncation causing rendering errors

### Required Workflow:

1. **Generate to temp file:**
   - Write Node.js script that uses ChartBuilder
   - Script MUST save output to `/tmp/chart_output.txt` (or similar temp path)
   - Script should output confirmation: `console.log('Chart saved. Size:', uu5.length, 'bytes');`

2. **Upload using MCP skill with `contentFilePath`:**
   - Use `contentFilePath` parameter instead of `content` to pass the file path directly
   - Example: `bookkit-update` with `contentFilePath: "/tmp/chart_output.txt"`
   - The skill reads the file directly - content never enters chat context

### What NOT to do:
- Do NOT use `console.log(builder.toUu5String())` - this loads content into context
- Do NOT use Read tool to load the generated chart file
- Do NOT pass `content` parameter with chart content - use `contentFilePath` instead

## MANDATORY: Verify Components via uu5-components

Before generating any chart, verify the component exists and check its actual props:

```
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "list", library: "uu5ChartsBricks" } })
executeSkill({ scriptPath: "<absolute path to uu5-components/skill.js>", params: { action: "brickDefinitionGet", tagName: "Uu5ChartsBricks.XyChart" } })
```

The catalog contains 5 chart bricks: **PieChart, RadarChart, RadialBarChart, GaugeChart, XyChart**. Use `brickDefinitionGet` to get exact prop names and types — the chart-builder library handles this internally, but if you write chart uu5string manually, you MUST verify props first.

## Supported Chart Types

| Chart Type | Component | Use For |
|------------|-----------|---------|
| **PieChart** | `Uu5ChartsBricks.PieChart` | Parts of a whole, percentages, distribution |
| **RadarChart** | `Uu5ChartsBricks.RadarChart` | Multi-variable comparison, skills, performance metrics |
| **RadialBarChart** | `Uu5ChartsBricks.RadialBarChart` | Progress indicators, circular comparisons |
| **BarChart** | `Uu5ChartsBricks.XyChart` | Category comparisons, rankings (via XyChart) |
| **XyChart** | `Uu5ChartsBricks.XyChart` | Generic XY plots, trends |
| **LineChart** | `Uu5ChartsBricks.XyChart` | Trends over time (via XyChart with type: 'line') |
| **AreaChart** | `Uu5ChartsBricks.XyChart` | Cumulative values (via XyChart with type: 'area') |
| **GaugeChart** | `Uu5ChartsBricks.GaugeChart` | Single KPI value with min/max range |

## Quick Start

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addBarChart({
    data: [
        { label: 'Jan', value: 40 },
        { label: 'Feb', value: 30 },
        { label: 'Mar', value: 50 }
    ],
    series: [{ valueKey: 'value', name: 'Sales', color: '#2196F3' }]
});

// CRITICAL: Save to temp file - NEVER console.log the full content
const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved to /tmp/chart_output.txt');
console.log('Size:', uu5.length, 'bytes');
```

## Chart Builder API

### ChartBuilder Class

```javascript
const { ChartBuilder } = require('./lib/chart-builder');

const builder = new ChartBuilder();

// Add charts
builder.addPieChart(config);
builder.addRadarChart(config);
builder.addRadialBarChart(config);
builder.addBarChart(config);
builder.addXyChart(config);
builder.addLineChart(config);
builder.addAreaChart(config);
builder.addGaugeChart(config);

// Optional: wrap in LSI
builder.withLsi('en');

// Get output
const uu5 = builder.toUu5String();
```

### GaugeChart Configuration

`GaugeChart` uses `data` and `serieList` props in the local uu5 component catalog. Use the builder instead of hand-writing a simple `value/min/max` component.

```javascript
builder.addGaugeChart({
    value: 75,
    min: 0,
    max: 100,
    label: 'Progress',
    colorScheme: 'blue'
});
```

### PieChart Configuration

```javascript
builder.addPieChart({
    data: [
        { name: 'Apples', sum: 20, color: '#E53935' },
        { name: 'Bananas', sum: 40, color: '#FDD835' },
        { name: 'Oranges', sum: 30, color: '#FF9800' }
    ],
    serieList: [{
        valueKey: 'sum',
        labelKey: 'name',
        title: 'Fruits',
        innerRadius: 0,    // 0 for pie, >0 for donut
        outerRadius: 100
    }],
    legend: true
});
```

**Data Point Structure:**
| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label for the slice |
| `sum` | number | Value (determines slice size) |
| `color` | string | Hex color code (e.g., '#E53935') |

**Serie Options:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `valueKey` | string | 'sum' | Key in data for values |
| `labelKey` | string | 'name' | Key in data for labels |
| `title` | string | - | Serie title |
| `innerRadius` | number | 0 | Inner radius (0=pie, >0=donut) |
| `outerRadius` | number | 100 | Outer radius |

### RadarChart Configuration

```javascript
builder.addRadarChart({
    data: [
        { label: 'Speed', value: 80 },
        { label: 'Power', value: 70 },
        { label: 'Defense', value: 60 },
        { label: 'Stamina', value: 90 },
        { label: 'Technique', value: 75 }
    ],
    serieList: [{
        valueKey: 'value',
        title: 'Player Stats',
        color: '#2196F3'
    }],
    labelAxis: { dataKey: 'label' },
    legend: true
});
```

**Data Point Structure:**
| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Axis label |
| `value` | number | Value on that axis |

### RadialBarChart Configuration

```javascript
builder.addRadialBarChart({
    data: [
        { value: 25, name: 'Task A', color: { value: '#2196F3' } },
        { value: 60, name: 'Task B', color: { value: '#4CAF50' } },
        { value: 85, name: 'Task C', color: { value: '#FF9800' } }
    ],
    serieList: [{ valueKey: 'value', title: 'Progress' }],
    legend: true
});
```

**Data Point Structure:**
| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `value` | number | Value (progress) |
| `color` | object | Color as `{ value: '#hexcode' }` |

### BarChart Configuration (via Uu5ChartsBricks.XyChart)

```javascript
builder.addBarChart({
    data: [
        { label: 'Jan', sales: 40, costs: 30 },
        { label: 'Feb', sales: 50, costs: 35 },
        { label: 'Mar', sales: 45, costs: 32 }
    ],
    series: [
        { valueKey: 'sales', name: 'Sales', color: '#2196F3' },
        { valueKey: 'costs', name: 'Costs', color: '#FF5722' }
    ],
    labelKey: 'label',   // Key for X-axis labels
    legend: true
});
```

### XyChart Configuration

```javascript
builder.addXyChart({
    data: [
        { x: 0, y: 10 },
        { x: 10, y: 25 },
        { x: 20, y: 40 },
        { x: 30, y: 35 }
    ],
    serieList: [{
        valueKey: 'y',
        title: 'Growth'
    }],
    xAxis: { dataKey: 'x' },
    legend: true
});
```

### LineChart Configuration (via Uu5ChartsBricks.XyChart)

```javascript
builder.addLineChart({
    data: [
        { label: 'Week 1', users: 100 },
        { label: 'Week 2', users: 150 },
        { label: 'Week 3', users: 180 },
        { label: 'Week 4', users: 220 }
    ],
    series: [{
        valueKey: 'users',
        name: 'Active Users',
        color: '#4CAF50'
    }],
    legend: true
});
```

### AreaChart Configuration (via Uu5ChartsBricks.XyChart)

```javascript
builder.addAreaChart({
    data: [
        { label: 'Q1', revenue: 100, profit: 20 },
        { label: 'Q2', revenue: 150, profit: 35 },
        { label: 'Q3', revenue: 180, profit: 45 },
        { label: 'Q4', revenue: 220, profit: 60 }
    ],
    series: [
        { valueKey: 'revenue', name: 'Revenue', color: '#2196F3' },
        { valueKey: 'profit', name: 'Profit', color: '#4CAF50' }
    ],
    legend: true
});
```

## Convenience Functions

For simple charts, use the convenience functions:

```javascript
const { simplePieChart, simpleBarChart, simpleLineChart, simpleRadarChart } = require('./lib/chart-builder');
const fs = require('fs');

// Simple pie chart
const pie = simplePieChart([
    { label: 'Desktop', value: 60 },
    { label: 'Mobile', value: 35 },
    { label: 'Tablet', value: 5 }
], 'Device Usage');

// Simple bar chart
const bar = simpleBarChart([
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 150 },
    { label: 'Wed', value: 180 }
], 'Daily Visitors', '#2196F3');

// Simple line chart
const line = simpleLineChart([
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 120 },
    { label: 'Mar', value: 140 }
], 'Growth', '#4CAF50');

// Simple radar chart
const radar = simpleRadarChart([
    { label: 'Speed', value: 80 },
    { label: 'Power', value: 70 },
    { label: 'Defense', value: 60 }
], 'Stats', '#2196F3');

// Save to file
fs.writeFileSync('/tmp/chart_output.txt', `<uu5string/>${pie}`);
```

## Complete Examples

### Sales Dashboard with Multiple Charts

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

// Monthly sales bar chart
builder.addBarChart({
    data: [
        { label: 'Jan', value: 12000 },
        { label: 'Feb', value: 15000 },
        { label: 'Mar', value: 18000 },
        { label: 'Apr', value: 14000 },
        { label: 'May', value: 21000 },
        { label: 'Jun', value: 19000 }
    ],
    series: [{ valueKey: 'value', name: 'Sales ($)', color: '#2196F3' }]
});

// Product distribution pie chart
builder.addPieChart({
    data: [
        { name: 'Product A', sum: 45, color: '#2196F3' },
        { name: 'Product B', sum: 30, color: '#4CAF50' },
        { name: 'Product C', sum: 15, color: '#FF9800' },
        { name: 'Product D', sum: 10, color: '#E91E63' }
    ],
    serieList: [{ valueKey: 'sum', labelKey: 'name', title: 'Products' }],
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Charts saved. Size:', uu5.length, 'bytes');
```

### Performance Comparison Radar Chart

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addRadarChart({
    data: [
        { label: 'Performance', value: 85 },
        { label: 'Reliability', value: 90 },
        { label: 'Scalability', value: 75 },
        { label: 'Security', value: 95 },
        { label: 'Cost', value: 70 },
        { label: 'Ease of Use', value: 80 }
    ],
    serieList: [{ valueKey: 'value', title: 'System Score', color: '#2196F3' }],
    labelAxis: { dataKey: 'label' },
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

### Progress Indicators with Radial Bar

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addRadialBarChart({
    data: [
        { value: 95, name: 'Phase 1 - Complete', color: { value: '#4CAF50' } },
        { value: 75, name: 'Phase 2 - In Progress', color: { value: '#2196F3' } },
        { value: 30, name: 'Phase 3 - Started', color: { value: '#FF9800' } },
        { value: 0, name: 'Phase 4 - Pending', color: { value: '#9E9E9E' } }
    ],
    serieList: [{ valueKey: 'value', title: 'Project Progress' }],
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

### Multi-Series Line Chart (Trend Analysis)

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addLineChart({
    data: [
        { label: 'Q1 2024', desktop: 1200, mobile: 800, tablet: 200 },
        { label: 'Q2 2024', desktop: 1100, mobile: 1000, tablet: 250 },
        { label: 'Q3 2024', desktop: 1000, mobile: 1200, tablet: 280 },
        { label: 'Q4 2024', desktop: 950, mobile: 1500, tablet: 300 }
    ],
    series: [
        { valueKey: 'desktop', name: 'Desktop', color: '#2196F3' },
        { valueKey: 'mobile', name: 'Mobile', color: '#4CAF50' },
        { valueKey: 'tablet', name: 'Tablet', color: '#FF9800' }
    ],
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

## Output Format

The library generates valid UU5 string content with **single-quoted** `<uu5json/>` attributes:

```xml
<uu5string/><Uu5ChartsBricks.PieChart data='<uu5json/>[...]' serieList='<uu5json/>[...]' legend/>
```

Charts can be combined and wrapped in LSI for localization:

```xml
<uu5string/><UU5.Bricks.Lsi><UU5.Bricks.Lsi.Item language="en">
<Uu5ChartsBricks.PieChart .../>
<Uu5ChartsBricks.BarChart .../>
</UU5.Bricks.Lsi.Item></UU5.Bricks.Lsi>
```

## ECC Context (ManagementKit / BookKit)

When writing chart output to ManagementKit or BookKit, the content must be wrapped in an ECC component array:

```json
[{
  "uu5Tag": "UU5.RichText.Block",
  "props": {
    "uu5string": "<uu5string/>...chart content from builder..."
  }
}]
```

The library uses single-quoted attributes for all `<uu5json/>` values (e.g., `data='<uu5json/>[...]'`). This is critical — double-quoted attributes break in ECC context because the inner JSON double quotes conflict with the outer JSON `uu5string` property value.

## Context Optimization: File-Based I/O

The MCP server supports generic file-based I/O to avoid loading large content into the chat context:

- **Large input**: Save params to a JSON file, pass path via `inputFile` parameter on `executeSkill`
- **Large output**: Use `outputFile: true` on `executeSkill` to write result to /tmp and get only summary back

This is handled automatically by the MCP server - the skill receives normal params either way.

## Best Practices

1. **Always use the library** - Never manually construct chart JSON
2. **Save to temp file** - Use file-based workflow to avoid context bloat
3. **Choose the right chart type:**
   - Pie: Parts of a whole (max 6-7 slices)
   - Bar: Category comparison
   - Line: Trends over time
   - Radar: Multi-variable comparison (4-8 axes)
   - Radial Bar: Progress indicators
4. **Use consistent colors** - Use color schemes or the default palette
5. **Add legends** for multi-series charts
6. **Keep data points reasonable** - Too many points reduce readability
