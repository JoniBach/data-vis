// xyChart.ts

// Imports
import * as d3 from 'd3';
import { createBars } from './plot/bar.js';
import {
	createGrid,
	createAxis,
	createLabel,
	handleTooltipShow,
	handleTooltipMove,
	handleTooltipHide
} from './plot/canvas.js';
import { eventSystem } from './plot/event.js';
import { createArea, createLine, createBubbles, createPoints } from './plot/point.js';
import type {
	FeatureRegistry,
	RenderFeaturesProps,
	InitializeChartProps,
	CreateMultiSeriesChartProps,
	CreateDataSeriesChartProps
} from './types.js';

// **1. Preparation Phase**
import { prepareValidData } from './lifecycle/2_preperation.js';

// **2. Domain Calculation Phase**
import { computeDomains } from './lifecycle/1_domain.js';

// **3. Initialization Phase**
import { initializeScaledChartGroup } from './lifecycle/3_initialization.js';

// **4. Data Binding & Chart Rendering Phase**
import { setupAndRenderChart } from './lifecycle/4_binding.js';

// **5. Feature Enrichment Phase**

/**
 * A registry mapping feature names to their corresponding rendering functions.
 */
const featureRegistry: FeatureRegistry = {
	tooltip: () => null,
	grid: createGrid,
	axis: createAxis,
	label: createLabel,
	area: createArea,
	line: createLine,
	bubbles: createBubbles,
	point: createPoints,
	bar: createBars
};

/**
 * Renders additional chart features such as grids, axes, labels, and data representations.
 */
function renderFeatures(props: RenderFeaturesProps): void {
	const { createParams, chartFeatures } = props;
	chartFeatures.forEach(({ feature, hide, config }) => {
		if (hide) return;
		const featureFunction = featureRegistry[feature];
		if (featureFunction) {
			const selection = featureFunction(createParams, config) as d3.Selection<
				SVGGElement,
				unknown,
				null,
				undefined
			>;
			if (selection && selection.on) {
				if (['point', 'bubbles', 'bar'].includes(feature)) {
					selection
						.on('mouseover', (event: MouseEvent, data: unknown) => {
							handleTooltipShow({
								chartTooltip: createParams.chartTooltip,
								data,
								dataKeys: createParams.dataKeys
							});
						})
						.on('mousemove', (event: MouseEvent) => {
							handleTooltipMove({ chartTooltip: createParams.chartTooltip, event });
						})
						.on('mouseout', () => {
							handleTooltipHide({ chartTooltip: createParams.chartTooltip });
						});
				}
			}
		} else {
			console.warn(`Feature function not found for feature: ${feature}`);
		}
	});
}

// **6. Interactivity Phase**

/**
 * Sets up event handlers to enable interactivity within the chart, such as tooltips and event responses.
 */
function initializeEventHandlers(): void {
	eventSystem.on('tooltip', (chartTooltip, data, dataKeys) => {
		handleTooltipShow({ chartTooltip, data, dataKeys });
	});
	eventSystem.on('tooltipMove', (chartTooltip, event) => {
		handleTooltipMove({ chartTooltip, event });
	});
	eventSystem.on('tooltipHide', (chartTooltip) => {
		handleTooltipHide({ chartTooltip });
	});
}

// **7. Unified Chart Creation Phase**

/**
 * Serves as the main entry point for chart creation, handling domain computations, rendering, and interactivity setup.
 */
export function initializeChart(props: InitializeChartProps): void {
	const { container, data, dataKeysArray, features, config } = props;
	const { height, squash, syncX, syncY, merge } = config;

	const { mergedXDomain, mergedYDomain } = computeDomains({
		syncX: !!syncX,
		syncY: !!syncY,
		data,
		dataKeysArray,
		features
	});

	if (!merge) {
		d3.select(container).selectAll('*').remove();
	}

	const allCreateParams = createMultiSeriesChart({
		container,
		data,
		dataKeysArray,
		features,
		config,
		mergedDomains: { x: mergedXDomain, y: mergedYDomain },
		merge: !!merge,
		squash: !!squash,
		height,
		syncX: !!syncX,
		syncY: !!syncY
	});

	allCreateParams.forEach((paramsAndFeatures) => {
		renderFeatures(paramsAndFeatures);
	});

	initializeEventHandlers();
}

// **8. Multi-Series Chart Creation Phase**

/**
 * Handles the creation of charts for multiple data series, optionally merging them into a single chart or rendering them separately.
 */
function createMultiSeriesChart(props: CreateMultiSeriesChartProps): RenderFeaturesProps[] {
	const allCreateParams: RenderFeaturesProps[] = [];
	props.data.forEach((seriesData, i) => {
		const result = createDataSeriesChart({ ...props, seriesData, i });
		if (result) {
			allCreateParams.push(result);
		}
	});
	return allCreateParams;
}

/**
 * Sets up and renders a chart for a single data series.
 */
function createDataSeriesChart(props: CreateDataSeriesChartProps): RenderFeaturesProps | null {
	const {
		seriesData,
		i,
		dataKeysArray,
		features,
		config,
		mergedDomains,
		container,
		merge,
		squash,
		height,
		data,
		syncX,
		syncY
	} = props;

	const { width, margin } = config;
	const chartFeatures = features[i];
	const dataKeys = dataKeysArray[i];

	const chartContainer = merge ? container : document.createElement('div');
	if (!merge) container.appendChild(chartContainer);

	const chartHeight = squash ? height / data.length : height;
	const preparedData = prepareValidData({ seriesData, dataKeys });
	if (!preparedData) return null;

	// Use the merged or individual domains depending on syncX and syncY
	const domains = {
		x: syncX ? mergedDomains.x : mergedDomains.x[i], // For unsynced X domain, use the ith domain
		y: syncY ? mergedDomains.y : mergedDomains.y[i] // For unsynced Y domain, use the ith domain
	};

	const newChartWidth = width - margin.left - margin.right;
	const newChartHeight = chartHeight - margin.top - margin.bottom;

	// Call the combined function to create the chart group and initialize scales
	const chartAndScales = initializeScaledChartGroup({
		margin,
		chartContainer,
		width,
		height: chartHeight,
		merge,
		domains,
		chartWidth: newChartWidth,
		chartHeight: newChartHeight,
		xType: props.xType
	});

	if (!chartAndScales) return null;

	const result = setupAndRenderChart({
		preparedData,
		chartContainer,
		height: chartHeight,
		chartFeatures,
		dataKeys,
		domains, // Pass the correct domains based on syncX and syncY
		config,
		merge,
		xType: props.xType,
		chartWidth: newChartWidth,
		chartHeight: newChartHeight,
		chartAndScales
	});

	if (result) {
		return { createParams: result.createParams, chartFeatures };
	}

	return null;
}

export default initializeChart;
