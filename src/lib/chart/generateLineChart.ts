import type { DataPoint, SeriesData } from "./lineChart.js";


export interface DataGenerationConfig {
    seriesRange: { min: number; max: number };
    monthsRange: { min: number; max: number };
    valueRange: { min: number; max: number };
    trendDirection?: 'up' | 'down' | 'random' | null | undefined; // Optional, controls the trend
    softCap?: {
        enable: boolean;
        upperLimit?: number;
        lowerLimit?: number;
        adjustmentRange?: number;
    };
    trendVariance?: number; // Controls the amount of randomness (e.g., 1 for smooth, 10 for high variance)
}

export function generateXyData(config: DataGenerationConfig): SeriesData[] {
    const numSeries =
        Math.floor(Math.random() * (config.seriesRange.max - config.seriesRange.min + 1)) +
        config.seriesRange.min;
    const numMonths =
        Math.floor(Math.random() * (config.monthsRange.max - config.monthsRange.min + 1)) +
        config.monthsRange.min;
    const seriesData: SeriesData[] = [];
    const startDate = new Date();
    const variance = config.trendVariance ?? 5; // Default variance is 5 if not provided

    for (let i = 0; i < numSeries; i++) {
        const seriesName = `Series ${i + 1}`;
        const data: DataPoint[] = [];

        // Set an initial value within the configurable value range
        let initialValue =
            Math.floor(Math.random() * (config.valueRange.max - config.valueRange.min + 1)) +
            config.valueRange.min;

        // Determine the trend direction
        let trendDirection = 0;
        if (config.trendDirection === 'up') {
            trendDirection = 1;
        } else if (config.trendDirection === 'down') {
            trendDirection = -1;
        } else if (config.trendDirection === 'random') {
            trendDirection = Math.random() < 0.5 ? -1 : 1; // Random direction per series
        } else if (config.trendDirection === null) {
            trendDirection = 0; // No consistent trend, each step random
        }

        for (let j = 0; j < numMonths; j++) {
            // Adjust the value based on the trend direction and the variance
            let randomChange = 0;

            // If trendDirection is null, make the change totally random for each step
            if (config.trendDirection === null) {
                randomChange = Math.random() * variance * (Math.random() < 0.5 ? -1 : 1); // Completely random up or down
            } else {
                randomChange = (Math.random() * variance + 1) * trendDirection;
            }
            initialValue += randomChange;

            // If soft cap is enabled, apply soft cap logic
            if (config.softCap?.enable) {
                if (config.softCap.upperLimit && initialValue > config.softCap.upperLimit) {
                    initialValue -= Math.random() * (config.softCap.adjustmentRange || 5);
                }
                if (config.softCap.lowerLimit && initialValue < config.softCap.lowerLimit) {
                    initialValue += Math.random() * (config.softCap.adjustmentRange || 5);
                }
            }

            // Ensure value stays within bounds (absolute caps at the min and max values)
            initialValue = Math.max(
                config.valueRange.min,
                Math.min(config.valueRange.max, initialValue)
            );

            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + j);

            data.push({ date, value: Math.round(initialValue) });
        }

        seriesData.push({
            name: seriesName,
            data: data
        });
    }
    console.log('Generating mock XY data:', seriesData);
    return seriesData;
}