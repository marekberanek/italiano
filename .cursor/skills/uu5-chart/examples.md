# UU5 Chart Examples

Reference examples for generating UU5 charts using the ChartBuilder library.

## PieChart Examples

### Basic Pie Chart

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addPieChart({
    data: [
        { name: 'Apples', sum: 20, color: '#E53935' },
        { name: 'Bananas', sum: 40, color: '#FDD835' }
    ],
    serieList: [{
        valueKey: 'sum',
        labelKey: 'name',
        title: 'Fruits',
        innerRadius: 0,
        outerRadius: 100
    }],
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

**Output Format:**
```xml
<uu5string/><Uu5ChartsBricks.PieChart data="<uu5json/>[[{"name":"Apples","sum":20,"color":"#E53935"},{"name":"Bananas","sum":40,"color":"#FDD835"}]]" serieList="<uu5json/>[{"valueKey":"sum","labelKey":"name","title":"Fruits","innerRadius":0,"outerRadius":100,"_key":"..."}]" legend/>
```

### Donut Chart (with inner radius)

```javascript
builder.addPieChart({
    data: [
        { name: 'Complete', sum: 75, color: '#4CAF50' },
        { name: 'Remaining', sum: 25, color: '#E0E0E0' }
    ],
    serieList: [{
        valueKey: 'sum',
        labelKey: 'name',
        title: 'Progress',
        innerRadius: 60,   // Creates donut hole
        outerRadius: 100
    }],
    legend: true
});
```

## RadarChart Examples

### Performance Metrics Radar

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addRadarChart({
    data: [
        { label: 'January', value: 40 },
        { label: 'February', value: 30 },
        { label: 'March', value: 20 },
        { label: 'April', value: 27 },
        { label: 'May', value: 18 }
    ],
    serieList: [{
        valueKey: 'value',
        title: 'Number of visits',
        color: '#2196F3'
    }],
    labelAxis: { dataKey: 'label' },
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

**Output Format:**
```xml
<uu5string/><Uu5ChartsBricks.RadarChart data="<uu5json/>[{"label":"January","value":40},...]" serieList="<uu5json/>[{"valueKey":"value","title":"Number of visits","color":"#2196F3"}]" labelAxis="<uu5json/>{"dataKey":"label"}" legend/>
```

## RadialBarChart Examples

### Progress Indicators

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addRadialBarChart({
    data: [
        { value: 25, name: 'January', color: { value: '#2196F3' } },
        { value: 40, name: 'February', color: { value: '#1565C0' } },
        { value: 70, name: 'March', color: { value: '#64B5F6' } }
    ],
    serieList: [{
        valueKey: 'value',
        title: 'Serie 1'
    }],
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

**Output Format:**
```xml
<uu5string/><Uu5ChartsBricks.RadialBarChart data="<uu5json/>[{"value":25,"name":"January","color":{"value":"#2196F3"}},...]" serieList="<uu5json/>[{"valueKey":"value","title":"Serie 1"}]" legend/>
```

## BarChart Examples (via Uu5ChartsBricks.XyChart)

### Simple Bar Chart

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addBarChart({
    data: [
        { label: 'Jan', value: 40 },
        { label: 'Feb', value: 30 },
        { label: 'Mar', value: 20 },
        { label: 'Apr', value: 27 }
    ],
    series: [{
        valueKey: 'value',
        title: 'Number of visits',
        color: '#2196F3'
    }]
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

**Output Format:**
```xml
<uu5string/><Uu5ChartsBricks.XyChart serieList='<uu5json/>[{"valueKey":"value","title":"Number of visits","color":"#2196F3"}]' data='<uu5json/>[{"label":"Jan","value":40},...]'/>
```

### Multi-Series Bar Chart

```javascript
builder.addBarChart({
    data: [
        { label: 'Q1', sales: 100, costs: 60, profit: 40 },
        { label: 'Q2', sales: 120, costs: 70, profit: 50 },
        { label: 'Q3', sales: 150, costs: 80, profit: 70 },
        { label: 'Q4', sales: 180, costs: 90, profit: 90 }
    ],
    series: [
        { valueKey: 'sales', title: 'Sales', color: '#2196F3' },
        { valueKey: 'costs', title: 'Costs', color: '#E53935' },
        { valueKey: 'profit', title: 'Profit', color: '#4CAF50' }
    ],
    legend: true
});
```

### Horizontal Stacked Bar Chart

```javascript
builder.addBarChart({
    data: [
        { label: 'Team A', frontend: 5, backend: 3, devops: 2 },
        { label: 'Team B', frontend: 3, backend: 4, devops: 1 },
        { label: 'Team C', frontend: 4, backend: 2, devops: 3 }
    ],
    series: [
        { valueKey: 'frontend', title: 'Frontend', color: '#2196F3' },
        { valueKey: 'backend', title: 'Backend', color: '#4CAF50' },
        { valueKey: 'devops', title: 'DevOps', color: '#FF9800' }
    ],
    horizontal: true,
    stacked: true,
    legend: true
});
```

## XyChart Examples

### Simple XY Chart

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addXyChart({
    data: [
        { value: 25, name: 'January' },
        { value: 40, name: 'February' },
        { value: 70, name: 'March' }
    ],
    serieList: [{
        valueKey: 'value',
        title: 'Number of visits'
    }],
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

**Output Format:**
```xml
<uu5string/><Uu5ChartsBricks.XyChart data="<uu5json/>[{"value":25,"name":"January"},...]" serieList="<uu5json/>[{"valueKey":"value","title":"Number of visits"}]" legend/>
```

## LineChart Examples (via Uu5ChartsBricks.XyChart)

### Trend Line Chart

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addLineChart({
    data: [
        { label: 'Week 1', users: 1000 },
        { label: 'Week 2', users: 1200 },
        { label: 'Week 3', users: 1100 },
        { label: 'Week 4', users: 1400 },
        { label: 'Week 5', users: 1600 }
    ],
    series: [{
        valueKey: 'users',
        title: 'Active Users',
        color: '#4CAF50'
    }],
    dots: true,
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

## AreaChart Examples (via Uu5ChartsBricks.XyChart)

### Stacked Area Chart

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

builder.addAreaChart({
    data: [
        { label: 'Jan', mobile: 200, desktop: 400, tablet: 100 },
        { label: 'Feb', mobile: 300, desktop: 380, tablet: 120 },
        { label: 'Mar', mobile: 400, desktop: 350, tablet: 150 },
        { label: 'Apr', mobile: 500, desktop: 300, tablet: 180 }
    ],
    series: [
        { valueKey: 'mobile', title: 'Mobile', color: '#4CAF50' },
        { valueKey: 'desktop', title: 'Desktop', color: '#2196F3' },
        { valueKey: 'tablet', title: 'Tablet', color: '#FF9800' }
    ],
    stacked: true,
    legend: true
});

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Chart saved. Size:', uu5.length, 'bytes');
```

## Convenience Functions

### Quick Pie Chart

```javascript
const { simplePieChart } = require('./lib/chart-builder');
const fs = require('fs');

const uu5 = simplePieChart([
    { label: 'Chrome', value: 65 },
    { label: 'Firefox', value: 15 },
    { label: 'Safari', value: 12 },
    { label: 'Edge', value: 5 },
    { label: 'Other', value: 3 }
], 'Browser Market Share');

fs.writeFileSync('/tmp/chart_output.txt', `<uu5string/>${uu5}`);
console.log('Chart saved.');
```

### Quick Bar Chart

```javascript
const { simpleBarChart } = require('./lib/chart-builder');
const fs = require('fs');

const uu5 = simpleBarChart([
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 150 },
    { label: 'Wed', value: 180 },
    { label: 'Thu', value: 140 },
    { label: 'Fri', value: 200 }
], 'Daily Visitors', 'blue');

fs.writeFileSync('/tmp/chart_output.txt', `<uu5string/>${uu5}`);
console.log('Chart saved.');
```

### Quick Radar Chart

```javascript
const { simpleRadarChart } = require('./lib/chart-builder');
const fs = require('fs');

const uu5 = simpleRadarChart([
    { label: 'Attack', value: 85 },
    { label: 'Defense', value: 70 },
    { label: 'Speed', value: 90 },
    { label: 'Magic', value: 60 },
    { label: 'HP', value: 75 }
], 'Character Stats', '#9C27B0');

fs.writeFileSync('/tmp/chart_output.txt', `<uu5string/>${uu5}`);
console.log('Chart saved.');
```

## Multiple Charts with LSI Wrapper

```javascript
const { ChartBuilder } = require('./lib/chart-builder');
const fs = require('fs');

const builder = new ChartBuilder();

// Add multiple charts
builder.addPieChart({
    data: [
        { name: 'Product A', sum: 45, color: '#2196F3' },
        { name: 'Product B', sum: 35, color: '#4CAF50' },
        { name: 'Product C', sum: 20, color: '#FF9800' }
    ],
    serieList: [{ valueKey: 'sum', labelKey: 'name', title: 'Products' }],
    legend: true
});

builder.addBarChart({
    data: [
        { label: 'Jan', value: 100 },
        { label: 'Feb', value: 120 },
        { label: 'Mar', value: 140 }
    ],
    series: [{ valueKey: 'value', title: 'Sales', color: '#2196F3' }]
});

// Wrap in LSI for localization support
builder.withLsi('en');

const uu5 = builder.toUu5String();
fs.writeFileSync('/tmp/chart_output.txt', uu5);
console.log('Charts saved. Size:', uu5.length, 'bytes');
```

**Output Format with LSI:**
```xml
<uu5string/><UU5.Bricks.Lsi><UU5.Bricks.Lsi.Item language="en"><Uu5ChartsBricks.PieChart .../><Uu5ChartsBricks.XyChart .../></UU5.Bricks.Lsi.Item></UU5.Bricks.Lsi>
```
