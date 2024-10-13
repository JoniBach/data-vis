// **Domain Calculation Phase**
import type { GetCoordinateValueProps, CalculateDomainsProps } from '../types.js';

// **Validation Phase**
/**
 * Validates the configuration and input properties to ensure they are suitable for domain calculation.
 */
function validateConfiguration(props: CalculateDomainsProps) {
	const { syncX, syncY, data, dataKeysArray, features } = props;

	// Validate data and dataKeysArray are arrays of the same length
	if (!Array.isArray(data) || !Array.isArray(dataKeysArray)) {
		throw new Error('Invalid input: data and dataKeysArray must both be arrays.');
	}
	if (data.length !== dataKeysArray.length) {
		throw new Error('Mismatch: data and dataKeysArray must have the same length.');
	}

	// Validate dataKeysArray has valid coordinates
	dataKeysArray.forEach((dataKeys, index) => {
		if (!dataKeys.coordinates || !('x' in dataKeys.coordinates) || !('y' in dataKeys.coordinates)) {
			throw new Error(
				`Invalid dataKeys at index ${index}: coordinates must include both 'x' and 'y' keys.`
			);
		}
		if (!('data' in dataKeys)) {
			throw new Error(`Invalid dataKeys at index ${index}: 'data' key is required.`);
		}
	});

	// Validate syncX and syncY are boolean values
	if (typeof syncX !== 'boolean' || typeof syncY !== 'boolean') {
		throw new Error('Invalid input: syncX and syncY must be boolean values.');
	}

	// Validate features is an array
	if (!Array.isArray(features)) {
		throw new Error('Invalid input: features must be an array.');
	}
}

// **1. Data Extraction Phase**
/**
 * Extracts series data and associated keys for further calculation.
 */
function extractInputData(seriesDataArray, dataKeysArray) {
	return { seriesDataArray, dataKeysArray };
}

// **2. Key Identification Phase**
/**
 * Helper function to get a coordinate value from a data point.
 */
function getCoordinateValue(props: GetCoordinateValueProps): number | string {
	const { value } = props;
	if (value instanceof Date) {
		return value.getTime(); // Convert date to timestamp for consistency
	}
	return value; // Return numeric or string values as-is
}

// **3. Collect Unique X-Values Phase**
/**
 * Helper function to collect all unique x-values from series data.
 */
function collectUniqueXValues(seriesDataArray, dataKeysArray): Set<number | string> {
	const allKeysSet = new Set<number | string>();
	seriesDataArray.forEach((seriesData, index) => {
		const xKey = dataKeysArray[index].coordinates['x'];
		seriesData.forEach((series) => {
			(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
				allKeysSet.add(getCoordinateValue({ value: d[xKey] }));
			});
		});
	});
	return allKeysSet;
}

// **4. Calculate Y-Domain Range Phase**
/**
 * Computes the Y domain for individual or stacked series.
 */
function calculateYDomain(seriesDataArray, dataKeysArray, variants): [number, number][] {
	return seriesDataArray.map((seriesData, index) => {
		const yKey = dataKeysArray[index].coordinates.y;
		let minY = Infinity;
		let maxY = -Infinity;
		let stackedValues = new Map<number | string, number>();

		seriesData.forEach((series) => {
			(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
				const xValue = getCoordinateValue({ value: d[dataKeysArray[index].coordinates.x] });
				const yValue = d[yKey];

				if (variants[index] === 'stacked') {
					// Accumulate stacked values by x-coordinate
					const currentStackedValue = stackedValues.get(xValue) || 0;
					stackedValues.set(xValue, currentStackedValue + yValue);
				} else {
					// For non-stacked, calculate min and max directly
					if (yValue < minY) minY = yValue;
					if (yValue > maxY) maxY = yValue;
				}
			});
		});

		// Update minY and maxY for stacked values if applicable
		if (variants[index] === 'stacked') {
			stackedValues.forEach((stackedValue) => {
				if (stackedValue < minY) minY = stackedValue;
				if (stackedValue > maxY) maxY = stackedValue;
			});
		}

		return [Math.min(0, minY), Math.max(0, maxY)];
	});
}

// **5. Synchronize Domains Phase (Optional)**
/**
 * Synchronizes X and Y domains across multiple series if sync is enabled.
 */
function synchronizeDomains(
	syncX: boolean,
	syncY: boolean,
	uniqueXValues: Set<number | string>,
	yDomains: [number, number][]
) {
	let mergedXDomain: unknown[] | null = null;
	let mergedYDomain: [number, number] | null = null;

	if (syncX) {
		mergedXDomain = Array.from(uniqueXValues).sort((a, b) => {
			if (typeof a === 'number' && typeof b === 'number') return a - b;
			if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
			return a.toString().localeCompare(b.toString());
		});
	}

	if (syncY) {
		let minY = Infinity;
		let maxY = -Infinity;

		yDomains.forEach(([min, max]) => {
			if (min < minY) minY = min;
			if (max > maxY) maxY = max;
		});

		mergedYDomain = [Math.min(0, minY), Math.max(0, maxY)];
	}

	return { mergedXDomain, mergedYDomain };
}

// **6. Validate and Set Default Domains Phase**
/**
 * Validates domain values and sets default values if required.
 */
function validateAndSetDefaults(xDomain: unknown[], yDomain: [number, number]) {
	if (!xDomain || xDomain.length === 0) {
		console.warn('X Domain is empty, defaulting to [0, 1]');
		xDomain = [0, 1];
	}

	if (!yDomain || yDomain.includes(Infinity) || yDomain.includes(-Infinity)) {
		console.warn('Y Domain contains invalid values, defaulting to [0, 1]');
		yDomain = [0, 1];
	}

	return { xDomain, yDomain };
}

// **7. Finalize Domains Phase**
/**
 * Finalizes and returns the domains for rendering.
 */
function finalizeDomains({ xDomain, yDomain }) {
	return {
		mergedXDomain: xDomain,
		mergedYDomain: yDomain
	};
}

// **Main Entry Function: calculateDomains**
/**
 * Orchestrates the domain calculation lifecycle.
 */
export function calculateDomains(props: CalculateDomainsProps): {
	mergedXDomain?: unknown[];
	mergedYDomain?: [number, number];
} {
	// **Validation Phase**
	validateConfiguration(props);

	const { syncX, syncY, data, dataKeysArray, features } = props;

	// **1. Data Extraction Phase**
	const extractedData = extractInputData(data, dataKeysArray);

	// **2. Key Identification Phase**

	// **3. Collect Unique X-Values Phase**
	const uniqueXValues = collectUniqueXValues(
		extractedData.seriesDataArray,
		extractedData.dataKeysArray
	);

	// **4. Calculate Y-Domain Range Phase**
	const variants = features.map(
		(feature) => feature.find((f) => f.feature === 'bar' && !f.hide)?.config.variant || 'grouped'
	);
	const yDomains = calculateYDomain(
		extractedData.seriesDataArray,
		extractedData.dataKeysArray,
		variants
	);

	// **5. Synchronize Domains Phase (Optional)**
	const synchronizedDomains = synchronizeDomains(syncX, syncY, uniqueXValues, yDomains);

	// **6. Validate and Set Default Domains Phase**
	const validatedDomains = validateAndSetDefaults(
		synchronizedDomains.mergedXDomain ?? Array.from(uniqueXValues),
		synchronizedDomains.mergedYDomain ?? [
			Math.min(...yDomains.map(([min]) => min)),
			Math.max(...yDomains.map(([, max]) => max))
		]
	);

	// **7. Finalize Domains Phase**
	return finalizeDomains(validatedDomains);
}
/**
 * This phase is responsible for calculating the X and Y domains for the chart, based on the input datasets and series
 * configurations. Domains define the range of values that are represented on each axis, which is essential for proper
 * scaling and rendering of data points. In multi-series charts, this phase ensures that domains are calculated and
 * synchronized across all series to maintain consistency, even when datasets vary in structure or scale.
 *
 * The purpose of this step is to accurately compute the boundaries (min and max values) for both axes, handling
 * complexities such as stacking data series or ensuring that synchronized domains are applied when needed. This is
 * especially important for visualizations with multiple datasets, where each series might have different coordinate
 * values, yet must be aligned on a common scale.
 */
