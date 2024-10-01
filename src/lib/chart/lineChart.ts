import * as d3 from 'd3';

// Define the structure of the data points
interface DataPoint {
    date: Date;
    value: number;
}

export function createLineChart(
    container: HTMLElement,
    data: DataPoint[],
    width: number = 500,
    height: number = 300
) {
    // Set the margins
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear the container before drawing a new chart
    d3.select(container).selectAll("*").remove();

    // Create an SVG container
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create a group to position the chart inside the margins
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define the x and y scales
    const x = d3.scaleBand<DataPoint['date']>()
        .domain(data.map(d => d.date))
        .range([0, innerWidth])
        .padding(0.2);  // Add some padding between the bars

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) as number])
        .range([innerHeight, 0]);

    // Create the axes
    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")));  // Format the date labels

    g.append('g')
        .call(d3.axisLeft(y));


    // Create the area generator
    const area = d3.area<DataPoint>()
        .x(d => (x(d.date) || 0) + x.bandwidth() / 2)  // Use the middle of the bar for x
        .y0(innerHeight)  // Bottom of the area (x-axis)
        .y1(d => y(d.value));  // Top of the area (line)

    // Append the shaded area
    g.append('path')
        .datum(data)
        .attr('fill', 'lightsteelblue')
        .attr('d', area);

    // Create the line generator
    const line = d3.line<DataPoint>()
        .x(d => (x(d.date) || 0) + x.bandwidth() / 2)  // Use the middle of the bar for x
        .y(d => y(d.value));

    // Append the path (the line itself)
    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', line);

    // Add points (circles) at each data point
    g.selectAll('.point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('cx', d => (x(d.date) || 0) + x.bandwidth() / 2)  // Center the point on the bar
        .attr('cy', d => y(d.value))  // y position
        .attr('r', 4)  // radius of the circle
        .attr('fill', 'steelblue');  // color of the circle

    // Add bars to the chart (bars behind the line and area)
    g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.date)!)  // x position of the bar
        .attr('y', d => y(d.value))  // y position (top of the bar)
        .attr('width', x.bandwidth())  // width of the bar
        .attr('height', d => innerHeight - y(d.value))  // height of the bar
        .attr('fill', 'lightgray');  // bar color

}
