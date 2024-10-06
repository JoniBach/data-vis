import type { DataKeys } from "./types.js";

// Utility function to handle different types for xKey (Date, number, string)
function getXKeyValue(xKey: any): number | string {
    if (xKey instanceof Date) {
        return xKey.getTime();
    }
    return xKey;
}

// (7/10): Important domain calculation, but could use performance optimization for large datasets.
export function computeMergedValueDomain(
    seriesDataArray: any[][],
    dataKeysArray: DataKeys[],
    variants: string[]
): [number, number] {
    let minValue = Infinity;
    let maxValue = -Infinity;

    const allKeysSet = new Set<number | string>(); // Support number or string keys
    for (let i = 0; i < seriesDataArray.length; i++) {
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allKeysSet.add(getXKeyValue(d[dataKeys.xKey]));
            });
        });
    }
    const allKeys = Array.from(allKeysSet);

    allKeys.forEach(key => {
        let dateMaxPositive = -Infinity;
        let dateMinNegative = Infinity;

        for (let i = 0; i < seriesDataArray.length; i++) {
            const variant = variants[i];
            const seriesData = seriesDataArray[i];
            const dataKeys = dataKeysArray[i];

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

                if (chartPositive > dateMaxPositive) dateMaxPositive = chartPositive;
                if (chartNegative < dateMinNegative) dateMinNegative = chartNegative;
            } else {
                seriesData.forEach(series => {
                    const dataPoint = series[dataKeys.data].find((d: any) => getXKeyValue(d[dataKeys.xKey]) === key);
                    if (dataPoint) {
                        const value = dataPoint[dataKeys.yKey];
                        if (value > dateMaxPositive) dateMaxPositive = value;
                        if (value < dateMinNegative) dateMinNegative = value;
                    }
                });
            }
        }

        if (dateMaxPositive > maxValue) maxValue = dateMaxPositive;
        if (dateMinNegative < minValue) minValue = dateMinNegative;
    });

    minValue = Math.min(minValue, 0);
    maxValue = Math.max(maxValue, 0);

    return [minValue, maxValue];
}

// (7/10): Date merging logic is functional but could benefit from optimization in large datasets.
export function computeMergedDateDomain(seriesDataArray: any[][], dataKeysArray: DataKeys[]): (Date | number | string)[] {
    const allKeys: (Date | number | string)[] = [];
    for (let i = 0; i < seriesDataArray.length; i++) {
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allKeys.push(d[dataKeys.xKey]);
            });
        });
    }
    const uniqueKeys = Array.from(new Set(allKeys.map(getXKeyValue))); // Uniqueness based on type
    uniqueKeys.sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
        return a.toString().localeCompare(b.toString()); // Ensure consistent sorting across types
    });
    return uniqueKeys.map(key => (typeof key === 'number' ? new Date(key) : key)); // Convert back to Date if needed
}

// (7/10): Efficient for small datasets but could be slow with large data arrays.
export function extractDateDomain(seriesData: any[], dataKeys: DataKeys): (Date | number | string)[] {
    return seriesData.flatMap(series => series[dataKeys.data].map((d: any) => d[dataKeys.xKey]));
}