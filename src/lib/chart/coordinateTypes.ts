export interface CartesianCoordinates {
	x: string; // x-axis mapping (e.g., date, category)
	y: string; // y-axis mapping (e.g., numerical value)
}

export interface CartesianChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: CartesianCoordinates;
	magnitude?: string; // Optional, used for bubble or scatter plots
}

export interface PolarCoordinates {
	angle: string; // e.g., categorical data like month or day
	radius: string; // e.g., numeric value like sales or rainfall
}

export interface PolarChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: PolarCoordinates;
	magnitude?: string; // Optional, used to size elements
}

export interface SphericalCoordinates {
	longitude: string; // Longitude value
	latitude: string; // Latitude value
	radius: string; // Numeric value like depth or height
}

export interface SphericalChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: SphericalCoordinates;
	magnitude?: string; // Optional, e.g., earthquake magnitude or size
}

export interface CylindricalCoordinates {
	radial: string; // Radial position (e.g., regions or categories)
	height: string; // Height value (e.g., numeric value like rainfall)
}

export interface CylindricalChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: CylindricalCoordinates;
	magnitude?: string; // Optional, used for size or intensity
}

export interface GeographicCoordinates {
	latitude: string; // Latitude value (e.g., geo location)
	longitude: string; // Longitude value (e.g., geo location)
}

export interface GeographicChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: GeographicCoordinates;
	magnitude?: string; // Optional, e.g., population density or marker size
}

export interface LogarithmicCoordinates {
	x: string; // x-axis value (e.g., time, category)
	y: string; // y-axis value (e.g., numerical value)
}

export interface LogarithmicChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: LogarithmicCoordinates;
	scale: {
		x?: 'log'; // Optional, apply log scale on x-axis
		y?: 'log'; // Apply log scale on y-axis
	};
	magnitude?: string; // Optional, used for additional sizing info
}

export interface ParallelCoordinates {
	dimensions: string[]; // List of attributes to represent on parallel axes
}

export interface ParallelChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: ParallelCoordinates;
}

export interface TernaryCoordinates {
	a: string; // First axis (e.g., percentage of one component)
	b: string; // Second axis
	c: string; // Third axis
}

export interface TernaryChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: TernaryCoordinates;
}

export interface HexagonalCoordinates {
	x: string; // x-axis value (e.g., position in 2D space)
	y: string; // y-axis value
}

export interface HexagonalChartConfig {
	name: string;
	data: string; // Dataset reference
	coordinates: HexagonalCoordinates;
	magnitude?: string; // Optional, used for density or color intensity
}

// General ChartConfig with discriminated union for different coordinate systems

export type CoordinateSystem =
	| 'cartesian'
	| 'polar'
	| 'spherical'
	| 'cylindrical'
	| 'geographic'
	| 'logarithmic'
	| 'parallel'
	| 'ternary'
	| 'hexagonal';

export interface ChartConfig {
	type: CoordinateSystem; // Discriminates between different types of coordinate systems
	config:
		| CartesianChartConfig
		| PolarChartConfig
		| SphericalChartConfig
		| CylindricalChartConfig
		| GeographicChartConfig
		| LogarithmicChartConfig
		| ParallelChartConfig
		| TernaryChartConfig
		| HexagonalChartConfig;
}
