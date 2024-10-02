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

const defaultFeatures = (labels) => [
    {
        feature: 'line',
        hide: false
    },
    {
        feature: 'bar',
        hide: false,
        config: {
            variant: 'grouped' // or 'overlapped' or 'stacked'
        }
    },
    {
        feature: 'point',
        hide: false
    },
    // {
    //     feature: 'area',
    //     hide: true
    // },
    {
        feature: 'grid',
        hide: false
    },
    {
        feature: 'axis',
        hide: false
    },
    {
        feature: 'tooltip',
        hide: false,
        config: {
            border: '1px solid #d3d3d3',
            padding: '5px',
            background: '#f9f9f9'
        }
    },
    {
        feature: 'label',
        hide: false,
        config: labels
    }
];
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

class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    // Linear congruential generator (LCG) for pseudo-random number generation
    next(): number {
        return this.seed = this.seed * 16807 % 2147483647;
    }

    nextFloat(): number {
        return (this.next() - 1) / 2147483646;
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }
}

const randomizeFeatures = (labels) => {
    return defaultFeatures({
        ...labels,
        title: `${labels.title} (${Math.floor(Math.random() * 100)})`,
        xAxis: labels.xAxis,
        yAxis: labels.yAxis
    }).map(feature => {
        // Ensure that all 'hide' properties are set to false
        feature.hide = false;
        return feature;
    });
};


export function generateXyData(
    config: DataGenerationConfig,
    userDataKeys: DataKeys | null = null,
    seed: number | null = null,
    usedIndices: Set<number>
): { labels?: DataKeys, data: any[], dataKeys: DataKeys, seed: number } {
    // Use seeded random if a seed is provided, otherwise generate a new seed
    const generatedSeed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
    const randomGenerator = new SeededRandom(generatedSeed);

    const getRandomFloat = () => randomGenerator ? randomGenerator.nextFloat() : Math.random();
    const getRandomInt = (min: number, max: number) => randomGenerator ? randomGenerator.nextInt(min, max) : Math.floor(Math.random() * (max - min + 1)) + min;

    // Function to get a unique random index for defaultDataKeys
    const getUniqueRandomIndex = (max: number): number => {
        let randomIndex;
        do {
            randomIndex = getRandomInt(0, max);
        } while (usedIndices.has(randomIndex));
        usedIndices.add(randomIndex);
        return randomIndex;
    };

    // Select a random but unique data configuration index
    const randomConfigIndex = getUniqueRandomIndex(defaultDataKeys.length - 1);
    const randomDataConfig = defaultDataKeys[randomConfigIndex];

    const dataKeys = userDataKeys ?? randomDataConfig.dataKeys;

    const numSeries = getRandomInt(config.seriesRange.min, config.seriesRange.max);
    const numMonths = getRandomInt(config.monthsRange.min, config.monthsRange.max);

    const seriesData: any[] = [];
    const startDate = new Date();
    const variance = config.trendVariance ?? 5;

    for (let i = 0; i < numSeries; i++) {
        const seriesName = `Series ${i + 1}`;
        const data: any[] = [];

        let initialValue = getRandomInt(config.valueRange.min, config.valueRange.max);

        let trendDirection = 0;
        if (config.trendDirection === 'up') {
            trendDirection = 1;
        } else if (config.trendDirection === 'down') {
            trendDirection = -1;
        } else if (config.trendDirection === 'random') {
            trendDirection = getRandomFloat() < 0.5 ? -1 : 1;
        }

        for (let j = 0; j < numMonths; j++) {
            let randomChange = 0;

            if (config.trendDirection === null) {
                randomChange = getRandomFloat() * variance * (getRandomFloat() < 0.5 ? -1 : 1);
            } else {
                randomChange = (getRandomFloat() * variance + 1) * trendDirection;
            }
            initialValue += randomChange;

            if (config.softCap?.enable) {
                if (config.softCap.upperLimit && initialValue > config.softCap.upperLimit) {
                    initialValue -= getRandomFloat() * (config.softCap.adjustmentRange || 5);
                }
                if (config.softCap.lowerLimit && initialValue < config.softCap.lowerLimit) {
                    initialValue += getRandomFloat() * (config.softCap.adjustmentRange || 5);
                }
            }

            initialValue = Math.max(config.valueRange.min, Math.min(config.valueRange.max, initialValue));

            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + j);

            data.push({
                [dataKeys.date]: date,
                [dataKeys.value]: Math.round(initialValue)
            });
        }

        seriesData.push({
            [dataKeys.name]: seriesName,
            [dataKeys.data]: data
        });
    }

    const features = randomizeFeatures(randomDataConfig.labels); // Generate unique features

    const results = { data: seriesData, dataKeys, seed: generatedSeed, features };

    return results;
}

const generateSingleSeries = (config, userDataKeys, seed, seriesIndex, usedIndices) => {
    // Generate data for a single series with tracking of used indices
    const generated = generateXyData(config, userDataKeys, seed !== null ? seed + seriesIndex : null, usedIndices);
    return {
        data: generated.data,
        dataKeys: generated.dataKeys,
        features: generated.features,
        seed: generated.seed
    };
};

export const generateMultiSeriesData = (config, userDataKeys = null, seed = null) => {
    const numberOfSeries = 3;
    let newSeed = seed;
    const usedIndices = new Set(); // Set to track used indices and ensure uniqueness

    const seriesData = Array.from({ length: numberOfSeries }, (_, i) => {
        const singleSeries = generateSingleSeries(config, userDataKeys, newSeed, i, usedIndices);

        // Update the seed after the first series, to use in subsequent series
        if (newSeed === null && i === 0) {
            newSeed = singleSeries.seed;
        }

        return singleSeries;
    });

    // Combine the results into arrays of data, dataKeys, and features
    const data = seriesData.map(series => series.data);
    const dataKeys = seriesData.map(series => series.dataKeys);
    const features = seriesData.map(series => series.features);

    const response = {
        data,
        dataKeys,
        features,
        seed: newSeed
    };

    console.log('Generating mock XY data with the following data:', response);

    return response;
};
