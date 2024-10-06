import type { DataKeys } from "./types.js";

// Utility function to find unique and sorted dates
const getUniqueSortedDates = (dates: (Date | number | string)[]): Date[] => {
    return Array.from(new Set(dates.map(date => {
        if (date instanceof Date) {
            return date.getTime();
        } else if (typeof date === 'number') {
            return date; // Assuming date is a timestamp number
        } else {
            // If it's a string, try to parse it into a Date object
            return new Date(date).getTime();
        }
    })))
        .map(time => new Date(time))
        .sort((a, b) => a.getTime() - b.getTime());
};

// Utility function to find the data point by date
const findDataPointByDate = (series: any, dataKeys: DataKeys, date: number) => {
    return series[dataKeys.data].find((d: any) => {
        const xValue = d[dataKeys.xKey];
        if (xValue instanceof Date) {
            return xValue.getTime() === date;
        } else if (typeof xValue === 'number') {
            return xValue === date; // If `xKey` is a timestamp number
        } else if (typeof xValue === 'string') {
            return new Date(xValue).getTime() === date; // If it's a string, convert to Date and compare
        }
        return false;
    });
};

// DRY: Abstract calculation of min/max values for stacked and non-stacked variants
const calculateMinMaxForDate = (seriesDataArray: any[][], dataKeysArray: DataKeys[], variants: string[], date: number) => {
    let dateMaxPositive = -Infinity;
    let dateMinNegative = Infinity;

    seriesDataArray.forEach((seriesData, i) => {
        const variant = variants[i];
        const dataKeys = dataKeysArray[i];
        let chartPositive = 0;
        let chartNegative = 0;

        seriesData.forEach(series => {
            const dataPoint = findDataPointByDate(series, dataKeys, date);
            if (dataPoint) {
                const value = dataPoint[dataKeys.yKey];
                if (variant === 'stacked') {
                    if (value >= 0) chartPositive += value;
                    else chartNegative += value;
                } else {
                    if (value > dateMaxPositive) dateMaxPositive = value;
                    if (value < dateMinNegative) dateMinNegative = value;
                }
            }
        });

        if (variant === 'stacked') {
            if (chartPositive > dateMaxPositive) dateMaxPositive = chartPositive;
            if (chartNegative < dateMinNegative) dateMinNegative = chartNegative;
        }
    });

    return { dateMaxPositive, dateMinNegative };
};

// Optimized: Merged value domain calculation
export function computeMergedValueDomain(
    seriesDataArray: any[][],
    dataKeysArray: DataKeys[],
    variants: string[]
): [number, number] {
    let minValue = Infinity;
    let maxValue = -Infinity;

    // Collect all unique dates across series
    const allDates = getUniqueSortedDates(
        seriesDataArray.flatMap((seriesData, i) =>
            seriesData.flatMap(series => series[dataKeysArray[i].data].map((d: any) => d[dataKeysArray[i].xKey]))
        )
    );

    // Loop through each unique date and calculate min/max values
    allDates.forEach(date => {
        const { dateMaxPositive, dateMinNegative } = calculateMinMaxForDate(seriesDataArray, dataKeysArray, variants, date.getTime());
        if (dateMaxPositive > maxValue) maxValue = dateMaxPositive;
        if (dateMinNegative < minValue) minValue = dateMinNegative;
    });

    return [Math.min(minValue, 0), Math.max(maxValue, 0)];
}

// Optimized: Merged date domain calculation
export function computeMergedDateDomain(seriesDataArray: any[][], dataKeysArray: DataKeys[]): Date[] {
    const allDates = seriesDataArray.flatMap((seriesData, i) =>
        seriesData.flatMap(series => series[dataKeysArray[i].data].map((d: any) => d[dataKeysArray[i].xKey]))
    );
    return getUniqueSortedDates(allDates);
}

// Optimized: Extract date domain from a single series
export function extractDateDomain(seriesData: any[], dataKeys: DataKeys): Date[] {
    return seriesData.flatMap(series => series[dataKeys.data].map((d: any) => d[dataKeys.xKey]));
}
