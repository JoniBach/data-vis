// types.ts

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
	coordinates: { [key: string]: string }; // e.g., { x: 'date', y: 'value' }
	name: string;
	magnitude?: string;
}

// Data point interface
export interface DataPoint {
	[key: string]: unknown;
}

// Series interface
export interface Series {
	[key: string]: unknown;
	[dataKey: string]: DataPoint[];
}

// Prepare and validate data props
export interface PrepareValidDataProps {
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
	margin: Margin;
	chartContainer: HTMLElement;
	width: number;
	height: number;
	merge?: boolean;
}

// Initialize scales props
export interface InitializeScalesProps {
	domains: { x?: unknown[]; y?: unknown[] };
	chartWidth: number;
	chartHeight: number;
	xType?: 'date' | 'number' | 'string';
}

// Setup and render chart props
export interface SetupAndRenderChartProps {
	xType: 'string' | 'number' | 'date' | undefined;
	chartContainer: HTMLElement;
	preparedData: { seriesData: Series[]; dataKeys: DataKeys };
	height: number;
	chartFeatures: ChartFeature[];
	dataKeys: DataKeys;
	domains: { x?: unknown[]; y?: [number, number] | number };
	config: ChartConfig;
	merge?: boolean;
	chartWidth: number;
	chartHeight: number;
	chartAndScales: {
		chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
		scales: { x: unknown; y: unknown };
	};
}

// Should render feature props
export interface ShouldRenderFeatureProps {
	chartFeatures: ChartFeature[];
	featureName: string;
}

// Render features props
export interface RenderFeaturesProps {
	params: {
		createParams: CreateParams;
		chartFeatures: ChartFeature[];
		featureRegistry: FeatureRegistry;
	};
	featureRegistry: FeatureRegistry;
}

// Initialize event handlers props
export type InitializeEventHandlersProps = unknown;

// Initialize chart props
export interface InitializeChartProps {
	container: HTMLElement;
	data: Series[][];
	dataKeysArray: DataKeys[];
	features: ChartFeature[][];
	config: ChartConfig;
}

// Compute domains props
export interface ComputeDomainsProps {
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
	mergedDomains: { x?: unknown[]; y?: [number, number] };
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
	mergedDomains: { x?: unknown[]; y?: [number, number] };
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
	config?: unknown;
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
	scales: { x: unknown; y: unknown };
	chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
	chartHeight: number;
	chartWidth: number;
	dataKeys: DataKeys;
	xType?: 'date' | 'number' | 'string';
	margin: Margin;
	[key: string]: unknown;
}

// Feature registry interface
export interface FeatureRegistry {
	[key: string]: (props: CreateParams, config?: unknown) => unknown;
}

// Event system interface
export interface EventSystem {
	on(event: string, handler: (...args: unknown[]) => void): void;
	trigger(event: string, ...args: unknown[]): void;
}
