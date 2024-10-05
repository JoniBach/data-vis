import { generateXyData } from "./chart/generateXyChart.js";
import XyChart from "./chart/XyChart.svelte";
// Reexport your entry components here
export { XyChart, generateXyData }

export type { DataGenerationConfig } from "./chart/generateXyChart.ts";
export type { SeriesData, Feature, DataPoint } from "./chart/xyChart.js";