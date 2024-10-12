// xyChart.ts

// Imports
import * as d3 from 'd3';
import { createBars } from './plot/bar.js';
import {
	createTooltip,
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
	CreateInitialSVGProps,
	CreateChartGroupProps,
	InitializeScalesProps,
	SetupAndRenderChartProps,
	CreateParams,
	ShouldRenderFeatureProps,
	FeatureRegistry,
	RenderFeaturesProps,
	InitializeChartProps,
	CreateMultiSeriesChartProps,
	CreateDataSeriesChartProps
} from './types.js';

// **1. Preparation Phase**
import { prepareValidData } from './lifecycle/preperation.js';

// **2. Domain Calculation Phase**
import { computeDomains } from './lifecycle/domain.js';

// **3. Initialization Phase**
/**
 * Creates the initial SVG element within the specified container.
 */
function createInitialSVG(
	props: CreateInitialSVGProps
): d3.Selection<SVGSVGElement, unknown, null, undefined> | null {
	const { container, width, height, merge } = props;
	if (!(container instanceof HTMLElement)) {
		throw new Error('Invalid container provided. It must be an instance of HTMLElement.');
	}

	if (merge) {
		const existingSvg = d3.select(container).select<SVGSVGElement>('svg');
		if (!existingSvg.empty()) {
			return existingSvg;
		}
	} else {
		d3.select(container).selectAll('*').remove();
	}

	return d3
		.select(container)
		.append('svg')
		.attr('width', width)
		.attr('height', height)
		.attr('role', 'img')
		.attr('aria-label', 'Chart');
}

/**
 * Appends a <g> element to the SVG to contain the chart elements, applying the specified margins.
 */
function createChartGroup(
	props: CreateChartGroupProps
): d3.Selection<SVGGElement, unknown, null, undefined> {
	const { svg, margin } = props;
	return svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
}

/**
 * Initializes the scales based on the domains and chart dimensions.
 */
function initializeScales(props: InitializeScalesProps): { x: unknown; y: unknown } {
	const { domains, chartWidth, chartHeight, xType } = props;
	const scales: { x: unknown; y: unknown } = {
		x: undefined,
		y: undefined
	};

	const xDomain = domains['x'];

	if (xType === 'date') {
		scales['x'] = d3
			.scaleTime()
			.domain(d3.extent(xDomain as Date[]) as [Date, Date])
			.range([0, chartWidth]);
	} else if (xType === 'number') {
		scales['x'] = d3
			.scaleLinear()
			.domain(d3.extent(xDomain as number[]) as [number, number])
			.range([0, chartWidth]);
	} else {
		scales['x'] = d3
			.scaleBand<string>()
			.domain(xDomain as string[])
			.range([0, chartWidth])
			.padding(0.1);
	}

	scales['y'] = d3.scaleLinear().domain(domains['y']).range([chartHeight, 0]);

	return scales;
}

// **4. Data Binding & Chart Rendering Phase**

/**
 * Sets up and renders the chart elements based on the data and configurations.
 */
function setupAndRenderChart(props: SetupAndRenderChartProps): {
	createParams: CreateParams;
	chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
} | null {
	const { chartContainer, seriesData, height, chartFeatures, dataKeys, domains, config, merge } =
		props;
	const { width, margin } = config;
	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	const preparedData = prepareValidData({ seriesData, dataKeys });
	if (!preparedData) return null;

	const svg = createInitialSVG({ container: chartContainer, width, height, merge });
	if (!svg) return null;

	const chartGroup = createChartGroup({ svg, margin });

	// Use computeDomains for xDomain and yDomain calculations
	const { mergedXDomain, mergedYDomain } = computeDomains({
		syncX: !domains?.['x'], // If no existing xDomain, we need to compute it
		syncY: !domains?.['y'], // If no existing yDomain, we need to compute it
		data: [preparedData.seriesData],
		dataKeysArray: [preparedData.dataKeys],
		features: [chartFeatures]
	});

	// Use the computed domains or fall back to existing ones if available
	const xDomainUsed = domains?.['x'] || mergedXDomain;
	const yDomainUsed = domains?.['y'] || mergedYDomain;

	const scales = initializeScales({
		domains: { x: xDomainUsed, y: yDomainUsed },
		chartWidth,
		chartHeight,
		xType: props.xType
	});

	const colorScale = d3
		.scaleOrdinal<string>()
		.domain(preparedData.seriesData.map((d) => d[dataKeys.name] as string))
		.range(d3.schemeCategory10);

	const chartTooltip = createTooltip({
		container: chartContainer,
		showTooltip: shouldRenderFeature({ chartFeatures, featureName: 'tooltip' }),
		config: chartFeatures.find((feature) => feature.feature === 'tooltip')?.config
	});

	return {
		createParams: {
			seriesData: preparedData.seriesData,
			chartGroup,
			colorScale,
			scales,
			chartTooltip,
			chartHeight,
			chartWidth,
			dataKeys: preparedData.dataKeys,
			xType: props.xType,
			...config,
			margin: config.margin
		},
		chartGroup
	};
}

/**
 * Determines whether a specific feature should be rendered based on the provided chart features configuration.
 */
function shouldRenderFeature(props: ShouldRenderFeatureProps): boolean {
	const { chartFeatures, featureName } = props;
	return chartFeatures.some(({ feature, hide }) => feature === featureName && !hide);
}

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

	const chartFeatures = features[i];
	const dataKeys = dataKeysArray[i];

	const chartContainer = merge ? container : document.createElement('div');
	if (!merge) container.appendChild(chartContainer);

	const chartHeight = squash ? height / data.length : height;
	const domains = {
		x: syncX ? mergedDomains.x : undefined,
		y: syncY ? mergedDomains.y : undefined
	};

	const result = setupAndRenderChart({
		chartContainer,
		seriesData,
		height: chartHeight,
		chartFeatures,
		dataKeys,
		domains,
		config,
		merge,
		xType: undefined
	});

	if (result) {
		return { createParams: result.createParams, chartFeatures };
	}
	return null;
}

export default initializeChart;
