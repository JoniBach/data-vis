// Interfaces and Types

export interface DataGenerationConfig {
    seriesRange: { min: number; max: number };
    monthsRange: { min: number; max: number };
    valueRange: { min: number; max: number };
    trendDirection?: 'up' | 'down' | 'random' | null; // Optional, controls the trend
    softCap?: SoftCapConfig;
    trendVariance?: number; // Controls the amount of randomness (e.g., 1 for smooth, 10 for high variance)
}

export interface SoftCapConfig {
    enable: boolean;
    upperLimit?: number;
    lowerLimit?: number;
    adjustmentRange?: number;
}

export interface DataKeys {
    name: string;
    data: string;
    date: string;
    value: string;
}

export interface LabelConfig {
    title: string;
    xAxis: string;
    yAxis: string;
}

export interface FeatureConfig {
    feature: string;
    hide: boolean;
    config?: Record<string, unknown>;
}

export interface DefaultDataKeyEntry {
    dataKeys: DataKeys;
    labels: LabelConfig;
}

export interface GeneratedData {
    data: SeriesData[];
    dataKeys: DataKeys;
    seed: number;
    features: FeatureConfig[];
}

export interface SeriesData {
    [key: string]: string | DataPoint[];
}

export interface DataPoint {
    [key: string]: Date | number;
}

export interface MultiSeriesResponse {
    data: SeriesData[][];
    dataKeys: DataKeys[];
    features: FeatureConfig[][];
    seed: number;
}

// Default Features Function

const defaultFeatures = (labels: LabelConfig): FeatureConfig[] => [
    {
        feature: 'line',
        hide: false,
    },
    {
        feature: 'bar',
        hide: false,
        config: {
            variant: 'grouped', // or 'overlapped' or 'stacked'
        },
    },
    {
        feature: 'point',
        hide: false,
    },
    // {
    //   feature: 'area',
    //   hide: true,
    // },
    {
        feature: 'grid',
        hide: false,
    },
    {
        feature: 'axis',
        hide: false,
    },
    {
        feature: 'tooltip',
        hide: false,
        config: {
            border: '1px solid #d3d3d3',
            padding: '5px',
            background: '#f9f9f9',
        },
    },
    {
        feature: 'label',
        hide: false,
        config: labels,
    },
];
const defaultDataKeys = [
    {
        dataKeys: {
            name: 'city',
            data: 'temperatureData',
            date: 'date',
            value: 'averageTemperature',
        },
        labels: {
            title: 'Average Temperature Over Time',
            xAxis: 'Date',
            yAxis: 'Temperature (°C)',
        },
    },
    {
        dataKeys: {
            name: 'city',
            data: 'airQualityData',
            date: 'date',
            value: 'aqiValue',
        },
        labels: {
            title: 'Air Quality Index Over Time',
            xAxis: 'Date',
            yAxis: 'AQI Value',
        },
    },
    {
        dataKeys: {
            name: 'website',
            data: 'trafficData',
            date: 'date',
            value: 'numberOfVisitors',
        },
        labels: {
            title: 'Website Traffic Over Time',
            xAxis: 'Date',
            yAxis: 'Number of Visitors',
        },
    },
    {
        dataKeys: {
            name: 'store',
            data: 'salesData',
            date: 'date',
            value: 'totalSales',
        },
        labels: {
            title: 'Store Sales Over Time',
            xAxis: 'Date',
            yAxis: 'Total Sales (USD)',
        },
    },
    {
        dataKeys: {
            name: 'user',
            data: 'fitnessData',
            date: 'date',
            value: 'stepsWalked',
        },
        labels: {
            title: 'Daily Steps Walked Over Time',
            xAxis: 'Date',
            yAxis: 'Steps Walked',
        },
    },
    {
        dataKeys: {
            name: 'restaurant',
            data: 'reservationData',
            date: 'date',
            value: 'numberOfReservations',
        },
        labels: {
            title: 'Restaurant Reservations Over Time',
            xAxis: 'Date',
            yAxis: 'Number of Reservations',
        },
    },
    {
        dataKeys: {
            name: 'app',
            data: 'downloadData',
            date: 'date',
            value: 'downloads',
        },
        labels: {
            title: 'App Downloads Over Time',
            xAxis: 'Date',
            yAxis: 'Number of Downloads',
        },
    },
    {
        dataKeys: {
            name: 'product',
            data: 'reviewData',
            date: 'date',
            value: 'averageRating',
        },
        labels: {
            title: 'Product Average Rating Over Time',
            xAxis: 'Date',
            yAxis: 'Average Rating',
        },
    },
    {
        dataKeys: {
            name: 'company',
            data: 'stockPriceData',
            date: 'date',
            value: 'closingPrice',
        },
        labels: {
            title: 'Company Stock Prices Over Time',
            xAxis: 'Date',
            yAxis: 'Closing Price (USD)',
        },
    },
    {
        dataKeys: {
            name: 'region',
            data: 'electricityUsageData',
            date: 'date',
            value: 'energyConsumed',
        },
        labels: {
            title: 'Electricity Usage Over Time',
            xAxis: 'Date',
            yAxis: 'Energy Consumed (kWh)',
        },
    },
];

// Seeded Random Number Generator Class

class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }

    // Linear congruential generator (LCG) for pseudo-random number generation
    public next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed;
    }

    public nextFloat(): number {
        return (this.next() - 1) / 2147483646;
    }

    public nextInt(min: number, max: number): number {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }
}

// Randomize Features Function

const randomizeFeatures = (labels: LabelConfig): FeatureConfig[] => {
    const updatedLabels: LabelConfig = {
        ...labels,
        title: `${labels.title} (${Math.floor(Math.random() * 100)})`,
    };

    return defaultFeatures(updatedLabels).map((feature) => ({
        ...feature,
        hide: false, // Ensure that all 'hide' properties are set to false
    }));
};

// Generate XY Data Function

export function generateXyData(
    config: DataGenerationConfig,
    userDataKeys: DataKeys | null = null,
    seed: number | null = null,
    usedIndices: Set<number>
): GeneratedData {
    // Initialize seeded random number generator
    const generatedSeed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
    const randomGenerator = new SeededRandom(generatedSeed);

    // Utility functions for random number generation
    const getRandomFloat = (): number => randomGenerator.nextFloat();
    const getRandomInt = (min: number, max: number): number => randomGenerator.nextInt(min, max);

    // Function to get a unique random index for defaultDataKeys
    const getUniqueRandomIndex = (max: number): number => {
        let randomIndex: number;
        do {
            randomIndex = getRandomInt(0, max);
        } while (usedIndices.has(randomIndex));
        usedIndices.add(randomIndex);
        return randomIndex;
    };

    // Select a random but unique data configuration index
    const randomConfigIndex = getUniqueRandomIndex(defaultDataKeys.length - 1);
    const randomDataConfig = defaultDataKeys[randomConfigIndex];

    const dataKeys: DataKeys = userDataKeys ?? randomDataConfig.dataKeys;

    const numSeries = getRandomInt(config.seriesRange.min, config.seriesRange.max);
    const numMonths = getRandomInt(config.monthsRange.min, config.monthsRange.max);

    const seriesData: SeriesData[] = [];
    const startDate = new Date();
    const variance = config.trendVariance ?? 5;

    for (let i = 0; i < numSeries; i++) {
        const seriesName = `Series ${i + 1}`;
        const dataPoints: DataPoint[] = [];

        let currentValue = getRandomInt(config.valueRange.min, config.valueRange.max);

        let trendDirection = 0;
        switch (config.trendDirection) {
            case 'up':
                trendDirection = 1;
                break;
            case 'down':
                trendDirection = -1;
                break;
            case 'random':
                trendDirection = getRandomFloat() < 0.5 ? -1 : 1;
                break;
            default:
                trendDirection = 0;
        }

        for (let j = 0; j < numMonths; j++) {
            let randomChange = 0;

            if (config.trendDirection === null) {
                randomChange = getRandomFloat() * variance * (getRandomFloat() < 0.5 ? -1 : 1);
            } else {
                randomChange = (getRandomFloat() * variance + 1) * trendDirection;
            }

            currentValue += randomChange;

            // Apply soft caps if enabled
            if (config.softCap?.enable) {
                const adjustmentRange = config.softCap.adjustmentRange || 5;
                if (config.softCap.upperLimit !== undefined && currentValue > config.softCap.upperLimit) {
                    currentValue -= getRandomFloat() * adjustmentRange;
                }
                if (config.softCap.lowerLimit !== undefined && currentValue < config.softCap.lowerLimit) {
                    currentValue += getRandomFloat() * adjustmentRange;
                }
            }

            // Ensure value stays within specified range
            currentValue = Math.max(config.valueRange.min, Math.min(config.valueRange.max, currentValue));

            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + j);

            dataPoints.push({
                [dataKeys.date]: date,
                [dataKeys.value]: Math.round(currentValue),
            });
        }

        seriesData.push({
            [dataKeys.name]: seriesName,
            [dataKeys.data]: dataPoints,
        });
    }

    const features = randomizeFeatures(randomDataConfig.labels);

    return {
        data: seriesData,
        dataKeys,
        seed: generatedSeed,
        features,
    };
}

// Generate Single Series Function

const generateSingleSeries = (
    config: DataGenerationConfig,
    userDataKeys: DataKeys | null,
    seed: number | null,
    seriesIndex: number,
    usedIndices: Set<number>
): GeneratedData => {
    const adjustedSeed = seed !== null ? seed + seriesIndex : null;
    return generateXyData(config, userDataKeys, adjustedSeed, usedIndices);
};

// Generate Multi-Series Data Function

export const generateMultiSeriesData = (
    config: DataGenerationConfig,
    userDataKeys: DataKeys | null = null,
    seed: number | null = null
): MultiSeriesResponse => {
    const numberOfSeries = 3;
    let newSeed = seed;
    const usedIndices = new Set<number>();

    const seriesData = Array.from({ length: numberOfSeries }, (_, index) => {
        const singleSeries = generateSingleSeries(config, userDataKeys, newSeed, index, usedIndices);

        if (newSeed === null && index === 0) {
            newSeed = singleSeries.seed;
        }

        return singleSeries;
    });

    // Extract data, dataKeys, and features from each series
    const data = seriesData.map((series) => series.data);
    const dataKeys = seriesData.map((series) => series.dataKeys);
    const features = seriesData.map((series) => series.features);

    const response: MultiSeriesResponse = {
        data,
        dataKeys,
        features,
        seed: newSeed as number, // Type assertion since newSeed will be set after first iteration
    };

    console.log('Generating mock XY data with the following data:', response);

    return response;
};