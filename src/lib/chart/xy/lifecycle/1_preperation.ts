import type { ValidateAndPrepareDataProps, DataKeys, Series } from '../types.js';

export function validateAndPrepareData(
	props: ValidateAndPrepareDataProps
): { seriesData: Series[]; dataKeys: DataKeys } | null {
	const { seriesData, dataKeys } = props;
	const errors: string[] = [];

	// 1. Check if seriesData is a non-empty array
	if (!Array.isArray(seriesData) || seriesData.length === 0) {
		errors.push('seriesData must be a non-empty array.');
	} else {
		const firstSeries = seriesData[0];

		// 2. Validate if the data key exists in the first series
		if (!firstSeries || !firstSeries[dataKeys.data]) {
			errors.push(`Data key '${dataKeys.data}' is missing in the first series.`);
		} else {
			// 3. Validate the presence of all coordinate keys in the data points
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

	// 4. If any validation errors, log them and return null
	if (errors.length > 0) {
		console.error('Data validation failed:', errors);
		return null;
	}

	// 5. Return the validated seriesData and dataKeys if everything is fine
	return { seriesData, dataKeys };
}

/**
 * This function exists to ensure that input data is properly validated and structured
 * before it is passed through to the rest of the chart creation pipeline. Its purpose
 * is to catch potential issues early, such as missing or misaligned data, and to prevent
 * invalid datasets from causing errors in later stages like rendering or scaling.
 *
 * The function is designed to be **coordinate-system agnostic** to support the flexibility
 * of a multi-coordinate chart library. The reason for this agnosticism is that the library
 * needs to handle a variety of chart types (e.g., Cartesian, Polar, Geographic), each with
 * its own set of coordinate systems and data structures. Instead of hardcoding checks for
 * specific coordinates like `x` and `y` (which would limit it to Cartesian charts), the
 * function dynamically validates whatever coordinate keys are provided.
 *
 * By using the `dataKeys.coordinates` object, this function can validate any type of coordinate
 * system, whether it’s Cartesian (`x`, `y`), Polar (`angle`, `radius`), or even more complex
 * systems like Geographic (`latitude`, `longitude`). This ensures that the validation process
 * is both flexible and scalable across various chart types, reducing the need for separate
 * validation functions for each coordinate system.
 */
