/**
 * UU5 Chart Builder Library
 * 
 * Provides deterministic, reusable functions for generating UU5 chart components.
 * Supports PieChart, RadarChart, RadialBarChart, BarChart, XyChart, LineChart, AreaChart, GaugeChart.
 */

// ============================================================================
// ID Generation
// ============================================================================

let idCounter = 0;

/**
 * Generate a unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique identifier
 */
function generateId(prefix = 'chart') {
    idCounter++;
    return `${prefix}_${idCounter.toString(16).padStart(4, '0')}`;
}

/**
 * Generate a random hexadecimal ID (32 characters)
 * Format matches UU5 native IDs
 * @returns {string} Random hex identifier
 */
function generateHexId() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars[Math.floor(Math.random() * 16)];
    }
    return result;
}

/**
 * Reset the ID counter (useful for deterministic output)
 */
function resetIdCounter() {
    idCounter = 0;
}

// ============================================================================
// Color Palette
// ============================================================================

/**
 * Default color palette for charts
 */
const DEFAULT_COLORS = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#F44336', // Red
    '#FFEB3B', // Yellow
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#3F51B5', // Indigo
    '#009688', // Teal
];

/**
 * Color schemes (legacy, kept for backward compatibility)
 */
const COLOR_SCHEMES = {
    blue: 'blue',
    lightBlue: 'light-blue',
    lightBlueRich: 'light-blue-rich',
    cyan: 'cyan',
    teal: 'teal',
    green: 'green',
    lightGreen: 'light-green',
    lime: 'lime',
    yellow: 'yellow',
    amber: 'amber',
    orange: 'orange',
    deepOrange: 'deep-orange',
    red: 'red',
    pink: 'pink',
    purple: 'purple',
    deepPurple: 'deep-purple',
    indigo: 'indigo',
    brown: 'brown',
    grey: 'grey',
    blueGrey: 'blue-grey',
};

/**
 * Get a color from the default palette
 * @param {number} index - Index in the palette
 * @returns {string} Hex color code
 */
function getColor(index) {
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

// ============================================================================
// Data Helpers
// ============================================================================

/**
 * Create a data point for simple charts (value + label)
 * @param {string} label - Label for the data point
 * @param {number} value - Value
 * @param {string} color - Optional color
 * @returns {Object} Data point object
 */
function createDataPoint(label, value, color = null) {
    const point = { label, value };
    if (color) {
        point.color = color;
    }
    return point;
}

/**
 * Create a data point for pie charts
 * @param {string} name - Name/label for the slice
 * @param {number} sum - Value/sum for the slice
 * @param {string} color - Color for the slice
 * @returns {Object} Pie chart data point
 */
function createPieDataPoint(name, sum, color) {
    return { name, sum, color };
}

/**
 * Create a data point for radial bar charts
 * @param {string} name - Name/label
 * @param {number} value - Value
 * @param {string} color - Color (as string or object with value property)
 * @returns {Object} Radial bar data point
 */
function createRadialBarDataPoint(name, value, color) {
    return {
        name,
        value,
        color: typeof color === 'string' ? { value: color } : color
    };
}

/**
 * Create a serie configuration
 * @param {Object} config - Serie configuration
 * @returns {Object} Serie object
 */
function createSerie(config) {
    const {
        valueKey = 'value',
        labelKey = null,
        title = null,
        name = null,
        color = null,
        colorSchema = null,
        innerRadius = null,
        outerRadius = null,
    } = config;

    const serie = { valueKey };
    
    if (labelKey) serie.labelKey = labelKey;
    if (title) serie.title = title;
    if (name) serie.name = name;
    if (color) serie.color = color;
    if (colorSchema) serie.colorSchema = colorSchema;
    if (innerRadius !== null) serie.innerRadius = innerRadius;
    if (outerRadius !== null) serie.outerRadius = outerRadius;
    
    // Add unique key for rendering
    serie._key = generateHexId();
    
    return serie;
}

// ============================================================================
// Chart Component Builders
// ============================================================================

/**
 * Escape a value for UU5 JSON embedding
 * @param {*} value - Value to escape
 * @returns {string} Escaped JSON string
 */
function escapeForUu5Json(value) {
    return JSON.stringify(value).replace(/'/g, '\\u0027');
}

/**
 * Create UU5 JSON attribute value
 * @param {*} value - Value to embed
 * @returns {string} UU5 JSON string
 */
function toUu5Json(value) {
    return `<uu5json/>${escapeForUu5Json(value)}`;
}

/**
 * Build a PieChart component
 * 
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} config.data - Array of data points with {name, sum, color}
 * @param {Array<Object>} config.serieList - Serie configurations
 * @param {boolean} config.legend - Show legend (default: true)
 * @param {string} config.width - Chart width
 * @param {string} config.height - Chart height
 * @returns {string} UU5 string for PieChart component
 * 
 * @example
 * buildPieChart({
 *     data: [
 *         { name: 'Apples', sum: 20, color: '#E53935' },
 *         { name: 'Bananas', sum: 40, color: '#FDD835' }
 *     ],
 *     serieList: [{ valueKey: 'sum', labelKey: 'name', title: 'Fruits' }]
 * })
 */
function buildPieChart(config) {
    const {
        data,
        serieList = [{ valueKey: 'sum', labelKey: 'name', title: 'Chart', innerRadius: 0, outerRadius: 100 }],
        legend = true,
        width = null,
        height = null,
    } = config;

    // PieChart expects data wrapped in outer array
    const chartData = Array.isArray(data[0]) ? data : [data];
    
    // Ensure serieList has _key
    const processedSerieList = serieList.map(serie => ({
        ...serie,
        _key: serie._key || generateHexId(),
        innerRadius: serie.innerRadius ?? 0,
        outerRadius: serie.outerRadius ?? 100,
    }));

    let attrs = [
        `data='${toUu5Json(chartData)}'`,
        `serieList='${toUu5Json(processedSerieList)}'`,
    ];
    
    if (legend) attrs.push('legend');
    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    return `<Uu5ChartsBricks.PieChart ${attrs.join(' ')}/>`;
}

/**
 * Build a RadarChart component
 * 
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} config.data - Array of data points with {label, value}
 * @param {Array<Object>} config.serieList - Serie configurations
 * @param {Object} config.labelAxis - Label axis configuration
 * @param {boolean} config.legend - Show legend (default: true)
 * @returns {string} UU5 string for RadarChart component
 * 
 * @example
 * buildRadarChart({
 *     data: [
 *         { label: 'January', value: 40 },
 *         { label: 'February', value: 30 }
 *     ],
 *     serieList: [{ valueKey: 'value', title: 'Visits', color: '#2196F3' }]
 * })
 */
function buildRadarChart(config) {
    const {
        data,
        serieList = [{ valueKey: 'value', title: 'Value', color: '#2196F3' }],
        labelAxis = { dataKey: 'label' },
        legend = true,
        width = null,
        height = null,
    } = config;

    let attrs = [
        `data='${toUu5Json(data)}'`,
        `serieList='${toUu5Json(serieList)}'`,
        `labelAxis='${toUu5Json(labelAxis)}'`,
    ];
    
    if (legend) attrs.push('legend');
    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    return `<Uu5ChartsBricks.RadarChart ${attrs.join(' ')}/>`;
}

/**
 * Build a RadialBarChart component
 * 
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} config.data - Array of data points with {value, name, color}
 * @param {Array<Object>} config.serieList - Serie configurations
 * @param {boolean} config.legend - Show legend (default: true)
 * @returns {string} UU5 string for RadialBarChart component
 * 
 * @example
 * buildRadialBarChart({
 *     data: [
 *         { value: 25, name: 'January', color: { value: '#2196F3' } },
 *         { value: 40, name: 'February', color: { value: '#1565C0' } }
 *     ],
 *     serieList: [{ valueKey: 'value', title: 'Serie 1' }]
 * })
 */
function buildRadialBarChart(config) {
    const {
        data,
        serieList = [{ valueKey: 'value', title: 'Value' }],
        legend = true,
        width = null,
        height = null,
    } = config;

    // Ensure color is in correct format
    const processedData = data.map(point => ({
        ...point,
        color: typeof point.color === 'string' ? { value: point.color } : point.color
    }));

    let attrs = [
        `data='${toUu5Json(processedData)}'`,
        `serieList='${toUu5Json(serieList)}'`,
    ];
    
    if (legend) attrs.push('legend');
    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    return `<Uu5ChartsBricks.RadialBarChart ${attrs.join(' ')}/>`;
}

/**
 * Build a BarChart component (via Uu5ChartsBricks.XyChart)
 *
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} config.data - Array of data points with {label, value, ...}
 * @param {Array<Object>} config.series - Serie configurations [{valueKey, name, color?}]
 * @param {boolean} config.legend - Show legend
 * @param {string} config.labelKey - Key for x-axis labels (default: 'label')
 * @returns {string} UU5 string for XyChart (bar) component
 *
 * @example
 * buildBarChart({
 *     data: [
 *         { label: 'Jan', value: 40 },
 *         { label: 'Feb', value: 30 }
 *     ],
 *     series: [{ valueKey: 'value', name: 'Visits' }]
 * })
 */
function buildBarChart(config) {
    const {
        data,
        series = [{ valueKey: 'value', name: 'Value' }],
        legend = true,
        labelKey = 'label',
        width = null,
        height = null,
        horizontal = false,
        stacked = false,
    } = config;

    const serieList = series.map(s => {
        const barOpts = {};
        if (horizontal) barOpts.layout = 'horizontal';
        if (stacked) barOpts.stackId = 'stack';
        if (s.width) barOpts.width = s.width;

        return {
            valueKey: s.valueKey,
            title: s.name || s.title,
            color: s.color,
            colorScheme: s.colorScheme || s.colorSchema,
            bar: Object.keys(barOpts).length > 0 ? barOpts : true,
            _key: generateHexId()
        };
    });

    let attrs = [
        `data='${toUu5Json(data)}'`,
        `serieList='${toUu5Json(serieList)}'`,
    ];

    if (labelKey) attrs.push(`xAxis='${toUu5Json({ dataKey: labelKey })}'`);
    if (legend) attrs.push('legend');
    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    return `<Uu5ChartsBricks.XyChart ${attrs.join(' ')}/>`;
}

/**
 * Build an XyChart component
 * 
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} config.data - Array of data points
 * @param {Array<Object>} config.serieList - Serie configurations
 * @param {boolean} config.legend - Show legend (default: true)
 * @param {Object} config.xAxis - X-axis configuration
 * @param {Object} config.yAxis - Y-axis configuration
 * @returns {string} UU5 string for XyChart component
 * 
 * @example
 * buildXyChart({
 *     data: [
 *         { value: 25, name: 'January' },
 *         { value: 40, name: 'February' }
 *     ],
 *     serieList: [{ valueKey: 'value', title: 'Visits' }]
 * })
 */
function buildXyChart(config) {
    const {
        data,
        serieList = [{ valueKey: 'value', title: 'Value' }],
        legend = true,
        xAxis = null,
        yAxis = null,
        width = null,
        height = null,
    } = config;

    let attrs = [
        `data='${toUu5Json(data)}'`,
        `serieList='${toUu5Json(serieList)}'`,
    ];
    
    if (legend) attrs.push('legend');
    if (xAxis) attrs.push(`xAxis='${toUu5Json(xAxis)}'`);
    if (yAxis) attrs.push(`yAxis='${toUu5Json(yAxis)}'`);
    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    return `<Uu5ChartsBricks.XyChart ${attrs.join(' ')}/>`;
}

/**
 * Build a LineChart component (via Uu5ChartsBricks.XyChart)
 *
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} config.data - Array of data points
 * @param {Array<Object>} config.series - Serie configurations [{valueKey, name, color?}]
 * @param {boolean} config.legend - Show legend
 * @param {string} config.labelKey - Key for x-axis labels (default: 'label')
 * @returns {string} UU5 string for XyChart (line) component
 */
function buildLineChart(config) {
    const {
        data,
        series = [{ valueKey: 'value', name: 'Value' }],
        legend = true,
        labelKey = 'label',
        width = null,
        height = null,
        dots = true,
        lineType = 'monotoneX',
    } = config;

    const serieList = series.map(s => {
        const lineOpts = {};
        if (lineType) lineOpts.type = lineType;
        if (dots) lineOpts.point = true;

        return {
            valueKey: s.valueKey,
            title: s.name || s.title,
            color: s.color,
            colorScheme: s.colorScheme || s.colorSchema,
            line: Object.keys(lineOpts).length > 0 ? lineOpts : true,
            _key: generateHexId()
        };
    });

    let attrs = [
        `data='${toUu5Json(data)}'`,
        `serieList='${toUu5Json(serieList)}'`,
    ];

    if (labelKey) attrs.push(`xAxis='${toUu5Json({ dataKey: labelKey })}'`);
    if (legend) attrs.push('legend');
    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    return `<Uu5ChartsBricks.XyChart ${attrs.join(' ')}/>`;
}

/**
 * Build an AreaChart component (via Uu5ChartsBricks.XyChart)
 *
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} config.data - Array of data points
 * @param {Array<Object>} config.series - Serie configurations [{valueKey, name, color?}]
 * @param {boolean} config.legend - Show legend
 * @param {string} config.labelKey - Key for x-axis labels (default: 'label')
 * @returns {string} UU5 string for XyChart (area) component
 */
function buildAreaChart(config) {
    const {
        data,
        series = [{ valueKey: 'value', name: 'Value' }],
        legend = true,
        labelKey = 'label',
        width = null,
        height = null,
        stacked = false,
    } = config;

    const serieList = series.map(s => {
        const areaOpts = {};
        if (stacked) areaOpts.stackId = 'stack';

        return {
            valueKey: s.valueKey,
            title: s.name || s.title,
            color: s.color,
            colorScheme: s.colorScheme || s.colorSchema,
            area: Object.keys(areaOpts).length > 0 ? areaOpts : true,
            _key: generateHexId()
        };
    });

    let attrs = [
        `data='${toUu5Json(data)}'`,
        `serieList='${toUu5Json(serieList)}'`,
    ];

    if (labelKey) attrs.push(`xAxis='${toUu5Json({ dataKey: labelKey })}'`);
    if (legend) attrs.push('legend');
    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    return `<Uu5ChartsBricks.XyChart ${attrs.join(' ')}/>`;
}

/**
 * Build a GaugeChart component.
 *
 * The local uu5-components catalog defines GaugeChart with required `data` and
 * `serieList` props, so this builder keeps the same UU5-string shape as the
 * other chart builders instead of returning a standalone ECC object.
 *
 * @param {Object} config - Chart configuration
 * @param {number} config.value - Current value for the default one-point gauge
 * @param {number} config.min - Minimum gauge value (default: 0)
 * @param {number} config.max - Maximum gauge value (default: 100)
 * @param {string|Object} config.label - Gauge label/title
 * @param {Array<Object>} config.data - Optional raw GaugeChart data
 * @param {Array<Object>} config.serieList - Optional raw GaugeChart serieList
 * @returns {string} UU5 string for GaugeChart component
 */
function buildGaugeChart(config) {
    const {
        value,
        min = 0,
        max = 100,
        label = 'Value',
        data = null,
        serieList = null,
        valueKey = 'value',
        labelKey = 'label',
        color = null,
        colorScheme = null,
        width = null,
        height = null,
        legend = false,
        startAngle = null,
        endAngle = null,
        step = null,
        tickStep = null,
        tickList = null,
        tickPosition = null,
        tickLabel = null,
        sectorList = null,
        sectorLabelKey = null,
        pointer = null,
        counter = null,
    } = config;

    const chartData = data || [{
        [labelKey]: typeof label === 'string' ? label : label?.en || 'Value',
        [valueKey]: value,
        ...(color ? { color } : {}),
    }];

    const processedSerieList = (serieList || [{
        valueKey,
        labelKey,
        title: label,
        min,
        max,
        ...(colorScheme ? { colorScheme } : {}),
        ...(color ? { color } : {}),
        ...(step !== null ? { step } : {}),
        ...(tickStep !== null ? { tickStep } : {}),
        ...(tickList ? { tickList } : {}),
        ...(tickPosition ? { tickPosition } : {}),
        ...(tickLabel ? { tickLabel } : {}),
        ...(sectorList ? { sectorList } : {}),
        ...(sectorLabelKey ? { sectorLabelKey } : {}),
        ...(pointer ? { pointer } : {}),
        ...(counter ? { counter } : {}),
    }]).map(serie => ({
        ...serie,
        _key: serie._key || generateHexId(),
    }));

    let attrs = [
        `data='${toUu5Json(chartData)}'`,
        `serieList='${toUu5Json(processedSerieList)}'`,
    ];

    if (legend) attrs.push('legend');
    if (startAngle !== null) attrs.push(`startAngle=${startAngle}`);
    if (endAngle !== null) attrs.push(`endAngle=${endAngle}`);
    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    return `<Uu5ChartsBricks.GaugeChart ${attrs.join(' ')}/>`;
}

// ============================================================================
// Chart Builder Class
// ============================================================================

/**
 * UU5 Chart Builder class
 * Provides a fluent API for building chart components
 */
class ChartBuilder {
    constructor() {
        this.charts = [];
        this.wrapper = null;
        resetIdCounter();
    }

    /**
     * Add a wrapper element (like LSI)
     * @param {string} language - Language code (e.g., 'en', 'cs')
     * @returns {ChartBuilder} this for chaining
     */
    withLsi(language = 'en') {
        this.wrapper = { type: 'lsi', language };
        return this;
    }

    /**
     * Add a Pie Chart
     * @param {Object} config - Chart configuration
     * @returns {ChartBuilder} this for chaining
     */
    addPieChart(config) {
        this.charts.push({ type: 'pie', config });
        return this;
    }

    /**
     * Add a Radar Chart
     * @param {Object} config - Chart configuration
     * @returns {ChartBuilder} this for chaining
     */
    addRadarChart(config) {
        this.charts.push({ type: 'radar', config });
        return this;
    }

    /**
     * Add a Radial Bar Chart
     * @param {Object} config - Chart configuration
     * @returns {ChartBuilder} this for chaining
     */
    addRadialBarChart(config) {
        this.charts.push({ type: 'radialBar', config });
        return this;
    }

    /**
     * Add a Bar Chart
     * @param {Object} config - Chart configuration
     * @returns {ChartBuilder} this for chaining
     */
    addBarChart(config) {
        this.charts.push({ type: 'bar', config });
        return this;
    }

    /**
     * Add an XY Chart
     * @param {Object} config - Chart configuration
     * @returns {ChartBuilder} this for chaining
     */
    addXyChart(config) {
        this.charts.push({ type: 'xy', config });
        return this;
    }

    /**
     * Add a Line Chart
     * @param {Object} config - Chart configuration
     * @returns {ChartBuilder} this for chaining
     */
    addLineChart(config) {
        this.charts.push({ type: 'line', config });
        return this;
    }

    /**
     * Add an Area Chart
     * @param {Object} config - Chart configuration
     * @returns {ChartBuilder} this for chaining
     */
    addAreaChart(config) {
        this.charts.push({ type: 'area', config });
        return this;
    }

    /**
     * Add a Gauge Chart
     * @param {Object} config - Chart configuration
     * @returns {ChartBuilder} this for chaining
     */
    addGaugeChart(config) {
        this.charts.push({ type: 'gauge', config });
        return this;
    }

    /**
     * Build a single chart from type and config
     * @private
     */
    _buildChart(chart) {
        switch (chart.type) {
            case 'pie':
                return buildPieChart(chart.config);
            case 'radar':
                return buildRadarChart(chart.config);
            case 'radialBar':
                return buildRadialBarChart(chart.config);
            case 'bar':
                return buildBarChart(chart.config);
            case 'xy':
                return buildXyChart(chart.config);
            case 'line':
                return buildLineChart(chart.config);
            case 'area':
                return buildAreaChart(chart.config);
            case 'gauge':
                return buildGaugeChart(chart.config);
            default:
                throw new Error(`Unknown chart type: ${chart.type}`);
        }
    }

    /**
     * Build and return as UU5 string
     * @returns {string} UU5 string with chart component(s)
     */
    toUu5String() {
        const chartStrings = this.charts.map(chart => this._buildChart(chart));
        let content = chartStrings.join('');

        if (this.wrapper?.type === 'lsi') {
            content = `<UU5.Bricks.Lsi><UU5.Bricks.Lsi.Item language="${this.wrapper.language}">${content}</UU5.Bricks.Lsi.Item></UU5.Bricks.Lsi>`;
        }

        return `<uu5string/>${content}`;
    }

    /**
     * Build and return charts array (for embedding in other content)
     * @returns {Array<string>} Array of chart UU5 strings
     */
    toChartArray() {
        return this.charts.map(chart => this._buildChart(chart));
    }
}

// ============================================================================
// Convenience Functions for Quick Chart Creation
// ============================================================================

/**
 * Create a simple pie chart from label-value pairs
 * @param {Array<{label: string, value: number, color?: string}>} data - Data points
 * @param {string} title - Chart title
 * @returns {string} UU5 string
 */
function simplePieChart(data, title = 'Chart') {
    const chartData = data.map((d, i) => ({
        name: d.label,
        sum: d.value,
        color: d.color || getColor(i)
    }));
    
    return buildPieChart({
        data: chartData,
        serieList: [{ valueKey: 'sum', labelKey: 'name', title }],
        legend: true
    });
}

/**
 * Create a simple bar chart from label-value pairs
 * @param {Array<{label: string, value: number}>} data - Data points
 * @param {string} name - Serie name
 * @param {string} color - Hex color code
 * @returns {string} UU5 string
 */
function simpleBarChart(data, name = 'Value', color = '#2196F3') {
    return buildBarChart({
        data,
        series: [{ valueKey: 'value', name, color }]
    });
}

/**
 * Create a simple line chart from label-value pairs
 * @param {Array<{label: string, value: number}>} data - Data points
 * @param {string} name - Serie name
 * @param {string} color - Hex color code
 * @returns {string} UU5 string
 */
function simpleLineChart(data, name = 'Value', color = '#4CAF50') {
    return buildLineChart({
        data,
        series: [{ valueKey: 'value', name, color }]
    });
}

/**
 * Create a simple radar chart from label-value pairs
 * @param {Array<{label: string, value: number}>} data - Data points
 * @param {string} title - Serie title
 * @param {string} color - Serie color
 * @returns {string} UU5 string
 */
function simpleRadarChart(data, title = 'Value', color = '#2196F3') {
    return buildRadarChart({
        data,
        serieList: [{ valueKey: 'value', title, color }],
        labelAxis: { dataKey: 'label' }
    });
}

/**
 * Create a simple gauge chart.
 * @param {Object} config - Gauge config with value, min, max, label, colorScheme
 * @returns {string} UU5 string
 */
function simpleGaugeChart(config) {
    const {
        value,
        min = 0,
        max = 100,
        label = 'Value',
        colorScheme = 'blue',
    } = config;

    return buildGaugeChart({ value, min, max, label, colorScheme });
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    // ID generation
    generateId,
    generateHexId,
    resetIdCounter,
    
    // Colors
    DEFAULT_COLORS,
    COLOR_SCHEMES,
    getColor,
    
    // Data helpers
    createDataPoint,
    createPieDataPoint,
    createRadialBarDataPoint,
    createSerie,
    
    // JSON helpers
    escapeForUu5Json,
    toUu5Json,
    
    // Chart builders
    buildPieChart,
    buildRadarChart,
    buildRadialBarChart,
    buildBarChart,
    buildXyChart,
    buildLineChart,
    buildAreaChart,
    buildGaugeChart,
    
    // Convenience functions
    simplePieChart,
    simpleBarChart,
    simpleLineChart,
    simpleRadarChart,
    simpleGaugeChart,
    
    // Builder class
    ChartBuilder
};
