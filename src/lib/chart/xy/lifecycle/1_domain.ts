// **2. Domain Calculation Phase**

import type {
	GetCoordinateValueProps,
	ComputeMergedValueDomainProps,
	ComputeDomainsProps,
	ComputeMergedXDomainProps
} from '../types.js';

/**
 * Computes the merged value domain for multiple series, considering stacking variants.
 */

function getCoordinateValue(props: GetCoordinateValueProps): number | string {
	const { value } = props;
	if (value instanceof Date) {
		return value.getTime();
	}
	return value;
}
function computeMergedValueDomain(props: ComputeMergedValueDomainProps): [number, number] {
	const { seriesDataArray, dataKeysArray, variants } = props;
	let minValue = Infinity;
	let maxValue = -Infinity;

	const allKeysSet = new Set<number | string>();
	seriesDataArray.forEach((seriesData, index) => {
		const dataKeys = dataKeysArray[index];
		const xKey = dataKeys.coordinates['x'];

		seriesData.forEach((series) => {
			const dataPoints = series[dataKeys.data] as unknown[];
			dataPoints.forEach((d) => {
				allKeysSet.add(getCoordinateValue({ value: d[xKey] }));
			});
		});
	});
	const allKeys = Array.from(allKeysSet);

	allKeys.forEach((key) => {
		let dateMaxPositive = -Infinity;
		let dateMinNegative = Infinity;

		seriesDataArray.forEach((seriesData, index) => {
			const variant = variants[index];
			const dataKeys = dataKeysArray[index];
			const xKey = dataKeys.coordinates['x'];
			const yKey = dataKeys.coordinates['y'];

			if (variant === 'stacked') {
				let chartPositive = 0;
				let chartNegative = 0;

				seriesData.forEach((series) => {
					const dataPoint = (series[dataKeys.data] as unknown[]).find(
						(d) => getCoordinateValue({ value: d[xKey] }) === key
					);
					if (dataPoint) {
						const value = dataPoint[yKey];
						if (value >= 0) {
							chartPositive += value;
						} else {
							chartNegative += value;
						}
					}
				});

				dateMaxPositive = Math.max(dateMaxPositive, chartPositive);
				dateMinNegative = Math.min(dateMinNegative, chartNegative);
			} else {
				seriesData.forEach((series) => {
					const dataPoint = (series[dataKeys.data] as unknown[]).find(
						(d) => getCoordinateValue({ value: d[xKey] }) === key
					);
					if (dataPoint) {
						const value = dataPoint[yKey];
						dateMaxPositive = Math.max(dateMaxPositive, value);
						dateMinNegative = Math.min(dateMinNegative, value);
					}
				});
			}
		});

		maxValue = Math.max(maxValue, dateMaxPositive);
		minValue = Math.min(minValue, dateMinNegative);
	});

	return [Math.min(minValue, 0), Math.max(maxValue, 0)];
}

/**
 * Computes the merged x-domain for multiple series.
 */
function computeMergedXDomain(props: ComputeMergedXDomainProps): unknown[] {
	const { seriesDataArray, dataKeysArray } = props;
	const allKeysSet = new Set<number | string>();
	seriesDataArray.forEach((seriesData, index) => {
		const dataKeys = dataKeysArray[index];
		const xKey = dataKeys.coordinates['x'];
		seriesData.forEach((series) => {
			(series[dataKeys.data] as unknown[]).forEach((d) => {
				allKeysSet.add(getCoordinateValue({ value: d[xKey] }));
			});
		});
	});

	const uniqueKeys = Array.from(allKeysSet);
	uniqueKeys.sort((a, b) => {
		if (typeof a === 'number' && typeof b === 'number') return a - b;
		if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
		return a.toString().localeCompare(b.toString());
	});

	return uniqueKeys.map((key) => (typeof key === 'number' ? new Date(key) : key));
}

function computeYDomain({ seriesData, dataKeys }) {
	const yKey = dataKeys.coordinates.y;
	let minY = Infinity,
		maxY = -Infinity;

	seriesData.forEach((series) => {
		series[dataKeys.data].forEach((d) => {
			const yValue = d[yKey];
			if (yValue < minY) minY = yValue;
			if (yValue > maxY) maxY = yValue;
		});
	});

	return [minY, maxY];
}

function extractXDomain({ seriesData, dataKeys }) {
	const xKey = dataKeys.coordinates.x;
	const xValues = new Set<number | string>();

	seriesData.forEach((series) => {
		series[dataKeys.data].forEach((d) => {
			xValues.add(d[xKey]);
		});
	});

	return Array.from(xValues); // Return an array of unique x-values
}

/**
 * Computes merged domains for x and y axes if synchronization is enabled.
 */
export function computeDomains(props: ComputeDomainsProps): {
	mergedXDomain?: unknown[];
	mergedYDomain?: [number, number];
} {
	const { syncX, syncY, data, dataKeysArray, features } = props;

	// Compute the merged X domain if syncX is true, otherwise compute individual X domains
	const mergedXDomain = syncX
		? computeMergedXDomain({ seriesDataArray: data, dataKeysArray })
		: data.map((seriesData, i) => extractXDomain({ seriesData, dataKeys: dataKeysArray[i] }));

	// Compute the merged Y domain if syncY is true, otherwise compute individual Y domains
	const mergedYDomain = syncY
		? computeMergedValueDomain({
				seriesDataArray: data,
				dataKeysArray,
				variants: features.map(
					(chartFeatures) =>
						(
							chartFeatures.find((f) => f.feature === 'bar' && !f.hide)?.config as {
								variant?: string;
							}
						)?.variant || 'grouped'
				)
			})
		: data.map((seriesData, i) => computeYDomain({ seriesData, dataKeys: dataKeysArray[i] }));

	return { mergedXDomain, mergedYDomain };
}
