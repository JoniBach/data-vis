// **4. Data Binding & Chart Rendering Phase**

import * as d3 from 'd3';
import { createTooltip } from '../plot/canvas.js';
import type { FinalizeChartRenderingProps, CreateParams } from '../types.js';

/**
 * Sets up and renders the chart elements based on the data and configurations.
 */

export function finalizeChartRendering(props: FinalizeChartRenderingProps): {
	createParams: CreateParams;
	chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
} | null {
	const {
		chartHeight,
		chartWidth,
		chartContainer,
		chartFeatures,
		dataKeys,
		config,
		preparedData,
		chartAndScales
	} = props;

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
			...config,
			margin: config.margin
		},
		chartGroup
	};
}

/**
 * This phase is responsible for binding the prepared data to the visual elements of the chart and rendering them
 * within the defined SVG container. By using the scales computed in the previous phases, this step ensures that
 * chart elements like bars, lines, and points are appropriately placed according to their data values.
 *
 * The purpose of this step is to visually represent the data points by creating and positioning SVG elements
 * based on the calculated domains and scaling. It ensures that the data becomes visible on the chart and
 * follows the correct layout and dimensions.
 *
 * In addition to rendering the chart elements, this phase also integrates optional features like tooltips,
 * which provide additional interactivity and data insights to the user. The system checks whether the tooltip
 * feature is enabled and sets it up accordingly, making the chart more interactive when users hover over data points.
 *
 * The result of this step is the creation of a visual chart, with all elements rendered and bound to the data.
 * It produces the necessary parameters to be used in subsequent phases, such as interaction handling and
 * feature enrichment.
 */
