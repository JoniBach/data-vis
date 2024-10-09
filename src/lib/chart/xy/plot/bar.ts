// Imports
import * as d3 from 'd3';
import { attachTooltipHandlers } from './canvas.js';
import type { CreateParams } from './types.js';
import { prepareAndValidateData } from '../xyChart.js';
import type { DataKeys } from '../generateXyChart.js';

// Main function to create bars (grouped, stacked, overlapped, or error bars)
export function createBarsVariant(
	type: 'grouped' | 'stacked' | 'overlapped' | 'error',
	params: CreateParams,
	config: { fillOpacity?: number } = {}
) {
	const {
		seriesData,
		chartGroup,
		colorScale,
		scales,
		chartHeight,
		chartWidth,
		dataKeys,
		chartTooltip
	} = params;

	// Validate the input data using the new validator
	const preparedData = prepareAndValidateData({ seriesData, dataKeys });
	if (!preparedData) return;

	// Extract coordinate keys
	const xKey = dataKeys.coordinates['x'];
	const yKey = dataKeys.coordinates['y'];

	// Add clipping path to prevent overflow
	createClippingPath(chartGroup, chartWidth, chartHeight);

	const barsGroup = chartGroup
		.append('g')
		.attr('class', 'bars-group')
		.attr('clip-path', 'url(#clip)');
	const fillOpacity = config.fillOpacity ?? 0.5;

	switch (type) {
		case 'stacked':
			createStackedBars(
				preparedData.seriesData,
				barsGroup,
				params,
				fillOpacity,
				dataKeys,
				chartHeight,
				xKey,
				yKey
			);
			break;
		case 'error':
			createErrorBars(
				preparedData.seriesData,
				barsGroup,
				params,
				fillOpacity,
				dataKeys,
				chartHeight,
				xKey,
				yKey
			);
			break;
		default:
			createNonStackedBars(
				type,
				preparedData.seriesData,
				barsGroup,
				params,
				fillOpacity,
				dataKeys,
				chartHeight,
				xKey,
				yKey
			);
			break;
	}
}

// Helper function to create clipping path
function createClippingPath(chartGroup: any, chartWidth: number, chartHeight: number) {
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

// Function to create error bars
export function createErrorBars(
	seriesData: any[],
	barsGroup: any,
	params: CreateParams,
	fillOpacity: number,
	dataKeys: DataKeys,
	chartHeight: number,
	xKey: string,
	yKey: string
) {
	const { scales, colorScale } = params;
	const xScale = scales['x'];
	const yScale = scales['y'];

	try {
		// Only define seriesScale if xScale has a bandwidth function (scaleBand)
		const seriesScale = xScale.bandwidth
			? d3
					.scaleBand()
					.domain(seriesData.map((d) => d[dataKeys.name]))
					.range([0, xScale.bandwidth()])
					.padding(0.05)
			: null;

		const magnitudeKey = dataKeys.magnitude;

		const magnitudeScale = d3
			.scaleLinear()
			.domain([
				d3.min(seriesData, (series) => d3.min(series[dataKeys.data], (d) => d[magnitudeKey])) || 0,
				d3.max(seriesData, (series) => d3.max(series[dataKeys.data], (d) => d[magnitudeKey])) || 1
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
				const xPos =
					getXPosition(xScale, d[xKey]) + (seriesScale ? seriesScale(series[dataKeys.name])! : 0);
				const yPos = yScale(d[yKey]);
				const height = chartHeight - yScale(d[yKey]);
				const width = seriesScale ? seriesScale.bandwidth() : 10; // Fallback width if not scaleBand
				const fillColor = colorScale(series[dataKeys.name]);

				createBar(
					bar,
					d,
					xPos,
					yPos,
					height,
					width,
					fillColor,
					fillOpacity,
					params.chartTooltip,
					dataKeys
				);

				addErrorBars(barsGroup, xPos, width, yPos, magnitudeScale(d[magnitudeKey]));
			});
		});
	} catch (error) {
		console.error('Error generating error bars:', error);
	}
}

// Helper function to add error bars (lines and caps)
function addErrorBars(
	barsGroup: any,
	xPos: number,
	width: number,
	yPos: number,
	errorMagnitude: number
) {
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
export function createStackedBars(
	seriesData: any[],
	barsGroup: any,
	params: CreateParams,
	fillOpacity: number,
	dataKeys: DataKeys,
	chartHeight: number,
	xKey: string,
	yKey: string
) {
	const { scales, colorScale } = params;
	const xScale = scales['x'];
	const yScale = scales['y'];

	try {
		const stackedData = prepareStackedData(seriesData, dataKeys, xKey, yKey);

		stackedData.forEach((layer, layerIndex) => {
			const seriesName = seriesData[layerIndex][dataKeys.name];
			const bars = barsGroup
				.selectAll(`rect.${seriesName.replace(/\s+/g, '-')}`)
				.data(layer)
				.enter()
				.append('rect');

			bars.each((d, i, nodes) => {
				const bar = d3.select(nodes[i]);
				const xPos = getXPosition(xScale, d.data[xKey]);
				const yPos = yScale(d[1]);
				const height = Math.abs(yScale(d[0]) - yScale(d[1]));
				const width = xScale.bandwidth ? xScale.bandwidth() : 10; // Fallback width if not scaleBand
				const fillColor = colorScale(seriesName);

				createBar(
					bar,
					d,
					xPos,
					yPos,
					height,
					width,
					fillColor,
					fillOpacity,
					params.chartTooltip,
					dataKeys
				);
			});
		});
	} catch (error) {
		console.error('Error generating stacked bars:', error);
	}
}

// Function to create grouped or overlapped bars
export function createNonStackedBars(
	type: 'grouped' | 'overlapped',
	seriesData: any[],
	barsGroup: any,
	params: CreateParams,
	fillOpacity: number,
	dataKeys: DataKeys,
	chartHeight: number,
	xKey: string,
	yKey: string
) {
	const { scales, colorScale } = params;
	const xScale = scales['x'];
	const yScale = scales['y'];

	try {
		const seriesScale = xScale.bandwidth
			? d3
					.scaleBand()
					.domain(seriesData.map((d) => d[dataKeys.name]))
					.range([0, xScale.bandwidth()])
					.padding(0.05)
			: null;

		seriesData.forEach((series) => {
			const bars = barsGroup
				.selectAll(`rect.${series[dataKeys.name].replace(/\s+/g, '-')}`)
				.data(series[dataKeys.data])
				.enter()
				.append('rect');

			bars.each((d, i, nodes) => {
				const bar = d3.select(nodes[i]);
				const xPos =
					getXPosition(xScale, d[xKey]) +
					(type === 'grouped' && seriesScale ? seriesScale(series[dataKeys.name])! : 0);
				const yPos = yScale(d[yKey]);
				const height = chartHeight - yScale(d[yKey]);
				const width = seriesScale
					? seriesScale.bandwidth()
					: xScale.bandwidth
						? xScale.bandwidth()
						: 10; // Fallback width
				const fillColor = colorScale(series[dataKeys.name]);

				createBar(
					bar,
					d,
					xPos,
					yPos,
					height,
					width,
					fillColor,
					fillOpacity,
					params.chartTooltip,
					dataKeys
				);
			});
		});
	} catch (error) {
		console.error('Error generating bars for grouped or overlapped variant:', error);
	}
}

// General function to create a bar with tooltip
export function createBar(
	selection: d3.Selection<SVGRectElement, any, SVGGElement, any>,
	d: any,
	x: number,
	y: number,
	height: number,
	width: number,
	fillColor: string,
	fillOpacity: number,
	chartTooltip: any,
	dataKeys: DataKeys
) {
	selection
		.attr('x', x)
		.attr('y', y)
		.attr('height', height)
		.attr('width', width)
		.attr('fill', fillColor)
		.attr('fill-opacity', fillOpacity);

	attachTooltipHandlers(selection, chartTooltip, dataKeys);
}

// Helper function to prepare stacked data
export function prepareStackedData(
	seriesData: any[],
	dataKeys: DataKeys,
	xKey: string,
	yKey: string
) {
	if (!Array.isArray(seriesData) || seriesData.length === 0) {
		throw new Error('Invalid seriesData: must be a non-empty array');
	}

	if (!dataKeys || !dataKeys.name || !xKey || !yKey || !dataKeys.data) {
		throw new Error('Invalid dataKeys: all keys (name, data) and coordinate keys must be defined');
	}

	const seriesNames = seriesData.map((d) => d[dataKeys.name]);

	const dataArray = seriesData[0][dataKeys.data].map((_, i) => {
		const obj: Record<string, any> = {
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
function getXPosition(xScale: any, xValue: any) {
	if (xValue instanceof Date) {
		return xScale(xValue.getTime());
	} else if (typeof xValue === 'number' || typeof xValue === 'string') {
		return xScale(xValue);
	}
	throw new Error('Unsupported xValue type. Only Date, number, or string are supported.');
}
