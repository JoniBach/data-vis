import type { DataKeys } from "./types.js";

// Utility function to handle different types for xKey (Date, number, string)
function getXKeyValue(xKey: any): number | string {
    if (xKey instanceof Date) {
        return xKey.getTime();
    }
    return xKey;
}

// Optimized domain calculation for large datasets, improving performance and readability
export function computeMergedValueDomain(
    seriesDataArray: any[][],
    dataKeysArray: DataKeys[],
    variants: string[]
): [number, number] {
    let minValue = Infinity;
    let maxValue = -Infinity;

    // Aggregate all unique keys from series data
    const allKeysSet = new Set<number | string>();
    seriesDataArray.forEach((seriesData, index) => {
        const dataKeys = dataKeysArray[index];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allKeysSet.add(getXKeyValue(d[dataKeys.xKey]));
            });
        });
    });
    const allKeys = Array.from(allKeysSet);

    // Compute min and max values based on all unique keys
    allKeys.forEach(key => {
        let dateMaxPositive = -Infinity;
        let dateMinNegative = Infinity;

        seriesDataArray.forEach((seriesData, index) => {
            const variant = variants[index];
            const dataKeys = dataKeysArray[index];

            if (variant === 'stacked') {
                let chartPositive = 0;
                let chartNegative = 0;

                seriesData.forEach(series => {
                    const dataPoint = series[dataKeys.data].find((d: any) => getXKeyValue(d[dataKeys.xKey]) === key);
                    if (dataPoint) {
                        const value = dataPoint[dataKeys.yKey];
                        if (value >= 0) {
                            chartPositive += value;
                        } else {
                            chartNegative += value;
                        }
                    }
                });

                dateMaxPositive = Math.max(dateMaxPositive, chartPositive);
                dateMinNegative = Math.min(dateMinNegative, chartNegative);
            } else {
                seriesData.forEach(series => {
                    const dataPoint = series[dataKeys.data].find((d: any) => getXKeyValue(d[dataKeys.xKey]) === key);
                    if (dataPoint) {
                        const value = dataPoint[dataKeys.yKey];
                        dateMaxPositive = Math.max(dateMaxPositive, value);
                        dateMinNegative = Math.min(dateMinNegative, value);
                    }
                });
            }
        });

        maxValue = Math.max(maxValue, dateMaxPositive);
        minValue = Math.min(minValue, dateMinNegative);
    });

    return [Math.min(minValue, 0), Math.max(maxValue, 0)];
}

// Optimized date domain merging with improved performance for large datasets
export function computeMergedDateDomain(seriesDataArray: any[][], dataKeysArray: DataKeys[]): (Date | number | string)[] {
    const allKeys = seriesDataArray.flatMap((seriesData, index) => {
        const dataKeys = dataKeysArray[index];
        return seriesData.flatMap(series => series[dataKeys.data].map((d: any) => getXKeyValue(d[dataKeys.xKey])));
    });

    const uniqueKeys = Array.from(new Set(allKeys)); // Uniqueness based on type
    uniqueKeys.sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
        return a.toString().localeCompare(b.toString()); // Ensure consistent sorting across types
    });

    return uniqueKeys.map(key => (typeof key === 'number' ? new Date(key) : key)); // Convert back to Date if needed
}

// Optimized: Efficiently extract date domain for small and large datasets
export function extractDateDomain(seriesData: any[], dataKeys: DataKeys): (Date | number | string)[] {
    return Array.from(new Set(seriesData.flatMap(series => series[dataKeys.data].map((d: any) => getXKeyValue(d[dataKeys.xKey])))));
}
