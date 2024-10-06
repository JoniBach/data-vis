import type { DataKeys } from "./types.js";

// DRY: Abstracted validation logic for object properties
const validateProperties = <T extends object>(obj: T, properties: (keyof T)[], expectedType: string): boolean => {
    return properties.every(prop => typeof obj[prop] === expectedType);
};

// Optimized: Validate margin using the abstracted property validation
export function isValidMargin(margin: { top: number, right: number, bottom: number, left: number }): boolean {
    return validateProperties(margin, ['top', 'right', 'bottom', 'left'], 'number');
}

// Improved: Validation for series data with more descriptive logging and enhanced typing
export function isValidSeriesData<T>(seriesData: T[], dataKeys: DataKeys): boolean {
    if (!Array.isArray(seriesData)) {
        console.error("Invalid seriesData: Must be an array.");
        return false;
    }

    if (seriesData.length === 0) {
        console.error("Invalid seriesData: Array is empty.");
        return false;
    }

    if (!seriesData[0]?.[dataKeys.data]) {
        console.error(`Invalid seriesData: Data key "${dataKeys.data}" is missing in the first series.`);
        return false;
    }

    return true;
}

// DRY: General input validation for non-empty arrays
const validateNonEmptyArray = <T>(arr: T[], name: string): boolean => {
    if (!Array.isArray(arr) || arr.length === 0) {
        console.error(`Invalid ${name}: Must be a non-empty array.`);
        return false;
    }
    return true;
};

// DRY: General input validation for defined variables
const validateDefined = (variables: any[], names: string[]): boolean => {
    return variables.every((variable, index) => {
        if (variable === undefined || variable === null) {
            console.error(`${names[index]} is not defined.`);
            return false;
        }
        return true;
    });
};

// Optimized: Input validation for scales and seriesData with reusable helper functions
export function validateInput<T>(
    seriesData: T[],
    xScale: any,
    valueScale: any,
    colorScale: any
): boolean {
    if (!validateNonEmptyArray(seriesData, 'seriesData')) {
        return false;
    }

    return validateDefined([xScale, valueScale, colorScale], ['xScale', 'valueScale', 'colorScale']);
}
