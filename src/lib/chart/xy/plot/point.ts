import type { DataPoint } from '$lib/chart/generateXyChart.js';
import { eventSystem } from '../utils/event.js';
import * as d3 from 'd3';
import type { CreateParams } from '../utils/types.js';
import { attachTooltipHandlers } from './canvas.js';

export function createLineOrArea(type: 'line' | 'area', params: CreateParams) {
    const { seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, dataKeys, chartHeight } = params;

    // Ensure that the chart group, scales, and data are available
    if (!chartGroup || (!dateScale && !xScale) || !valueScale) {
        console.error("Missing required elements (chartGroup, dateScale/xScale, valueScale) to create chart.");
        return;
    }

    // Determine how to compute x position based on the type of scale (Date, number, or string)
    const computeXPosition = (d: DataPoint) => {
        const xValue = d[dataKeys.xKey];
        let computedX;
        if (xScale) {
            computedX = xScale.bandwidth ? xScale(xValue)! + xScale.bandwidth() / 2 : xScale(xValue);
        } else {
            computedX = dateScale!(xValue);
        }
        // Debug: Log if computedX is invalid
        if (isNaN(computedX)) {
            console.warn("Invalid x value detected:", xValue, computedX);
        }
        return computedX;
    };

    const computeYPosition = (d: DataPoint) => {
        const yValue = d[dataKeys.yKey];
        const computedY = valueScale(yValue);
        // Debug: Log if computedY is invalid
        if (isNaN(computedY)) {
            console.warn("Invalid y value detected:", yValue, computedY);
        }
        return computedY;
    };

    // Create line or area generator based on the type
    const generator = type === 'line'
        ? d3.line<DataPoint>()
            .defined(d => d[dataKeys.yKey] !== null && d[dataKeys.yKey] !== undefined && !isNaN(valueScale(d[dataKeys.yKey]))) // Ignore invalid points
            .x(computeXPosition)
            .y(computeYPosition)
        : d3.area<DataPoint>()
            .defined(d => d[dataKeys.yKey] !== null && d[dataKeys.yKey] !== undefined && !isNaN(valueScale(d[dataKeys.yKey]))) // Ignore invalid points
            .x(computeXPosition)
            .y1(computeYPosition)
            .y0(chartHeight);

    const group = chartGroup.append('g').attr('class', `${type}-group`);

    // Append path for each series
    seriesData.forEach(series => {
        group.append('path')
            .datum(series[dataKeys.data].filter(d => d[dataKeys.xKey] !== null && d[dataKeys.yKey] !== null && !isNaN(valueScale(d[dataKeys.yKey])))) // Filter out invalid data points
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
            .data(series[dataKeys.data].filter(d => d[dataKeys.xKey] !== null && d[dataKeys.yKey] !== null && !isNaN(valueScale(d[dataKeys.yKey])))) // Filter out invalid data points
            .join(
                enter => enter.append('circle')
                    .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
                    .attr('cx', d => {
                        const xValue = d[dataKeys.xKey];
                        const computedX = xScale
                            ? xScale.bandwidth
                                ? xScale(xValue)! + xScale.bandwidth() / 2
                                : xScale(xValue)
                            : dateScale!(xValue);
                        return isNaN(computedX) ? 0 : computedX; // Set to 0 if invalid
                    })
                    .attr('cy', d => {
                        const computedY = valueScale(d[dataKeys.yKey]);
                        return isNaN(computedY) ? chartHeight : computedY; // Set to chartHeight if invalid
                    })
                    .attr('r', 4)
                    .attr('fill', colorScale(series[dataKeys.name]))
                    .on('mouseover', (event, d) => {
                        eventSystem.trigger('tooltip', chartTooltip, d, dataKeys);
                    })
                    .on('mousemove', (event) => {
                        eventSystem.trigger('tooltipMove', chartTooltip, event);
                    })
                    .on('mouseout', () => {
                        eventSystem.trigger('tooltipHide', chartTooltip);
                    }),
                update => update
                    .attr('cx', d => {
                        const xValue = d[dataKeys.xKey];
                        const computedX = xScale
                            ? xScale.bandwidth
                                ? xScale(xValue)! + xScale.bandwidth() / 2
                                : xScale(xValue)
                            : dateScale!(xValue);
                        return isNaN(computedX) ? 0 : computedX; // Set to 0 if invalid
                    })
                    .attr('cy', d => {
                        const computedY = valueScale(d[dataKeys.yKey]);
                        return isNaN(computedY) ? chartHeight : computedY; // Set to chartHeight if invalid
                    }),
                exit => exit.remove() // Remove points that no longer have data
            );
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

    chartGroup.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("x", 0)
        .attr("y", 0);

    const bubblesGroup = chartGroup.append('g')
        .attr('class', 'bubbles-group')
        .attr("clip-path", "url(#clip)");

    seriesData.forEach(series => {
        const bubbles = bubblesGroup.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data].filter(d => d[dataKeys.xKey] !== null && d[dataKeys.yKey] !== null && !isNaN(valueScale(d[dataKeys.yKey])))) // Filter out invalid data points
            .enter()
            .append('circle')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('cx', d => {
                const xValue = d[dataKeys.xKey];
                const computedX = xScale
                    ? xScale.bandwidth
                        ? xScale(xValue)! + xScale.bandwidth() / 2
                        : xScale(xValue)
                    : dateScale!(xValue);
                return isNaN(computedX) ? 0 : computedX; // Set to 0 if invalid
            })
            .attr('cy', d => {
                const computedY = valueScale(d[dataKeys.yKey]);
                return isNaN(computedY) ? chartHeight : computedY; // Set to chartHeight if invalid
            })
            .attr('r', d => radiusScale(d[dataKeys.yKey]))
            .attr('fill', colorScale(series[dataKeys.name]))
            .attr('fill-opacity', 0.7);

        attachTooltipHandlers(bubbles, chartTooltip, dataKeys);

    });
}