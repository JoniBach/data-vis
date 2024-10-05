import * as d3 from 'd3';
import { createBubbles, createLineOrArea, createPoints } from './xy/plot/point.js';
import { createBarsVariant } from './xy/plot/bar.js';
import { createGrid, createAxis, createLabel, createTooltip, escapeHTML } from './xy/plot/canvas.js';
import { computeMergedValueDomain, computeMergedDateDomain, extractDateDomain } from './xy/utils/domin.js';
import type { FeatureFunction, CreateParams, AxisType, Feature, DataKeys } from './xy/utils/types.js';
import { eventSystem } from './xy/utils/event.js';
import { createInitialSVG, createInitialChartGroup, createInitialScale } from './xy/utils/initial.js';
import { isValidSeriesData } from './xy/utils/validator.js';

// DRY principle: Abstract repeated logic into reusable pure functions
const handleTooltip = (chartTooltip, d, dataKeys) => {
    try {
        const dateStr = escapeHTML(d3.timeFormat("%b %Y")(d[dataKeys.xKey]));
        const valueStr = escapeHTML(d[dataKeys.yKey]);

        chartTooltip.style("visibility", "visible")
            .html(`Date: ${dateStr}<br>Value: ${valueStr}`);
    } catch (error) {
        console.error("Error in tooltip handler:", error);
    }
};

const moveTooltip = (chartTooltip, event) => {
    chartTooltip.style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
};

const hideTooltip = (chartTooltip) => {
    chartTooltip.style("visibility", "hidden");
};

// Attach tooltip events with refactored functions
eventSystem.on('tooltip', handleTooltip);
eventSystem.on('tooltipMove', moveTooltip);
eventSystem.on('tooltipHide', hideTooltip);

// Registry system for features
const featureRegistry: Record<string, FeatureFunction> = {
    tooltip: () => null,
    grid: createGrid,
    axis: createAxis,
    label: createLabel,
    area: (params) => createLineOrArea('area', params),
    line: (params) => createLineOrArea('line', params),
    bubbles: createBubbles,
    point: createPoints,
    bar: (params, config) => createBarsVariant(config.variant || 'grouped', params),
};

// Abstract feature creation
const createFeature = (createParameters: CreateParams, feature: Feature) => {
    if (feature.hide) return;
    const featureFunction = featureRegistry[feature.feature];
    if (!featureFunction) {
        console.warn(`Feature function not found for feature: ${feature.feature}`);
        return;
    }
    featureFunction(createParameters, feature.config);
};

// Create features with DRY implementation
function createFeatures(createParameters: CreateParams, features: Feature[]) {
    features.forEach((feature) => createFeature(createParameters, feature));
}

// DRY: Abstract scale creation logic
const createScales = ({ isBarChart, dateDomainUsed, chartWidth, seriesData, dataKeys }: any) => {
    let dateScale, xScale, barWidth = 0;

    if (isBarChart) {
        xScale = d3.scaleBand()
            .domain(dateDomainUsed.map(d => d.getTime()))
            .range([0, chartWidth])
            .padding(0.1);
        barWidth = xScale.bandwidth();
    } else {
        dateScale = d3.scaleTime()
            .domain(d3.extent(dateDomainUsed) as [Date, Date])
            .range([0, chartWidth]);
    }

    return { dateScale, xScale, barWidth };
};

// DRY: Abstract common chart setup logic
const setupChart = (container, width, height) => {
    d3.select(container).selectAll("*").remove();
    return createInitialSVG({ container, width, height });
};

// DRY: Abstract domain calculations
const calculateDomains = ({ syncX, syncY, seriesDataArray, dataKeysArray, featuresArray }) => {
    let mergedDateDomain, mergedValueDomain;

    if (syncX) mergedDateDomain = computeMergedDateDomain(seriesDataArray, dataKeysArray);
    if (syncY) {
        const variants = featuresArray.map(features => features.find(f => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped');
        mergedValueDomain = computeMergedValueDomain(seriesDataArray, dataKeysArray, variants);
    }

    return { mergedDateDomain, mergedValueDomain };
};

// Common setup logic for XY charts
function setupXYChart(
    container: HTMLElement,
    seriesData: any[],
    width: number,
    height: number,
    features: Feature[],
    dataKeys: DataKeys,
    dateDomain?: Date[],
    valueDomain?: [number, number],
    isBarChart: boolean = false
) {
    const margin = { top: 25, right: 30, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (!isValidSeriesData(seriesData, dataKeys)) {
        console.error("Invalid or no data provided for the chart.");
        return null;
    }

    const svg = setupChart(container, width, height);
    const chartGroup = createInitialChartGroup({ svg, margin });

    const dateDomainUsed = dateDomain || extractDateDomain(seriesData, dataKeys);
    const { dateScale, xScale, barWidth } = createScales({ isBarChart, dateDomainUsed, chartWidth, seriesData, dataKeys });

    valueDomain = valueDomain || computeMergedValueDomain([seriesData], [dataKeys], [features.find(f => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped']);
    const valueScale = createInitialScale(d3.scaleLinear, [chartHeight, 0], valueDomain as [number, number]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(seriesData.map(d => d[dataKeys.name]));
    const chartTooltip = createTooltip(container, shouldShowFeature(features, 'tooltip'), features.find(feature => feature.feature === 'tooltip')?.config);

    const createParameters: CreateParams = {
        seriesData,
        chartGroup,
        colorScale,
        dateScale,
        xScale,
        valueScale,
        chartTooltip,
        chartHeight,
        chartWidth,
        dataKeys,
        barWidth,
    };

    return { createParameters, chartGroup };
}

// Unified function for creating charts
export function createXYChartCore(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number,
    height: number,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    dateDomain?: Date[],
    valueDomain?: [number, number],
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false,
    merge: boolean = false
) {
    d3.select(container).selectAll("*").remove();

    const { mergedDateDomain, mergedValueDomain } = calculateDomains({
        syncX,
        syncY,
        seriesDataArray,
        dataKeysArray,
        featuresArray,
    });

    const isBarChart = featuresArray.some(features => features.some(f => f.feature === 'bar' && !f.hide));

    // Loop through each series to generate either separate or merged charts
    seriesDataArray.forEach((seriesData, i) => {
        const features = featuresArray[i];
        const dataKeys = dataKeysArray[i];

        const chartContainer = merge ? container : document.createElement('div');
        if (!merge) {
            container.appendChild(chartContainer);
        }

        const chartHeight = squash ? height / seriesDataArray.length : height;
        const domainDate = merge && syncX ? mergedDateDomain : dateDomain;
        const domainValue = merge && syncY ? mergedValueDomain : valueDomain;

        const { createParameters } = setupXYChart(
            chartContainer,
            seriesData,
            width,
            chartHeight,
            features,
            dataKeys,
            domainDate,
            domainValue,
            isBarChart
        );

        if (createParameters) {
            createFeatures(createParameters, features);
        }
    });
}

// Wrapper for separate charts using the unified function
export function createSeperateXyCharts(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false
) {
    createXYChartCore(container, seriesDataArray, width, height, featuresArray, dataKeysArray, undefined, undefined, squash, syncX, syncY, false);
}

// Wrapper for merged charts using the unified function
export function createMergedXyCharts(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false
) {
    createXYChartCore(container, seriesDataArray, width, height, featuresArray, dataKeysArray, undefined, undefined, squash, syncX, syncY, true);
}

// Original createSeriesXYChart refactored to use the setup function
export function createSeriesXYChart(
    container: HTMLElement,
    seriesData: any[],
    width: number = 500,
    height: number = 300,
    features: Feature[],
    dataKeys: DataKeys,
    dateDomain?: Date[],
    valueDomain?: [number, number]
) {
    const { createParameters } = setupXYChart(container, seriesData, width, height, features, dataKeys, dateDomain, valueDomain);

    if (createParameters) {
        createFeatures(createParameters, features);
    }
}
export function createXyChart(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    merge: boolean = false,
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false
) {
    if (merge) {
        createMergedXyCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY);
    } else {
        createSeperateXyCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY);
    }
}


// Utility function to check if a feature should be displayed
function shouldShowFeature(features: Feature[], featureName: string): boolean {
    return features.some(feature => feature.feature === featureName && !feature.hide);
}
