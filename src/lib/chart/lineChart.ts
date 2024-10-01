import * as d3 from 'd3';

export interface DataPoint {
    date: Date;
    value: number;
}

export interface SeriesData {
    name: string;
    data: DataPoint[];
}

// Define the CreateParams interface
export interface CreateParams {
    seriesData: SeriesData[];
    chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    colorScale: d3.ScaleOrdinal<string, string>;
    dateScale: d3.ScaleBand<Date>;
    valueScale: d3.ScaleLinear<number, number>;
    area: d3.Area<DataPoint>;
    line: d3.Line<DataPoint>;
    chartTooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null;
    chartHeight: number;
    chartWidth: number;
}

export interface Feature {
    feature: string;
}

// Function to create the tooltip div
function createTooltip(container: HTMLElement, showTooltip: boolean): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null {
    if (!showTooltip) return null;
    return d3.select(container)
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#f9f9f9")
        .style("border", "1px solid #d3d3d3")
        .style("padding", "5px");
}

// Function to add event handlers for showing/hiding the tooltip
function createTooltipHandler(
    chartTooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    elements: d3.Selection<any, DataPoint, SVGGElement, unknown>,
) {
    if (chartTooltip) {
        elements
            .on("mouseover", (event, d) => {
                chartTooltip.style("visibility", "visible")
                    .html(`Date: ${d3.timeFormat("%b %Y")(d.date)}<br>Value: ${d.value}`);
            })
            .on("mousemove", (event) => {
                chartTooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => {
                chartTooltip.style("visibility", "hidden");
            });
    }
}

// Function to create grid lines
function createGrid({ chartGroup, dateScale, valueScale, chartHeight, chartWidth }: CreateParams) {
    // Create horizontal grid lines (based on valueScale)
    chartGroup.append('g')
        .attr('class', 'grid')
        .call(
            d3.axisLeft(valueScale)
                .tickSize(-chartWidth)  // Extend the ticks across the chart width
                .tickFormat(() => "")    // Don't show labels, just the grid lines
        )
        .selectAll('line')
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray', '2,2'); // Dotted line

    // Hide the solid axis line for the y-axis
    chartGroup.selectAll('.grid path')
        .attr('stroke', 'none');  // Remove the solid line

    // Create vertical grid lines (based on dateScale)
    chartGroup.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(
            d3.axisBottom(dateScale)
                .tickSize(-chartHeight)  // Extend the ticks across the chart height
                .tickFormat(() => "")    // Don't show labels, just the grid lines
        )
        .selectAll('line')
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray', '2,2'); // Dotted line

    // Hide the solid axis line for the x-axis
    chartGroup.selectAll('.grid path')
        .attr('stroke', 'none');  // Remove the solid line
}

// Function to create the axis
function createAxis({ chartGroup, dateScale, valueScale, chartHeight }: CreateParams) {
    // X-axis
    chartGroup.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(dateScale).tickFormat(d3.timeFormat("%b %Y")));

    // Y-axis
    chartGroup.append('g').call(d3.axisLeft(valueScale));
}

// Function to create lines
function createLine({ seriesData, chartGroup, colorScale, dateScale, valueScale, line }: CreateParams) {
    const linesGroup = chartGroup.append('g').attr('class', 'lines-group');

    seriesData.forEach(series => {
        const path = linesGroup.append('path')
            .datum(series.data)
            .attr('fill', 'none')
            .attr('stroke', colorScale(series.name))
            .attr('stroke-width', 2)
            .attr('d', line);
    });
}

// Function to create areas
function createArea({ seriesData, chartGroup, colorScale, dateScale, valueScale, area }: CreateParams) {
    const areasGroup = chartGroup.append('g').attr('class', 'areas-group');

    seriesData.forEach(series => {
        areasGroup.append('path')
            .datum(series.data)
            .attr('fill', colorScale(series.name))
            .attr('fill-opacity', 0.2)
            .attr('d', area);
    });
}

// Function to create bars
function createBars({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartHeight, chartTooltip }: CreateParams) {
    const seriesScale = d3.scaleBand<string>()
        .domain(seriesData.map(d => d.name))
        .range([0, dateScale.bandwidth()])
        .padding(0.05);

    const barsGroup = chartGroup.append('g').attr('class', 'bars-group');

    seriesData.forEach(series => {
        const sanitizedSeriesName = series.name.replace(/\s+/g, '-');

        const bars = barsGroup.selectAll(`.bar-${sanitizedSeriesName}`)
            .data(series.data)
            .enter()
            .append('rect')
            .attr('class', `bar-${sanitizedSeriesName}`)
            .attr('x', d => (dateScale(d.date) || 0) + seriesScale(series.name)!)
            .attr('y', d => valueScale(d.value))
            .attr('width', seriesScale.bandwidth())
            .attr('height', d => chartHeight - valueScale(d.value))
            .attr('fill', colorScale(series.name))
            .attr('fill-opacity', 0.5);

        // Apply tooltip handler to bars
        createTooltipHandler(chartTooltip, bars);
    });
}

// Function to create points
function createPoints({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartTooltip }: CreateParams) {
    const pointsGroup = chartGroup.append('g').attr('class', 'points-group');

    seriesData.forEach(series => {
        const sanitizedSeriesName = series.name.replace(/\s+/g, '-');

        const points = pointsGroup.selectAll(`.point-${sanitizedSeriesName}`)
            .data(series.data)
            .enter()
            .append('circle')
            .attr('class', `point-${sanitizedSeriesName}`)
            .attr('cx', d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
            .attr('cy', d => valueScale(d.value))
            .attr('r', 4)
            .attr('fill', colorScale(series.name));

        // Apply tooltip handler to points
        createTooltipHandler(chartTooltip, points);
    });
}

function checkIfFeatureExists(features: Feature[], feature: string) {
    return features.some(f => f.feature === feature);
}

function conditionallyRenderFeature(feature: string, fn: Function, features: Feature[], createParameters: CreateParams) {
    checkIfFeatureExists(features, feature) && fn(createParameters);
}

const featuresMap = {
    'grid': createGrid,
    'axis': createAxis,
    'area': createArea,
    'bar': createBars,
    'line': createLine,
    'point': createPoints
}

function createFeatures(createParameters: CreateParams, features: Feature[]) {
    Object.keys(featuresMap).forEach(feature => {
        conditionallyRenderFeature(feature, featuresMap[feature], features, createParameters);
    });
}


// Main chart function
export function createLineChart(
    container: HTMLElement,
    seriesData: SeriesData[],
    width: number = 500,
    height: number = 300,
    features: { feature: string }[]  // Add the features array to control what is shown
) {
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    d3.select(container).selectAll("*").remove();

    if (seriesData.length === 0 || seriesData[0].data.length === 0) {
        console.warn("No data available for the chart.");
        return;
    }

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const chartGroup = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const dateScale = d3.scaleBand<Date>()
        .domain(seriesData[0].data.map(d => d.date))
        .range([0, chartWidth])
        .padding(0.1);

    const valueScale = d3.scaleLinear()
        .domain([0, d3.max(seriesData.flatMap(series => series.data), d => d.value) as number])
        .range([chartHeight, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(seriesData.map(d => d.name));

    const area = d3.area<DataPoint>()
        .x(d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
        .y0(chartHeight)
        .y1(d => valueScale(d.value));

    const line = d3.line<DataPoint>()
        .x(d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
        .y(d => valueScale(d.value));

    // Explicitly create the tooltip div and cast it as HTMLDivElement
    const showTooltip = features.some(feature => feature.feature === 'tooltip')
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

    createFeatures(createParameters, features)
}
