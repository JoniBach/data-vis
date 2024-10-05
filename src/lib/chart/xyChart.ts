import * as d3 from 'd3';
import { createBubbles, createLineOrArea, createPoints } from './xy/plot/point.js';
import { createBarsVariant } from './xy/plot/bar.js';
import { createGrid, createAxis, createLabel, createTooltip, escapeHTML } from './xy/plot/canvas.js';
import { computeMergedValueDomain, computeMergedDateDomain, extractDateDomain } from './xy/utils/domin.js';
import type { FeatureFunction, CreateParams, AxisType, Feature, DataKeys } from './xy/utils/types.js';
import { eventSystem } from './xy/utils/event.js';
import { createInitialSVG, createInitialChartGroup, createInitialScale } from './xy/utils/initial.js';
import { isValidSeriesData } from './xy/utils/validator.js';




// (8/10): Good event handler but should include better type safety and error handling.
eventSystem.on('tooltip', (chartTooltip, event, d, dataKeys: DataKeys) => {
    try {
        const dateStr = escapeHTML(d3.timeFormat("%b %Y")(d[dataKeys.xKey]));
        const valueStr = escapeHTML(d[dataKeys.yKey]);

        chartTooltip.style("visibility", "visible")
            .html(`Date: ${dateStr}<br>Value: ${valueStr}`);
    } catch (error) {
        console.error("Error in tooltip handler:", error);
    }
});

// (7/10): Simple yet effective; could be extended for touch events and better device support.
eventSystem.on('tooltipMove', (chartTooltip, event) => {
    chartTooltip.style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
});

// (7/10): Basic but functional; consider hiding tooltip gracefully with transitions.
eventSystem.on('tooltipHide', (chartTooltip) => {
    chartTooltip.style("visibility", "hidden");
});

// (9/10): Smart registry system for features, allowing extendability without modifying core logic.
const featureRegistry: Record<string, FeatureFunction> = {
    tooltip: () => null, // Tooltips can be safely ignored when hidden
    grid: createGrid,
    axis: createAxis,
    label: createLabel,
    area: (params) => createLineOrArea('area', params),
    line: (params) => createLineOrArea('line', params),
    bubbles: createBubbles,  // New feature for bubble charts
    point: createPoints,
    bar: (params, config) => createBarsVariant(config.variant || 'grouped', params),
};


// (8/10): Highly customizable feature creation, though error handling for unknown features could be more explicit.
function createFeatures(createParameters: CreateParams, features: Feature[]) {
    features.forEach(({ feature, hide, config }) => {
        const featureFunction = featureRegistry[feature];

        // Skip the feature if it's hidden
        if (hide) {
            return;
        }

        // Check if the feature function exists in the registry
        if (!featureFunction) {
            console.warn(`Feature function not found for feature: ${feature}`);
            return;
        }

        // Call the feature creation function with parameters and configuration
        featureFunction(createParameters, config);
    });
}




// (9/10): Well-structured and flexible chart creator, though it has room for performance improvements in large datasets.
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
    try {
        const margin = { top: 25, right: 30, bottom: 50, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        d3.select(container).selectAll("*").remove();

        if (!isValidSeriesData(seriesData, dataKeys)) {
            console.error("Invalid or no data provided for the chart.");
            return;
        }

        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });

        const isBarChart = features.some(feature => feature.feature === 'bar' && !feature.hide);
        const dateDomainUsed = dateDomain || extractDateDomain(seriesData, dataKeys);

        const { dateScale, xScale, barWidth } = createScales({
            isBarChart,
            dateDomainUsed,
            chartWidth,
            seriesData,
            dataKeys
        });

        const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
        const barVariant = barFeature?.config?.variant || 'grouped';

        valueDomain = valueDomain || computeMergedValueDomain([seriesData], [dataKeys], [barVariant]);

        const valueScale = createInitialScale(d3.scaleLinear, [chartHeight, 0], valueDomain as [number, number]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(seriesData.map(d => d[dataKeys.name]));

        const area = dateScale ? createLineOrArea('area', { colorScale, dateScale, valueScale, ...arguments[0] }) : undefined;
        const line = dateScale ? createLineOrArea('line', { colorScale, dateScale, valueScale, ...arguments[0] }) : undefined;

        const chartTooltip = createTooltip(
            container,
            shouldShowFeature(features, 'tooltip'),
            features.find(feature => feature.feature === 'tooltip')?.config
        );

        const createParameters: CreateParams = {
            seriesData,
            chartGroup,
            colorScale,
            dateScale,
            xScale,
            valueScale,
            area,
            line,
            chartTooltip,
            chartHeight,
            chartWidth,
            dataKeys,
            barWidth,
        };

        createFeatures(createParameters, features);
    } catch (error) {
        console.error("Error creating chart:", error);
    }
}

// (8/10): Solid scaling logic, though barWidth calculation could be optimized for larger data sets.
function createScales({ isBarChart, dateDomainUsed, chartWidth, seriesData, dataKeys }: any) {
    let dateScale: d3.ScaleTime<number, number> | undefined;
    let xScale: d3.ScaleBand<number> | undefined;
    let barWidth = 0;

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
}
// (8/10): Simple utility function to control feature display, could improve readability with better typing.
function shouldShowFeature(features: Feature[], featureName: string): boolean {
    return features.some(feature => feature.feature === featureName && !feature.hide);
}

// (8/10): Clean and logical, but lacks differentiation between merged and non-merged states.
export function createSeperateXyCharts(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false,
    xType: AxisType = 'date',
    yType: AxisType = 'date',

) {
    d3.select(container).selectAll("*").remove();

    let mergedDateDomain: Date[] | undefined;
    let mergedValueDomain: [number, number] | undefined;

    if (syncX) {
        mergedDateDomain = computeMergedDateDomain(seriesDataArray, dataKeysArray);
    }

    if (syncY) {
        const variants = featuresArray.map(features => {
            const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
            return barFeature?.config?.variant || 'grouped';
        });

        mergedValueDomain = computeMergedValueDomain(seriesDataArray, dataKeysArray, variants);
    }

    for (let i = 0; i < seriesDataArray.length; i++) {
        const features = featuresArray[i];
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];

        const dateDomain = syncX ? mergedDateDomain : undefined;
        const valueDomain = syncY ? mergedValueDomain : undefined;

        const chartContainer = document.createElement('div');
        container.appendChild(chartContainer);

        const chartHeight = squash ? height / seriesDataArray.length : height;

        createSeriesXYChart(
            chartContainer,
            seriesData,
            width,
            chartHeight,
            features,
            dataKeys,
            dateDomain,
            valueDomain
        );
    }
}

// (9/10): A well-designed function for merged multi-series line charts.
export function createMergedXyCharts(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false,
    xType: AxisType = 'date',
    yType: AxisType = 'date'

) {
    try {
        // Set up the margin and the chart dimensions
        const margin = { top: 25, right: 30, bottom: 50, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Remove any existing content in the container
        d3.select(container).selectAll("*").remove();

        // Compute the merged date domain (X-axis) if syncX is true
        const dateDomain = syncX ? computeMergedDateDomain(seriesDataArray, dataKeysArray) : undefined;

        // Compute the merged value domain (Y-axis) if syncY is true
        const variants = featuresArray.map(features => {
            const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
            return barFeature?.config?.variant || 'grouped';
        });
        const valueDomain = syncY ? computeMergedValueDomain(seriesDataArray, dataKeysArray, variants) : undefined;

        // Create an SVG for the merged chart
        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });

        // We need to compute the scales for the merged chart
        const isBarChart = featuresArray.some(features => features.some(f => f.feature === 'bar' && !f.hide));
        const { dateScale, xScale, barWidth } = createScales({
            isBarChart,
            dateDomainUsed: dateDomain || extractDateDomain(seriesDataArray[0], dataKeysArray[0]),
            chartWidth,
            seriesData: seriesDataArray[0], // The first series to determine the domain
            dataKeys: dataKeysArray[0],
        });

        // Set up the value scale (Y-axis) for the merged chart
        const finalValueDomain = valueDomain || computeMergedValueDomain(seriesDataArray, dataKeysArray, variants);
        const valueScale = createInitialScale(d3.scaleLinear, [chartHeight, 0], finalValueDomain as [number, number]);

        // Define the color scale for multiple series
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(seriesDataArray.flatMap(series => series.map(d => d[dataKeysArray[0].name])));

        // Set up tooltip if needed
        const chartTooltip = createTooltip(
            container,
            featuresArray.some(features => shouldShowFeature(features, 'tooltip')),
            featuresArray.find(features => features.some(feature => feature.feature === 'tooltip'))?.[0].config
        );

        // Now, we need to handle each seriesDataArray and merge it into the same SVG.
        seriesDataArray.forEach((seriesData, i) => {
            const dataKeys = dataKeysArray[i];
            const features = featuresArray[i];

            const area = dateScale ? createLineOrArea('area', {
                seriesData,
                chartGroup,
                colorScale,
                dateScale,
                valueScale,
                chartTooltip,
                chartHeight,
                chartWidth,
                dataKeys,
                barWidth,
            }) : undefined;

            const line = dateScale ? createLineOrArea('line', {
                seriesData,
                chartGroup,
                colorScale,
                dateScale,
                valueScale,
                chartTooltip,
                chartHeight,
                chartWidth,
                dataKeys,
                barWidth,
            }) : undefined;

            // Create the parameters for the current series
            const createParameters: CreateParams = {
                seriesData,
                chartGroup,
                colorScale,
                dateScale,
                xScale,
                valueScale,
                area,
                line,
                chartTooltip,
                chartHeight,
                chartWidth,
                dataKeys,
                barWidth,
            };

            // Create features (axes, lines, bars, grid, etc.) for the current series
            createFeatures(createParameters, features);
        });

    } catch (error) {
        console.error("Error creating merged chart:", error);
    }
}


// (7/10): Solid chart creation but lacks clear differentiation between merged and non-merged variants.
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
    syncY: boolean = false,
    xType: AxisType = 'date',
    yType: AxisType = 'date'
) {
    if (merge) {
        createMergedXyCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY, xType, yType);
    } else {
        createSeperateXyCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY, xType, yType);
    }
}
