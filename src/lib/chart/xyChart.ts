// Imports
import * as d3 from 'd3';
import * as point from './xy/plot/point.js';
import * as bar from './xy/plot/bar.js';
import * as canvas from './xy/plot/canvas.js';
import * as domainUtils from './xy/utils/domain.js';
import * as types from './xy/utils/types.js';
import * as eventUtils from './xy/utils/event.js';
import * as initialUtils from './xy/utils/initial.js';
import * as validator from './xy/utils/validator.js';

// Preparation Phase
const prepareAndValidateData = (seriesData, dataKeys) => {
	if (!validator.isValidSeriesData(seriesData, dataKeys)) {
		console.error('Invalid or no data provided for the chart.');
		return null;
	}
	return { seriesData, dataKeys };
};

const shouldRenderFeature = (chartFeatures, featureName) =>
	chartFeatures.some(({ feature, hide }) => feature === featureName && !hide);

// Domain Calculation Phase
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

// Initialization Phase
const clearChartContainer = (container) => {
	d3.select(container).selectAll('*').remove();
};

const initializeChartContainer = (container, width, height, merge) => {
	if (merge) {
		const existingSvg = d3.select(container).select('svg');
		if (!existingSvg.empty()) {
			return existingSvg;
		}
	}
	clearChartContainer(container);
	return initialUtils.createInitialSVG({ container, width, height });
};

const initializeScales = ({ dateDomainUsed, chartWidth }) => {
	const xScale = d3.scaleBand().domain(dateDomainUsed).range([0, chartWidth]).padding(0.1);
	return { xScale, barWidth: xScale.bandwidth() };
};

// Drawing Essentials Phase
const initializeChartGroup = (svg, margin) => {
	return svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
};

// Data Binding & Chart Rendering Phase
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
}) => {
	const { width, margin } = config;

	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	const { seriesData: validatedData, dataKeys: validatedKeys } = prepareAndValidateData(
		seriesData,
		dataKeys
	);
	if (!validatedData) return null;

	// Prepare Chart Container
	const svg = initializeChartContainer(chartContainer, width, height, merge);
	const chartGroup = initializeChartGroup(svg, margin);

	// Extract or compute domains
	const dateDomainUsed = dateDomain || domainUtils.extractDateDomain(validatedData, validatedKeys);
	const { xScale, barWidth } = initializeScales({ dateDomainUsed, chartWidth });

	const valueDomainUsed =
		valueDomain ||
		domainUtils.computeMergedValueDomain(
			[validatedData],
			[validatedKeys],
			[chartFeatures.find((f) => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped']
		);

	const valueScale = initialUtils.createInitialScale(
		d3.scaleLinear,
		[chartHeight, 0],
		valueDomainUsed
	);

	const colorScale = d3
		.scaleOrdinal(d3.schemeCategory10)
		.domain(validatedData.map((d) => d[validatedKeys.name]));

	const chartTooltip = canvas.createTooltip(
		chartContainer,
		shouldRenderFeature(chartFeatures, 'tooltip'),
		chartFeatures.find((feature) => feature.feature === 'tooltip')?.config
	);

	return {
		createParams: {
			seriesData: validatedData,
			chartGroup,
			colorScale,
			xScale,
			valueScale,
			chartTooltip,
			chartHeight,
			chartWidth,
			dataKeys: validatedKeys,
			barWidth,
			...config
		},
		chartGroup
	};
};

// Feature Enrichment Phase
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

const renderFeatures = ({ createParams, chartFeatures }) => {
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

// Interactivity Phase
const initializeEventHandlers = () => {
	eventUtils.eventSystem.on('tooltip', canvas.handleTooltipShow);
	eventUtils.eventSystem.on('tooltipMove', canvas.handleTooltipMove);
	eventUtils.eventSystem.on('tooltipHide', canvas.handleTooltipHide);
};

// Helper Function for Creating Multi-Series Chart
const createMultiSeriesChart = (props) => {
	const allCreateParams = [];
	props.data.forEach((seriesData, i) => {
		const { createParams, chartFeatures } = createDataSeriesChart({ ...props, seriesData, i });
		if (createParams) {
			allCreateParams.push({ createParams, chartFeatures });
		}
	});
	return allCreateParams;
};

const createDataSeriesChart = ({
	seriesData,
	i,
	dataKeysArray,
	features,
	config,
	mergedDateDomain,
	mergedValueDomain,
	container,
	isBarChart,
	merge,
	squash,
	height,
	data,
	syncX,
	syncY
}) => {
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

	return { createParams, chartFeatures };
};

// Unified Chart Creation
export const initializeChart = (props) => {
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
	const isBarChart = features.some((chartFeatures) =>
		chartFeatures.some((f) => f.feature === 'bar' && !f.hide)
	);

	// Step 4: Create Charts for Each Data Series
	const allCreateParams = createMultiSeriesChart({
		container,
		data,
		dataKeysArray,
		features,
		config,
		mergedDateDomain,
		mergedValueDomain,
		isBarChart,
		merge,
		squash,
		height,
		syncX,
		syncY
	});

	// Step 5: Render Features onto Chart
	allCreateParams.forEach((paramsAndFeatures) => {
		renderFeatures(paramsAndFeatures);
	});

	// Step 6: Initialize Event Handlers for Interactivity (Tooltips)
	initializeEventHandlers();
};

export default initializeChart;
