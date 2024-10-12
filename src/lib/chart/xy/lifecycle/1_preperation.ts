// **1. Preparation Phase**

import type { ValidateAndPrepareDataProps, DataKeys, Series } from '../types.js';

export function validateAndPrepareData(
	props: ValidateAndPrepareDataProps
): { seriesData: Series[]; dataKeys: DataKeys } | null {
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

	if (errors.length > 0) {
		console.error('Data validation failed:', errors);
		return null;
	}

	return { seriesData, dataKeys };
}
