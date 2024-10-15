// **Domain Calculation Lifecycle**
import type { GetCoordinateValueProps, CalculateDomainsProps } from '../types.js';

// **1. Validation Phase**
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
		if (!dataKeys.coordinates) {
			throw new Error(`Invalid dataKeys at index ${index}: coordinates are required.`);
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

// **2. Data Extraction Phase**
/**
 * Extracts series data and associated keys for further calculation.
 */
function extractInputData(seriesDataArray: any[], dataKeysArray: any[]) {
	return { seriesDataArray, dataKeysArray };
}

// **Helper Function: getCoordinateValue**
/**
 * Helper function to get a coordinate value from a data point.
 */

// **Domain Calculation Strategies**
// Define DomainCalculationStrategy interface
interface DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]>;
	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]>;
}

// **Helper Function: getCoordinateValue**
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

// **Domain Calculation Strategies**
// **Cartesian Domain Calculation Strategy**
class CartesianDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			x: new Set<number | string>(),
			y: new Set<number | string>()
		};

		data.forEach((seriesData, index) => {
			const xKey = dataKeysArray[index].coordinates['x'];
			const yKey = dataKeysArray[index].coordinates['y'];

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					domains.x.add(d[xKey]);
					domains.y.add(d[yKey]);
				});
			});
		});

		return {
			x: Array.from(domains.x).sort((a, b) => (a as number) - (b as number)),
			y: Array.from(domains.y).sort((a, b) => (a as number) - (b as number))
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants); // Reuse Y domain logic
	}
}

// **Polar Domain Calculation Strategy**
class PolarDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			angle: new Set<number | string>(),
			radius: new Set<number | string>()
		};

		data.forEach((seriesData, index) => {
			const angleKey = dataKeysArray[index].coordinates['angle'];
			const radiusKey = dataKeysArray[index].coordinates['radius'];

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					domains.angle.add(d[angleKey]);
					domains.radius.add(d[radiusKey]);
				});
			});
		});

		return {
			angle: Array.from(domains.angle),
			radius: Array.from(domains.radius)
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants);
	}
}

// **Spherical Domain Calculation Strategy**
class SphericalDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			longitude: new Set<number | string>(),
			latitude: new Set<number | string>(),
			radius: new Set<number | string>()
		};

		data.forEach((seriesData, index) => {
			const lonKey = dataKeysArray[index].coordinates['longitude'];
			const latKey = dataKeysArray[index].coordinates['latitude'];
			const radiusKey = dataKeysArray[index].coordinates['radius'];

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					domains.longitude.add(d[lonKey]);
					domains.latitude.add(d[latKey]);
					domains.radius.add(d[radiusKey]);
				});
			});
		});

		return {
			longitude: Array.from(domains.longitude),
			latitude: Array.from(domains.latitude),
			radius: Array.from(domains.radius)
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants);
	}
}

// **Cylindrical Domain Calculation Strategy**
class CylindricalDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			radial: new Set<number | string>(),
			height: new Set<number | string>()
		};

		data.forEach((seriesData, index) => {
			const radialKey = dataKeysArray[index].coordinates['radial'];
			const heightKey = dataKeysArray[index].coordinates['height'];

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					domains.radial.add(d[radialKey]);
					domains.height.add(d[heightKey]);
				});
			});
		});

		return {
			radial: Array.from(domains.radial),
			height: Array.from(domains.height)
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants);
	}
}

// **Geographic Domain Calculation Strategy**
class GeographicDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			longitude: new Set<number | string>(),
			latitude: new Set<number | string>()
		};

		data.forEach((seriesData, index) => {
			const lonKey = dataKeysArray[index].coordinates['longitude'];
			const latKey = dataKeysArray[index].coordinates['latitude'];

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					domains.longitude.add(d[lonKey]);
					domains.latitude.add(d[latKey]);
				});
			});
		});

		return {
			longitude: Array.from(domains.longitude),
			latitude: Array.from(domains.latitude)
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants);
	}
}

// **Logarithmic Domain Calculation Strategy**
class LogarithmicDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			x: new Set<number | string>(),
			y: new Set<number | string>()
		};

		data.forEach((seriesData, index) => {
			const xKey = dataKeysArray[index].coordinates['x'];
			const yKey = dataKeysArray[index].coordinates['y'];

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					domains.x.add(d[xKey]);
					domains.y.add(d[yKey]);
				});
			});
		});

		return {
			x: Array.from(domains.x).sort((a, b) => (a as number) - (b as number)),
			y: Array.from(domains.y).sort((a, b) => (a as number) - (b as number))
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants).map(([min, max]) => {
			return [Math.log10(min), Math.log10(max)];
		});
	}
}

// **Parallel Domain Calculation Strategy**
class ParallelDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			dimensions: new Set<string>()
		};

		data.forEach((seriesData, index) => {
			const dimensions = dataKeysArray[index].coordinates['dimensions'];
			dimensions.forEach((dim: string) => {
				domains.dimensions.add(dim);
			});
		});

		return {
			dimensions: Array.from(domains.dimensions)
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants);
	}
}

// **Ternary Domain Calculation Strategy**
class TernaryDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			a: new Set<number | string>(),
			b: new Set<number | string>(),
			c: new Set<number | string>()
		};

		data.forEach((seriesData, index) => {
			const aKey = dataKeysArray[index].coordinates['a'];
			const bKey = dataKeysArray[index].coordinates['b'];
			const cKey = dataKeysArray[index].coordinates['c'];

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					domains.a.add(d[aKey]);
					domains.b.add(d[bKey]);
					domains.c.add(d[cKey]);
				});
			});
		});

		return {
			a: Array.from(domains.a),
			b: Array.from(domains.b),
			c: Array.from(domains.c)
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants);
	}
}

// **Hexagonal Domain Calculation Strategy**
class HexagonalDomainCalculationStrategy implements DomainCalculationStrategy {
	calculateDomainsForAllAxes(data: any[], dataKeysArray: any[]): Record<string, unknown[]> {
		const domains = {
			x: new Set<number | string>(),
			y: new Set<number | string>()
		};

		data.forEach((seriesData, index) => {
			const xKey = dataKeysArray[index].coordinates['x'];
			const yKey = dataKeysArray[index].coordinates['y'];

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					domains.x.add(d[xKey]);
					domains.y.add(d[yKey]);
				});
			});
		});

		return {
			x: Array.from(domains.x),
			y: Array.from(domains.y)
		};
	}

	calculateMergedDomains(
		data: any[],
		dataKeysArray: any[],
		variants: string[]
	): Record<string, [number, number][]> {
		return calculateMergedYDomains(data, dataKeysArray, variants);
	}
}

// **Utility function for Y Domain Merging**
function calculateMergedYDomains(
	data: any[],
	dataKeysArray: any[],
	variants: string[]
): Record<string, [number, number][]> {
	return {
		y: data.map((seriesData, index) => {
			const yKey = dataKeysArray[index].coordinates.y;
			let minY = Infinity;
			let maxY = -Infinity;
			let stackedValues = new Map<number | string, number>();

			seriesData.forEach((series) => {
				(series[dataKeysArray[index].data] as unknown[]).forEach((d) => {
					const yValue = d[yKey];

					if (variants[index] === 'stacked') {
						const currentStackedValue = stackedValues.get(yValue) || 0;
						stackedValues.set(yValue, currentStackedValue + yValue);
					} else {
						if (yValue < minY) minY = yValue;
						if (yValue > maxY) maxY = yValue;
					}
				});
			});

			if (variants[index] === 'stacked') {
				stackedValues.forEach((stackedValue) => {
					if (stackedValue < minY) minY = stackedValue;
					if (stackedValue > maxY) maxY = stackedValue;
				});
			}

			return [Math.min(0, minY), Math.max(0, maxY)];
		})
	};
}

// **getDomainCalculationStrategy Function**
/**
 * Selects the appropriate strategy based on the coordinate system type.
 */
function getDomainCalculationStrategy(coordinateSystemType: string): DomainCalculationStrategy {
	switch (coordinateSystemType) {
		case 'cartesian':
			return new CartesianDomainCalculationStrategy();
		case 'polar':
			return new PolarDomainCalculationStrategy();
		case 'spherical':
			return new SphericalDomainCalculationStrategy();
		case 'cylindrical':
			return new CylindricalDomainCalculationStrategy();
		case 'geographic':
			return new GeographicDomainCalculationStrategy();
		case 'logarithmic':
			return new LogarithmicDomainCalculationStrategy();
		case 'parallel':
			return new ParallelDomainCalculationStrategy();
		case 'ternary':
			return new TernaryDomainCalculationStrategy();
		case 'hexagonal':
			return new HexagonalDomainCalculationStrategy();
		default:
			throw new Error(`Unsupported coordinate system: ${coordinateSystemType}`);
	}
}

// **5. Synchronization Phase**
/**
 * Synchronizes the X and Y domains if sync is enabled.
 */
function synchronizeDomains(
	syncX: boolean,
	syncY: boolean,
	uniqueXValues: Set<number | string>,
	yDomains: [number, number][]
) {
	// Default to unsynced X values or fallback [0, 1] if the set is empty
	let mergedXDomain: unknown[] = uniqueXValues.size ? Array.from(uniqueXValues) : [0, 1];

	// If syncY is false, use individual y domains
	if (!syncY) {
		return {
			mergedXDomain,
			mergedYDomain: yDomains // Directly use the individual yDomains
		};
	}

	// Otherwise, synchronize y domains
	let minY = Infinity;
	let maxY = -Infinity;

	yDomains.forEach(([min, max]) => {
		if (min < minY) minY = min;
		if (max > maxY) maxY = max;
	});

	// Ensure min and max are valid and not Infinity
	if (minY === Infinity) minY = 0;
	if (maxY === -Infinity) maxY = 1;

	const mergedYDomain: [number, number] = [Math.min(0, minY), Math.max(0, maxY)];

	return { mergedXDomain, mergedYDomain };
}

// **6. Validation and Defaults Phase**
/**
 * Validates the calculated domains and sets default values if necessary.
 */
function validateAndSetDefaults(xDomain: unknown[], yDomain: [number, number]) {
	if (!xDomain || xDomain.length === 0) {
		console.warn('X Domain is empty, defaulting to [0, 1]');
		xDomain = [0, 1]; // Ensure a valid default X domain
	}

	if (!yDomain || yDomain.includes(Infinity) || yDomain.includes(-Infinity)) {
		console.warn('Y Domain contains invalid values, defaulting to [0, 1]');
		yDomain = [0, 1]; // Ensure a valid default Y domain
	}

	return { x: xDomain, y: yDomain };
}

// **7. Finalization Phase**

// **Main Entry Function: calculateDomains**
export function calculateDomains(props: CalculateDomainsProps): {
	mergedXDomain?: unknown[];
	mergedYDomain?: [number, number][];
	individualDomains?: Record<string, unknown[]>[];
} {
	// **1. Validation Phase**
	validateConfiguration(props);

	const { syncX, syncY, data, dataKeysArray, features, coordinateSystemType } = props;

	// **2. Data Extraction Phase**
	const extractedData = extractInputData(data, dataKeysArray);

	// **3. Strategy Selection Phase**
	const strategy = getDomainCalculationStrategy(coordinateSystemType);

	// **4. Domain Calculation Phase**
	const individualDomains = data.map((_, index) => {
		return strategy.calculateDomainsForAllAxes(
			[extractedData.seriesDataArray[index]],
			[extractedData.dataKeysArray[index]]
		);
	});

	const variants = features.map(
		(feature) => feature.find((f) => f.feature === 'bar' && !f.hide)?.config.variant || 'grouped'
	);

	const mergedDomains = strategy.calculateMergedDomains(
		extractedData.seriesDataArray,
		extractedData.dataKeysArray,
		variants
	);

	// **5. Synchronization Phase**
	const uniqueXValues = new Set(individualDomains.flatMap((d) => d.x as number[]));

	const synchronizedDomains = synchronizeDomains(syncX, syncY, uniqueXValues, mergedDomains.y);

	// **6. Validation and Defaults Phase**
	const validatedDomains = validateAndSetDefaults(
		synchronizedDomains.mergedXDomain ?? Array.from(uniqueXValues),
		synchronizedDomains.mergedYDomain ?? [
			Math.min(...mergedDomains.y.map(([min]) => min)),
			Math.max(...mergedDomains.y.map(([, max]) => max))
		]
	);

	// **7. Finalization Phase**

	// Return both the merged domains and the individual domains per series
	return {
		mergedDomains: validatedDomains,
		separatedDomains: individualDomains.map((data) => ({
			y: [Math.min(...(data.y as number[])), Math.max(...(data.y as number[]))]
		})) // Return only the highest and lowest values in individual domains y
	};
}
