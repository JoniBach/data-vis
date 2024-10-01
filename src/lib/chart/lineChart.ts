
export interface DataPoint {
    date: Date;
    value: number;
}

export interface SeriesData {
    name: string;      // Name of the series
    data: DataPoint[]; // Data points for the series
}
import * as d3 from 'd3';
export function createLineChart(
    container: HTMLElement,
    data: SeriesData[],
    width: number = 500,
    height: number = 300
) {
    // Set the margins
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear the container before drawing a new chart
    d3.select(container).selectAll("*").remove();

    // Ensure data is available and valid
    if (data.length === 0 || data[0].data.length === 0) {
        console.warn("No data available for the chart.");
        return;
    }

    // Create an SVG container
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create a group to position the chart inside the margins
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define the x scale (band scale for dates)
    const x0 = d3.scaleBand<Date>()
        .domain(data[0].data.map(d => d.date))
        .range([0, innerWidth])
        .padding(0.1);

    // Define the x1 scale (band scale for the different series within each date)
    const x1 = d3.scaleBand<string>()
        .domain(data.map(d => d.name))
        .range([0, x0.bandwidth()])
        .padding(0.05);

    // Define the y scale (linear scale for the values)
    const y = d3.scaleLinear()
        .domain([0, d3.max(data.flatMap(series => series.data), d => d.value) as number])
        .range([innerHeight, 0]);

    // Create the axes
    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x0).tickFormat(d3.timeFormat("%b %Y")));  // Format the date labels

    g.append('g')
        .call(d3.axisLeft(y));

    // Define colors for the series
    const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(data.map(d => d.name));

    // Create the area and line generators for each series
    const area = d3.area<DataPoint>()
        .x(d => (x0(d.date) || 0) + x0.bandwidth() / 2)
        .y0(innerHeight)
        .y1(d => y(d.value));

    const line = d3.line<DataPoint>()
        .x(d => (x0(d.date) || 0) + x0.bandwidth() / 2)
        .y(d => y(d.value));

    // Tooltip for interaction
    const tooltip = d3.select(container)
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#f9f9f9")
        .style("border", "1px solid #d3d3d3")
        .style("padding", "5px");

    // Append bars for each series first to render them behind the lines and areas
    data.forEach(series => {
        const sanitizedSeriesName = series.name.replace(/\s+/g, '-'); // Replace spaces with hyphens

        g.selectAll(`.bar-${sanitizedSeriesName}`)
            .data(series.data)
            .enter()
            .append('rect')
            .attr('class', `bar-${sanitizedSeriesName}`)
            .attr('x', d => (x0(d.date) || 0) + x1(series.name)!)  // Position based on series
            .attr('y', d => y(d.value))
            .attr('width', x1.bandwidth())  // Narrower width for side-by-side bars
            .attr('height', d => innerHeight - y(d.value))
            .attr('fill', color(series.name))
            .attr('fill-opacity', 0.5)  // Transparent bars
            .on('mouseover', (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`Date: ${d3.timeFormat("%b %Y")(d.date)}<br>Value: ${d.value}`);
            })
            .on('mousemove', (event) => {
                tooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on('mouseout', () => tooltip.style("visibility", "hidden"));
    });

    // Append the series (lines, areas, and points)
    data.forEach(series => {
        const sanitizedSeriesName = series.name.replace(/\s+/g, '-'); // Sanitize class name

        // Append the shaded area
        g.append('path')
            .datum(series.data)
            .attr('fill', color(series.name))
            .attr('fill-opacity', 0.2)  // Apply transparency
            .attr('d', area);

        // Append the line
        g.append('path')
            .datum(series.data)
            .attr('fill', 'none')
            .attr('stroke', color(series.name))
            .attr('stroke-width', 2)
            .attr('d', line);

        // Append points at each data point
        g.selectAll(`.point-${sanitizedSeriesName}`)
            .data(series.data)
            .enter()
            .append('circle')
            .attr('class', `point-${sanitizedSeriesName}`)
            .attr('cx', d => (x0(d.date) || 0) + x0.bandwidth() / 2)
            .attr('cy', d => y(d.value))
            .attr('r', 4)
            .attr('fill', color(series.name))
            .on('mouseover', (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`Date: ${d3.timeFormat("%b %Y")(d.date)}<br>Value: ${d.value}`);
            })
            .on('mousemove', (event) => {
                tooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on('mouseout', () => tooltip.style("visibility", "hidden"));
    });
}
