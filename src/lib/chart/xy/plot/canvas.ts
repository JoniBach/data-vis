import type { LabelConfig } from '$lib/chart/generateXyChart.js';
import * as d3 from 'd3';
import type { CreateParams, TooltipConfig } from '../utils/types.js';
import { eventSystem } from '../utils/event.js';

// Optimized: Simple helper for sanitizing input
export function escapeHTML(str: number | string | null | undefined): string {
	if (str === null || str === undefined) {
		return ''; // Return empty string for null or undefined values
	}

	if (typeof str !== 'string' && typeof str !== 'number') {
		console.warn('Invalid input type for escapeHTML. Expected a string or number.');
		return '';
	}

	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// Optimized: Axis creation with reusable helper
export function createAxis(params: CreateParams, config: any) {
	const { chartGroup, dateScale, xScale, valueScale, chartHeight, xType } = params;

	// Set up tick formatting and scales conditionally based on xType
	let xAxis;
	if (xType === 'date') {
		const xTickFormat = d3.timeFormat(config?.xTickFormat || '%m / %y');
		const xTicks = config?.xTicks || 5;

		xAxis = d3.axisBottom(xScale).ticks(xTicks).tickFormat(xTickFormat);
	} else if (xType === 'number') {
		const xTicks = config?.xTicks || 5;

		xAxis = d3.axisBottom(xScale).ticks(xTicks).tickFormat(d3.format('~s')); // Format for numbers, e.g., using SI prefixes
	} else {
		// If xType is something else, fallback to default
		xAxis = d3.axisBottom(xScale);
	}

	// Create the y-axis
	const yTickDecimals = config?.yTickDecimals !== undefined ? config.yTickDecimals : 2;
	const yTicks = config?.yTicks || 10;

	const yAxis = d3
		.axisLeft(valueScale)
		.ticks(yTicks)
		.tickFormat(d3.format(`.${yTickDecimals}f`)); // Number formatting for y-axis

	// Append the x-axis at the bottom of the chart
	chartGroup
		.append('g')
		.attr('transform', `translate(0,${chartHeight})`)
		.call(xAxis)
		.selectAll('text')
		.style('text-anchor', 'start')
		.attr('transform', 'rotate(15)');

	// Append the y-axis
	chartGroup.append('g').call(yAxis);
}

// Optimized: Create grid with refactored code
export function createGrid(params: CreateParams) {
	const { chartGroup, dateScale, xScale, valueScale, chartHeight, chartWidth } = params;

	const gridGroup = chartGroup.append('g').attr('class', 'grid');
	gridGroup
		.call(
			d3
				.axisLeft(valueScale)
				.tickSize(-chartWidth)
				.tickFormat(() => '')
		)
		.selectAll('line')
		.attr('stroke', '#ccc')
		.attr('stroke-dasharray', '2,2');

	const xAxis = xScale ? d3.axisBottom(xScale) : d3.axisBottom(dateScale!);
	gridGroup
		.append('g')
		.attr('transform', `translate(0,${chartHeight})`)
		.call(xAxis.tickSize(-chartHeight).tickFormat(() => ''))
		.selectAll('line')
		.attr('stroke', '#ccc')
		.attr('stroke-dasharray', '2,2');
}

// DRY: Utility function for creating labels
const createTextLabel = (
	chartGroup: any,
	text: string,
	position: { x: number; y: number },
	options: { anchor?: string; fontSize?: string; rotation?: string }
) => {
	const label = chartGroup
		.append('text')
		.attr('x', position.x)
		.attr('y', position.y)
		.attr('text-anchor', options.anchor || 'middle')
		.attr('font-size', options.fontSize || '12px')
		.text(text);

	if (options.rotation) {
		label.attr('transform', `rotate(${options.rotation})`);
	}
};

// Optimized: Label creation using utility function
export function createLabel(params: CreateParams, config?: LabelConfig) {
	const { chartGroup, chartWidth, chartHeight } = params;

	if (config?.title) {
		createTextLabel(chartGroup, config.title, { x: chartWidth / 2, y: -10 }, { fontSize: '16px' });
	}

	if (config?.xAxis) {
		createTextLabel(chartGroup, config.xAxis, { x: chartWidth / 2, y: chartHeight + 40 }, {});
	}

	if (config?.yAxis) {
		createTextLabel(chartGroup, config.yAxis, { x: -chartHeight / 2, y: -40 }, { rotation: '-90' });
	}
}

// Optimized: Create tooltip with default settings
export function createTooltip(
	container: HTMLElement | null,
	showTooltip: boolean,
	config: TooltipConfig
): d3.Selection<HTMLDivElement, unknown, null, undefined> {
	if (!showTooltip) {
		return d3.select(document.createElement('div'));
	}

	return d3
		.select(container as HTMLElement)
		.append('div')
		.attr('class', 'tooltip')
		.style('position', 'absolute')
		.style('visibility', 'hidden')
		.style('background', config?.background || '#f9f9f9')
		.style('border', config?.border || '1px solid #d3d3d3')
		.style('padding', config?.padding || '5px');
}

// Optimized: Attach tooltip handlers using a utility function
export function attachTooltipHandlers(
	selection: d3.Selection<any, any, any, any>,
	chartTooltip: any,
	dataKeys: any
) {
	selection
		.on('mouseover', (event, d) => {
			eventSystem.trigger('tooltip', chartTooltip, d, dataKeys);
		})
		.on('mousemove', (event) => {
			eventSystem.trigger('tooltipMove', chartTooltip, event);
		})
		.on('mouseout', () => {
			eventSystem.trigger('tooltipHide', chartTooltip);
		});
}

// Tooltip Handlers
export const handleTooltipShow = (chartTooltip, d, dataKeys) => {
	try {
		const xKeyValue = d[dataKeys.xKey];
		const yKeyValue = d[dataKeys.yKey];

		const dateStr = xKeyValue
			? xKeyValue instanceof Date
				? escapeHTML(d3.timeFormat('%b %Y')(xKeyValue))
				: escapeHTML(String(xKeyValue))
			: 'N/A';

		const valueStr = yKeyValue != null ? escapeHTML(String(yKeyValue)) : 'N/A';

		chartTooltip.style('visibility', 'visible').html(`Date: ${dateStr}<br>Value: ${valueStr}`);
	} catch (error) {
		console.error('Error in tooltip handler:', error);
	}
};

export const handleTooltipMove = (chartTooltip, event) => {
	chartTooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
};

export const handleTooltipHide = (chartTooltip) => {
	chartTooltip.style('visibility', 'hidden');
};
