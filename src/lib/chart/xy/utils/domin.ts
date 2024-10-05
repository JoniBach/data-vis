import type { DataKeys } from "./types.js";

// (7/10): Important domain calculation, but could use performance optimization for large datasets.
export function computeMergedValueDomain(
    seriesDataArray: any[][],
    dataKeysArray: DataKeys[],
    variants: string[]
): [number, number] {
    let minValue = Infinity;
    let maxValue = -Infinity;

    const allDatesSet = new Set<number>();
    for (let i = 0; i < seriesDataArray.length; i++) {
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allDatesSet.add(d[dataKeys.xKey].getTime());
            });
        });
    }
    const allDates = Array.from(allDatesSet);

    allDates.forEach(date => {
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
                    const dataPoint = series[dataKeys.data].find((d: any) => d[dataKeys.xKey].getTime() === date);
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
                    const dataPoint = series[dataKeys.data].find((d: any) => d[dataKeys.xKey].getTime() === date);
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
export function computeMergedDateDomain(seriesDataArray: any[][], dataKeysArray: DataKeys[]): Date[] {
    const allDates: Date[] = [];
    for (let i = 0; i < seriesDataArray.length; i++) {
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allDates.push(d[dataKeys.xKey]);
            });
        });
    }
    const uniqueDates = Array.from(new Set(allDates.map(date => date.getTime()))).map(time => new Date(time));
    uniqueDates.sort((a, b) => a.getTime() - b.getTime());
    return uniqueDates;
}

// (7/10): Efficient for small datasets but could be slow with large data arrays.
export function extractDateDomain(seriesData: any[], dataKeys: DataKeys): Date[] {
    return seriesData.flatMap(series => series[dataKeys.data].map((d: any) => d[dataKeys.xKey]));
}