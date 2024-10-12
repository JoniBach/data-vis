// **4. Data Binding & Chart Rendering Phase**

import * as d3 from 'd3';
import { createTooltip } from '../plot/canvas.js';
import type { SetupAndRenderChartProps, CreateParams } from '../types.js';
import { computeDomains } from './1_domain.js';
import { prepareValidData } from './2_preperation.js';
import { initializeScaledChartGroup } from './3_initialization.js';

/**
 * Sets up and renders the chart elements based on the data and configurations.
 */
export function setupAndRenderChart(props: SetupAndRenderChartProps): {
	createParams: CreateParams;
	chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
} | null {
	const { chartContainer, seriesData, height, chartFeatures, dataKeys, domains, config, merge } =
		props;
	const { width, margin } = config;
	const chartWidth = width - margin.left - margin.right;
	const chartHeight = height - margin.top - margin.bottom;

	const preparedData = prepareValidData({ seriesData, dataKeys });
	if (!preparedData) return null;

	// Use computeDomains for xDomain and yDomain calculations
	const { mergedXDomain, mergedYDomain } = computeDomains({
		syncX: !domains?.['x'], // If no existing xDomain, we need to compute it
		syncY: !domains?.['y'], // If no existing yDomain, we need to compute it
		data: [preparedData.seriesData],
		dataKeysArray: [preparedData.dataKeys],
		features: [chartFeatures]
	});

	// Use the computed domains or fall back to existing ones if available
	const xDomainUsed = domains?.['x'] || mergedXDomain;
	const yDomainUsed = domains?.['y'] || mergedYDomain;

	// Call the combined function to create the chart group and initialize scales
	const chartAndScales = initializeScaledChartGroup({
		margin,
		chartContainer,
		width,
		height,
		merge,
		domains: { x: xDomainUsed, y: yDomainUsed },
		chartWidth,
		chartHeight,
		xType: props.xType
	});

	if (!chartAndScales) return null;

	const { chartGroup, scales } = chartAndScales;

	const colorScale = d3
		.scaleOrdinal<string>()
		.domain(preparedData.seriesData.map((d) => d[dataKeys.name] as string))
		.range(d3.schemeCategory10);

	const chartTooltip = createTooltip({
		container: chartContainer,
		showTooltip: chartFeatures.some(({ feature, hide }) => feature === 'tooltip' && !hide),
		config: chartFeatures.find((feature) => feature.feature === 'tooltip')?.config
	});

	return {
		createParams: {
			seriesData: preparedData.seriesData,
			chartGroup,
			colorScale,
			scales,
			chartTooltip,
			chartHeight,
			chartWidth,
			dataKeys: preparedData.dataKeys,
			xType: props.xType,
			...config,
			margin: config.margin
		},
		chartGroup
	};
}
