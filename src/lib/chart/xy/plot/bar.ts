import type { SeriesData, DataKeys } from '$lib/chart/generateXyChart.js';
import * as d3 from 'd3';
import { attachTooltipHandlers } from './canvas.js';
import type { CreateParams } from '../utils/types.js';
import { validateInput } from '../utils/validator.js';
export function createBarsVariant(type: 'grouped' | 'stacked' | 'overlapped' | 'error', params: CreateParams, config: { fillOpacity?: number } = {}) {
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

    if (type === 'stacked') {
        createStackedBars(seriesData, barsGroup, params, fillOpacity, dataKeys, chartHeight);
    } else if (type === 'error') {
        createErrorBars(seriesData, barsGroup, params, fillOpacity, dataKeys, chartHeight);
    } else {
        createNonStackedBars(type, seriesData, barsGroup, params, fillOpacity, dataKeys, chartHeight);
    }
}

export function createErrorBars(seriesData: any[], barsGroup: any, params: CreateParams, fillOpacity: number, dataKeys: any, chartHeight: number) {
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

export function createStackedBars(seriesData: any[], barsGroup: any, params: CreateParams, fillOpacity: number, dataKeys: any, chartHeight: number) {
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

// export Function to create grouped or overlapped bars
export function createNonStackedBars(type: 'grouped' | 'overlapped', seriesData: any[], barsGroup: any, params: CreateParams, fillOpacity: number, dataKeys: any, chartHeight: number) {
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

// General export function to create a bar with tooltip
export function createBar(selection: d3.Selection<SVGRectElement, any, SVGGElement, any>, d: any, x: number, y: number, height: number, width: number, fillColor: string, fillOpacity: number, chartTooltip: any, dataKeys: any) {
    selection.attr('x', x)
        .attr('y', y)
        .attr('height', height)
        .attr('width', width)
        .attr('fill', fillColor)
        .attr('fill-opacity', fillOpacity);
    attachTooltipHandlers(selection, chartTooltip, dataKeys);
}

export function prepareStackedData(seriesData: SeriesData[], dataKeys: DataKeys) {
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
