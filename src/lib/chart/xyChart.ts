import * as d3 from 'd3';
import * as point from './xy/plot/point.js';
import * as bar from './xy/plot/bar.js';
import * as canvas from './xy/plot/canvas.js';
import * as domainUtils from './xy/utils/domain.js';
import * as types from './xy/utils/types.js';
import * as eventUtils from './xy/utils/event.js';
import * as initialUtils from './xy/utils/initial.js';
import * as validator from './xy/utils/validator.js';

// Tooltip Handlers
const handleTooltipShow = (chartTooltip, d, dataKeys) => {
	try {
		const xKeyValue = d[dataKeys.xKey];
		const yKeyValue = d[dataKeys.yKey];

		const dateStr = xKeyValue
			? xKeyValue instanceof Date
				? canvas.escapeHTML(d3.timeFormat('%b %Y')(xKeyValue))
				: canvas.escapeHTML(String(xKeyValue))
			: 'N/A';

		const valueStr = yKeyValue != null ? canvas.escapeHTML(String(yKeyValue)) : 'N/A';

		chartTooltip.style('visibility', 'visible').html(`Date: ${dateStr}<br>Value: ${valueStr}`);
	} catch (error) {
		console.error('Error in tooltip handler:', error);
	}
};

const handleTooltipMove = (chartTooltip, event) => {
	chartTooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
};

const handleTooltipHide = (chartTooltip) => {
	chartTooltip.style('visibility', 'hidden');
};

// Event Handlers Initialization
const initializeEventHandlers = () => {
	eventUtils.eventSystem.on('tooltip', handleTooltipShow);
	eventUtils.eventSystem.on('tooltipMove', handleTooltipMove);
	eventUtils.eventSystem.on('tooltipHide', handleTooltipHide);
};

// Feature Display Utility
const shouldRenderFeature = (chartFeatures, featureName) =>
	chartFeatures.some(({ feature, hide }) => feature === featureName && !hide);

// Feature Registry
const featureRegistry = {
	tooltip: () => null,
	grid: canvas.createGrid,
	axis: canvas.createAxis,
	label: canvas.createLabel,
	area: (params) => point.createLineOrArea('area', params),
	line: (params) => point.createLineOrArea('line', params),
	bubbles: point.createBubbles,
	point: point.createPoints,
	bar: (params, config) => bar.createBarsVariant(config?.variant || 'grouped', params)
};

// Render Features
const renderFeatures = (createParams, chartFeatures) => {
	chartFeatures.forEach(({ feature, hide, config }) => {
		if (hide) return;
		const featureFunction = featureRegistry[feature];
		if (featureFunction) {
			const selection = featureFunction(createParams, config);
			if (selection && selection.on) {
				if (feature === 'point' || feature === 'bubbles' || feature === 'bar') {
					selection
						.on('mouseover', (event, d) => {
							eventUtils.eventSystem.trigger(
								'tooltip',
								createParams.chartTooltip,
								d,
								createParams.dataKeys
							);
						})
						.on('mousemove', (event) => {
							eventUtils.eventSystem.trigger('tooltipMove', createParams.chartTooltip, event);
						})
						.on('mouseout', () => {
							eventUtils.eventSystem.trigger('tooltipHide', createParams.chartTooltip);
						});
				}
			}
		} else {
			console.warn(`Feature function not found for feature: ${feature}`);
		}
	});
};

// Scale Initialization
const initializeScales = ({ dateDomainUsed, chartWidth }) => {
	const xScale = d3.scaleBand().domain(dateDomainUsed).range([0, chartWidth]).padding(0.1);
	return { xScale, barWidth: xScale.bandwidth() };
};

// Chart Container Initialization
const clearChartContainer = (container) => {
	d3.select(container).selectAll('*').remove();
};

const initializeChart = (container, width, height) => {
	clearChartContainer(container);
	return initialUtils.createInitialSVG({ container, width, height });
};

// Domain Calculations
const computeDomains = ({ syncX, syncY, data, dataKeysArray, features }) => {
	const mergedDateDomain = syncX
		? domainUtils.computeMergedDateDomain(data, dataKeysArray)
		: undefined;
	const mergedValueDomain = syncY
		? domainUtils.computeMergedValueDomain(
				data,
				dataKeysArray,
				features.map(
					(chartFeatures) =>
						chartFeatures.find((f) => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped'
				)
			)
		: undefined;
	return { mergedDateDomain, mergedValueDomain };
};

// Setup and Render Individual Chart
const setupAndRenderChart = ({
	chartContainer,
	seriesData,
	height,
	chartFeatures,
	dataKeys,
	dateDomain,
	valueDomain,
	isBarChart,
	config,
	merge
}: types.SetupChartParams): types.setupAndRenderChartRes => {
	const { width, xType, margin } = config;

	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	if (!validator.isValidSeriesData(seriesData, dataKeys)) {
		console.error('Invalid or no data provided for the chart.');
		return null;
	}

	const svg = merge
		? d3.select(chartContainer).select('svg').empty()
			? initializeChart(chartContainer, width, height)
			: d3.select(chartContainer).select('svg')
		: initializeChart(chartContainer, width, height);

	const chartGroup = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

	const dateDomainUsed = dateDomain || domainUtils.extractDateDomain(seriesData, dataKeys);
	const { xScale, barWidth } = initializeScales({
		isBarChart,
		dateDomainUsed,
		chartWidth,
		seriesData,
		dataKeys,
		xType
	});

	valueDomain =
		valueDomain ||
		domainUtils.computeMergedValueDomain(
			[seriesData],
			[dataKeys],
			[chartFeatures.find((f) => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped']
		);

	const valueScale = initialUtils.createInitialScale(
		d3.scaleLinear,
		[chartHeight, 0],
		valueDomain as [number, number]
	);

	const colorScale = d3
		.scaleOrdinal(d3.schemeCategory10)
		.domain(seriesData.map((d) => d[dataKeys.name]));

	const chartTooltip = canvas.createTooltip(
		chartContainer,
		shouldRenderFeature(chartFeatures, 'tooltip'),
		chartFeatures.find((feature) => feature.feature === 'tooltip')?.config
	);

	return {
		createParams: {
			seriesData,
			chartGroup,
			colorScale,
			xScale,
			valueScale,
			chartTooltip,
			chartHeight,
			chartWidth,
			dataKeys,
			barWidth,
			...config
		},
		chartGroup
	};
};

// Unified Chart Creation
export const initializeXyChart = (props) => {
	const { container, data, dataKeysArray, features, config } = props;
	const { height, squash, syncX, syncY, merge } = config;

	// Step 1: Prepare and Validate Data Domains
	const { mergedDateDomain, mergedValueDomain } = computeDomains({
		syncX,
		syncY,
		data,
		dataKeysArray,
		features
	});

	// Step 2: Chart Initialization
	if (!merge) {
		clearChartContainer(container);
	}

	// Step 3: Identify Chart Type
	const isBarChart = features.some((chartFeatures: types.Feature[]) =>
		chartFeatures.some((f) => f.feature === 'bar' && !f.hide)
	);

	// Step 4: Create Charts for Each Data Series
	data.forEach((seriesData: types.SeriesData, i: number) => {
		const chartFeatures = features[i];
		const dataKeys = dataKeysArray[i];

		// Step 4a: Create Individual Chart Containers
		const chartContainer = merge ? container : document.createElement('div');
		if (!merge) container.appendChild(chartContainer);

		const chartHeight = squash ? height / data.length : height;
		const dateDomain = syncX ? mergedDateDomain : undefined;
		const domainValue = syncY ? mergedValueDomain : undefined;

		// Step 4b: Setup and Render Individual Charts
		const { createParams } = setupAndRenderChart({
			chartContainer,
			seriesData,
			height: chartHeight,
			chartFeatures,
			dataKeys,
			dateDomain,
			valueDomain: domainValue,
			isBarChart,
			config,
			merge
		});

		// Step 5: Render Features onto Chart
		if (createParams) {
			renderFeatures(createParams, chartFeatures);
		}
	});

	// Step 6: Initialize Event Handlers for Interactivity (Tooltips)
	initializeEventHandlers();
};
