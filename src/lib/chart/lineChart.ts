import * as d3 from 'd3';

export interface DataPoint {
    date: Date;
    value: number;
}

export interface SeriesData {
    name: string;
    data: DataPoint[];
}

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
    dateScale?: d3.ScaleTime<number, number>;
    xScale?: d3.ScaleBand<number>;
    valueScale: d3.ScaleLinear<number, number>;
    stackedValueScale?: d3.ScaleLinear<number, number>;
    area?: d3.Area<DataPoint>;
    line?: d3.Line<DataPoint>;
    chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    chartHeight: number;
    chartWidth: number;
    dataKeys: DataKeys;
    barWidth: number;
}

interface TooltipListener {
    (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>, event: MouseEvent, d: DataPoint): void;
}

interface ListenerMap {
    tooltip: TooltipListener;
    tooltipMove: TooltipListener;
    tooltipHide: (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>) => void;
}

// (9/10): Good modular event system, but could expand for future interactivity needs.
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

// (8/10): Simple but useful helper function for sanitizing input.
function escapeHTML(str: number | string): string {
    if (typeof str !== 'string' && typeof str !== 'number') {
        console.warn('Invalid input type for escapeHTML. Expected a string or number.');
        return '';
    }

    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// (8/10): Solid function for creating tooltips but lacks support for dynamic content updates.
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

// (8/10): Good event handler but should include better type safety and error handling.
eventSystem.on('tooltip', (chartTooltip, event, d, dataKeys: DataKeys) => {
    try {
        const dateStr = escapeHTML(d3.timeFormat("%b %Y")(d[dataKeys.xKey]));
        const valueStr = escapeHTML(d[dataKeys.yKey]);

        chartTooltip.style("visibility", "visible")
            .html(`Date: ${dateStr}<br>Value: ${valueStr}`);
    } catch (error) {
        console.error("Error in tooltip handler:", error);
    }
});

// (7/10): Simple yet effective; could be extended for touch events and better device support.
eventSystem.on('tooltipMove', (chartTooltip, event) => {
    chartTooltip.style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
});

// (7/10): Basic but functional; consider hiding tooltip gracefully with transitions.
eventSystem.on('tooltipHide', (chartTooltip) => {
    chartTooltip.style("visibility", "hidden");
});

// (9/10): Well-structured function but could use type checks on container.
function createInitialSVG({ container, width, height }: { container: HTMLElement, width: number, height: number }) {
    return d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
}

// (8/10): Good practice of transforming chart groups, though it could further abstract the margin check.
function createInitialChartGroup({ svg, margin }: { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, margin: { top: number, right: number, bottom: number, left: number } }) {
    if (!isValidMargin(margin)) {
        console.error("Invalid margin object provided. Ensure top, right, bottom, and left are numbers.");
        return;
    }

    return svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
}

// (8/10): Helpful validation function, though redundancy could be reduced by using a margin interface.
function isValidMargin(margin: { top: number, right: number, bottom: number, left: number }): boolean {
    return ['top', 'right', 'bottom', 'left'].every(prop => typeof margin[prop] === 'number');
}

// (7/10): Useful function but could further validate the scaleFn return type.
function createInitialScale<T>(
    scaleFn: () => d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<T>,
    range: [number, number],
    domain: [number, number] | [Date, Date]
) {
    if (!Array.isArray(range) || !Array.isArray(domain)) {
        console.error("Invalid range or domain provided. Both must be arrays.");
        return;
    }

    return scaleFn()
        .domain(domain)
        .range(range);
}

// (9/10): Clear function to create axes, with good use of D3 features, but could improve tick configuration.
function createAxis(params: CreateParams, config: any) {
    const { chartGroup, dateScale, xScale, valueScale, chartHeight } = params;

    const xTickFormat = config?.xTickFormat || "%b %Y";
    const xAxis = xScale
        ? d3.axisBottom(xScale).tickFormat(d => d3.timeFormat(xTickFormat)(new Date(d as number)))
        : d3.axisBottom(dateScale!).tickFormat(d3.timeFormat(xTickFormat));

    const yTickDecimals = config?.yTickDecimals !== undefined ? config.yTickDecimals : 2;
    const yTickFormat = d3.format(`.${yTickDecimals}f`);

    const xTicks = config?.xTicks || 5;
    const yTicks = config?.yTicks || 10;

    chartGroup.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(xAxis.ticks(xTicks));

    chartGroup.append('g')
        .call(d3.axisLeft(valueScale).ticks(yTicks).tickFormat(yTickFormat));
}

// (8/10): Well-structured bar chart generator but lacks handling for dynamic updates or transitions.
// Main function to create bar charts based on type
// Main function to create bar charts based on type
function createBarsVariant(type: 'grouped' | 'stacked' | 'overlapped' | 'error', params: CreateParams, config: { fillOpacity?: number } = {}) {
    const { seriesData, chartGroup, colorScale, xScale, valueScale, chartHeight, chartWidth, dataKeys, chartTooltip } = params;

    // Validate input
    if (!validateInput(seriesData, xScale, valueScale, colorScale)) return;

    // Define a clipping path to prevent overflow outside the chart area
    chartGroup.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("x", 0)
        .attr("y", 0);

    // Create a group for the bars and apply the clipping path
    const barsGroup = chartGroup.append('g')
        .attr('class', 'bars-group')
        .attr("clip-path", "url(#clip)"); // Apply the clipping path here

    const fillOpacity = config.fillOpacity ?? 0.5;

    // Delegate to the appropriate variant function
    if (type === 'stacked') {
        createStackedBars(seriesData, barsGroup, params, fillOpacity, dataKeys, chartHeight);
    } else if (type === 'error') {
        createErrorBars(seriesData, barsGroup, params, fillOpacity, dataKeys, chartHeight);
    } else {
        createNonStackedBars(type, seriesData, barsGroup, params, fillOpacity, dataKeys, chartHeight);
    }
}

// Function to create error bars (variant: error)
function createErrorBars(seriesData: any[], barsGroup: any, params: CreateParams, fillOpacity: number, dataKeys: any, chartHeight: number) {
    const { xScale, valueScale, colorScale } = params;

    try {
        const seriesScale = d3.scaleBand()
            .domain(seriesData.map(d => d[dataKeys.name]))
            .range([0, xScale.bandwidth()])
            .padding(0.05);

        const magnitudeScale = d3.scaleLinear()
            .domain([d3.min(seriesData, series => d3.min(series[dataKeys.data], d => d[dataKeys.magnitude])) || 0,
            d3.max(seriesData, series => d3.max(series[dataKeys.data], d => d[dataKeys.magnitude])) || 1])
            .range([0, chartHeight * 0.2]); // Adjust the error bar size range based on magnitude

        seriesData.forEach(series => {
            const bars = barsGroup.selectAll(`rect.${series[dataKeys.name].replace(/\s+/g, '-')}`)
                .data(series[dataKeys.data])
                .enter()
                .append('rect');

            bars.each((d, i, nodes) => {
                const bar = d3.select(nodes[i]);
                const xPos = xScale(d[dataKeys.xKey].getTime())! + seriesScale(series[dataKeys.name])!;
                const yPos = valueScale(d[dataKeys.yKey]);
                const height = chartHeight - valueScale(d[dataKeys.yKey]);
                const width = seriesScale.bandwidth();
                const fillColor = colorScale(series[dataKeys.name]);

                // Create the bar
                createBar(bar, d, xPos, yPos, height, width, fillColor, fillOpacity, params.chartTooltip, dataKeys);

                // Add error bars (vertical line with caps)
                const errorMagnitude = magnitudeScale(d[dataKeys.magnitude]);
                const errorLineGroup = barsGroup.append('g').attr('class', 'error-bars-group');

                // Vertical line
                errorLineGroup.append('line')
                    .attr('x1', xPos + width / 2)
                    .attr('x2', xPos + width / 2)
                    .attr('y1', yPos - errorMagnitude)
                    .attr('y2', yPos + errorMagnitude)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1.5);

                // Top cap
                errorLineGroup.append('line')
                    .attr('x1', xPos + width / 4)
                    .attr('x2', xPos + (3 * width) / 4)
                    .attr('y1', yPos - errorMagnitude)
                    .attr('y2', yPos - errorMagnitude)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1.5);

                // Bottom cap
                errorLineGroup.append('line')
                    .attr('x1', xPos + width / 4)
                    .attr('x2', xPos + (3 * width) / 4)
                    .attr('y1', yPos + errorMagnitude)
                    .attr('y2', yPos + errorMagnitude)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1.5);
            });
        });
    } catch (error) {
        console.error('Error generating error bars:', error);
    }
}


// Helper function to validate input
function validateInput(seriesData: any[], xScale: any, valueScale: any, colorScale: any): boolean {
    if (!seriesData || !Array.isArray(seriesData) || seriesData.length === 0) {
        console.error('Invalid seriesData: must be a non-empty array.');
        return false;
    }
    if (!xScale || !valueScale || !colorScale) {
        console.error('xScale, valueScale, or colorScale is not defined for bars.');
        return false;
    }
    return true;
}

// Attach tooltip handlers
function attachTooltipHandlers(selection: d3.Selection<SVGRectElement, any, SVGGElement, any>, chartTooltip: any, dataKeys: any) {
    selection.on('mouseover', (event, d) => eventSystem.trigger('tooltip', chartTooltip, event, d, dataKeys))
        .on('mousemove', (event) => eventSystem.trigger('tooltipMove', chartTooltip, event))
        .on('mouseout', () => eventSystem.trigger('tooltipHide', chartTooltip));
}

// General function to create a bar with tooltip
function createBar(selection: d3.Selection<SVGRectElement, any, SVGGElement, any>, d: any, x: number, y: number, height: number, width: number, fillColor: string, fillOpacity: number, chartTooltip: any, dataKeys: any) {
    selection.attr('x', x)
        .attr('y', y)
        .attr('height', height)
        .attr('width', width)
        .attr('fill', fillColor)
        .attr('fill-opacity', fillOpacity);
    attachTooltipHandlers(selection, chartTooltip, dataKeys);
}

// Function to create stacked bars
function createStackedBars(seriesData: any[], barsGroup: any, params: CreateParams, fillOpacity: number, dataKeys: any, chartHeight: number) {
    const { xScale, valueScale, colorScale } = params;

    try {
        const stackedData = prepareStackedData(seriesData, dataKeys);

        stackedData.forEach((layer, layerIndex) => {
            const seriesName = seriesData[layerIndex][dataKeys.name];
            const bars = barsGroup.selectAll(`rect.${seriesName.replace(/\s+/g, '-')}`)
                .data(layer)
                .enter()
                .append('rect');

            bars.each((d, i, nodes) => {
                const bar = d3.select(nodes[i]);
                const xPos = xScale(d.data[dataKeys.xKey])!;
                const yPos = valueScale(d[1]);
                const height = Math.abs(valueScale(d[0]) - valueScale(d[1]));
                const fillColor = colorScale(seriesName);

                createBar(bar, d, xPos, yPos, height, xScale.bandwidth(), fillColor, fillOpacity, params.chartTooltip, dataKeys);
            });
        });
    } catch (error) {
        console.error('Error generating stacked bars:', error);
    }
}

// Function to create grouped or overlapped bars
function createNonStackedBars(type: 'grouped' | 'overlapped', seriesData: any[], barsGroup: any, params: CreateParams, fillOpacity: number, dataKeys: any, chartHeight: number) {
    const { xScale, valueScale, colorScale } = params;

    try {
        const seriesScale = d3.scaleBand()
            .domain(seriesData.map(d => d[dataKeys.name]))
            .range([0, xScale.bandwidth()])
            .padding(0.05);

        seriesData.forEach(series => {
            const bars = barsGroup.selectAll(`rect.${series[dataKeys.name].replace(/\s+/g, '-')}`)
                .data(series[dataKeys.data])
                .enter()
                .append('rect');

            bars.each((d, i, nodes) => {
                const bar = d3.select(nodes[i]);
                const xPos = xScale(d[dataKeys.xKey].getTime())! + (type === 'grouped' ? seriesScale(series[dataKeys.name])! : 0);
                const yPos = valueScale(d[dataKeys.yKey]);
                const height = chartHeight - valueScale(d[dataKeys.yKey]);
                const width = type === 'grouped' ? seriesScale.bandwidth() : xScale.bandwidth();
                const fillColor = colorScale(series[dataKeys.name]);

                createBar(bar, d, xPos, yPos, height, width, fillColor, fillOpacity, params.chartTooltip, dataKeys);
            });
        });
    } catch (error) {
        console.error('Error generating bars for grouped or overlapped variant:', error);
    }
}


// (8/10): Useful but overly complex; can be simplified for better readability.
function prepareStackedData(seriesData: SeriesData[], dataKeys: DataKeys) {
    if (!Array.isArray(seriesData) || seriesData.length === 0) {
        throw new Error('Invalid seriesData: must be a non-empty array');
    }

    if (!dataKeys || !dataKeys.name || !dataKeys.xKey || !dataKeys.yKey || !dataKeys.data) {
        throw new Error('Invalid dataKeys: all keys (name, date, value, data) must be defined');
    }

    const firstSeriesData = seriesData[0][dataKeys.data];
    if (!Array.isArray(firstSeriesData)) {
        throw new Error('Invalid data format: seriesData elements must contain arrays');
    }

    return d3.stack()
        .keys(seriesData.map(d => d[dataKeys.name]))
        .offset(d3.stackOffsetDiverging)(
            firstSeriesData.map((_, i) => {
                const obj: Record<string, number> = {
                    [dataKeys.xKey]: firstSeriesData[i][dataKeys.xKey].getTime()
                };
                seriesData.forEach(series => {
                    const seriesName = series[dataKeys.name];
                    const dataPoint = series[dataKeys.data][i];
                    if (seriesName && dataPoint) {
                        obj[seriesName] = dataPoint[dataKeys.yKey];
                    } else {
                        throw new Error(`Data inconsistency found at index ${i} for series: ${seriesName}`);
                    }
                });
                return obj;
            })
        );
}

// (8/10): Versatile function for line and area charts, but lacks transition and interaction handling.
function createLineOrArea(type: 'line' | 'area', params: CreateParams) {
    const { seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, dataKeys, chartHeight } = params;

    // Ensure that the chart group, scales, and data are available
    if (!chartGroup || (!dateScale && !xScale) || !valueScale) {
        console.error("Missing required elements (chartGroup, dateScale/xScale, valueScale) to create chart.");
        return;
    }

    const computeXPosition = (d: DataPoint) => xScale
        ? xScale(d[dataKeys.xKey].getTime())! + xScale.bandwidth() / 2
        : dateScale!(d[dataKeys.xKey]);

    // Create line or area generator based on the type
    const generator = type === 'line'
        ? d3.line<DataPoint>()
            .x(computeXPosition)
            .y(d => valueScale(d[dataKeys.yKey]))
        : d3.area<DataPoint>()
            .x(computeXPosition)
            .y1(d => valueScale(d[dataKeys.yKey]))
            .y0(chartHeight);

    // Ensure the group exists before appending
    if (!chartGroup) {
        console.error("No valid chartGroup found to append the path.");
        return;
    }

    const group = chartGroup.append('g').attr('class', `${type}-group`);

    // Append path for each series
    seriesData.forEach(series => {
        group.append('path')
            .datum(series[dataKeys.data])
            .attr('fill', type === 'area' ? colorScale(series[dataKeys.name]) : 'none')
            .attr('stroke', type === 'line' ? colorScale(series[dataKeys.name]) : undefined)
            .attr('fill-opacity', type === 'area' ? 0.4 : 1)
            .attr('d', generator)
            .attr('stroke-width', type === 'line' ? 2 : 0);
    });
}



// (9/10): A well-designed function for rendering points with tooltip interaction.
function createPoints({ seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, chartTooltip, dataKeys }: CreateParams) {
    const pointsGroup = chartGroup.append('g').attr('class', 'points-group');
    seriesData.forEach(series => {
        pointsGroup.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data])
            .enter()
            .append('circle')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('cx', d => xScale ? xScale(d[dataKeys.xKey].getTime())! + xScale.bandwidth() / 2 : dateScale!(d[dataKeys.xKey]))
            .attr('cy', d => valueScale(d[dataKeys.yKey]))
            .attr('r', 4)
            .attr('fill', colorScale(series[dataKeys.name]))
            .on('mouseover', (event, d) => {
                eventSystem.trigger('tooltip', chartTooltip, event, d, dataKeys);
            })
            .on('mousemove', (event) => {
                eventSystem.trigger('tooltipMove', chartTooltip, event);
            })
            .on('mouseout', () => {
                eventSystem.trigger('tooltipHide', chartTooltip);
            });
    });
}

function createBubbles(params: CreateParams, config: { minRadius?: number, maxRadius?: number } = {}) {
    const { seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, chartTooltip, dataKeys, chartHeight, chartWidth } = params;
    const minRadius = config.minRadius ?? 5;
    const maxRadius = config.maxRadius ?? 20;

    const radiusScale = d3.scaleSqrt()
        .domain([d3.min(seriesData, series => d3.min(series[dataKeys.data], d => d[dataKeys.yKey])) || 0,
        d3.max(seriesData, series => d3.max(series[dataKeys.data], d => d[dataKeys.yKey])) || 1])
        .range([minRadius, maxRadius]);

    // Define a clipping path to prevent overflow outside the chart area
    chartGroup.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("x", 0)
        .attr("y", 0);

    // Create a group for the bubbles and apply the clipping path
    const bubblesGroup = chartGroup.append('g')
        .attr('class', 'bubbles-group')
        .attr("clip-path", "url(#clip)"); // Apply the clipping path here

    // Create the bubbles
    seriesData.forEach(series => {
        const bubbles = bubblesGroup.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data])
            .enter()
            .append('circle')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('cx', d => xScale ? xScale(d[dataKeys.xKey].getTime())! + xScale.bandwidth() / 2 : dateScale!(d[dataKeys.xKey]))
            .attr('cy', d => valueScale(d[dataKeys.yKey]))
            .attr('r', d => radiusScale(d[dataKeys.yKey]))
            .attr('fill', colorScale(series[dataKeys.name]))
            .attr('fill-opacity', 0.7);

        // Add tooltip handlers
        bubbles.on('mouseover', (event, d) => {
            eventSystem.trigger('tooltip', chartTooltip, event, d, dataKeys);
        }).on('mousemove', (event) => {
            eventSystem.trigger('tooltipMove', chartTooltip, event);
        }).on('mouseout', () => {
            eventSystem.trigger('tooltipHide', chartTooltip);
        });
    });
}



// (8/10): Clean implementation for grid lines, though can be improved with dynamic tick calculations.
function createGrid({ chartGroup, dateScale, xScale, valueScale, chartHeight, chartWidth }: CreateParams) {
    const gridGroup = chartGroup.append('g').attr('class', 'grid');

    gridGroup.call(d3.axisLeft(valueScale).tickSize(-chartWidth).tickFormat(() => ""))
        .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');

    if (xScale || dateScale) {
        gridGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call((xScale ? d3.axisBottom(xScale) : d3.axisBottom(dateScale!)).tickSize(-chartHeight).tickFormat(() => ""))
            .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
    }
}

// (8/10): Efficient label creation but could be enhanced with more style configuration options.
function createLabel({ chartGroup, chartWidth, chartHeight }: CreateParams, config?: LabelConfig) {

    const createTitle = (title: string) => {
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .text(title);
    };

    const createXAxisLabel = (xAxis: string) => {
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', chartHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(xAxis);
    };

    const createYAxisLabel = (yAxis: string) => {
        chartGroup.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -chartHeight / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(yAxis);
    };

    if (config?.title) {
        createTitle(config.title);
    }

    if (config?.xAxis) {
        createXAxisLabel(config.xAxis);
    }

    if (config?.yAxis) {
        createYAxisLabel(config.yAxis);
    }
}

// (9/10): Smart registry system for features, allowing extendability without modifying core logic.
const featureRegistry: Record<string, FeatureFunction> = {
    grid: createGrid,
    axis: createAxis,
    area: (params) => createLineOrArea('area', params),
    bar: (params, config) => createBarsVariant(config.variant || 'grouped', params),
    line: (params) => createLineOrArea('line', params),
    point: createPoints,
    label: createLabel,
    tooltip: () => null, // Tooltips can be safely ignored when hidden
    bubbles: createBubbles,  // New feature for bubble charts
};



// (8/10): Highly customizable feature creation, though error handling for unknown features could be more explicit.
function createFeatures(createParameters: CreateParams, features: Feature[]) {
    features.forEach(({ feature, hide, config }) => {
        const featureFunction = featureRegistry[feature];

        // Skip the feature if it's hidden
        if (hide) {
            return;
        }

        // Check if the feature function exists in the registry
        if (!featureFunction) {
            console.warn(`Feature function not found for feature: ${feature}`);
            return;
        }

        // Call the feature creation function with parameters and configuration
        featureFunction(createParameters, config);
    });
}


// (7/10): Important domain calculation, but could use performance optimization for large datasets.
function computeMergedValueDomain(
    seriesDataArray: any[][],
    dataKeysArray: DataKeys[],
    variants: string[]
): [number, number] {
    let minValue = Infinity;
    let maxValue = -Infinity;

    const allDatesSet = new Set<number>();
    for (let i = 0; i < seriesDataArray.length; i++) {
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allDatesSet.add(d[dataKeys.xKey].getTime());
            });
        });
    }
    const allDates = Array.from(allDatesSet);

    allDates.forEach(date => {
        let dateMaxPositive = -Infinity;
        let dateMinNegative = Infinity;

        for (let i = 0; i < seriesDataArray.length; i++) {
            const variant = variants[i];
            const seriesData = seriesDataArray[i];
            const dataKeys = dataKeysArray[i];

            if (variant === 'stacked') {
                let chartPositive = 0;
                let chartNegative = 0;

                seriesData.forEach(series => {
                    const dataPoint = series[dataKeys.data].find((d: any) => d[dataKeys.xKey].getTime() === date);
                    if (dataPoint) {
                        const value = dataPoint[dataKeys.yKey];
                        if (value >= 0) {
                            chartPositive += value;
                        } else {
                            chartNegative += value;
                        }
                    }
                });

                if (chartPositive > dateMaxPositive) dateMaxPositive = chartPositive;
                if (chartNegative < dateMinNegative) dateMinNegative = chartNegative;
            } else {
                seriesData.forEach(series => {
                    const dataPoint = series[dataKeys.data].find((d: any) => d[dataKeys.xKey].getTime() === date);
                    if (dataPoint) {
                        const value = dataPoint[dataKeys.yKey];
                        if (value > dateMaxPositive) dateMaxPositive = value;
                        if (value < dateMinNegative) dateMinNegative = value;
                    }
                });
            }
        }

        if (dateMaxPositive > maxValue) maxValue = dateMaxPositive;
        if (dateMinNegative < minValue) minValue = dateMinNegative;
    });

    minValue = Math.min(minValue, 0);
    maxValue = Math.max(maxValue, 0);

    return [minValue, maxValue];
}

// (7/10): Date merging logic is functional but could benefit from optimization in large datasets.
function computeMergedDateDomain(seriesDataArray: any[][], dataKeysArray: DataKeys[]): Date[] {
    const allDates: Date[] = [];
    for (let i = 0; i < seriesDataArray.length; i++) {
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allDates.push(d[dataKeys.xKey]);
            });
        });
    }
    const uniqueDates = Array.from(new Set(allDates.map(date => date.getTime()))).map(time => new Date(time));
    uniqueDates.sort((a, b) => a.getTime() - b.getTime());
    return uniqueDates;
}

// (9/10): Well-structured and flexible chart creator, though it has room for performance improvements in large datasets.
export function createSeriesXYChart(
    container: HTMLElement,
    seriesData: any[],
    width: number = 500,
    height: number = 300,
    features: Feature[],
    dataKeys: DataKeys,
    dateDomain?: Date[],
    valueDomain?: [number, number]
) {
    try {
        const margin = { top: 25, right: 30, bottom: 50, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        d3.select(container).selectAll("*").remove();

        if (!isValidSeriesData(seriesData, dataKeys)) {
            console.error("Invalid or no data provided for the chart.");
            return;
        }

        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });

        const isBarChart = features.some(feature => feature.feature === 'bar' && !feature.hide);
        const dateDomainUsed = dateDomain || extractDateDomain(seriesData, dataKeys);

        const { dateScale, xScale, barWidth } = createScales({
            isBarChart,
            dateDomainUsed,
            chartWidth,
            seriesData,
            dataKeys
        });

        const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
        const barVariant = barFeature?.config?.variant || 'grouped';

        valueDomain = valueDomain || computeMergedValueDomain([seriesData], [dataKeys], [barVariant]);

        const valueScale = createInitialScale(d3.scaleLinear, [chartHeight, 0], valueDomain as [number, number]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(seriesData.map(d => d[dataKeys.name]));

        const area = dateScale ? createLineOrArea('area', { colorScale, dateScale, valueScale, ...arguments[0] }) : undefined;
        const line = dateScale ? createLineOrArea('line', { colorScale, dateScale, valueScale, ...arguments[0] }) : undefined;

        const chartTooltip = createTooltip(
            container,
            shouldShowFeature(features, 'tooltip'),
            features.find(feature => feature.feature === 'tooltip')?.config
        );

        const createParameters: CreateParams = {
            seriesData,
            chartGroup,
            colorScale,
            dateScale,
            xScale,
            valueScale,
            area,
            line,
            chartTooltip,
            chartHeight,
            chartWidth,
            dataKeys,
            barWidth,
        };

        createFeatures(createParameters, features);
    } catch (error) {
        console.error("Error creating chart:", error);
    }
}

// (8/10): Necessary validation, but could return more descriptive errors or logs for invalid data.
function isValidSeriesData(seriesData: any[], dataKeys: DataKeys): boolean {
    return seriesData && seriesData.length > 0 && seriesData[0]?.[dataKeys.data];
}

// (7/10): Efficient for small datasets but could be slow with large data arrays.
function extractDateDomain(seriesData: any[], dataKeys: DataKeys): Date[] {
    return seriesData.flatMap(series => series[dataKeys.data].map((d: any) => d[dataKeys.xKey]));
}

// (8/10): Solid scaling logic, though barWidth calculation could be optimized for larger data sets.
function createScales({ isBarChart, dateDomainUsed, chartWidth, seriesData, dataKeys }: any) {
    let dateScale: d3.ScaleTime<number, number> | undefined;
    let xScale: d3.ScaleBand<number> | undefined;
    let barWidth = 0;

    if (isBarChart) {
        xScale = d3.scaleBand()
            .domain(dateDomainUsed.map(d => d.getTime()))
            .range([0, chartWidth])
            .padding(0.1);
        barWidth = xScale.bandwidth();
    } else {
        dateScale = d3.scaleTime()
            .domain(d3.extent(dateDomainUsed) as [Date, Date])
            .range([0, chartWidth]);
    }

    return { dateScale, xScale, barWidth };
}

// (8/10): Simple utility function to control feature display, could improve readability with better typing.
function shouldShowFeature(features: Feature[], featureName: string): boolean {
    return features.some(feature => feature.feature === featureName && !feature.hide);
}

// (8/10): Clean and logical, but lacks differentiation between merged and non-merged states.
export function createSeperateLineCharts(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false
) {
    d3.select(container).selectAll("*").remove();

    let mergedDateDomain: Date[] | undefined;
    let mergedValueDomain: [number, number] | undefined;

    if (syncX) {
        mergedDateDomain = computeMergedDateDomain(seriesDataArray, dataKeysArray);
    }

    if (syncY) {
        const variants = featuresArray.map(features => {
            const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
            return barFeature?.config?.variant || 'grouped';
        });

        mergedValueDomain = computeMergedValueDomain(seriesDataArray, dataKeysArray, variants);
    }

    for (let i = 0; i < seriesDataArray.length; i++) {
        const features = featuresArray[i];
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];

        const dateDomain = syncX ? mergedDateDomain : undefined;
        const valueDomain = syncY ? mergedValueDomain : undefined;

        const chartContainer = document.createElement('div');
        container.appendChild(chartContainer);

        const chartHeight = squash ? height / seriesDataArray.length : height;

        createSeriesXYChart(
            chartContainer,
            seriesData,
            width,
            chartHeight,
            features,
            dataKeys,
            dateDomain,
            valueDomain
        );
    }
}

// (9/10): A well-designed function for merged multi-series line charts.
export function createMergedLineCharts(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false
) {
    try {
        // Set up the margin and the chart dimensions
        const margin = { top: 25, right: 30, bottom: 50, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Remove any existing content in the container
        d3.select(container).selectAll("*").remove();

        // Compute the merged date domain (X-axis) if syncX is true
        const dateDomain = syncX ? computeMergedDateDomain(seriesDataArray, dataKeysArray) : undefined;

        // Compute the merged value domain (Y-axis) if syncY is true
        const variants = featuresArray.map(features => {
            const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
            return barFeature?.config?.variant || 'grouped';
        });
        const valueDomain = syncY ? computeMergedValueDomain(seriesDataArray, dataKeysArray, variants) : undefined;

        // Create an SVG for the merged chart
        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });

        // We need to compute the scales for the merged chart
        const isBarChart = featuresArray.some(features => features.some(f => f.feature === 'bar' && !f.hide));
        const { dateScale, xScale, barWidth } = createScales({
            isBarChart,
            dateDomainUsed: dateDomain || extractDateDomain(seriesDataArray[0], dataKeysArray[0]),
            chartWidth,
            seriesData: seriesDataArray[0], // The first series to determine the domain
            dataKeys: dataKeysArray[0],
        });

        // Set up the value scale (Y-axis) for the merged chart
        const finalValueDomain = valueDomain || computeMergedValueDomain(seriesDataArray, dataKeysArray, variants);
        const valueScale = createInitialScale(d3.scaleLinear, [chartHeight, 0], finalValueDomain as [number, number]);

        // Define the color scale for multiple series
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(seriesDataArray.flatMap(series => series.map(d => d[dataKeysArray[0].name])));

        // Set up tooltip if needed
        const chartTooltip = createTooltip(
            container,
            featuresArray.some(features => shouldShowFeature(features, 'tooltip')),
            featuresArray.find(features => features.some(feature => feature.feature === 'tooltip'))?.[0].config
        );

        // Now, we need to handle each seriesDataArray and merge it into the same SVG.
        seriesDataArray.forEach((seriesData, i) => {
            const dataKeys = dataKeysArray[i];
            const features = featuresArray[i];

            const area = dateScale ? createLineOrArea('area', {
                seriesData,
                chartGroup,
                colorScale,
                dateScale,
                valueScale,
                chartTooltip,
                chartHeight,
                chartWidth,
                dataKeys,
                barWidth,
            }) : undefined;

            const line = dateScale ? createLineOrArea('line', {
                seriesData,
                chartGroup,
                colorScale,
                dateScale,
                valueScale,
                chartTooltip,
                chartHeight,
                chartWidth,
                dataKeys,
                barWidth,
            }) : undefined;

            // Create the parameters for the current series
            const createParameters: CreateParams = {
                seriesData,
                chartGroup,
                colorScale,
                dateScale,
                xScale,
                valueScale,
                area,
                line,
                chartTooltip,
                chartHeight,
                chartWidth,
                dataKeys,
                barWidth,
            };

            // Create features (axes, lines, bars, grid, etc.) for the current series
            createFeatures(createParameters, features);
        });

    } catch (error) {
        console.error("Error creating merged chart:", error);
    }
}


// (7/10): Solid chart creation but lacks clear differentiation between merged and non-merged variants.
export function createLineChart(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    merge: boolean = false,
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false
) {
    if (merge) {
        createMergedLineCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY);
    } else {
        createSeperateLineCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY);
    }
}
