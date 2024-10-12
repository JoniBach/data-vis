// chart/xy/types.ts

import * as d3 from 'd3';

// Margin interface
export interface Margin {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

// Validation result interface
export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

// Data keys interface
export interface DataKeys {
	data: string;
	coordinates: { [key: string]: string };
	name: string;
	magnitude?: string;
}

// Data point interface
export interface DataPoint {
	[key: string]: any;
}

// Series interface
export interface Series {
	[key: string]: any;
}

// Prepare and validate data props
export interface ValidateAndPrepareDataProps {
	seriesData: Series[];
	dataKeys: DataKeys;
}

// Get coordinate value props
export interface GetCoordinateValueProps {
	value: number | string | Date;
}

// Compute merged value domain props
export interface ComputeMergedValueDomainProps {
	seriesDataArray: Series[][];
	dataKeysArray: DataKeys[];
	variants: string[];
}

// Compute merged X domain props
export interface ComputeMergedXDomainProps {
	seriesDataArray: Series[][];
	dataKeysArray: DataKeys[];
}

// Extract X domain props
export interface ExtractXDomainProps {
	seriesData: Series[];
	dataKeys: DataKeys;
}

// Create initial SVG props
export interface CreateInitialSVGProps {
	container: HTMLElement;
	width: number;
	height: number;
	merge?: boolean;
}

// Create chart group props
export interface CreateChartGroupProps {
	svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	margin: Margin;
}

// Initialize scales props
export interface InitializeScalesProps {
	domains: { x: any[]; y: [number, number] };
	chartWidth: number;
	chartHeight: number;
	xType?: 'date' | 'number' | 'string';
}

// Setup and render chart props
export interface FinalizeChartRenderingProps {
	chartContainer: HTMLElement;
	seriesData: Series[];
	height: number;
	chartFeatures: ChartFeature[];
	dataKeys: DataKeys;
	domains: { x?: any[]; y?: [number, number] };
	config: ChartConfig;
	merge?: boolean;
	xType?: 'date' | 'number' | 'string';
}

// Should render feature props
export interface ShouldRenderFeatureProps {
	chartFeatures: ChartFeature[];
	featureName: string;
}

// Render features props
export interface ApplyChartFeaturesProps {
	createParams: CreateParams;
	chartFeatures: ChartFeature[];
}

// Initialize chart props
export interface InitializeChartProps {
	container: HTMLElement;
	data: Series[][];
	dataKeysArray: DataKeys[];
	features: ChartFeature[][];
	config: ChartConfig;
}

// Compute domains props
export interface CalculateDomainsProps {
	syncX: boolean;
	syncY: boolean;
	data: Series[][];
	dataKeysArray: DataKeys[];
	features: ChartFeature[][];
}

// Create multi-series chart props
export interface CreateMultiSeriesChartProps {
	container: HTMLElement;
	data: Series[][];
	dataKeysArray: DataKeys[];
	features: ChartFeature[][];
	config: ChartConfig;
	mergedDomains: { x?: any[]; y?: [number, number] };
	merge?: boolean;
	squash?: boolean;
	height: number;
	syncX: boolean;
	syncY: boolean;
}

// Create data series chart props
export interface CreateDataSeriesChartProps {
	seriesData: Series[];
	i: number;
	dataKeysArray: DataKeys[];
	features: ChartFeature[][];
	config: ChartConfig;
	mergedDomains: { x?: any[]; y?: [number, number] };
	container: HTMLElement;
	merge?: boolean;
	squash?: boolean;
	height: number;
	data: Series[][];
	syncX: boolean;
	syncY: boolean;
}

// Chart feature interface
export interface ChartFeature {
	feature: string;
	hide?: boolean;
	config?: any;
}

// Chart config interface
export interface ChartConfig {
	width: number;
	height: number;
	margin: Margin;
	squash?: boolean;
	syncX?: boolean;
	syncY?: boolean;
	merge?: boolean;
}

// Create params interface
export interface CreateParams {
	seriesData: Series[];
	chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
	colorScale: d3.ScaleOrdinal<string, string>;
	scales: { x: any; y: any };
	chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
	chartHeight: number;
	chartWidth: number;
	dataKeys: DataKeys;
	xType?: 'date' | 'number' | 'string';
	margin: Margin;
	[key: string]: any;
}

interface LabelConfig {
	title?: string;
	xAxis?: string;
	yAxis?: string;
}

// Feature registry interface
export interface FeatureRegistry {
	[key: string]: (
		props: CreateParams,
		config?: LabelConfig | undefined
	) => d3.Selection<SVGGElement, unknown, null, undefined> | void;
}

// Event system interface
export interface EventSystem {
	on(event: string, handler: (...args: any[]) => void): void;
	trigger(event: string, ...args: any[]): void;
}
