// bar.ts

import * as d3 from 'd3';
import { attachTooltipHandlers } from './canvas.js';
import type { CreateParams, DataKeys, Series } from './types.js';

interface BarConfig {
	variant?: 'grouped' | 'stacked' | 'overlapped' | 'error';
	fillOpacity?: number;
}

interface CreateBarsProps {
	params: CreateParams;
	config: BarConfig;
}

export const createBars = (params: CreateParams, config: BarConfig) =>
	createBarsVariant({
		params,
		config
	});

// Helper function to create clipping path
function createClippingPath(props: {
	chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	chartWidth: number;
	chartHeight: number;
}): void {
	const { chartGroup, chartWidth, chartHeight } = props;

	chartGroup
		.append('defs')
		.append('clipPath')
		.attr('id', 'clip')
		.append('rect')
		.attr('width', chartWidth)
		.attr('height', chartHeight)
		.attr('x', 0)
		.attr('y', 0);
}

// Main function to create bars (grouped, stacked, overlapped, or error bars)
function createBarsVariant(props: CreateBarsProps): void {
	const { params, config } = props;
	const { seriesData, chartGroup, chartHeight, chartWidth, dataKeys } = params;

	const type = config?.variant || 'grouped';

	// Extract coordinate keys
	const xKey = dataKeys.coordinates['x'];
	const yKey = dataKeys.coordinates['y'];

	// Add clipping path to prevent overflow
	createClippingPath({ chartGroup, chartWidth, chartHeight });

	const barsGroup = chartGroup
		.append('g')
		.attr('class', 'bars-group')
		.attr('clip-path', 'url(#clip)');
	const fillOpacity = config.fillOpacity ?? 0.5;

	switch (type) {
		case 'stacked':
			createStackedBars({
				seriesData: seriesData,
				barsGroup,
				params,
				fillOpacity,
				dataKeys,
				chartHeight,
				xKey,
				yKey
			});
			break;
		case 'error':
			createErrorBars({
				seriesData: seriesData,
				barsGroup,
				params,
				fillOpacity,
				dataKeys,
				chartHeight,
				xKey,
				yKey
			});
			break;
		default:
			createNonStackedBars({
				type,
				seriesData: seriesData,
				barsGroup,
				params,
				fillOpacity,
				dataKeys,
				chartHeight,
				xKey,
				yKey
			});
			break;
	}
}

// Function to create error bars
function createErrorBars(props: {
	seriesData: Series[];
	barsGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	params: CreateParams;
	fillOpacity: number;
	dataKeys: DataKeys;
	chartHeight: number;
	xKey: string;
	yKey: string;
}): void {
	const { seriesData, barsGroup, params, fillOpacity, dataKeys, chartHeight, xKey, yKey } = props;
	const { scales, colorScale } = params;
	const xScale = scales['x'];
	const yScale = scales['y'];

	try {
		// Define seriesScale if xScale is not scaleBand
		let seriesScale = null;

		if (!xScale.bandwidth) {
			// For numeric or date x-axis, calculate the group width
			const uniqueXValues = [
				...new Set(seriesData.flatMap((series) => series[dataKeys.data].map((d) => d[xKey])))
			];
			const groupWidth = Math.min(xScale(uniqueXValues[1]) - xScale(uniqueXValues[0]), 50); // Cap width for clarity

			// Create seriesScale to distribute space among series within each x value
			seriesScale = d3
				.scaleBand<string>()
				.domain(seriesData.map((d) => d[dataKeys.name]))
				.range([0, groupWidth])
				.padding(0.2);
		} else {
			// For categorical x-axis (e.g., strings)
			seriesScale = d3
				.scaleBand<string>()
				.domain(seriesData.map((d) => d[dataKeys.name]))
				.range([0, xScale.bandwidth()])
				.padding(0.05);
		}

		// Magnitude key for error
		const magnitudeKey = dataKeys.magnitude;

		const magnitudeScale = d3
			.scaleLinear()
			.domain([
				d3.min(seriesData, (series) => d3.min(series[dataKeys.data], (d) => +d[magnitudeKey])) || 0,
				d3.max(seriesData, (series) => d3.max(series[dataKeys.data], (d) => +d[magnitudeKey])) || 1
			])
			.range([0, chartHeight * 0.2]);

		seriesData.forEach((series) => {
			const bars = barsGroup
				.selectAll(`rect.${series[dataKeys.name].replace(/\s+/g, '-')}`)
				.data(series[dataKeys.data])
				.enter()
				.append('rect');

			bars.each((d, i, nodes) => {
				const bar = d3.select(nodes[i]);
				const xValue = d[xKey];
				const xPos =
					getXPosition({ xScale, xValue }) + (seriesScale ? seriesScale(series[dataKeys.name]) : 0);
				const yPos = yScale(d[yKey]);
				const height = chartHeight - yScale(d[yKey]);
				const width = seriesScale ? seriesScale.bandwidth() : 10; // Fallback width

				// Only create bar if width and height are valid
				if (width > 0 && height > 0) {
					const fillColor = colorScale(series[dataKeys.name]);

					createBar({
						selection: bar,
						d,
						x: xPos,
						y: yPos,
						height,
						width,
						fillColor,
						fillOpacity,
						chartTooltip: params.chartTooltip,
						dataKeys
					});

					// Adding error bars at the same x position, with consideration of the series scale
					addErrorBars({
						barsGroup,
						xPos,
						width,
						yPos,
						errorMagnitude: magnitudeScale(d[magnitudeKey])
					});
				}
			});
		});
	} catch (error) {
		console.error('Error generating error bars:', error);
	}
}

// Helper function to add error bars (lines and caps)
function addErrorBars(props: {
	barsGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	xPos: number;
	width: number;
	yPos: number;
	errorMagnitude: number;
}): void {
	const { barsGroup, xPos, width, yPos, errorMagnitude } = props;
	const errorLineGroup = barsGroup.append('g').attr('class', 'error-bars-group');

	// Vertical line
	errorLineGroup
		.append('line')
		.attr('x1', xPos + width / 2)
		.attr('x2', xPos + width / 2)
		.attr('y1', yPos - errorMagnitude)
		.attr('y2', yPos + errorMagnitude)
		.attr('stroke', 'black')
		.attr('stroke-width', 1.5);

	// Top cap
	errorLineGroup
		.append('line')
		.attr('x1', xPos + width / 4)
		.attr('x2', xPos + (3 * width) / 4)
		.attr('y1', yPos - errorMagnitude)
		.attr('y2', yPos - errorMagnitude)
		.attr('stroke', 'black')
		.attr('stroke-width', 1.5);

	// Bottom cap
	errorLineGroup
		.append('line')
		.attr('x1', xPos + width / 4)
		.attr('x2', xPos + (3 * width) / 4)
		.attr('y1', yPos + errorMagnitude)
		.attr('y2', yPos + errorMagnitude)
		.attr('stroke', 'black')
		.attr('stroke-width', 1.5);
}

// Function to create stacked bars
function createStackedBars(props: {
	seriesData: Series[];
	barsGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	params: CreateParams;
	fillOpacity: number;
	dataKeys: DataKeys;
	chartHeight: number;
	xKey: string;
	yKey: string;
}): void {
	const { seriesData, barsGroup, params, fillOpacity, dataKeys, xKey, yKey } = props;
	const { scales, colorScale } = params;
	const xScale = scales['x'];
	const yScale = scales['y'];

	try {
		const stackedData = prepareStackedData({ seriesData, dataKeys, xKey, yKey });

		stackedData.forEach((layer, layerIndex) => {
			const seriesName = seriesData[layerIndex][dataKeys.name];
			const bars = barsGroup
				.selectAll(`rect.${seriesName.replace(/\s+/g, '-')}`)
				.data(layer as unknown[])
				.enter()
				.append('rect');

			bars.each((d: { [key: string]: unknown }, i, nodes) => {
				const bar = d3.select(nodes[i]);
				const xPos = getXPosition({ xScale, xValue: d.data[xKey] });
				const yPos = yScale(d[1]);
				const height = Math.abs(yScale(d[0]) - yScale(d[1]));
				const width = xScale.bandwidth ? xScale.bandwidth() : 10; // Fallback width if not scaleBand
				const fillColor = colorScale(seriesName);

				createBar({
					selection: bar,
					d,
					x: xPos,
					y: yPos,
					height,
					width,
					fillColor,
					fillOpacity,
					chartTooltip: params.chartTooltip,
					dataKeys
				});
			});
		});
	} catch (error) {
		console.error('Error generating stacked bars:', error);
	}
}
function createNonStackedBars(props: {
	type: string;
	seriesData: Series[];
	barsGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	params: CreateParams;
	fillOpacity: number;
	dataKeys: DataKeys;
	chartHeight: number;
	xKey: string;
	yKey: string;
}): void {
	const { type, seriesData, barsGroup, params, fillOpacity, dataKeys, chartHeight, xKey, yKey } =
		props;
	const { scales, colorScale } = params;
	const xScale = scales['x'];
	const yScale = scales['y'];

	try {
		// Define a series scale for numeric or date x-values
		let seriesScale = null;

		if (xScale.bandwidth) {
			// For categorical x-axis (e.g., strings)
			seriesScale = d3
				.scaleBand<string>()
				.domain(seriesData.map((d) => d[dataKeys.name]))
				.range([0, xScale.bandwidth()])
				.padding(0.05);
		} else {
			// For numeric or date x-axis, calculate appropriate width for each bar group
			const uniqueXValues = [
				...new Set(seriesData.flatMap((series) => series[dataKeys.data].map((d) => d[xKey])))
			];

			if (uniqueXValues.length > 1) {
				const groupWidth = Math.min(xScale(uniqueXValues[1]) - xScale(uniqueXValues[0]), 50); // Ensure there's enough space between groups

				// Calculate series scale to distribute space among multiple series
				seriesScale = d3
					.scaleBand<string>()
					.domain(seriesData.map((d) => d[dataKeys.name]))
					.range([0, groupWidth])
					.padding(0.2); // Add some padding to avoid overlap
			} else {
				// If there is only one unique x value, fallback to default reasonable width
				seriesScale = d3
					.scaleBand<string>()
					.domain(seriesData.map((d) => d[dataKeys.name]))
					.range([0, 20]) // Fallback range
					.padding(0.2);
			}
		}

		seriesData.forEach((series) => {
			const bars = barsGroup
				.selectAll(`rect.${series[dataKeys.name].replace(/\s+/g, '-')}`)
				.data(series[dataKeys.data])
				.enter()
				.append('rect');

			bars.each((d, i, nodes) => {
				const bar = d3.select(nodes[i]);
				const xValue = d[xKey];
				const xPos =
					getXPosition({ xScale, xValue }) + (seriesScale ? seriesScale(series[dataKeys.name]) : 0);
				const yPos = yScale(d[yKey]);
				const height = chartHeight - yPos;

				// Set width based on series scale bandwidth, ensure it fits the allocated space
				const width = seriesScale ? seriesScale.bandwidth() : 10; // Fallback width

				// Logging to verify positions and dimensions
				console.log(`xPos: ${xPos}, yPos: ${yPos}, height: ${height}, width: ${width}`);

				// Check if width and height are valid
				if (width > 0 && height > 0) {
					const fillColor = colorScale(series[dataKeys.name]);

					createBar({
						selection: bar,
						d,
						x: xPos,
						y: yPos,
						height,
						width,
						fillColor,
						fillOpacity,
						chartTooltip: params.chartTooltip,
						dataKeys
					});
				}
			});
		});
	} catch (error) {
		console.error('Error generating bars for grouped or overlapped variant:', error);
	}
}

// General function to create a bar with tooltip
function createBar(props: {
	selection: d3.Selection<SVGRectElement, unknown, d3.BaseType, unknown>;
	d: unknown;
	x: number;
	y: number;
	height: number;
	width: number;
	fillColor: string;
	fillOpacity: number;
	chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
	dataKeys: DataKeys;
}): void {
	const { selection, x, y, height, width, fillColor, fillOpacity, chartTooltip, dataKeys } = props;
	selection
		.attr('x', x)
		.attr('y', y)
		.attr('height', height)
		.attr('width', width)
		.attr('fill', fillColor)
		.attr('fill-opacity', fillOpacity);

	attachTooltipHandlers({ selection, chartTooltip, dataKeys });
}

// Helper function to prepare stacked data
export function prepareStackedData(props: {
	seriesData: Series[];
	dataKeys: DataKeys;
	xKey: string;
	yKey: string;
}): unknown[] {
	const { seriesData, dataKeys, xKey, yKey } = props;
	if (!Array.isArray(seriesData) || seriesData.length === 0) {
		throw new Error('Invalid seriesData: must be a non-empty array');
	}

	if (!dataKeys || !dataKeys.name || !xKey || !yKey || !dataKeys.data) {
		throw new Error('Invalid dataKeys: all keys (name, data) and coordinate keys must be defined');
	}

	const seriesNames = seriesData.map((d) => d[dataKeys.name]);

	const dataArray = seriesData[0][dataKeys.data].map((_, i) => {
		const obj: unknown = {
			[xKey]: seriesData[0][dataKeys.data][i][xKey]
		};
		seriesData.forEach((series) => {
			const seriesName = series[dataKeys.name];
			const dataPoint = series[dataKeys.data][i];
			if (seriesName && dataPoint) {
				obj[seriesName] = dataPoint[yKey];
			} else {
				throw new Error(`Data inconsistency found at index ${i} for series: ${seriesName}`);
			}
		});
		return obj;
	});

	return d3.stack().keys(seriesNames).offset(d3.stackOffsetDiverging)(dataArray);
}

// Helper function to handle different types for x-axis
function getXPosition(props: {
	xScale: d3.ScaleBand<string> | d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>;
	xValue: string | number | Date;
}): number {
	const { xScale, xValue } = props;
	if (xValue instanceof Date) {
		return xScale(
			xValue.getTime() as unknown as string & { valueOf(): number } & (d3.NumberValue | Date)
		);
	} else if (typeof xValue === 'number' || typeof xValue === 'string') {
		if (typeof xValue === 'string' || typeof xValue === 'number') {
			return xScale(xValue as unknown as string & { valueOf(): number } & (d3.NumberValue | Date));
		}
		throw new Error('Unsupported xValue type. Only Date, number, or string are supported.');
	}
	throw new Error('Unsupported xValue type. Only Date, number, or string are supported.');
}
