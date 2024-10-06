import type { DataPoint } from '$lib/chart/generateXyChart.js';
import { eventSystem } from '../utils/event.js';
import * as d3 from 'd3';
import type { CreateParams } from '../utils/types.js';

// DRY: Utility function to compute X position for both line/area and bubbles
const computeXPosition = (d: DataPoint, dataKeys: DataKeys, xScale: any, dateScale: any) => {
    const xValue = d[dataKeys.xKey];

    // Determine the type of xKey (Date, number, or string) and use the correct scale
    if (xValue instanceof Date) {
        return dateScale ? dateScale(xValue) : xScale(xValue.getTime()) + xScale.bandwidth() / 2;
    } else if (typeof xValue === 'number') {
        return xScale(xValue);
    } else if (typeof xValue === 'string') {
        return xScale(xValue) + xScale.bandwidth() / 2;
    } else {
        throw new Error('Unsupported xKey type. Only Date, number, or string are supported.');
    }
};

// DRY: Utility function to append tooltip handlers
const addTooltipHandlers = (selection: any, chartTooltip: any, dataKeys: DataKeys) => {
    selection.on('mouseover', function (event, d) {
        // Trigger tooltip with correct data point 'd'
        eventSystem.trigger('tooltip', chartTooltip, d, dataKeys);
    })
        .on('mousemove', function (event) {
            eventSystem.trigger('tooltipMove', chartTooltip, event);
        })
        .on('mouseout', function () {
            eventSystem.trigger('tooltipHide', chartTooltip);
        });
};

// Optimized: Create line or area generator
export function createLineOrArea(type: 'line' | 'area', params: CreateParams) {
    const { seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, dataKeys, chartHeight } = params;

    if (!chartGroup || (!dateScale && !xScale) || !valueScale) {
        console.error("Missing required elements (chartGroup, dateScale/xScale, valueScale) to create chart.");
        return;
    }

    const generator = type === 'line'
        ? d3.line<DataPoint>().x(d => computeXPosition(d, dataKeys, xScale, dateScale)).y(d => valueScale(d[dataKeys.yKey]))
        : d3.area<DataPoint>().x(d => computeXPosition(d, dataKeys, xScale, dateScale)).y1(d => valueScale(d[dataKeys.yKey])).y0(chartHeight);

    const group = chartGroup.append('g').attr('class', `${type}-group`);

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

// Optimized: Create points with tooltip handlers
export function createPoints(params: CreateParams) {
    const { seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, chartTooltip, dataKeys } = params;

    const pointsGroup = chartGroup.append('g').attr('class', 'points-group');
    seriesData.forEach(series => {
        const circles = pointsGroup.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data])
            .enter()
            .append('circle')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('cx', d => computeXPosition(d, dataKeys, xScale, dateScale))
            .attr('cy', d => valueScale(d[dataKeys.yKey]))
            .attr('r', 4)
            .attr('fill', colorScale(series[dataKeys.name]));

        addTooltipHandlers(circles, chartTooltip, dataKeys);
    });
}

// Optimized: Create bubbles with tooltip handlers and clipping path
export function createBubbles(params: CreateParams, config: { minRadius?: number, maxRadius?: number } = {}) {
    const { seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, chartTooltip, dataKeys, chartHeight, chartWidth } = params;
    const minRadius = config.minRadius ?? 5;
    const maxRadius = config.maxRadius ?? 20;

    const radiusScale = d3.scaleSqrt()
        .domain([
            d3.min(seriesData, series => d3.min(series[dataKeys.data], d => d[dataKeys.yKey])) || 0,
            d3.max(seriesData, series => d3.max(series[dataKeys.data], d => d[dataKeys.yKey])) || 1
        ])
        .range([minRadius, maxRadius]);

    chartGroup.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    const bubblesGroup = chartGroup.append('g')
        .attr('class', 'bubbles-group')
        .attr("clip-path", "url(#clip)");

    seriesData.forEach(series => {
        const bubbles = bubblesGroup.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data])
            .enter()
            .append('circle')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('cx', d => computeXPosition(d, dataKeys, xScale, dateScale))
            .attr('cy', d => valueScale(d[dataKeys.yKey]))
            .attr('r', d => radiusScale(d[dataKeys.yKey]))
            .attr('fill', colorScale(series[dataKeys.name]))
            .attr('fill-opacity', 0.7);

        addTooltipHandlers(bubbles, chartTooltip, dataKeys);
    });
}
