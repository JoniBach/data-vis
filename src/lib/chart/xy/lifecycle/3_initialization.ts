// **Initialization Phase**
import * as d3 from 'd3';
import type { CreateChartGroupProps, InitializeScalesProps } from '../types.js';

// **Validation Phase**
/**
 * Validates the configuration and input properties to ensure they are suitable for chart group creation and scale initialization.
 */
function validateInitializationConfiguration(props: {
	margin: CreateChartGroupProps['margin'];
	chartContainer: CreateChartGroupProps['chartContainer'];
	width: CreateChartGroupProps['width'];
	height: CreateChartGroupProps['height'];
	merge: CreateChartGroupProps['merge'];
	domains: InitializeScalesProps['domains'];
	chartWidth: InitializeScalesProps['chartWidth'];
	chartHeight: InitializeScalesProps['chartHeight'];
	xType: InitializeScalesProps['xType'];
}) {
	const { margin, chartContainer, width, height, merge, domains, chartWidth, chartHeight, xType } =
		props;

	// Validate chartContainer is an instance of HTMLElement
	if (!(chartContainer instanceof HTMLElement)) {
		throw new Error('Invalid chartContainer: must be an instance of HTMLElement.');
	}

	// Validate width and height are positive numbers
	if (typeof width !== 'number' || width <= 0) {
		throw new Error('Invalid width: must be a positive number.');
	}
	if (typeof height !== 'number' || height <= 0) {
		throw new Error('Invalid height: must be a positive number.');
	}

	// Validate merge is a boolean value
	if (typeof merge !== 'boolean') {
		throw new Error('Invalid merge: must be a boolean value.');
	}

	// Validate domains is an object with x and y domains
	if (!domains || typeof domains !== 'object' || !('x' in domains) || !('y' in domains)) {
		throw new Error('Invalid domains: must include both x and y domains.');
	}

	// Validate chartWidth and chartHeight are positive numbers
	if (typeof chartWidth !== 'number' || chartWidth <= 0) {
		throw new Error('Invalid chartWidth: must be a positive number.');
	}
	if (typeof chartHeight !== 'number' || chartHeight <= 0) {
		throw new Error('Invalid chartHeight: must be a positive number.');
	}

	// Validate xType is a valid type ('date', 'number', or 'string')
	if (!['date', 'number', 'string'].includes(xType)) {
		throw new Error(`Invalid xType: must be 'date', 'number', or 'string'.`);
	}
}

// ** Main Entry Function: createScaledChartGroup **
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
	// **Validation Phase**
	validateInitializationConfiguration(props);

	const coordinateType = 'cartesian';

	if (coordinateType === 'cartesian') {
		return createCartesianChartGroup(props);
	}

	// Placeholder for other coordinate systems
	throw new Error('Unsupported coordinate system type');
}

// ** Cartesian Chart Group Orchestration Function **
/**
 * Creates the SVG container, chart group, and initializes Cartesian-specific scales.
 */
function createCartesianChartGroup(props) {
	const chartGroup = createChartGroup({
		margin: configureCartesianMargins(props.margin),
		chartContainer: props.chartContainer,
		width: props.width,
		height: props.height,
		merge: props.merge
	});

	const scales = initializeCartesianScales(
		props.domains.x,
		props.domains.y,
		props.chartWidth,
		props.chartHeight,
		props.xType
	);

	return { chartGroup, scales };
}

// ** Step 3a: Create Initial SVG Container **
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

// ** Step 3b: Create Chart Group **
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

// ** Step 3c: Initialize Cartesian Scales **
/**
 * Initializes the scales for Cartesian coordinates based on the domains and chart dimensions.
 */
function initializeCartesianScales(xDomain, yDomain, chartWidth, chartHeight, xType) {
	const scales = {
		x: undefined,
		y: undefined
	};

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

	scales['y'] = d3.scaleLinear().domain(yDomain).range([chartHeight, 0]);

	return scales;
}

// ** Utility Function: Configure Cartesian Margins **
/**
 * Configures default margins for Cartesian charts, ensuring appropriate space for axes.
 */
function configureCartesianMargins(margin) {
	return {
		top: margin.top ?? 20,
		right: margin.right ?? 30,
		bottom: margin.bottom ?? 50,
		left: margin.left ?? 40
	};
}

/**
 * This phase exists to lay the foundational structure of the chart by creating the necessary
 * SVG containers, group elements, and initializing scales. The purpose is to establish a reliable
 * and consistent environment for rendering visual elements, abstracting the complexity of setting up
 * scalable containers. By handling the chart group and scale initialization here, we decouple
 * the specifics of setting up the environment from data binding and rendering, which enhances
 * modularity, scalability, and maintainability. This phase is designed to soon be **coordinate-system agnostic**,
 * allowing flexibility for various chart types, such as Cartesian or Polar, by making necessary
 * initializations adaptable for each coordinate system.
 */
