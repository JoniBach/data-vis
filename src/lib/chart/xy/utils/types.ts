export interface CreateChartProps {
	container: HTMLElement; // HTML element where the chart will be rendered
	data: SeriesData[]; // An array of data series
	dataKeysArray: DataKeys[]; // Keys for each data series to reference properties like x, y, name, etc.
	features: Feature[][]; // An array of feature configurations for each series
	config: ChartConfig; // General chart configuration settings
}

// Existing interfaces reused for completeness:
export interface DataPoint {
	date: Date;
	value: number;
}

export interface SeriesData {
	name: string;
	data: DataPoint[];
}

export interface Feature {
	feature: string;
	hide: boolean;
	config?: any;
}

export interface TooltipConfig {
	border?: string;
	padding?: string;
	background?: string;
}

export interface LabelConfig {
	title?: string;
	xAxis?: string;
	yAxis?: string;
}

export interface DataKeys {
	name: string;
	data: string;
	date: string;
	value: string;
	xKey: string;
	yKey: string;
}

export interface Margin {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface ChartConfig {
	width: string; // Width of the entire chart
	height: string; // Height of the entire chart
	squash: boolean; // Whether to compress each chart in case of multiple charts
	syncX: boolean; // Synchronize X axis across charts
	syncY: boolean; // Synchronize Y axis across charts
	yType: string; // Type of the Y axis, e.g., linear
	xType: string; // Type of the X axis, e.g., time or linear
	margin: Margin; // Margin settings for the chart
	merge: boolean; // If true, merge all charts into one container
}

export type AxisType = 'date' | 'string' | 'number';

export type FeatureFunction = (params: CreateParams, config?: any) => void;

export interface CreateParams {
	seriesData: SeriesData[]; // Data used to create each series of the chart
	chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>; // Main group element for the chart
	colorScale: d3.ScaleOrdinal<string, string>; // Color scale used for series
	dateScale?: d3.ScaleTime<number, number>; // Scale for date data
	xScale?: d3.ScaleBand<number>; // X axis scale (could be band or linear)
	valueScale: d3.ScaleLinear<number, number>; // Value scale for Y axis
	stackedValueScale?: d3.ScaleLinear<number, number>; // Optional scale for stacked values
	area?: d3.Area<DataPoint>; // Area configuration (if applicable)
	line?: d3.Line<DataPoint>; // Line configuration (if applicable)
	chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>; // Tooltip selection
	chartHeight: number; // Height of the chart
	chartWidth: number; // Width of the chart
	dataKeys: DataKeys; // Keys for data access
	barWidth: number; // Width of bars (if applicable)
}

export interface TooltipListener {
	(
		chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>,
		event: MouseEvent,
		d: DataPoint
	): void;
}

export interface ListenerMap {
	tooltip: TooltipListener;
	tooltipMove: TooltipListener;
	tooltipHide: (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>) => void;
}

export interface SetupChartParams {
	chartContainer: HTMLElement;
	seriesData: any[];
	height: number;
	chartFeatures: any[];
	dataKeys: types.DataKeys;
	dateDomain?: (Date | number | string)[];
	valueDomain?: [number, number];
	isBarChart: boolean;
	config: types.ChartConfig;
	merge: boolean;
}
export interface setupAndRenderChartRes {
	createParams: types.CreateParams;
	chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
}
