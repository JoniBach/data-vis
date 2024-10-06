import * as d3 from 'd3';
import { createBubbles, createLineOrArea, createPoints } from './xy/plot/point.js';
import { createBarsVariant } from './xy/plot/bar.js';
import { createGrid, createAxis, createLabel, createTooltip, escapeHTML } from './xy/plot/canvas.js';
import { computeMergedValueDomain, computeMergedDateDomain, extractDateDomain } from './xy/utils/domin.js';
import type { FeatureFunction, CreateParams, AxisType, Feature, DataKeys } from './xy/utils/types.js';
import { eventSystem } from './xy/utils/event.js';
import { createInitialSVG, createInitialChartGroup, createInitialScale } from './xy/utils/initial.js';
import { isValidSeriesData } from './xy/utils/validator.js';

// DRY Principle: Tooltip Handling
const handleTooltip = (chartTooltip, d, dataKeys) => {
    try {
        const xKeyValue = d[dataKeys.xKey];
        const yKeyValue = d[dataKeys.yKey];

        const dateStr = xKeyValue
            ? (xKeyValue instanceof Date
                ? escapeHTML(d3.timeFormat("%b %Y")(xKeyValue))
                : escapeHTML(String(xKeyValue)))
            : 'N/A';

        const valueStr = yKeyValue != null ? escapeHTML(String(yKeyValue)) : 'N/A';

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

// Event Handlers
const attachTooltipEvents = () => {
    eventSystem.on('tooltip', handleTooltip);
    eventSystem.on('tooltipMove', moveTooltip);
    eventSystem.on('tooltipHide', hideTooltip);
};

attachTooltipEvents();

// Feature Registry
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

// Create Features Abstraction
const createFeatures = (createParameters: CreateParams, features: Feature[]) => {
    features.forEach((feature) => {
        if (feature.hide) return;
        const featureFunction = featureRegistry[feature.feature];
        if (featureFunction) {
            featureFunction(createParameters, feature.config);
        } else {
            console.warn(`Feature function not found for feature: ${feature.feature}`);
        }
    });
};

// Scales Creation
const createScales = ({ isBarChart, dateDomainUsed, chartWidth, seriesData, dataKeys, xType }: any) => {
    let xScale;
    let barWidth = 0;

    if (isBarChart) {
        xScale = d3.scaleBand()
            .domain(dateDomainUsed)
            .range([0, chartWidth])
            .padding(0.1);
        barWidth = xScale.bandwidth();
    } else {
        xScale = xType === 'date'
            ? d3.scaleTime().domain(d3.extent(dateDomainUsed, d => new Date(d)) as [Date, Date]).range([0, chartWidth])
            : d3.scaleLinear().domain(d3.extent(seriesData, d => +d[dataKeys.xKey]) as [number, number]).range([0, chartWidth]);
    }

    return { xScale, barWidth };
};

// Chart Setup
const setupChart = (container, width, height) => {
    d3.select(container).selectAll("*").remove();
    return createInitialSVG({ container, width, height });
};

// Domain Calculations
const calculateDomains = ({ syncX, syncY, seriesDataArray, dataKeysArray, featuresArray }) => {
    return {
        mergedDateDomain: syncX ? computeMergedDateDomain(seriesDataArray, dataKeysArray) : undefined,
        mergedValueDomain: syncY ? computeMergedValueDomain(seriesDataArray, dataKeysArray, featuresArray.map(features => features.find(f => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped')) : undefined,
    };
};

// XY Chart Setup
const setupXYChart = (container, seriesData, width, height, features, dataKeys, dateDomain, valueDomain, isBarChart, syncX, syncY, xType, yType) => {
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
    const { xScale, barWidth } = createScales({ isBarChart, dateDomainUsed, chartWidth, seriesData, dataKeys, xType });

    valueDomain = valueDomain || computeMergedValueDomain([
        seriesData
    ], [dataKeys], [features.find(f => f.feature === 'bar' && !f.hide)?.config?.variant || 'grouped']);
    const valueScale = createInitialScale(d3.scaleLinear, [chartHeight, 0], valueDomain as [number, number]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(seriesData.map(d => d[dataKeys.name]));
    const chartTooltip = createTooltip(container, shouldShowFeature(features, 'tooltip'), features.find(feature => feature.feature === 'tooltip')?.config);

    return {
        createParameters: {
            seriesData,
            chartGroup,
            colorScale,
            xScale,
            valueScale,
            chartTooltip,
            chartHeight,
            chartWidth,
            dataKeys,
            barWidth,
            syncX,
            syncY,
            xType,
            yType
        },
        chartGroup
    };
};

// Unified Chart Creation
const createXYChartCore = (container, seriesDataArray, width, height, featuresArray, dataKeysArray, dateDomain, valueDomain, squash, syncX, syncY, merge, xType, yType) => {
    d3.select(container).selectAll("*").remove();

    const { mergedDateDomain, mergedValueDomain } = calculateDomains({
        syncX,
        syncY,
        seriesDataArray,
        dataKeysArray,
        featuresArray,
    });

    const isBarChart = featuresArray.some(features => features.some(f => f.feature === 'bar' && !f.hide));

    seriesDataArray.forEach((seriesData, i) => {
        const features = featuresArray[i];
        const dataKeys = dataKeysArray[i];

        const chartContainer = merge ? container : document.createElement('div');
        if (!merge) container.appendChild(chartContainer);

        const chartHeight = squash ? height / seriesDataArray.length : height;
        const domainDate = merge && syncX ? mergedDateDomain : dateDomain;
        const domainValue = merge && syncY ? mergedValueDomain : valueDomain;

        const { createParameters } = setupXYChart(chartContainer, seriesData, width, chartHeight, features, dataKeys, domainDate, domainValue, isBarChart, syncX, syncY, xType, yType);

        if (createParameters) {
            createFeatures(createParameters, features);
        }
    });
};

// Chart Creation Wrappers
export const createSeperateXyCharts = (container, seriesDataArray, width = 500, height = 300, featuresArray, dataKeysArray, squash = false, syncX = false, syncY = false, xType = 'number', yType = 'number') => {
    createXYChartCore(container, seriesDataArray, width, height, featuresArray, dataKeysArray, undefined, undefined, squash, syncX, syncY, false, xType, yType);
};

export const createMergedXyCharts = (container, seriesDataArray, width = 500, height = 300, featuresArray, dataKeysArray, squash = false, syncX = false, syncY = false, xType = 'number', yType = 'number') => {
    createXYChartCore(container, seriesDataArray, width, height, featuresArray, dataKeysArray, undefined, undefined, squash, syncX, syncY, true, xType, yType);
};

export const createSeriesXYChart = (container, seriesData, width = 500, height = 300, features, dataKeys, dateDomain, valueDomain, syncX = false, syncY = false, xType = 'number', yType = 'number') => {
    const { createParameters } = setupXYChart(container, seriesData, width, height, features, dataKeys, dateDomain, valueDomain, false, syncX, syncY, xType, yType);
    if (createParameters) createFeatures(createParameters, features);
};

export const createXyChart = (container, seriesDataArray, width = 500, height = 300, featuresArray, dataKeysArray, merge = false, squash = false, syncX = false, syncY = false, xType = 'number', yType = 'number') => {
    merge ? createMergedXyCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY, xType, yType) : createSeperateXyCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY, xType, yType);
};

// Feature Display Utility
const shouldShowFeature = (features: Feature[], featureName: string): boolean => features.some(feature => feature.feature === featureName && !feature.hide);