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
import type { DataKeys } from './generateXyChart.js';
import type { Margin, ListenerMap } from '../xy/utils/types.js';
import { eventSystem } from '../xy/utils/event.js';

// **1. Preparation Phase**
const validateProperties = <T extends object>(
	obj: T,
	properties: (keyof T)[],
	expectedType: string
): boolean => {
	return properties.every((prop) => typeof obj[prop] === expectedType);
};

export function isValidMargin(margin: {
	top: number;
	right: number;
	bottom: number;
	left: number;
}): boolean {
	return validateProperties(margin, ['top', 'right', 'bottom', 'left'], 'number');
}

export function isValidSeriesData<T>(seriesData: T[], dataKeys: DataKeys): boolean {
	if (!Array.isArray(seriesData)) {
		console.error('Invalid seriesData: Must be an array.');
		return false;
	}

	if (seriesData.length === 0) {
		console.error('Invalid seriesData: Array is empty.');
		return false;
	}

	if (!seriesData[0]?.[dataKeys.data]) {
		console.error(
			`Invalid seriesData: Data key "${dataKeys.data}" is missing in the first series.`
		);
		return false;
	}

	return true;
}

const validateNonEmptyArray = <T>(arr: T[], name: string): boolean => {
	if (!Array.isArray(arr) || arr.length === 0) {
		console.error(`Invalid ${name}: Must be a non-empty array.`);
		return false;
	}
	return true;
};

const validateDefined = (variables: any[], names: string[]): boolean => {
	return variables.every((variable, index) => {
		if (variable === undefined || variable === null) {
			console.error(`${names[index]} is not defined.`);
			return false;
		}
		return true;
	});
};

export function validateInput<T>(
	seriesData: T[],
	xScale: any,
	valueScale: any,
	colorScale: any
): boolean {
	if (!validateNonEmptyArray(seriesData, 'seriesData')) {
		return false;
	}

	return validateDefined([xScale, valueScale, colorScale], ['xScale', 'valueScale', 'colorScale']);
}

const logValidationError = (condition: boolean, errorMessage: string): boolean => {
	if (!condition) {
		console.error(errorMessage);
		return false;
	}
	return true;
};

export function combinedValidation<T>(
	seriesData: T[],
	dataKeys: DataKeys,
	xScale: any,
	valueScale: any,
	colorScale: any
): boolean {
	return (
		logValidationError(
			validateNonEmptyArray(seriesData, 'seriesData'),
			'seriesData validation failed.'
		) &&
		logValidationError(isValidSeriesData(seriesData, dataKeys), 'Invalid series data structure.') &&
		logValidationError(
			validateDefined([xScale, valueScale, colorScale], ['xScale', 'valueScale', 'colorScale']),
			'Scale validation failed.'
		)
	);
}

function getXKeyValue(xKey: any): number | string {
	if (xKey instanceof Date) {
		return xKey.getTime();
	}
	return xKey;
}

const prepareAndValidateData = (seriesData, dataKeys) => {
	if (!isValidSeriesData(seriesData, dataKeys)) {
		console.error('Invalid or no data provided for the chart.');
		return null;
	}
	return { seriesData, dataKeys };
};

// **2. Domain Calculation Phase**
const validateArray = <T>(input: T[], name: string): boolean => {
	if (!Array.isArray(input)) {
		console.error(`Invalid ${name} provided. It must be an array.`);
		return false;
	}
	if (input.length !== 2) {
		console.error(`Invalid ${name} array length. It must contain exactly two elements.`);
		return false;
	}
	return true;
};

export function computeMergedValueDomain(
	seriesDataArray: any[][],
	dataKeysArray: DataKeys[],
	variants: string[]
): [number, number] {
	let minValue = Infinity;
	let maxValue = -Infinity;

	// Aggregate all unique keys from series data
	const allKeysSet = new Set<number | string>();
	seriesDataArray.forEach((seriesData, index) => {
		const dataKeys = dataKeysArray[index];
		seriesData.forEach((series) => {
			series[dataKeys.data].forEach((d: any) => {
				allKeysSet.add(getXKeyValue(d[dataKeys.xKey]));
			});
		});
	});
	const allKeys = Array.from(allKeysSet);

	// Compute min and max values based on all unique keys
	allKeys.forEach((key) => {
		let dateMaxPositive = -Infinity;
		let dateMinNegative = Infinity;

		seriesDataArray.forEach((seriesData, index) => {
			const variant = variants[index];
			const dataKeys = dataKeysArray[index];

			if (variant === 'stacked') {
				let chartPositive = 0;
				let chartNegative = 0;

				seriesData.forEach((series) => {
					const dataPoint = series[dataKeys.data].find(
						(d: any) => getXKeyValue(d[dataKeys.xKey]) === key
					);
					if (dataPoint) {
						const value = dataPoint[dataKeys.yKey];
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
						(d: any) => getXKeyValue(d[dataKeys.xKey]) === key
					);
					if (dataPoint) {
						const value = dataPoint[dataKeys.yKey];
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

export function computeMergedDateDomain(
	seriesDataArray: any[][],
	dataKeysArray: DataKeys[]
): (Date | number | string)[] {
	const allKeys = seriesDataArray.flatMap((seriesData, index) => {
		const dataKeys = dataKeysArray[index];
		return seriesData.flatMap((series) =>
			series[dataKeys.data].map((d: any) => getXKeyValue(d[dataKeys.xKey]))
		);
	});

	const uniqueKeys = Array.from(new Set(allKeys)); // Uniqueness based on type
	uniqueKeys.sort((a, b) => {
		if (typeof a === 'number' && typeof b === 'number') return a - b;
		if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
		return a.toString().localeCompare(b.toString()); // Ensure consistent sorting across types
	});

	return uniqueKeys.map((key) => (typeof key === 'number' ? new Date(key) : key)); // Convert back to Date if needed
}

export function extractDateDomain(
	seriesData: any[],
	dataKeys: DataKeys
): (Date | number | string)[] {
	return Array.from(
		new Set(
			seriesData.flatMap((series) =>
				series[dataKeys.data].map((d: any) => getXKeyValue(d[dataKeys.xKey]))
			)
		)
	);
}

const computeDomains = ({ syncX, syncY, data, dataKeysArray, features }) => {
	const mergedDateDomain = syncX ? computeMergedDateDomain(data, dataKeysArray) : undefined;
	const mergedValueDomain = syncY
		? computeMergedValueDomain(
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

// **3. Initialization Phase**
const validateMargin = (margin: Margin): boolean => {
	if (!isValidMargin(margin)) {
		console.error(
			'Invalid margin object provided. Ensure top, right, bottom, and left are numbers.'
		);
		return false;
	}
	return true;
};

export function createInitialScale<T extends string | number | Date>(
	scaleFn: () => d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<T>,
	range: Range,
	domain: Domain<T>
) {
	if (!validateArray(range, 'range') || !validateArray(domain, 'domain')) {
		return null;
	}

	return scaleFn().domain(domain).range(range);
}

export function createInitialSVG({
	container,
	width,
	height
}: {
	container: HTMLElement;
	width: number;
	height: number;
}) {
	if (!(container instanceof HTMLElement)) {
		console.error('Invalid container provided. It must be an instance of HTMLElement.');
		return null;
	}

	return d3
		.select(container)
		.append('svg')
		.attr('width', width)
		.attr('height', height)
		.attr('xmlns', 'http://www.w3.org/2000/svg') // Ensuring proper namespace for SVG
		.attr('role', 'img'); // Adding role attribute for better accessibility
}

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
	return createInitialSVG({ container, width, height });
};

export function createInitialChartGroup({
	svg,
	margin
}: {
	svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	margin: Margin;
}) {
	if (!validateMargin(margin)) {
		return null;
	}

	return svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
}

const initializeScales = ({ dateDomainUsed, chartWidth }) => {
	const xScale = d3.scaleBand().domain(dateDomainUsed).range([0, chartWidth]).padding(0.1);
	return { xScale, barWidth: xScale.bandwidth() };
};

// **4. Drawing Essentials Phase**
const initializeChartGroup = (svg, margin) => {
	return svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
};

export function createAccessibleTitle(
	svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
	title: string
) {
	svg.append('title').text(title);
}

// **5. Data Binding & Chart Rendering Phase**
function shouldRenderFeature(chartFeatures, featureName) {
	return chartFeatures.some(({ feature, hide }) => feature === featureName && !hide);
}

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

	const svg = initializeChartContainer(chartContainer, width, height, merge);
	const chartGroup = initializeChartGroup(svg, margin);

	const dateDomainUsed = dateDomain || extractDateDomain(validatedData, validatedKeys);
	const { xScale, barWidth } = initializeScales({ dateDomainUsed, chartWidth });

	const valueDomainUsed =
		valueDomain ||
		computeMergedValueDomain(
			[validatedData],
			[validatedKeys],
			[chartFeatures.find((f) => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped']
		);

	const valueScale = createInitialScale(d3.scaleLinear, [chartHeight, 0], valueDomainUsed);

	const colorScale = d3
		.scaleOrdinal(d3.schemeCategory10)
		.domain(validatedData.map((d) => d[validatedKeys.name]));

	const chartTooltip = createTooltip(
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

// **6. Feature Enrichment Phase**
const featureRegistry = {
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
							handleTooltipShow(createParams.chartTooltip, d, createParams.dataKeys);
						})
						.on('mousemove', (event) => {
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
};

// **7. Interactivity Phase**

// for some reason thsi doesnt work unless externalised
// const eventSystem = {
// 	listeners: {} as ListenerMap,
// 	on<T extends keyof ListenerMap>(eventType: T, callback: ListenerMap[T]) {
// 		this.listeners[eventType] = callback;
// 	},
// 	trigger(eventType: keyof ListenerMap, ...args: any[]) {
// 		const listener = this.listeners[eventType];
// 		if (listener) {
// 			(listener as (...args: any[]) => void)(...args);
// 		}
// 	}
// };

const initializeEventHandlers = () => {
	eventSystem.on('tooltip', (tooltip, data, dataKeys) => {
		handleTooltipShow(tooltip, data, dataKeys);
	});
	eventSystem.on('tooltipMove', (tooltip, event) => {
		handleTooltipMove(tooltip, event);
	});
	eventSystem.on('tooltipHide', (tooltip) => {
		handleTooltipHide(tooltip);
	});
};

// **8. Unified Chart Creation Phase**
export const initializeChart = (props) => {
	const { container, data, dataKeysArray, features, config } = props;
	const { height, squash, syncX, syncY, merge } = config;

	const { mergedDateDomain, mergedValueDomain } = computeDomains({
		syncX,
		syncY,
		data,
		dataKeysArray,
		features
	});

	if (!merge) {
		clearChartContainer(container);
	}

	const isBarChart = features.some((chartFeatures) =>
		chartFeatures.some((f) => f.feature === 'bar' && !f.hide)
	);

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

	allCreateParams.forEach((paramsAndFeatures) => {
		renderFeatures(paramsAndFeatures);
	});

	// Initialize the event handlers to enable tooltips and other interactions.
	initializeEventHandlers();
};

// **9. Multi-Series Chart Creation (Optional Phase)**
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

	const chartContainer = merge ? container : document.createElement('div');
	if (!merge) container.appendChild(chartContainer);

	const chartHeight = squash ? height / data.length : height;
	const dateDomain = syncX ? mergedDateDomain : undefined;
	const domainValue = syncY ? mergedValueDomain : undefined;

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

export default initializeChart;
