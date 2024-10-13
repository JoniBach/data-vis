// **5. Feature Enrichment Phase**

import { handleTooltipShow, handleTooltipMove, handleTooltipHide } from '../plot/canvas.js';
import type { ApplyChartFeaturesProps } from '../types.js';

/**
 * Renders additional chart features such as grids, axes, labels, and data representations.
 */
export function applyChartFeatures(props: ApplyChartFeaturesProps): void {
	const { params, featureRegistry } = props;
	const { createParams, chartFeatures } = params;
	chartFeatures.forEach(({ feature, hide, config }) => {
		if (hide) return;
		const featureFunction = featureRegistry[feature];
		if (featureFunction) {
			const selection = featureFunction(createParams, config) as d3.Selection<
				SVGGElement,
				unknown,
				null,
				undefined
			>;
			if (selection && selection.on) {
				if (['point', 'bubbles', 'bar'].includes(feature)) {
					selection
						.on('mouseover', (event: MouseEvent, data: unknown) => {
							handleTooltipShow({
								chartTooltip: createParams.chartTooltip,
								data,
								dataKeys: createParams.dataKeys
							});
						})
						.on('mousemove', (event: MouseEvent) => {
							handleTooltipMove({ chartTooltip: createParams.chartTooltip, event });
						})
						.on('mouseout', () => {
							handleTooltipHide({ chartTooltip: createParams.chartTooltip });
						});
				}
			}
		} else {
			console.warn(`Feature function not found for feature: ${feature}`);
		}
	});
}

/**
 * This phase is responsible for adding supplementary features to the chart, such as grids, axes, labels, and
 * additional data representations (e.g., areas, points, bars). These features help enhance the chart by making
 * it more informative, user-friendly, and visually engaging.
 *
 * The purpose of this step is to extend the basic chart created in earlier phases with enriched elements
 * that provide context, clarity, and user interaction. For instance, grids can help users read values more
 * easily, axes define the scale of the chart, and labels provide important information like units or categories.
 *
 * This phase is designed to be **modular and flexible**, as each feature is registered in the `featureRegistry`
 * and can be applied conditionally based on the provided chart configuration. This allows users to enable or
 * disable specific features like tooltips or labels, making the chart customizable based on their needs.
 *
 * In addition, this phase supports **interactivity** by attaching event listeners to elements such as points,
 * bubbles, and bars. These interactions typically include tooltips that appear on mouse hover, providing
 * detailed information about specific data points. The system dynamically handles tooltip visibility, movement,
 * and hiding based on user interaction, enhancing user engagement with the chart.
 *
 * The result of this step is a more feature-rich chart with supplementary visual elements and interactive
 * components. These enhancements make the chart more informative and help users derive insights from the data
 * more easily.
 */
