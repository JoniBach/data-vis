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

export interface DataKeys {
    name: string;
    data: string;
    date: string;
    value: string;
}

const defaultDataKeys = [
    {
        dataKeys: {
            name: 'name',
            data: 'data',
            date: 'date',
            value: 'value'
        },
        labels: {
            title: 'Dummy Multi Series XY Chart Showing Mock Data',
            xAxis: 'Date',
            yAxis: 'Value'
        }
    },
    {
        dataKeys: {
            name: 'animal',
            data: 'results',
            date: 'treatedOn',
            value: 'results'
        },
        labels: {
            title: 'Vet Appointments',
            xAxis: 'Date Treated',
            yAxis: 'Results'
        }
    },

    {
        dataKeys: {
            name: 'region',
            data: 'salesData',
            date: 'saleDate',
            value: 'amount'
        },
        labels: {
            title: 'Sales Data by Region',
            xAxis: 'Sale Date',
            yAxis: 'Sales Amount'
        }
    },
    {
        dataKeys: {
            name: 'city',
            data: 'weatherStats',
            date: 'recordedAt',
            value: 'temperature'
        },
        labels: {
            title: 'City Weather Data',
            xAxis: 'Date Recorded',
            yAxis: 'Temperature (°C)'
        }
    },
    {
        dataKeys: {
            name: 'company',
            data: 'priceHistory',
            date: 'date',
            value: 'closingPrice'
        },
        labels: {
            title: 'Stock Prices',
            xAxis: 'Date',
            yAxis: 'Closing Price'
        }
    },
    {
        dataKeys: {
            name: 'student',
            data: 'examScores',
            date: 'examDate',
            value: 'score'
        },
        labels: {
            title: 'Student Exam Results',
            xAxis: 'Exam Date',
            yAxis: 'Score'
        }
    },
    {
        dataKeys: {
            name: 'user',
            data: 'activityData',
            date: 'activityDate',
            value: 'caloriesBurned'
        },
        labels: {
            title: 'User Fitness Activity',
            xAxis: 'Activity Date',
            yAxis: 'Calories Burned'
        }
    },
    {
        dataKeys: {
            name: 'accountHolder',
            data: 'transactionHistory',
            date: 'transactionDate',
            value: 'amount'
        },
        labels: {
            title: 'Financial Transactions',
            xAxis: 'Transaction Date',
            yAxis: 'Amount'
        }
    },
    {
        dataKeys: {
            name: 'page',
            data: 'trafficStats',
            date: 'visitDate',
            value: 'pageViews'
        },
        labels: {
            title: 'Website Traffic',
            xAxis: 'Visit Date',
            yAxis: 'Page Views'
        }
    }
];


const randomDataConfig = defaultDataKeys[Math.floor(Math.random() * defaultDataKeys.length)];


export function generateXyData(config: DataGenerationConfig, userDataKeys: DataKeys | null = null): { labels?: DataKeys, data: any[], dataKeys: DataKeys } {
    const dataKeys = userDataKeys ?? randomDataConfig.dataKeys;

    const numSeries =
        Math.floor(Math.random() * (config.seriesRange.max - config.seriesRange.min + 1)) +
        config.seriesRange.min;
    const numMonths =
        Math.floor(Math.random() * (config.monthsRange.max - config.monthsRange.min + 1)) +
        config.monthsRange.min;

    const seriesData: any[] = [];
    const startDate = new Date();
    const variance = config.trendVariance ?? 5; // Default variance is 5 if not provided

    for (let i = 0; i < numSeries; i++) {
        const seriesName = `Series ${i + 1}`;
        const data: any[] = [];

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

            // Push the data using the keys from dataKeys
            data.push({
                [dataKeys.date]: date,
                [dataKeys.value]: Math.round(initialValue)
            });
        }

        // Push the series data using the keys from dataKeys
        seriesData.push({
            [dataKeys.name]: seriesName,
            [dataKeys.data]: data
        });
    }


    const results = { data: seriesData, dataKeys, ...(!userDataKeys ? { labels: randomDataConfig.labels } : {}) }

    console.log('Generating mock XY data with the following data:', results);

    return results;
}
