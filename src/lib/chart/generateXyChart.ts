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
    xKey: string;
    yKey: string;
    magnitude?: string; // Add this new property
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
            variant: 'error',
            // variant: 'overlapped',
            // variant: 'stacked',
            // variant: 'grouped',
        },
    },
    {
        feature: 'point',
        hide: false,
    },
    { feature: 'bubbles', hide: false, config: { minRadius: 5, maxRadius: 30 } },  // Adding bubbles feature

    // {
    //     feature: 'area',
    //     hide: true,
    // },
    {
        feature: 'grid',
        hide: false,
    },
    {
        feature: "axis",
        hide: false,
        config: {
            xTickFormat: "%m / %y",  // This will be passed as a string for formatting the x-axis (day/month/year format)
            yTickDecimals: 0,   // Specify the number of decimal places on the y-axis
            xTicks: 5,          // Number of ticks on the x-axis
            yTicks: 10,         // Number of ticks on the y-axis
        }
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
            xKey: 'date',
            yKey: 'averageTemperature',
            magnitude: 'humidityLevel', // Added magnitude
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
            xKey: 'date',
            yKey: 'aqiValue',
            magnitude: 'pollutionConcentration', // Added magnitude
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
            xKey: 'date',
            yKey: 'numberOfVisitors',
            magnitude: 'timeSpentPerVisit', // Added magnitude
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
            xKey: 'date',
            yKey: 'totalSales',
            magnitude: 'numberOfTransactions', // Added magnitude
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
            xKey: 'date',
            yKey: 'stepsWalked',
            magnitude: 'caloriesBurned', // Added magnitude
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
            xKey: 'date',
            yKey: 'numberOfReservations',
            magnitude: 'averagePartySize', // Added magnitude
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
            xKey: 'date',
            yKey: 'downloads',
            magnitude: 'activeUsers', // Added magnitude
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
            xKey: 'date',
            yKey: 'averageRating',
            magnitude: 'reviewCount', // Added magnitude
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
            xKey: 'date',
            yKey: 'closingPrice',
            magnitude: 'dailyVolume', // Added magnitude
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
            xKey: 'date',
            yKey: 'energyConsumed',
            magnitude: 'peakDemand', // Added magnitude
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

// Updated function to generate XY data based on xType

// Updated function to generate XY data based on xType
// Updated function to generate XY data based on xType
export function generateXyData(
    config: DataGenerationConfig,
    userDataKeys: DataKeys | null = null,
    seed: number | null = null,
    usedIndices: Set<number>
): GeneratedData {
    const generatedSeed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
    const randomGenerator = new SeededRandom(generatedSeed);

    const getRandomFloat = (): number => randomGenerator.nextFloat();
    const getRandomInt = (min: number, max: number): number => randomGenerator.nextInt(min, max);

    const getUniqueRandomIndex = (max: number): number => {
        let randomIndex: number;
        do {
            randomIndex = getRandomInt(0, max);
        } while (usedIndices.has(randomIndex));
        usedIndices.add(randomIndex);
        return randomIndex;
    };

    const randomConfigIndex = getUniqueRandomIndex(defaultDataKeys.length - 1);
    const randomDataConfig = defaultDataKeys[randomConfigIndex];

    const dataKeys: DataKeys = userDataKeys ?? randomDataConfig.dataKeys;

    const numSeries = getRandomInt(config.seriesRange.min, config.seriesRange.max);
    const numXPoints = getRandomInt(config.monthsRange.min, config.monthsRange.max); // Number of points on the X-axis

    const seriesData: SeriesData[] = [];
    const startDate = new Date();
    const variance = config.trendVariance ?? 5;

    for (let i = 0; i < numSeries; i++) {
        const seriesName = `Series ${i + 1}`;
        const dataPoints: DataPoint[] = [];

        let currentValue = getRandomInt(config.valueRange.min, config.valueRange.max);
        let currentMagnitude = getRandomInt(config.valueRange.min, config.valueRange.max); // Generate random magnitude

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

        for (let j = 0; j < numXPoints; j++) {
            // Apply randomness and trend
            let randomChange = (getRandomFloat() * variance) * trendDirection;

            currentValue += randomChange;
            currentMagnitude += getRandomFloat() * variance; // Adjust magnitude with a random change

            // Keep values within the configured value range
            currentValue = Math.max(config.valueRange.min, Math.min(config.valueRange.max, currentValue));
            currentMagnitude = Math.max(config.valueRange.min, Math.min(config.valueRange.max, currentMagnitude)); // Keep magnitude within range

            let xKeyValue: Date | number;

            if (config.xType === 'date' || !config.xType) {
                // If xType is 'date' or undefined, generate dates for X-axis
                const date = new Date(startDate);
                date.setMonth(startDate.getMonth() + j); // Increment date by one month
                xKeyValue = date;
            } else if (config.xType === 'number') {
                // If xType is 'number', generate sequential numbers for X-axis
                xKeyValue = j + 1; // Sequential numbers, or use random if desired
            }

            // Push data points with magnitude
            dataPoints.push({
                [dataKeys.xKey]: xKeyValue,
                [dataKeys.yKey]: Math.round(currentValue),
                [dataKeys.magnitude ?? 'magnitude']: Math.round(currentMagnitude), // Add magnitude to data points
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