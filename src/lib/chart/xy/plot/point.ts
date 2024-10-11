// point.ts

import * as d3 from 'd3';
import { attachTooltipHandlers } from './canvas.js';
import type { CreateParams } from './types.js';

type ChartType = 'line' | 'area';

export const createArea = (props: CreateParams, config?: unknown) =>
	createLineOrArea('area', props, config);

export const createLine = (props: CreateParams, config?: unknown) =>
	createLineOrArea('line', props, config);

// Function to create line or area charts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createLineOrArea(type: ChartType, props: CreateParams, config?: unknown): void {
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
					.line<unknown>()
					.defined((d) => d[yKey] !== null && d[yKey] !== undefined && !isNaN(yScale(d[yKey])))
					.x((d) => xScale(d[xKey]))
					.y((d) => yScale(d[yKey]))
			: d3
					.area<unknown>()
					.defined((d) => d[yKey] !== null && d[yKey] !== undefined && !isNaN(yScale(d[yKey])))
					.x((d) => xScale(d[xKey]))
					.y1((d) => yScale(d[yKey]))
					.y0(chartHeight);

	const group = chartGroup.append('g').attr('class', `${type}-group`);

	// Append path for each series
	seriesData.forEach((series) => {
		// Sort the data by the xKey
		const sortedData = series[dataKeys.data]
			.filter((d: unknown) => d[xKey] !== null && d[yKey] !== null && !isNaN(yScale(d[yKey])))
			.sort((a: unknown, b: unknown) => d3.ascending(a[xKey], b[xKey]));

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createPoints(props: CreateParams, config?: unknown): void {
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
					(d: unknown) => d[xKey] !== null && d[yKey] !== null && !isNaN(yScale(d[yKey]))
				)
			)
			.join(
				(enter) =>
					enter
						.append('circle')
						.attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
						.attr('cx', (d: unknown) => xScale(d[xKey]))
						.attr('cy', (d: unknown) => yScale(d[yKey]))
						.attr('r', 4)
						.attr('fill', colorScale(series[dataKeys.name]))
						.call((selection) => attachTooltipHandlers({ selection, chartTooltip, dataKeys })),
				(update) =>
					update
						.attr('cx', (d: unknown) => xScale(d[xKey]))
						.attr('cy', (d: unknown) => yScale(d[yKey])),
				(exit) => exit.remove()
			);
	});
}

// Function to create bubbles (bubble charts)
interface BubbleConfig {
	minRadius?: number;
	maxRadius?: number;
}

export function createBubbles(props: CreateParams, config?: BubbleConfig): void {
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
			d3.min(seriesData, (series) =>
				d3.min(series[dataKeys.data], (d: { [key: string]: number }) => d[magnitudeKey])
			) || 0,
			d3.max(seriesData, (series) =>
				d3.max(series[dataKeys.data], (d: { [key: string]: number }) => d[magnitudeKey])
			) || 1
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
					(d: unknown) => d[xKey] !== null && d[yKey] !== null && !isNaN(yScale(d[yKey]))
				)
			)
			.join(
				(enter) =>
					enter
						.append('circle')
						.attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
						.attr('cx', (d: unknown) => xScale(d[xKey]))
						.attr('cy', (d: unknown) => yScale(d[yKey]))
						.attr('r', (d: unknown) => radiusScale(d[magnitudeKey]))
						.attr('fill', colorScale(series[dataKeys.name]))
						.attr('fill-opacity', 0.7)
						.call((selection) => attachTooltipHandlers({ selection, chartTooltip, dataKeys })),
				(update) =>
					update
						.attr('cx', (d: unknown) => xScale(d[xKey]))
						.attr('cy', (d: unknown) => yScale(d[yKey]))
						.attr('r', (d: unknown) => radiusScale(d[magnitudeKey])),
				(exit) => exit.remove()
			);
	});
}
