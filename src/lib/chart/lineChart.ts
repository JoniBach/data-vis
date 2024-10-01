import * as d3 from 'd3';

export interface DataPoint {
    date: Date;
    value: number;
}

export interface SeriesData {
    name: string;
    data: DataPoint[];
}

// Feature interface with string type for feature property
export interface Feature {
    feature: string;
    hide: boolean;
    config?: any;
}

export interface TooltipConfig {
    border?: string;
    padding?: string;
    background?: string;
}

export interface LabelConfig {
    title?: string;
    xAxis?: string;
    yAxis?: string;
}

export interface DataKeys {
    name: string;
    data: string;
    date: string;
    value: string;
}

type FeatureFunction = (params: CreateParams, config?: any) => void;

export interface CreateParams {
    seriesData: SeriesData[];
    chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    colorScale: d3.ScaleOrdinal<string, string>;
    dateScale: d3.ScaleBand<Date>;
    valueScale: d3.ScaleLinear<number, number>;
    area: d3.Area<DataPoint>;
    line: d3.Line<DataPoint>;
    chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    chartHeight: number;
    chartWidth: number;
    dataKeys: DataKeys;
}

// Centralized Event System with types
interface TooltipListener {
    (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>, event: MouseEvent, d: DataPoint): void;
}

interface ListenerMap {
    tooltip: TooltipListener;
    tooltipMove: TooltipListener;
    tooltipHide: (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>) => void;
}

const eventSystem = {
    listeners: {} as ListenerMap,
    on<T extends keyof ListenerMap>(eventType: T, callback: ListenerMap[T]) {
        this.listeners[eventType] = callback;
    },
    trigger(eventType: keyof ListenerMap, ...args: any[]) {
        const listener = this.listeners[eventType];
        if (listener) {
            (listener as (...args: any[]) => void)(...args);
        }
    }
};

// Create Tooltip
function createTooltip(container: HTMLElement | null, showTooltip: boolean, config: TooltipConfig): d3.Selection<HTMLDivElement, unknown, null, undefined> {
    if (!showTooltip) {
        return d3.select(document.createElement('div'));
    }
    return d3.select(container as HTMLElement)
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", config?.background || "#f9f9f9")
        .style("border", config?.border || "1px solid #d3d3d3")
        .style("padding", config?.padding || "5px");
}

function escapeHTML(str: number | string) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Tooltip Handlers
eventSystem.on('tooltip', (chartTooltip, event, d, dataKeys) => {
    try {
        const dateStr = escapeHTML(d3.timeFormat("%b %Y")(d[dataKeys.date]));
        const valueStr = escapeHTML(d[dataKeys.value]);

        chartTooltip.style("visibility", "visible")
            .html(`Date: ${dateStr}<br>Value: ${valueStr}`);
    } catch (error) {
        console.error("Error in tooltip handler: ", error);
    }
});

eventSystem.on('tooltipMove', (chartTooltip, event) => {
    chartTooltip.style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
});

eventSystem.on('tooltipHide', (chartTooltip) => {
    chartTooltip.style("visibility", "hidden");
});

// Create Initial SVG
function createInitialSVG({ container, width, height }: { container: HTMLElement, width: number, height: number }) {
    return d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
}

// Create Initial Chart Group
function createInitialChartGroup({ svg, margin }: { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, margin: { top: number, right: number, bottom: number, left: number } }) {
    return svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
}

// Create Date Scale
function createInitialDateScale({ seriesData, chartWidth, dataKeys }: { seriesData: any[], chartWidth: number, dataKeys: DataKeys }) {
    const data = seriesData?.[0]?.[dataKeys.data];
    if (!data || data.length === 0) {
        console.error("No data available for the date scale");
        return null;
    }

    return d3.scaleBand<Date>()
        .domain(data.map((d: any) => d[dataKeys.date]))
        .range([0, chartWidth])
        .padding(0.1);
}

// Create Value Scale
function createInitialValueScale({ seriesData, chartHeight, dataKeys }: { seriesData: any[], chartHeight: number, dataKeys: DataKeys }) {
    const data = seriesData.flatMap(series => series?.[dataKeys.data] || []);
    const maxValue = d3.max(data, (d: any) => d[dataKeys.value]);

    if (!maxValue) {
        console.error("No data available for the value scale");
        return null;
    }

    return d3.scaleLinear()
        .domain([0, maxValue])
        .range([chartHeight, 0]);
}

// Create Color Scale
function createInitialColorScale({ seriesData, dataKeys }: { seriesData: any[], dataKeys: DataKeys }) {
    return d3.scaleOrdinal(d3.schemeCategory10)
        .domain(seriesData.map((d: any) => d[dataKeys.name]));
}

// Create Area
function createInitialArea({ dateScale, valueScale, chartHeight, dataKeys }: { dateScale: d3.ScaleBand<Date>, valueScale: d3.ScaleLinear<number, number>, chartHeight: number, dataKeys: DataKeys }) {
    return d3.area<DataPoint>()
        .x(d => (dateScale(d[dataKeys.date]) || 0) + dateScale.bandwidth() / 2)
        .y0(chartHeight)
        .y1(d => valueScale(d[dataKeys.value]));
}

// Create Line
function createInitialLine({ dateScale, valueScale, dataKeys }: { dateScale: d3.ScaleBand<Date>, valueScale: d3.ScaleLinear<number, number>, dataKeys: DataKeys }) {
    return d3.line<DataPoint>()
        .x(d => (dateScale(d[dataKeys.date]) || 0) + dateScale.bandwidth() / 2)
        .y(d => valueScale(d[dataKeys.value]));
}

// Create Grid
function createGrid({ chartGroup, dateScale, valueScale, chartHeight, chartWidth }: CreateParams) {
    chartGroup.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(valueScale).tickSize(-chartWidth).tickFormat(() => ""))
        .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
    chartGroup.selectAll('.grid path').attr('stroke', 'none');

    chartGroup.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(dateScale).tickSize(-chartHeight).tickFormat(() => ""))
        .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
    chartGroup.selectAll('.grid path').attr('stroke', 'none');
}

// Create Axis
function createAxis({ chartGroup, dateScale, valueScale, chartHeight }: CreateParams) {
    chartGroup.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(dateScale).tickFormat(d3.timeFormat("%b %Y")));
    chartGroup.append('g').call(d3.axisLeft(valueScale));
}

// Create Area
function createArea({ seriesData, chartGroup, colorScale, area, chartTooltip, dataKeys }: CreateParams) {
    try {
        const areasGroup = chartGroup.append('g').attr('class', 'areas-group');
        seriesData.forEach(series => {
            areasGroup.append('path')
                .datum(series[dataKeys.data])
                .attr('fill', colorScale(series[dataKeys.name]))
                .attr('fill-opacity', 0.2)
                .attr('d', area)
                .on('mouseover', (event, d) => {
                    eventSystem.trigger('tooltip', chartTooltip, event, d); // Show tooltip
                })
                .on('mousemove', (event) => {
                    eventSystem.trigger('tooltipMove', chartTooltip, event); // Move tooltip
                })
                .on('mouseout', () => {
                    eventSystem.trigger('tooltipHide', chartTooltip); // Hide tooltip
                });
        });
    } catch (error) {
        console.error("Error creating area chart:", error);
    }
}


// Create Line Chart
function createLine({ seriesData, chartGroup, colorScale, line, dataKeys }: CreateParams) {
    const linesGroup = chartGroup.append('g').attr('class', 'lines-group');
    seriesData.forEach(series => {
        linesGroup.append('path')
            .datum(series[dataKeys.data])
            .attr('fill', 'none')
            .attr('stroke', colorScale(series[dataKeys.name]))
            .attr('stroke-width', 2)
            .attr('d', line);
    });
}

// Create Bars
function createBars({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartHeight, dataKeys }: CreateParams) {
    const barsGroup = chartGroup.append('g').attr('class', 'bars-group');

    const seriesScale = d3.scaleBand()
        .domain(seriesData.map(d => d[dataKeys.name]))
        .range([0, dateScale.bandwidth()])
        .padding(0.05);

    seriesData.forEach(series => {
        barsGroup.selectAll(`rect.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data])
            .enter()
            .append('rect')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('x', d => (dateScale(d[dataKeys.date]) || 0) + seriesScale(series[dataKeys.name])!)
            .attr('y', d => valueScale(d[dataKeys.value]))
            .attr('width', seriesScale.bandwidth())
            .attr('height', d => chartHeight - valueScale(d[dataKeys.value]))
            .attr('fill', colorScale(series[dataKeys.name]))
            .attr('fill-opacity', 0.5);
    });
}

// Create Points
function createPoints({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartTooltip, dataKeys }: CreateParams) {
    const pointsGroup = chartGroup.append('g').attr('class', 'points-group');
    seriesData.forEach(series => {
        pointsGroup.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data])
            .enter()
            .append('circle')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('cx', d => (dateScale(d[dataKeys.date]) || 0) + dateScale.bandwidth() / 2)
            .attr('cy', d => valueScale(d[dataKeys.value]))
            .attr('r', 4)
            .attr('fill', colorScale(series[dataKeys.name]));
    });
}

// Create Label
function createLabel({ chartGroup, chartWidth, chartHeight }: CreateParams, config?: LabelConfig) {
    if (config?.title) {
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .text(config.title);
    }
    if (config?.xAxis) {
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', chartHeight + 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(config.xAxis);
    }
    if (config?.yAxis) {
        chartGroup.append('text')
            .attr('transform', `rotate(-90)`)
            .attr('x', -chartHeight / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(config.yAxis);
    }
}

// Feature Registry
const featureRegistry: Record<string, FeatureFunction> = {
    grid: createGrid,
    axis: createAxis,
    area: createArea,
    bar: createBars,
    line: createLine,
    point: createPoints,
    label: createLabel,
};

// Render Features
function createFeatures(createParameters: CreateParams, features: Feature[]) {
    features.forEach(({ feature, hide, config }) => {
        const featureFunction = featureRegistry[feature];
        if (!hide && featureFunction) {
            featureFunction(createParameters, config);
        }
    });
}

// Main chart function
export function createLineChart(
    container: HTMLElement,
    seriesData: any[],
    width: number = 500,
    height: number = 300,
    features: Feature[],
    dataKeys: DataKeys
) {
    try {
        const margin = { top: 25, right: 30, bottom: 30, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        d3.select(container).selectAll("*").remove(); // Clear previous chart

        if (!seriesData || seriesData.length === 0 || !seriesData[0]?.[dataKeys.data]) {
            console.error("Invalid or no data provided for the chart.");
            return;
        }

        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });

        const dateScale = createInitialDateScale({ seriesData, chartWidth, dataKeys });
        const valueScale = createInitialValueScale({ seriesData, chartHeight, dataKeys });

        if (!dateScale || !valueScale) {
            console.error("Invalid scales created.");
            return;
        }

        const colorScale = createInitialColorScale({ seriesData, dataKeys });
        const area = createInitialArea({ dateScale, valueScale, chartHeight, dataKeys });
        const line = createInitialLine({ dateScale, valueScale, dataKeys });
        const showTooltip = features.some(feature => feature.feature === 'tooltip' && !feature.hide);
        const chartTooltip = createTooltip(container, showTooltip, features.find(feature => feature.feature === 'tooltip')?.config);

        const createParameters: CreateParams = {
            seriesData,
            chartGroup,
            colorScale,
            dateScale,
            valueScale,
            area,
            line,
            chartTooltip,
            chartHeight,
            chartWidth,
            dataKeys
        };

        createFeatures(createParameters, features);
    } catch (error) {
        console.error("Error creating line chart:", error);
    }
}
