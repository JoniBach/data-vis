import { generateXyData } from './chart/xy/generateXyChart.js';
import XyChart from './chart/xy/XyChart.svelte';
// Reexport your entry components here
export { XyChart, generateXyData };

export type { DataGenerationConfig } from './chart/xy/generateXyChart.js';
export type { SeriesData, Feature, DataPoint } from './chart/xyChart.js';
