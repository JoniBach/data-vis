// canvas.ts

import * as d3 from 'd3';
import type { CreateParams, DataKeys } from './types.js';
import { eventSystem } from '../lifecycle/6_interactions.js';

// Utility function to escape HTML
export function escapeHTML(str: string): string {
	if (str === null || str === undefined) {
		return '';
	}
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

interface AxisConfig {
	xTickFormat?: string;
	xTicks?: number;
	yTickDecimals?: number;
	yTicks?: number;
}

export function createAxis(props: CreateParams, config?: AxisConfig): void {
	const { chartGroup, scales, chartHeight, xType } = props;
	const xScale = scales['x'];
	const yScale = scales['y'];

	// Set up tick formatting and scales conditionally based on xType
	let xAxis: d3.Axis<unknown>;

	if (xType === 'date') {
		const xTickFormatStr = config?.xTickFormat || '%m / %y';
		let xTickFormat: (date: Date) => string;
		try {
			xTickFormat = d3.timeFormat(xTickFormatStr);
		} catch {
			console.warn(`Invalid date format "${xTickFormatStr}". Falling back to default '%m / %y'.`);
			xTickFormat = d3.timeFormat('%m / %y');
		}
		const xTicks = config?.xTicks || 5;
		xAxis = d3
			.axisBottom(xScale)
			.ticks(xTicks)
			.tickFormat((d) => xTickFormat(new Date(d as string)));
	} else if (xType === 'number') {
		const xTickFormatStr = config?.xTickFormat || '~s';
		let xTickFormat: (n: number | { valueOf(): number }) => string;
		try {
			xTickFormat = d3.format(xTickFormatStr);
		} catch {
			console.warn(`Invalid number format "${xTickFormatStr}". Falling back to default '~s'.`);
			xTickFormat = d3.format('~s');
		}
		const xTicks = config?.xTicks || 5;
		xAxis = d3.axisBottom(xScale).ticks(xTicks).tickFormat(xTickFormat);
	} else {
		// For strings or other types, use default formatting
		xAxis = d3.axisBottom(xScale);
	}

	// Create the y-axis
	const yTickDecimals = config?.yTickDecimals !== undefined ? config.yTickDecimals : 2;
	const yTicks = config?.yTicks || 10;
	const yTickFormat = d3.format(`.${yTickDecimals}f`);

	const yAxis = d3.axisLeft(yScale).ticks(yTicks).tickFormat(yTickFormat);

	// Append the x-axis at the bottom of the chart
	chartGroup
		.append('g')
		.attr('transform', `translate(0,${chartHeight})`)
		.call(xAxis)
		.selectAll('text')
		.style('text-anchor', 'start')
		.attr('transform', 'rotate(20)')
		.attr('dx', '0.8em')
		.attr('dy', '0.15em');

	// Append the y-axis
	chartGroup.append('g').call(yAxis);
}

// Function to create grid lines
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createGrid(props: CreateParams, config?: unknown): void {
	const { chartGroup, scales, chartHeight, chartWidth } = props;
	const xScale = scales['x'];
	const yScale = scales['y'];

	// Create y-axis grid lines
	chartGroup
		.append('g')
		.attr('class', 'grid')
		.call(
			d3
				.axisLeft(yScale)
				.tickSize(-chartWidth)
				.tickFormat(() => '')
		)
		.selectAll('line')
		.attr('stroke', '#ccc')
		.attr('stroke-dasharray', '2,2');

	// Create x-axis grid lines
	chartGroup
		.append('g')
		.attr('class', 'grid')
		.attr('transform', `translate(0,${chartHeight})`)
		.call(
			d3
				.axisBottom(xScale)
				.tickSize(-chartHeight)
				.tickFormat(() => '')
		)
		.selectAll('line')
		.attr('stroke', '#ccc')
		.attr('stroke-dasharray', '2,2');
}

interface LabelConfig {
	title?: string;
	xAxis?: string;
	yAxis?: string;
}

export function createLabel(props: CreateParams, config?: LabelConfig): void {
	const { chartGroup, chartWidth, chartHeight, margin } = props;

	if (config?.title) {
		chartGroup
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', -margin.top / 2)
			.attr('text-anchor', 'middle')
			.attr('font-size', '16px')
			.text(config.title);
	}

	if (config?.xAxis) {
		chartGroup
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', chartHeight + margin.bottom - 10)
			.attr('text-anchor', 'middle')
			.text(config.xAxis);
	}

	if (config?.yAxis) {
		chartGroup
			.append('text')
			.attr('transform', `rotate(-90)`)
			.attr('x', -chartHeight / 2)
			.attr('y', -margin.left + 20)
			.attr('text-anchor', 'middle')
			.text(config.yAxis);
	}
}

interface TooltipConfig {
	background?: string;
	border?: string;
	padding?: string;
	borderRadius?: string;
}

interface CreateTooltipProps {
	container: HTMLElement;
	showTooltip: boolean;
	config?: TooltipConfig;
}

export function createTooltip(
	props: CreateTooltipProps
): d3.Selection<HTMLDivElement, unknown, null, undefined> {
	const { container, showTooltip, config } = props;
	if (!showTooltip) {
		return d3.select(document.createElement('div'));
	}

	return d3
		.select(container)
		.append('div')
		.attr('class', 'tooltip')
		.style('position', 'absolute')
		.style('visibility', 'hidden')
		.style('background', config?.background || '#f9f9f9')
		.style('border', config?.border || '1px solid #d3d3d3')
		.style('padding', config?.padding || '5px')
		.style('border-radius', config?.borderRadius || '4px');
}

// Function to attach tooltip handlers
export function attachTooltipHandlers(props: {
	selection: d3.Selection<d3.BaseType, unknown, d3.BaseType, unknown>;
	chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
	dataKeys: DataKeys;
}): void {
	const { selection, chartTooltip, dataKeys } = props;
	selection
		.on('mouseover', function (event: MouseEvent, d: unknown) {
			eventSystem.trigger('tooltip', chartTooltip, d, dataKeys);
		})
		.on('mousemove', function (event: MouseEvent) {
			eventSystem.trigger('tooltipMove', chartTooltip, event);
		})
		.on('mouseout', function () {
			eventSystem.trigger('tooltipHide', chartTooltip);
		});
}
export const handleTooltipShow = ({
	chartTooltip,
	data,
	dataKeys
}: {
	chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
	data: unknown;
	dataKeys: DataKeys;
}): void => {
	try {
		const xKey = dataKeys.coordinates['x'];
		const yKey = dataKeys.coordinates['y'];

		let xValue = data[xKey];
		const yValue = data[yKey];

		// Check if xValue is a string in ISO format and parse it
		if (typeof xValue === 'string' && !isNaN(Date.parse(xValue))) {
			xValue = new Date(xValue);
		}

		// Format values for display
		const xStr = xValue instanceof Date ? d3.timeFormat('%b %Y')(xValue) : escapeHTML(xValue);
		const yStr = escapeHTML(yValue);

		chartTooltip.style('visibility', 'visible').html(`X: ${xStr}<br>Y: ${yStr}`);
	} catch (error) {
		console.error('Error in tooltip handler:', error);
	}
};

export const handleTooltipMove = ({
	chartTooltip,
	event
}: {
	chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
	event: MouseEvent;
}): void => {
	chartTooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
};

export const handleTooltipHide = ({
	chartTooltip
}: {
	chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
}): void => {
	chartTooltip.style('visibility', 'hidden');
};
