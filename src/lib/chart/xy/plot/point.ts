import type { DataPoint } from '$lib/chart/generateXyChart.js';
import { eventSystem } from '../utils/event.js';
import * as d3 from 'd3';
import type { CreateParams } from '../utils/types.js';

export function createLineOrArea(type: 'line' | 'area', params: CreateParams) {
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

export function createPoints({ seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, chartTooltip, dataKeys }: CreateParams) {
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


export function createBubbles(params: CreateParams, config: { minRadius?: number, maxRadius?: number } = {}) {
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