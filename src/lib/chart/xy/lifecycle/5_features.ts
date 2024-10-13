// **5. Feature Enrichment Phase**
import * as d3 from 'd3';

import { handleTooltipShow, handleTooltipMove, handleTooltipHide } from '../plot/canvas.js';
import type { ApplyChartFeaturesProps } from '../types.js';

// **Validation Phase**
/**
 * Validates the configuration and properties for applying chart features.
 */
function validateApplyChartFeaturesConfiguration(props: ApplyChartFeaturesProps) {
	const { params, featureRegistry } = props;
	const { createParams, chartFeatures } = params;

	// Validate createParams contains necessary properties
	if (!createParams || typeof createParams !== 'object') {
		throw new Error('Invalid createParams: must be an object containing chart configuration.');
	}
	if (!(createParams.chartTooltip instanceof d3.selection)) {
		throw new Error('Invalid chartTooltip in createParams: must be an instance of HTMLElement.');
	}
	if (typeof createParams.dataKeys !== 'object' || createParams.dataKeys === null) {
		throw new Error('Invalid dataKeys in createParams: must be an object.');
	}
	// Validate chartFeatures is an array
	if (!Array.isArray(chartFeatures)) {
		throw new Error('Invalid chartFeatures: must be an array.');
	}

	// Validate each feature in chartFeatures has valid properties
	chartFeatures.forEach(({ feature, hide, config }, index) => {
		if (typeof feature !== 'string') {
			throw new Error(`Invalid feature at index ${index}: feature must be a string.`);
		}
		if (typeof hide !== 'boolean') {
			throw new Error(`Invalid hide value at index ${index}: hide must be a boolean.`);
		}
		if (config && typeof config !== 'object') {
			throw new Error(`Invalid config at index ${index}: config must be an object.`);
		}
	});

	// Validate featureRegistry is an object
	if (!featureRegistry || typeof featureRegistry !== 'object') {
		throw new Error('Invalid featureRegistry: must be an object.');
	}
}

/**
 * Renders additional chart features such as grids, axes, labels, and data representations.
 */
export function applyChartFeatures(props: ApplyChartFeaturesProps): void {
	// **Validation Phase**
	validateApplyChartFeaturesConfiguration(props);

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
