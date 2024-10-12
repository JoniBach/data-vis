import * as d3 from 'd3';
import type { CreateChartGroupProps, InitializeScalesProps } from '../types.js';

// ** Refactored Function **
/**
 * Creates the chart group and initializes the scales based on the provided props.
 */
export function createScaledChartGroup(props: {
	margin: CreateChartGroupProps['margin'];
	chartContainer: CreateChartGroupProps['chartContainer'];
	width: CreateChartGroupProps['width'];
	height: CreateChartGroupProps['height'];
	merge: CreateChartGroupProps['merge'];
	domains: InitializeScalesProps['domains'];
	chartWidth: InitializeScalesProps['chartWidth'];
	chartHeight: InitializeScalesProps['chartHeight'];
	xType: InitializeScalesProps['xType'];
}): {
	chartGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null;
	scales: { x: unknown; y: unknown };
} {
	const { margin, chartContainer, width, height, merge, domains, chartWidth, chartHeight, xType } =
		props;

	// Create the SVG and chart group using existing createChartGroup
	const chartGroup = createChartGroup({
		margin,
		chartContainer,
		width,
		height,
		merge
	});

	// Initialize the scales using the existing initializeScales
	const scales = initializeScales({
		domains,
		chartWidth,
		chartHeight,
		xType
	});

	return { chartGroup, scales };
}

/**
 * Creates the initial SVG element within the specified container.
 */
function createInitialSVG(
	props: CreateChartGroupProps
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
	const { margin, chartContainer, width, height, merge } = props;
	const svg = createInitialSVG({ container: chartContainer, width, height, merge });
	if (!svg) return null;
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
