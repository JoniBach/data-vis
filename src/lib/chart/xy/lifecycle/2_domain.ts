// **Domain Calculation Phase**
import type {
	GetCoordinateValueProps,
	CalculateDomainsProps,
	ComputeMergedXDomainProps
} from '../types.js';

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
 * Computes the Y domain for individual series.
 */
function calculateYDomain(seriesDataArray, dataKeysArray): [number, number][] {
	return seriesDataArray.map((seriesData, index) => {
		const yKey = dataKeysArray[index].coordinates.y;
		let minY = Infinity;
		let maxY = -Infinity;

		seriesData.forEach((series) => {
			(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
				const yValue = d[yKey];
				if (yValue < minY) minY = yValue;
				if (yValue > maxY) maxY = yValue;
			});
		});

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

// **6. Calculate Stacked Domains Phase (Optional)**
/**
 * Calculates stacked domains for a given key (x-value).
 */
function calculateStackedDomains(seriesDataArray, dataKeysArray, variants) {
	let dateMaxPositive = -Infinity;
	let dateMinNegative = Infinity;

	seriesDataArray.forEach((seriesData, index) => {
		const variant = variants[index];
		const xKey = dataKeysArray[index].coordinates['x'];
		const yKey = dataKeysArray[index].coordinates['y'];

		if (variant === 'stacked') {
			const { chartPositive, chartNegative } = computeStackedValues(
				seriesData,
				xKey,
				yKey,
				dataKeysArray[index]
			);
			dateMaxPositive = Math.max(dateMaxPositive, chartPositive);
			dateMinNegative = Math.min(dateMinNegative, chartNegative);
		}
	});

	return { dateMaxPositive, dateMinNegative };
}

/**
 * Computes stacked positive and negative values for a given x-value.
 */
function computeStackedValues(
	seriesData,
	xKey,
	yKey,
	dataKeys
): { chartPositive: number; chartNegative: number } {
	let chartPositive = 0;
	let chartNegative = 0;

	seriesData.forEach((series) => {
		(series[dataKeys.data] as unknown[]).forEach((d) => {
			const value = d[yKey];
			value >= 0 ? (chartPositive += value) : (chartNegative += value);
		});
	});

	return { chartPositive, chartNegative };
}

// **7. Validate and Set Default Domains Phase**
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

// **8. Finalize Domains Phase**
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
	const yDomains = calculateYDomain(extractedData.seriesDataArray, extractedData.dataKeysArray);

	// **5. Synchronize Domains Phase (Optional)**
	const synchronizedDomains = synchronizeDomains(syncX, syncY, uniqueXValues, yDomains);

	// **6. Calculate Stacked Domains Phase (Optional)**
	const variants = features.map(
		(feature) => feature.find((f) => f.feature === 'bar' && !f.hide)?.config.variant || 'grouped'
	);
	const stackedDomains = calculateStackedDomains(
		extractedData.seriesDataArray,
		extractedData.dataKeysArray,
		variants
	);

	// **7. Validate and Set Default Domains Phase**
	const validatedDomains = validateAndSetDefaults(
		synchronizedDomains.mergedXDomain ?? Array.from(uniqueXValues),
		synchronizedDomains.mergedYDomain ?? [
			stackedDomains.dateMinNegative,
			stackedDomains.dateMaxPositive
		]
	);

	// **8. Finalize Domains Phase**
	return finalizeDomains(validatedDomains);
}

/**
 * This phase exists to identify and standardize the coordinate keys that will be used throughout
 * the domain calculation process. By identifying the `x` and `y` coordinate keys upfront, we can
 * effectively decouple the rest of the domain calculation from any hardcoded assumptions about 
 * which data keys are relevant. This contributes to a flexible and reusable system.

 * The goal of this step is to ensure that we know which properties of the data points represent
 * the coordinates for plotting. This identification is particularly crucial when dealing with 
 * multi-coordinate chart systems, where different coordinate types (e.g., Cartesian, Polar, 
 * Geographic) can each have their own respective coordinate keys.

 * By dynamically identifying coordinate keys using the provided data keys, we can abstract away 
 * the specific details of the coordinate system being used. For example, instead of relying on 
 * hardcoded keys like `x` and `y`, the system can handle `angle` and `radius` for polar plots or 
 * `latitude` and `longitude` for geographic maps. This abstraction allows the charting library to
 * remain **coordinate-system agnostic**, thereby supporting multiple chart types with a unified 
 * workflow.

 * The result of this step is a set of identified keys that can be passed along to the remaining 
 * lifecycle stages to ensure consistency when accessing and processing coordinate data.
 */
