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
			xType: props.xType,
			...config,
			margin: config.margin
		},
		chartGroup
	};
}
