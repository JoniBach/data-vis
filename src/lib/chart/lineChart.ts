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
    chartTooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    chartHeight: number;
    chartWidth: number;
}

function createTooltip(container: HTMLElement): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
    return d3.select(container)
        .append("div")
        .attr("class", "tooltip")  // You can add a class for CSS styling if needed
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#f9f9f9")
        .style("border", "1px solid #d3d3d3")
        .style("padding", "5px");
}


// Function to create lines
function createLine({ seriesData, chartGroup, colorScale, dateScale, valueScale, line }: CreateParams) {
    const linesGroup = chartGroup.append('g').attr('class', 'lines-group');

    seriesData.forEach(series => {
        linesGroup.append('path')
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

        barsGroup.selectAll(`.bar-${sanitizedSeriesName}`)
            .data(series.data)
            .enter()
            .append('rect')
            .attr('class', `bar-${sanitizedSeriesName}`)
            .attr('x', d => (dateScale(d.date) || 0) + seriesScale(series.name)!)
            .attr('y', d => valueScale(d.value))
            .attr('width', seriesScale.bandwidth())
            .attr('height', d => chartHeight - valueScale(d.value))
            .attr('fill', colorScale(series.name))
            .attr('fill-opacity', 0.5)
            .on('mouseover', (event, d) => {
                chartTooltip.style("visibility", "visible")
                    .html(`Date: ${d3.timeFormat("%b %Y")(d.date)}<br>Value: ${d.value}`);
            })
            .on('mousemove', (event) => {
                chartTooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on('mouseout', () => chartTooltip.style("visibility", "hidden"));
    });
}

// Function to create points
function createPoints({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartTooltip }: CreateParams) {
    const pointsGroup = chartGroup.append('g').attr('class', 'points-group');

    seriesData.forEach(series => {
        const sanitizedSeriesName = series.name.replace(/\s+/g, '-');

        pointsGroup.selectAll(`.point-${sanitizedSeriesName}`)
            .data(series.data)
            .enter()
            .append('circle')
            .attr('class', `point-${sanitizedSeriesName}`)
            .attr('cx', d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
            .attr('cy', d => valueScale(d.value))
            .attr('r', 4)
            .attr('fill', colorScale(series.name))
            .on('mouseover', (event, d) => {
                chartTooltip.style("visibility", "visible")
                    .html(`Date: ${d3.timeFormat("%b %Y")(d.date)}<br>Value: ${d.value}`);
            })
            .on('mousemove', (event) => {
                chartTooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on('mouseout', () => chartTooltip.style("visibility", "hidden"));
    });
}

// Main chart function
export function createLineChart(
    container: HTMLElement,
    seriesData: SeriesData[],
    width: number = 500,
    height: number = 300
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

    chartGroup.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(dateScale).tickFormat(d3.timeFormat("%b %Y")));

    chartGroup.append('g').call(d3.axisLeft(valueScale));

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
    const chartTooltip = createTooltip(container);


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

    // Call the functions with the createParameters object
    createArea(createParameters);
    createBars(createParameters);
    createLine(createParameters);
    createPoints(createParameters);
}
