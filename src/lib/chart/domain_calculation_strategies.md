
// **Helper Function: getCoordinateValue**

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