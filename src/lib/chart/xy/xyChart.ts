// xyChart.ts

// Imports
import * as d3 from 'd3';
import { createBars } from './plot/bar.js';
import { createGrid, createAxis, createLabel } from './plot/canvas.js';
import { createArea, createLine, createBubbles, createPoints } from './plot/point.js';
import type {
	FeatureRegistry,
	ApplyChartFeaturesProps,
	InitializeChartProps,
	CreateMultiSeriesChartProps,
	CreateDataSeriesChartProps
} from './types.js';

// **1. Preparation Phase**
import { validateAndPrepareData } from './lifecycle/1_preperation.js';

// **2. Domain Calculation Phase**
import { calculateDomains } from './lifecycle/2_domain.js';

// **3. Initialization Phase**
import { createScaledChartGroup } from './lifecycle/3_initialization.js';

// **4. Data Binding & Chart Rendering Phase**
import { finalizeChartRendering } from './lifecycle/4_binding.js';

// **5. Feature Enrichment Phase**
import { applyChartFeatures } from './lifecycle/5_features.js';

// **6. Interactivity Phase**
import { initializeEventHandlers } from './lifecycle/6_interactions.js';

// **7. Multi-Series Phase**

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
 * Sets up and renders a chart for a single data series.
 */
function createDataSeriesChart(props: CreateDataSeriesChartProps): ApplyChartFeaturesProps | null {
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
	const preparedData = validateAndPrepareData({ seriesData, dataKeys });
	if (!preparedData) return null;

	// Use the merged or individual domains depending on syncX and syncY
	const domains = {
		x: syncX ? mergedDomains.x : mergedDomains.x[i], // For unsynced X domain, use the ith domain
		y: syncY ? mergedDomains.y : mergedDomains.y[i] // For unsynced Y domain, use the ith domain
	};

	const newChartWidth = width - margin.left - margin.right;
	const newChartHeight = chartHeight - margin.top - margin.bottom;

	// Call the combined function to create the chart group and initialize scales
	const chartAndScales = createScaledChartGroup({
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

	const result = finalizeChartRendering({
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

/**
 * Handles the creation of charts for multiple data series, optionally merging them into a single chart or rendering them separately.
 */
function createMultiSeriesChart(props: CreateMultiSeriesChartProps): ApplyChartFeaturesProps[] {
	const allCreateParams: ApplyChartFeaturesProps[] = [];
	props.data.forEach((seriesData, i) => {
		const result = createDataSeriesChart({ ...props, seriesData, i });
		if (result) {
			allCreateParams.push(result);
		}
	});
	return allCreateParams;
}

/**
 * Serves as the main entry point for chart creation, handling domain computations, rendering, and interactivity setup.
 */
export function initializeChart(props: InitializeChartProps): void {
	const { container, data, dataKeysArray, features, config } = props;
	const { height, squash, syncX, syncY, merge } = config;

	const { mergedXDomain, mergedYDomain } = calculateDomains({
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

	allCreateParams.forEach((params) => {
		applyChartFeatures({ params, featureRegistry });
	});

	initializeEventHandlers();
}

export default initializeChart;
