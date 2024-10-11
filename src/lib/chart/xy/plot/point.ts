// point.ts

import * as d3 from 'd3';
import { attachTooltipHandlers } from './canvas.js';
import type { CreateParams } from './types.js';

type ChartType = 'line' | 'area';

export const createArea = (props: CreateParams, config?: any) =>
	createLineOrArea('area', props, config);

export const createLine = (props: CreateParams, config?: any) =>
	createLineOrArea('line', props, config);

// Function to create line or area charts
function createLineOrArea(type: ChartType, props: CreateParams, config?: any): void {
	const { seriesData, chartGroup, colorScale, scales, dataKeys, chartHeight } = props;
	const xScale = scales['x'];
	const yScale = scales['y'];

	// Extract coordinate keys
	const xKey = dataKeys.coordinates['x'];
	const yKey = dataKeys.coordinates['y'];

	// Ensure that the chart group, scales, and data are available
	if (!chartGroup || !xScale || !yScale) {
		console.error('Missing required elements (chartGroup, xScale, yScale) to create chart.');
		return;
	}

	// Create line or area generator based on the type
	const generator =
		type === 'line'
			? d3
					.line<any>()
					.defined((d) => d[yKey] !== null && d[yKey] !== undefined && !isNaN(yScale(d[yKey])))
					.x((d) => xScale(d[xKey]))
					.y((d) => yScale(d[yKey]))
			: d3
					.area<any>()
					.defined((d) => d[yKey] !== null && d[yKey] !== undefined && !isNaN(yScale(d[yKey])))
					.x((d) => xScale(d[xKey]))
					.y1((d) => yScale(d[yKey]))
					.y0(chartHeight);

	const group = chartGroup.append('g').attr('class', `${type}-group`);

	// Append path for each series
	seriesData.forEach((series) => {
		// Sort the data by the xKey
		const sortedData = series[dataKeys.data]
			.filter((d: any) => d[xKey] !== null && d[yKey] !== null && !isNaN(yScale(d[yKey])))
			.sort((a: any, b: any) => d3.ascending(a[xKey], b[xKey]));

		group
			.append('path')
			.datum(sortedData)
			.attr('fill', type === 'area' ? colorScale(series[dataKeys.name]) : 'none')
			.attr('stroke', type === 'line' ? colorScale(series[dataKeys.name]) : undefined)
			.attr('fill-opacity', type === 'area' ? 0.4 : 1)
			.attr('d', generator)
			.attr('stroke-width', type === 'line' ? 2 : 0);
	});
}

// Function to create points (scatter plots)
export function createPoints(props: CreateParams, config?: any): void {
	const { seriesData, chartGroup, colorScale, scales, chartTooltip, dataKeys } = props;
	const xScale = scales['x'];
	const yScale = scales['y'];

	// Extract coordinate keys
	const xKey = dataKeys.coordinates['x'];
	const yKey = dataKeys.coordinates['y'];

	const pointsGroup = chartGroup.append('g').attr('class', 'points-group');
	seriesData.forEach((series) => {
		pointsGroup
			.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
			.data(
				series[dataKeys.data].filter(
					(d: any) => d[xKey] !== null && d[yKey] !== null && !isNaN(yScale(d[yKey]))
				)
			)
			.join(
				(enter) =>
					enter
						.append('circle')
						.attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
						.attr('cx', (d: any) => xScale(d[xKey]))
						.attr('cy', (d: any) => yScale(d[yKey]))
						.attr('r', 4)
						.attr('fill', colorScale(series[dataKeys.name]))
						.call((selection) => attachTooltipHandlers({ selection, chartTooltip, dataKeys })),
				(update) =>
					update.attr('cx', (d: any) => xScale(d[xKey])).attr('cy', (d: any) => yScale(d[yKey])),
				(exit) => exit.remove()
			);
	});
}

// Function to create bubbles (bubble charts)
export function createBubbles(props: CreateParams, config?: LineOrAreaConfig): void {
	const {
		seriesData,
		chartGroup,
		colorScale,
		scales,
		chartTooltip,
		dataKeys,
		chartHeight,
		chartWidth
	} = props;

	const xScale = scales['x'];
	const yScale = scales['y'];

	// Extract coordinate keys
	const xKey = dataKeys.coordinates['x'];
	const yKey = dataKeys.coordinates['y'];
	const magnitudeKey = dataKeys.magnitude;

	const minRadius = config?.minRadius ?? 5;
	const maxRadius = config?.maxRadius ?? 20;

	const radiusScale = d3
		.scaleSqrt()
		.domain([
			d3.min(seriesData, (series) => d3.min(series[dataKeys.data], (d: any) => d[magnitudeKey])) ||
				0,
			d3.max(seriesData, (series) => d3.max(series[dataKeys.data], (d: any) => d[magnitudeKey])) ||
				1
		])
		.range([minRadius, maxRadius]);

	chartGroup
		.append('defs')
		.append('clipPath')
		.attr('id', 'clip')
		.append('rect')
		.attr('width', chartWidth)
		.attr('height', chartHeight)
		.attr('x', 0)
		.attr('y', 0);

	const bubblesGroup = chartGroup
		.append('g')
		.attr('class', 'bubbles-group')
		.attr('clip-path', 'url(#clip)');

	seriesData.forEach((series) => {
		bubblesGroup
			.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
			.data(
				series[dataKeys.data].filter(
					(d: any) => d[xKey] !== null && d[yKey] !== null && !isNaN(yScale(d[yKey]))
				)
			)
			.join(
				(enter) =>
					enter
						.append('circle')
						.attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
						.attr('cx', (d: any) => xScale(d[xKey]))
						.attr('cy', (d: any) => yScale(d[yKey]))
						.attr('r', (d: any) => radiusScale(d[magnitudeKey]))
						.attr('fill', colorScale(series[dataKeys.name]))
						.attr('fill-opacity', 0.7)
						.call((selection) => attachTooltipHandlers({ selection, chartTooltip, dataKeys })),
				(update) =>
					update
						.attr('cx', (d: any) => xScale(d[xKey]))
						.attr('cy', (d: any) => yScale(d[yKey]))
						.attr('r', (d: any) => radiusScale(d[magnitudeKey])),
				(exit) => exit.remove()
			);
	});
}
