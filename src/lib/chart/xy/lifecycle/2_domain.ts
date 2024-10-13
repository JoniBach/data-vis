// **Domain Calculation Phase**
import type {
	GetCoordinateValueProps,
	ComputeMergedValueDomainProps,
	CalculateDomainsProps,
	ComputeMergedXDomainProps
} from '../types.js';

/**
 * Helper function to get a coordinate value from a data point.
 */
function getCoordinateValue(props: GetCoordinateValueProps): number | string {
	const { value } = props;
	if (value instanceof Date) {
		return value.getTime();
	}
	return value;
}

/**
 * Helper function to collect all unique x-values from series data.
 */
function collectUniqueXValues(seriesDataArray, dataKeysArray): Set<number | string> {
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
	return allKeysSet;
}

/**
 * Computes the merged value domain for multiple series, considering stacking variants.
 */
function computeMergedValueDomain(props: ComputeMergedValueDomainProps): [number, number] {
	const { seriesDataArray, dataKeysArray, variants } = props;

	const allKeys = Array.from(collectUniqueXValues(seriesDataArray, dataKeysArray));
	let minValue = Infinity;
	let maxValue = -Infinity;

	allKeys.forEach((key) => {
		const { dateMaxPositive, dateMinNegative } = calculateStackedDomains(
			seriesDataArray,
			dataKeysArray,
			variants,
			key
		);
		maxValue = Math.max(maxValue, dateMaxPositive);
		minValue = Math.min(minValue, dateMinNegative);
	});

	return [Math.min(minValue, 0), Math.max(maxValue, 0)];
}

/**
 * Calculates stacked domains for a given key (x-value).
 */
function calculateStackedDomains(
	seriesDataArray,
	dataKeysArray,
	variants,
	targetKey: number | string
): { dateMaxPositive: number; dateMinNegative: number } {
	let dateMaxPositive = -Infinity;
	let dateMinNegative = Infinity;

	seriesDataArray.forEach((seriesData, index) => {
		const variant = variants[index];
		const dataKeys = dataKeysArray[index];
		const xKey = dataKeys.coordinates['x'];
		const yKey = dataKeys.coordinates['y'];

		if (variant === 'stacked') {
			const { chartPositive, chartNegative } = computeStackedValues(
				seriesData,
				xKey,
				yKey,
				targetKey,
				dataKeys
			);
			dateMaxPositive = Math.max(dateMaxPositive, chartPositive);
			dateMinNegative = Math.min(dateMinNegative, chartNegative);
			return;
		}

		calculateNonStackedDomains(seriesData, xKey, yKey, targetKey, dataKeys, (value) => {
			dateMaxPositive = Math.max(dateMaxPositive, value);
			dateMinNegative = Math.min(dateMinNegative, value);
		});
	});

	return { dateMaxPositive, dateMinNegative };
}

/**
 * Helper function to calculate non-stacked domains for a given key (x-value).
 */
function calculateNonStackedDomains(
	seriesData,
	xKey,
	yKey,
	targetKey: number | string,
	dataKeys,
	updateFn: (value: number) => void
) {
	seriesData.forEach((series) => {
		const dataPoint = findDataPoint(series, xKey, targetKey, dataKeys);
		if (dataPoint) {
			const value = dataPoint[yKey];
			updateFn(value);
		}
	});
}

/**
 * Helper function to find a data point by x-key.
 */
function findDataPoint(series, xKey, targetKey, dataKeys) {
	return (series[dataKeys.data] as unknown[]).find(
		(d) => getCoordinateValue({ value: d[xKey] }) === targetKey
	);
}

/**
 * Computes stacked positive and negative values for a given x-value.
 */
function computeStackedValues(
	seriesData,
	xKey,
	yKey,
	targetKey: number | string,
	dataKeys
): { chartPositive: number; chartNegative: number } {
	let chartPositive = 0;
	let chartNegative = 0;

	seriesData.forEach((series) => {
		const dataPoint = findDataPoint(series, xKey, targetKey, dataKeys);
		if (dataPoint) {
			const value = dataPoint[yKey];
			value >= 0 ? (chartPositive += value) : (chartNegative += value);
		}
	});

	return { chartPositive, chartNegative };
}

/**
 * Computes the merged x-domain for multiple series.
 */
function computeMergedXDomain(props: ComputeMergedXDomainProps): unknown[] {
	const { seriesDataArray, dataKeysArray } = props;
	const allKeysSet = collectUniqueXValues(seriesDataArray, dataKeysArray);

	const uniqueKeys = Array.from(allKeysSet);
	uniqueKeys.sort((a, b) => {
		if (typeof a === 'number' && typeof b === 'number') return a - b;
		if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
		return a.toString().localeCompare(b.toString());
	});

	return uniqueKeys.map((key) => (typeof key === 'number' ? new Date(key) : key));
}

/**
 * Computes the Y domain for individual series.
 */
function computeYDomain({ seriesData, dataKeys }): [number, number] {
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

/**
 * Extracts unique x-values for individual series.
 */
function extractXDomain({ seriesData, dataKeys }): unknown[] {
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
export function calculateDomains(props: CalculateDomainsProps): {
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
