// **1. Preparation Phase**

import type {
	Margin,
	ValidationResult,
	PrepareValidDataProps,
	GetCoordinateValueProps,
	DataKeys,
	Series
} from '../types.js';

/**
 * Validates the margin object to ensure it has valid numerical values.
 */
function validateMargin(props: { margin: Margin }): ValidationResult {
	const { margin } = props;
	const requiredProps: (keyof Margin)[] = ['top', 'right', 'bottom', 'left'];
	const errors = requiredProps.reduce((acc: string[], prop) => {
		if (typeof margin[prop] !== 'number') {
			acc.push(`Margin property '${prop}' must be a number.`);
		}
		return acc;
	}, []);

	return { valid: errors.length === 0, errors };
}

/**
 * Validates the series data to ensure it meets the required structure.
 */
function validateSeriesData(props: PrepareValidDataProps): ValidationResult {
	const { seriesData, dataKeys } = props;
	const errors: string[] = [];

	if (!Array.isArray(seriesData) || seriesData.length === 0) {
		errors.push('seriesData must be a non-empty array.');
	} else {
		const firstSeries = seriesData[0];
		if (!firstSeries || !firstSeries[dataKeys.data]) {
			errors.push(`Data key '${dataKeys.data}' is missing in the first series.`);
		} else {
			// Validate that all coordinate keys are present
			const coordinateKeys = Object.values(dataKeys.coordinates);
			const firstDataPoint = (firstSeries[dataKeys.data] as unknown[])[0];
			if (firstDataPoint) {
				coordinateKeys.forEach((key) => {
					if (
						typeof firstDataPoint === 'object' &&
						firstDataPoint !== null &&
						!(key in firstDataPoint)
					) {
						errors.push(`Coordinate key '${key}' is missing in the data points.`);
					}
				});
			}
		}
	}
	return { valid: errors.length === 0, errors };
}

/**
 * Retrieves the coordinate value, converting Date objects to timestamps if necessary.
 */
function getCoordinateValue(props: GetCoordinateValueProps): number | string {
	const { value } = props;
	if (value instanceof Date) {
		return value.getTime();
	}
	return value;
}

/**
 * Prepares and validates the data for further processing.
 */
function prepareValidData(
	props: PrepareValidDataProps
): { seriesData: Series[]; dataKeys: DataKeys } | null {
	const { seriesData, dataKeys } = props;
	const validation = validateSeriesData({ seriesData, dataKeys });
	if (!validation.valid) {
		console.error('Data validation failed:', validation.errors);
		return null;
	}
	return { seriesData, dataKeys };
}
