// Imports
import * as d3 from 'd3';
import { eventSystem } from './event.js';

// Utility function to escape HTML
export function escapeHTML(str) {
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

export function createAxis(params, config) {
	const { chartGroup, scales, chartHeight, xType } = params;
	const xScale = scales['x'];
	const yScale = scales['y'];

	// Set up tick formatting and scales conditionally based on xType
	let xAxis;

	if (xType === 'date') {
		const xTickFormatStr = config?.xTickFormat || '%m / %y';
		let xTickFormat;
		try {
			xTickFormat = d3.timeFormat(xTickFormatStr);
		} catch (error) {
			console.warn(`Invalid date format "${xTickFormatStr}". Falling back to default '%m / %y'.`);
			xTickFormat = d3.timeFormat('%m / %y');
		}
		const xTicks = config?.xTicks || 5;
		xAxis = d3.axisBottom(xScale).ticks(xTicks).tickFormat(xTickFormat);
	} else if (xType === 'number') {
		const xTickFormatStr = config?.xTickFormat || '~s';
		let xTickFormat;
		try {
			xTickFormat = d3.format(xTickFormatStr);
		} catch (error) {
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
export function createGrid(params, config) {
	const { chartGroup, scales, chartHeight, chartWidth } = params;
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

// Function to create labels
export function createLabel(params, config) {
	const { chartGroup, chartWidth, chartHeight, margin } = params;

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

// Function to create tooltip
export function createTooltip(props) {
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
export function attachTooltipHandlers(props) {
	const { selection, chartTooltip, dataKeys } = props;
	selection
		.on('mouseover', function (event, d) {
			eventSystem.trigger('tooltip', chartTooltip, d, dataKeys);
		})
		.on('mousemove', function (event) {
			eventSystem.trigger('tooltipMove', chartTooltip, event);
		})
		.on('mouseout', function () {
			eventSystem.trigger('tooltipHide', chartTooltip);
		});
}

// Tooltip Handlers
export const handleTooltipShow = ({ chartTooltip, data, dataKeys }) => {
	try {
		const xKey = dataKeys.coordinates['x'];
		const yKey = dataKeys.coordinates['y'];

		const xValue = data[xKey];
		const yValue = data[yKey];

		const xStr = xValue instanceof Date ? d3.timeFormat('%b %Y')(xValue) : escapeHTML(xValue);
		const yStr = escapeHTML(yValue);

		chartTooltip.style('visibility', 'visible').html(`X: ${xStr}<br>Y: ${yStr}`);
	} catch (error) {
		console.error('Error in tooltip handler:', error);
	}
};

export const handleTooltipMove = ({ chartTooltip, event }) => {
	chartTooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
};

export const handleTooltipHide = ({ chartTooltip }) => {
	chartTooltip.style('visibility', 'hidden');
};
