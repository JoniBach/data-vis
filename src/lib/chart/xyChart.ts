import * as d3 from 'd3';
import { createBubbles, createLineOrArea, createPoints } from './xy/plot/point.js';
import { createBarsVariant } from './xy/plot/bar.js';
import {
	createGrid,
	createAxis,
	createLabel,
	createTooltip,
	escapeHTML
} from './xy/plot/canvas.js';
import {
	computeMergedValueDomain,
	computeMergedDateDomain,
	extractDateDomain
} from './xy/utils/domin.js';
import type {
	FeatureFunction,
	CreateParams,
	AxisType,
	Feature,
	DataKeys,
	ChartConfig
} from './xy/utils/types.js';
import { eventSystem } from './xy/utils/event.js';
import {
	createInitialSVG,
	createInitialChartGroup,
	createInitialScale
} from './xy/utils/initial.js';
import { isValidSeriesData } from './xy/utils/validator.js';

// DRY Principle: Tooltip Handling
const handleTooltip = (
	chartTooltip: d3.Selection<HTMLElement, unknown, null, undefined>,
	d: any,
	dataKeys: DataKeys
) => {
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

const moveTooltip = (
	chartTooltip: d3.Selection<HTMLElement, unknown, null, undefined>,
	event: MouseEvent
) => {
	chartTooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
};

const hideTooltip = (chartTooltip: d3.Selection<HTMLElement, unknown, null, undefined>) => {
	chartTooltip.style('visibility', 'hidden');
};

// Event Handlers
const attachTooltipEvents = (): void => {
	eventSystem.on('tooltip', handleTooltip);
	eventSystem.on('tooltipMove', moveTooltip);
	eventSystem.on('tooltipHide', hideTooltip);
};

attachTooltipEvents();

// Feature Registry
const featureRegistry: Record<string, FeatureFunction> = {
	tooltip: () => null,
	grid: createGrid,
	axis: createAxis,
	label: createLabel,
	area: (params: CreateParams) => createLineOrArea('area', params),
	line: (params: CreateParams) => createLineOrArea('line', params),
	bubbles: createBubbles,
	point: createPoints,
	bar: (params: CreateParams, config: any) =>
		createBarsVariant(config?.variant || 'grouped', params)
};

// Create Features Abstraction
const createFeatures = (createParameters: CreateParams, chartFeatures: Feature[]): void => {
	chartFeatures.forEach(({ feature, hide, config }) => {
		if (hide) return;
		const featureFunction = featureRegistry[feature];
		if (featureFunction) {
			featureFunction(createParameters, config);
		} else {
			console.warn(`Feature function not found for feature: ${feature}`);
		}
	});
};

// Scales Creation
const createScales = ({
	isBarChart,
	dateDomainUsed,
	chartWidth,
	seriesData,
	dataKeys,
	xType
}: {
	isBarChart: boolean;
	dateDomainUsed: any[];
	chartWidth: number;
	seriesData: any[];
	dataKeys: DataKeys;
	xType: AxisType;
}) => {
	let xScale;
	// if (isBarChart) {
	xScale = d3.scaleBand().domain(dateDomainUsed).range([0, chartWidth]).padding(0.1);
	return { xScale, barWidth: xScale.bandwidth() };
	// }

	// if (xType === 'date' && dateDomainUsed?.length > 0) {
	//     xScale = d3.scaleTime()
	//         .domain(d3.extent(dateDomainUsed, d => new Date(d)) as [Date, Date])
	//         .range([0, chartWidth]);
	// } else if (seriesData?.length > 0) {
	//     xScale = d3.scaleLinear()
	//         .domain(d3.extent(seriesData, d => +d[dataKeys.xKey]) as [number, number])
	//         .range([0, chartWidth]);
	// } else {
	//     xScale = d3.scaleLinear()
	//         .domain([0, 1])
	//         .range([0, chartWidth]);
	// }

	// return { xScale, barWidth: 0 };
};

// Chart Setup
const setupChart = (
	container: HTMLElement,
	width: number,
	height: number
): d3.Selection<SVGSVGElement, unknown, null, undefined> => {
	d3.select(container).selectAll('*').remove();
	return createInitialSVG({ container, width, height });
};

// Domain Calculations
const calculateDomains = ({
	syncX,
	syncY,
	data,
	dataKeysArray,
	features
}: {
	syncX: boolean;
	syncY: boolean;
	data: any[];
	dataKeysArray: DataKeys[];
	features: Feature[][];
}) => {
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

// XY Chart Setup
const setupXYChart = (
	container: HTMLElement,
	seriesData: any[],
	height: number,
	chartFeatures: Feature[],
	dataKeys: DataKeys,
	dateDomain: any[],
	valueDomain: any[],
	isBarChart: boolean,
	config: ChartConfig
) => {
	const {
		width,
		// height,
		squash,
		syncX,
		syncY,
		yType,
		xType,
		margin
	} = config;

	console.log(config);

	// const margin = { top: 25, right: 30, bottom: 50, left: 50 };
	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	if (!isValidSeriesData(seriesData, dataKeys)) {
		console.error('Invalid or no data provided for the chart.');
		return null;
	}

	const svg = setupChart(container, width, height);
	const chartGroup = createInitialChartGroup({ svg, margin });

	const dateDomainUsed = dateDomain || extractDateDomain(seriesData, dataKeys);
	const { xScale, barWidth } = createScales({
		isBarChart,
		dateDomainUsed,
		chartWidth,
		seriesData,
		dataKeys,
		xType
	});
	valueDomain =
		valueDomain ||
		computeMergedValueDomain(
			[seriesData],
			[dataKeys],
			[chartFeatures.find((f) => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped']
		);
	const valueScale = createInitialScale(
		d3.scaleLinear,
		[chartHeight, 0],
		valueDomain as [number, number]
	);

	const colorScale = d3
		.scaleOrdinal(d3.schemeCategory10)
		.domain(seriesData.map((d) => d[dataKeys.name]));
	const chartTooltip = createTooltip(
		container,
		shouldShowFeature(chartFeatures, 'tooltip'),
		chartFeatures.find((feature) => feature.feature === 'tooltip')?.config
	);

	return {
		createParameters: {
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
const createXYChartCore = (props, dateDomain: any[], valueDomain: any[]) => {
	const { container, data, dataKeysArray, features, config } = props;
	const { height, squash, syncX, syncY, merge } = config;

	d3.select(container).selectAll('*').remove();

	const { mergedDateDomain, mergedValueDomain } = calculateDomains({
		syncX,
		syncY,
		data,
		dataKeysArray,
		features
	});

	const isBarChart = features.some((chartFeatures) =>
		chartFeatures.some((f) => f.feature === 'bar' && !f.hide)
	);

	data.forEach((seriesData, i) => {
		const chartFeatures = features[i];
		const dataKeys = dataKeysArray[i];

		const chartContainer = merge ? container : document.createElement('div');
		if (!merge) container.appendChild(chartContainer);

		const chartHeight = squash ? height / data.length : height;
		const domainDate = syncX ? mergedDateDomain : dateDomain;
		const domainValue = syncY ? mergedValueDomain : valueDomain;

		const { createParameters } = setupXYChart(
			chartContainer,
			seriesData,
			chartHeight,
			chartFeatures,
			dataKeys,
			domainDate,
			domainValue,
			isBarChart,
			config
		);

		if (createParameters) {
			createFeatures(createParameters, chartFeatures);
		}
	});
};

// Chart Creation Wrappers
export const createSeperateXyCharts = (props) => {
	createXYChartCore(props, undefined, false);
};

export const createMergedXyCharts = (props) => {
	createXYChartCore(props, undefined, true);
};

export const createXyChart = (props) =>
	props.config.merge ? createMergedXyCharts(props) : createSeperateXyCharts(props);

// Feature Display Utility
const shouldShowFeature = (chartFeatures: Feature[], featureName: string): boolean =>
	chartFeatures.some(({ feature, hide }) => feature === featureName && !hide);
