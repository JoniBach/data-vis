import type { DataKeys } from "./types.js";

// (8/10): Helpful validation function, though redundancy could be reduced by using a margin interface.
export function isValidMargin(margin: { top: number, right: number, bottom: number, left: number }): boolean {
    return ['top', 'right', 'bottom', 'left'].every(prop => typeof margin[prop] === 'number');
}

// (8/10): Necessary validation, but could return more descriptive errors or logs for invalid data.
export function isValidSeriesData(seriesData: any[], dataKeys: DataKeys): boolean {
    return seriesData && seriesData.length > 0 && seriesData[0]?.[dataKeys.data];
}

// Helper function to validate input
export function validateInput(seriesData: any[], xScale: any, valueScale: any, colorScale: any): boolean {
    if (!seriesData || !Array.isArray(seriesData) || seriesData.length === 0) {
        console.error('Invalid seriesData: must be a non-empty array.');
        return false;
    }
    if (!xScale || !valueScale || !colorScale) {
        console.error('xScale, valueScale, or colorScale is not defined for bars.');
        return false;
    }
    return true;
}
