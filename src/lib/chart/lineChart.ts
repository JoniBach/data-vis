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
    feature: string;  // Feature type is now a string
    hide: boolean;
    config?: any; // Flexible config type
}

// Updated FeatureFunction type
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
            // Call the listener with the provided arguments
            (listener as (...args: any[]) => void)(...args);
        }
    }

};

// Create Label
function createLabel({ chartGroup, chartWidth, chartHeight }: CreateParams, config?: any) {
    try {
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
    } catch (error) {
        console.error("Error creating label: ", error);
    }
}

// Tooltip Creation
function createTooltip(container: HTMLElement | null, showTooltip: boolean): d3.Selection<HTMLDivElement, unknown, null, undefined> {
    try {
        if (!showTooltip) {
            return d3.select(document.createElement('div'));
        }
        return d3.select(container as HTMLElement)
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "#f9f9f9")
            .style("border", "1px solid #d3d3d3")
            .style("padding", "5px");
    } catch (error) {
        console.error("Error creating tooltip: ", error);
        return d3.select(document.createElement('div'));
    }
}

// Tooltip Handlers
eventSystem.on('tooltip', (chartTooltip, event, d) => {
    try {
        chartTooltip.style("visibility", "visible")
            .html(`Date: ${d3.timeFormat("%b %Y")(d.date)}<br>Value: ${d.value}`);
    } catch (error) {
        console.error("Error in tooltip handler: ", error);
    }
});

eventSystem.on('tooltipMove', (chartTooltip, event) => {
    try {
        chartTooltip.style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
    } catch (error) {
        console.error("Error in tooltip move handler: ", error);
    }
});

eventSystem.on('tooltipHide', (chartTooltip) => {
    try {
        chartTooltip.style("visibility", "hidden");
    } catch (error) {
        console.error("Error in tooltip hide handler: ", error);
    }
});



// Create Grid
function createGrid({ chartGroup, dateScale, valueScale, chartHeight, chartWidth }: CreateParams) {
    try {
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
    } catch (error) {
        console.error("Error creating grid: ", error);
    }
}

// Create Axis
function createAxis({ chartGroup, dateScale, valueScale, chartHeight }: CreateParams) {
    try {
        chartGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(dateScale).tickFormat(d3.timeFormat("%b %Y")));
        chartGroup.append('g').call(d3.axisLeft(valueScale));
    } catch (error) {
        console.error("Error creating axis: ", error);
    }
}

// Create Line
function createLine({ seriesData, chartGroup, colorScale, line }: CreateParams) {
    try {
        const linesGroup = chartGroup.append('g').attr('class', 'lines-group');
        seriesData.forEach(series => {
            linesGroup.append('path')
                .datum(series.data)
                .attr('fill', 'none')
                .attr('stroke', colorScale(series.name))
                .attr('stroke-width', 2)
                .attr('d', line);
        });
    } catch (error) {
        console.error("Error creating line chart: ", error);
    }
}

// Create Area
function createArea({ seriesData, chartGroup, colorScale, area }: CreateParams) {
    try {
        const areasGroup = chartGroup.append('g').attr('class', 'areas-group');
        seriesData.forEach(series => {
            areasGroup.append('path')
                .datum(series.data)
                .attr('fill', colorScale(series.name))
                .attr('fill-opacity', 0.2)
                .attr('d', area);
        });
    } catch (error) {
        console.error("Error creating area chart: ", error);
    }
}

// Create Bars
function createBars({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartHeight }: CreateParams) {
    try {
        const barsGroup = chartGroup.append('g').attr('class', 'bars-group');

        const seriesScale = d3.scaleBand()
            .domain(seriesData.map(d => d.name))
            .range([0, dateScale.bandwidth()])
            .padding(0.05);

        seriesData.forEach(series => {
            barsGroup.selectAll(`rect.${series.name.replace(/\s+/g, '-')}`)
                .data(series.data)
                .enter()
                .append('rect')
                .attr('class', series.name.replace(/\s+/g, '-'))
                .attr('x', d => (dateScale(d.date) || 0) + seriesScale(series.name)!)
                .attr('y', d => valueScale(d.value))
                .attr('width', seriesScale.bandwidth())
                .attr('height', d => chartHeight - valueScale(d.value))
                .attr('fill', colorScale(series.name))
                .attr('fill-opacity', 0.5);
        });
    } catch (error) {
        console.error("Error creating bar chart: ", error);
    }
}

// Create Points
function createPoints({ seriesData, chartGroup, colorScale, dateScale, valueScale }: CreateParams) {
    try {
        const pointsGroup = chartGroup.append('g').attr('class', 'points-group');
        seriesData.forEach(series => {
            pointsGroup.selectAll(`circle.${series.name.replace(/\s+/g, '-')}`)
                .data(series.data)
                .enter()
                .append('circle')
                .attr('class', series.name.replace(/\s+/g, '-'))
                .attr('cx', d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
                .attr('cy', d => valueScale(d.value))
                .attr('r', 4)
                .attr('fill', colorScale(series.name));
        });
    } catch (error) {
        console.error("Error creating points: ", error);
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
    tooltip: () => { }, // No config needed for tooltip
};

// Render Features
function createFeatures(createParameters: CreateParams, features: Feature[]) {
    try {
        features.forEach(({ feature, hide, config }) => {
            if (!hide && featureRegistry[feature]) {
                featureRegistry[feature](createParameters, config); // Pass config to each feature
            }
        });
    } catch (error) {
        console.error("Error rendering features: ", error);
    }
}

// Function to create initial SVG container
function createInitialSVG({ container, width, height }: { container: HTMLElement, width: number, height: number }) {
    try {
        return d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
    } catch (error) {
        console.error("Error creating SVG: ", error);
        throw error;
    }
}

// Function to create initial chart group
function createInitialChartGroup({ svg, margin }: { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, margin: { top: number, right: number, bottom: number, left: number } }) {
    try {
        return svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
    } catch (error) {
        console.error("Error creating chart group: ", error);
        throw error;
    }
}

// Function to create the date scale (x-axis)
function createInitialDateScale({ seriesData, chartWidth }: { seriesData: SeriesData[], chartWidth: number }) {
    try {
        return d3.scaleBand<Date>()
            .domain(seriesData[0].data.map(d => d.date))
            .range([0, chartWidth])
            .padding(0.1);
    } catch (error) {
        console.error("Error creating date scale: ", error);
        throw error;
    }
}

// Function to create the value scale (y-axis)
function createInitialValueScale({ seriesData, chartHeight }: { seriesData: SeriesData[], chartHeight: number }) {
    try {
        return d3.scaleLinear()
            .domain([0, d3.max(seriesData.flatMap(series => series.data), d => d.value) as number])
            .range([chartHeight, 0]);
    } catch (error) {
        console.error("Error creating value scale: ", error);
        throw error;
    }
}

// Function to create the color scale for the series
function createInitialColorScale({ seriesData }: { seriesData: SeriesData[] }) {
    try {
        return d3.scaleOrdinal(d3.schemeCategory10)
            .domain(seriesData.map(d => d.name));
    } catch (error) {
        console.error("Error creating color scale: ", error);
        throw error;
    }
}

// Function to create the area (for area chart)
function createInitialArea({ dateScale, valueScale, chartHeight }: { dateScale: d3.ScaleBand<Date>, valueScale: d3.ScaleLinear<number, number>, chartHeight: number }) {
    try {
        return d3.area<DataPoint>()
            .x(d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
            .y0(chartHeight)
            .y1(d => valueScale(d.value));
    } catch (error) {
        console.error("Error creating area chart: ", error);
        throw error;
    }
}

// Function to create the line chart
function createInitialLine({ dateScale, valueScale }: { dateScale: d3.ScaleBand<Date>, valueScale: d3.ScaleLinear<number, number> }) {
    try {
        return d3.line<DataPoint>()
            .x(d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
            .y(d => valueScale(d.value));
    } catch (error) {
        console.error("Error creating line chart: ", error);
        throw error;
    }
}

// Main chart function
export function createLineChart(
    container: HTMLElement,
    seriesData: SeriesData[],
    width: number = 500,
    height: number = 300,
    features: Feature[]
) {
    try {
        const margin = { top: 20, right: 30, bottom: 30, left: 50 }; // Adjusted left margin
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        d3.select(container).selectAll("*").remove();

        if (seriesData.length === 0 || seriesData[0].data.length === 0) {
            console.warn("No data available for the chart.");
            return;
        }

        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });
        const dateScale = createInitialDateScale({ seriesData, chartWidth });
        const valueScale = createInitialValueScale({ seriesData, chartHeight });
        const colorScale = createInitialColorScale({ seriesData });
        const area = createInitialArea({ dateScale, valueScale, chartHeight });
        const line = createInitialLine({ dateScale, valueScale });
        const showTooltip = features.some(feature => feature.feature === 'tooltip' && !feature.hide);
        const chartTooltip = createTooltip(container, showTooltip);
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
            chartWidth
        };
        createFeatures(createParameters, features);
    } catch (error) {
        console.error("Error creating line chart: ", error);
    }
}
