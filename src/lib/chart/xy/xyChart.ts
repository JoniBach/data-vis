// Imports
import * as d3 from 'd3';
import { createBarsVariant } from '../xy/plot/bar.js';
import {
	createTooltip,
	createGrid,
	createAxis,
	createLabel,
	handleTooltipShow,
	handleTooltipMove,
	handleTooltipHide
} from '../xy/plot/canvas.js';
import { createLineOrArea, createBubbles, createPoints } from '../xy/plot/point.js';
import type { Margin } from './plot/types.js';
import { eventSystem } from './plot/event.js';

// **Type Definitions**
type DataKeys = {
	name: string;
	data: string;
	coordinates: Record<string, string>;
	magnitude?: string;
};

type ValidationResult = { valid: boolean; errors?: string[] };

// **1. Preparation Phase**

/**
 * Validates the margin object to ensure it has valid numerical values.
 */
function validateMargin({ margin }: { margin: Margin }): ValidationResult {
	const requiredProps: (keyof Margin)[] = ['top', 'right', 'bottom', 'left'];
	const errors = requiredProps.reduce<string[]>((acc, prop) => {
		if (typeof margin[prop] !== 'number') {
			acc.push(`Margin property '${prop}' must be a number.`);
		}
		return acc;
	}, []);

	return { valid: errors.length === 0, errors };
}

/**
 * Validates the series data to ensure it meets the required structure.
 */
function validateSeriesData<T>({
	seriesData,
	dataKeys
}: {
	seriesData: T[];
	dataKeys: DataKeys;
}): ValidationResult {
	const errors: string[] = [];

	if (!Array.isArray(seriesData) || seriesData.length === 0) {
		errors.push('seriesData must be a non-empty array.');
	} else {
		const firstSeries = seriesData[0];
		if (!firstSeries || !firstSeries[dataKeys.data]) {
			errors.push(`Data key '${dataKeys.data}' is missing in the first series.`);
		} else {
			// Validate that all coordinate keys are present
			const coordinateKeys = Object.values(dataKeys.coordinates);
			const firstDataPoint = firstSeries[dataKeys.data][0];
			if (firstDataPoint) {
				coordinateKeys.forEach((key) => {
					if (!(key in firstDataPoint)) {
						errors.push(`Coordinate key '${key}' is missing in the data points.`);
					}
				});
			}
		}
	}
	return { valid: errors.length === 0, errors };
}

/**
 * Retrieves the coordinate value, converting Date objects to timestamps if necessary.
 */
function getCoordinateValue(value: unknown): number | string {
	if (value instanceof Date) {
		return value.getTime();
	}
	return value as number | string;
}

/**
 * Prepares and validates the data for further processing.
 */
export function prepareAndValidateData<T>({
	seriesData,
	dataKeys
}: {
	seriesData: T[];
	dataKeys: DataKeys;
}): { seriesData: T[]; dataKeys: DataKeys } | null {
	const validation = validateSeriesData({ seriesData, dataKeys });
	if (!validation.valid) {
		console.error('Data validation failed:', validation.errors);
		return null;
	}
	return { seriesData, dataKeys };
}

// **2. Domain Calculation Phase**

/**
 * Computes the merged value domain for multiple series, considering stacking variants.
 */
function computeMergedValueDomain<T>({
	seriesDataArray,
	dataKeysArray,
	variants
}: {
	seriesDataArray: T[][];
	dataKeysArray: DataKeys[];
	variants: string[];
}): [number, number] {
	let minValue = Infinity;
	let maxValue = -Infinity;

	const allKeysSet = new Set<number | string>();
	seriesDataArray.forEach((seriesData, index) => {
		const dataKeys = dataKeysArray[index];
		const xKey = dataKeys.coordinates['x'];

		seriesData.forEach((series) => {
			const dataPoints = series[dataKeys.data];
			dataPoints.forEach((d: any) => {
				allKeysSet.add(getCoordinateValue(d[xKey]));
			});
		});
	});
	const allKeys = Array.from(allKeysSet);

	allKeys.forEach((key) => {
		let dateMaxPositive = -Infinity;
		let dateMinNegative = Infinity;

		seriesDataArray.forEach((seriesData, index) => {
			const variant = variants[index];
			const dataKeys = dataKeysArray[index];
			const xKey = dataKeys.coordinates['x'];
			const yKey = dataKeys.coordinates['y'];

			if (variant === 'stacked') {
				let chartPositive = 0;
				let chartNegative = 0;

				seriesData.forEach((series) => {
					const dataPoint = series[dataKeys.data].find(
						(d: any) => getCoordinateValue(d[xKey]) === key
					);
					if (dataPoint) {
						const value = dataPoint[yKey];
						if (value >= 0) {
							chartPositive += value;
						} else {
							chartNegative += value;
						}
					}
				});

				dateMaxPositive = Math.max(dateMaxPositive, chartPositive);
				dateMinNegative = Math.min(dateMinNegative, chartNegative);
			} else {
				seriesData.forEach((series) => {
					const dataPoint = series[dataKeys.data].find(
						(d: any) => getCoordinateValue(d[xKey]) === key
					);
					if (dataPoint) {
						const value = dataPoint[yKey];
						dateMaxPositive = Math.max(dateMaxPositive, value);
						dateMinNegative = Math.min(dateMinNegative, value);
					}
				});
			}
		});

		maxValue = Math.max(maxValue, dateMaxPositive);
		minValue = Math.min(minValue, dateMinNegative);
	});

	return [Math.min(minValue, 0), Math.max(maxValue, 0)];
}

/**
 * Computes the merged x-domain for multiple series.
 */
function computeMergedXDomain<T>({
	seriesDataArray,
	dataKeysArray
}: {
	seriesDataArray: T[][];
	dataKeysArray: DataKeys[];
}): (Date | number | string)[] {
	const allKeysSet = new Set<number | string>();
	seriesDataArray.forEach((seriesData, index) => {
		const dataKeys = dataKeysArray[index];
		const xKey = dataKeys.coordinates['x'];
		seriesData.forEach((series) => {
			series[dataKeys.data].forEach((d: any) => {
				allKeysSet.add(getCoordinateValue(d[xKey]));
			});
		});
	});

	const uniqueKeys = Array.from(allKeysSet);
	uniqueKeys.sort((a, b) => {
		if (typeof a === 'number' && typeof b === 'number') return a - b;
		if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
		return a.toString().localeCompare(b.toString());
	});

	return uniqueKeys.map((key) => (typeof key === 'number' ? new Date(key) : key));
}

/**
 * Extracts the unique x-axis keys from a single series.
 */
function extractXDomain<T>({
	seriesData,
	dataKeys
}: {
	seriesData: T[];
	dataKeys: DataKeys;
}): (Date | number | string)[] {
	const keysSet = new Set<number | string>();
	const xKey = dataKeys.coordinates['x'];
	seriesData.forEach((series) => {
		series[dataKeys.data].forEach((d: any) => {
			keysSet.add(getCoordinateValue(d[xKey]));
		});
	});
	return Array.from(keysSet);
}

// **3. Initialization Phase**

/**
 * Creates the initial SVG element within the specified container.
 */
function createInitialSVG({
	container,
	width,
	height,
	merge
}: {
	container: HTMLElement;
	width: number;
	height: number;
	merge: boolean;
}): d3.Selection<SVGSVGElement, unknown, null, undefined> | null {
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
 * Appends a `<g>` element to the SVG to contain the chart elements, applying the specified margins.
 */
function createChartGroup({
	svg,
	margin
}: {
	svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	margin: Margin;
}): d3.Selection<SVGGElement, unknown, null, undefined> {
	const validation = validateMargin({ margin });
	if (!validation.valid) {
		throw new Error(`Margin validation failed: ${validation.errors?.join(', ')}`);
	}

	return svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
}

/**
 * Initializes the scales based on the domains and chart dimensions.
 */
// xyChart.ts (or wherever initializeScales is defined)

function initializeScales({
	domains,
	chartWidth,
	chartHeight,
	xType
}: {
	domains: Record<string, any>;
	chartWidth: number;
	chartHeight: number;
	xType: 'date' | 'number' | 'string';
}): Record<string, any> {
	const scales: Record<string, any> = {};

	const xDomain = domains['x'];

	if (xType === 'date') {
		scales['x'] = d3.scaleTime().domain(d3.extent(xDomain)).range([0, chartWidth]);
	} else if (xType === 'number') {
		scales['x'] = d3.scaleLinear().domain(d3.extent(xDomain)).range([0, chartWidth]);
	} else {
		scales['x'] = d3.scaleBand().domain(xDomain).range([0, chartWidth]).padding(0.1);
	}

	scales['y'] = d3.scaleLinear().domain(domains['y']).range([chartHeight, 0]);

	return scales;
}

// **4. Data Binding & Chart Rendering Phase**

/**
 * Sets up and renders the chart elements based on the data and configurations.
 */
function setupAndRenderChart<T>({
	chartContainer,
	seriesData,
	height,
	chartFeatures,
	dataKeys,
	domains,
	config,
	merge
}: {
	chartContainer: HTMLElement;
	seriesData: T[];
	height: number;
	chartFeatures: any[];
	dataKeys: DataKeys;
	domains?: Record<string, any>;
	config: any;
	merge: boolean;
}): { createParams: any; chartGroup: d3.Selection<SVGGElement, unknown, null, undefined> } | null {
	const { width, margin } = config;
	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	const preparedData = prepareAndValidateData({ seriesData, dataKeys });
	if (!preparedData) return null;

	const svg = createInitialSVG({ container: chartContainer, width, height, merge });
	if (!svg) return null;

	const chartGroup = createChartGroup({ svg, margin });

	const xDomainUsed =
		domains?.['x'] ||
		extractXDomain({ seriesData: preparedData.seriesData, dataKeys: preparedData.dataKeys });
	const yDomainUsed =
		domains?.['y'] ||
		computeMergedValueDomain({
			seriesDataArray: [preparedData.seriesData],
			dataKeysArray: [preparedData.dataKeys],
			variants: [
				chartFeatures.find((f) => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped'
			]
		});

	const scales = initializeScales({
		domains: { x: xDomainUsed, y: yDomainUsed },
		chartWidth,
		chartHeight
	});

	const colorScale = d3
		.scaleOrdinal<string>()
		.domain(preparedData.seriesData.map((d) => d[preparedData.dataKeys.name]))
		.range(d3.schemeCategory10);

	const chartTooltip = createTooltip(
		chartContainer,
		shouldRenderFeature({ chartFeatures, featureName: 'tooltip' }),
		chartFeatures.find((feature) => feature.feature === 'tooltip')?.config
	);

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
			...config
		},
		chartGroup
	};
}

/**
 * Determines whether a specific feature should be rendered based on the provided chart features configuration.
 */
function shouldRenderFeature({
	chartFeatures,
	featureName
}: {
	chartFeatures: any[];
	featureName: string;
}): boolean {
	return chartFeatures.some(({ feature, hide }) => feature === featureName && !hide);
}

// **5. Feature Enrichment Phase**

/**
 * A registry mapping feature names to their corresponding rendering functions.
 */
const featureRegistry: Record<string, (params: any, config?: any) => any> = {
	tooltip: () => null,
	grid: createGrid,
	axis: createAxis,
	label: createLabel,
	area: (params) => createLineOrArea('area', params),
	line: (params) => createLineOrArea('line', params),
	bubbles: createBubbles,
	point: createPoints,
	bar: (params, config) => createBarsVariant(config?.variant || 'grouped', params)
};

/**
 * Renders additional chart features such as grids, axes, labels, and data representations.
 */
function renderFeatures({
	createParams,
	chartFeatures
}: {
	createParams: any;
	chartFeatures: any[];
}): void {
	chartFeatures.forEach(({ feature, hide, config }) => {
		if (hide) return;
		const featureFunction = featureRegistry[feature];
		if (featureFunction) {
			const selection = featureFunction(createParams, config);
			if (selection && selection.on) {
				if (['point', 'bubbles', 'bar'].includes(feature)) {
					selection
						.on('mouseover', (event: any, d: any) => {
							handleTooltipShow(createParams.chartTooltip, d, createParams.dataKeys);
						})
						.on('mousemove', (event: any) => {
							handleTooltipMove(createParams.chartTooltip, event);
						})
						.on('mouseout', () => {
							handleTooltipHide(createParams.chartTooltip);
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
	eventSystem.on('tooltip', (tooltip, data, dataKeys) => {
		handleTooltipShow(tooltip, data, dataKeys);
	});
	eventSystem.on('tooltipMove', (tooltip, event) => {
		handleTooltipMove(tooltip, event);
	});
	eventSystem.on('tooltipHide', (tooltip) => {
		handleTooltipHide(tooltip);
	});
}

// **7. Unified Chart Creation Phase**

/**
 * Serves as the main entry point for chart creation, handling domain computations, rendering, and interactivity setup.
 */
export function initializeChart(props: any): void {
	const { container, data, dataKeysArray, features, config } = props;
	const { height, squash, syncX, syncY, merge } = config;

	const { mergedXDomain, mergedYDomain } = computeDomains({
		syncX,
		syncY,
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
		merge,
		squash,
		height,
		syncX,
		syncY
	});

	allCreateParams.forEach((paramsAndFeatures) => {
		renderFeatures(paramsAndFeatures);
	});

	initializeEventHandlers();
}

/**
 * Computes merged domains for x and y axes if synchronization is enabled.
 */
function computeDomains({
	syncX,
	syncY,
	data,
	dataKeysArray,
	features
}: {
	syncX: boolean;
	syncY: boolean;
	data: any[][];
	dataKeysArray: DataKeys[];
	features: any[];
}): { mergedXDomain?: any[]; mergedYDomain?: [number, number] } {
	const mergedXDomain = syncX
		? computeMergedXDomain({ seriesDataArray: data, dataKeysArray })
		: undefined;
	const mergedYDomain = syncY
		? computeMergedValueDomain({
				seriesDataArray: data,
				dataKeysArray,
				variants: features.map(
					(chartFeatures) =>
						chartFeatures.find((f: any) => f.feature === 'bar' && !f.hide)?.config?.variant ||
						'grouped'
				)
			})
		: undefined;
	return { mergedXDomain, mergedYDomain };
}

// **8. Multi-Series Chart Creation Phase**

/**
 * Handles the creation of charts for multiple data series, optionally merging them into a single chart or rendering them separately.
 */
function createMultiSeriesChart(props: any): any[] {
	const allCreateParams: any[] = [];
	props.data.forEach((seriesData: any, i: number) => {
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
function createDataSeriesChart(props: any): any | null {
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
		merge
	});

	if (result) {
		return { createParams: result.createParams, chartFeatures };
	}
	return null;
}

export default initializeChart;
