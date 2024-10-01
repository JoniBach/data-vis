import { generateXyData } from "./chart/generateLineChart.js";
import LineChart from "./chart/LineChart.svelte";
// Reexport your entry components here
export { LineChart, generateXyData }

export type { DataGenerationConfig } from "./chart/generateLineChart.ts";
export type { SeriesData, Feature, DataPoint } from "./chart/lineChart.ts";