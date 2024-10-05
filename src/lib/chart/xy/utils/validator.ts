import type { DataKeys } from "./types.js";

// DRY: Abstracted validation logic for object properties
const validateProperties = (obj: any, properties: string[], expectedType: string): boolean => {
    return properties.every(prop => typeof obj[prop] === expectedType);
};

// Optimized: Validate margin using the abstracted property validation
export function isValidMargin(margin: { top: number, right: number, bottom: number, left: number }): boolean {
    return validateProperties(margin, ['top', 'right', 'bottom', 'left'], 'number');
}

// Improved: Validation for series data with more descriptive logging
export function isValidSeriesData(seriesData: any[], dataKeys: DataKeys): boolean {
    if (!seriesData || !Array.isArray(seriesData)) {
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

// DRY: General input validation with reusable logic
const validateNonEmptyArray = (arr: any, name: string): boolean => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
        console.error(`Invalid ${name}: Must be a non-empty array.`);
        return false;
    }
    return true;
};

const validateDefined = (variables: any[], names: string[]): boolean => {
    return variables.every((variable, index) => {
        if (!variable) {
            console.error(`${names[index]} is not defined.`);
            return false;
        }
        return true;
    });
};

// Optimized: Validation for input with reusable helper functions
export function validateInput(seriesData: any[], xScale: any, valueScale: any, colorScale: any): boolean {
    if (!validateNonEmptyArray(seriesData, 'seriesData')) {
        return false;
    }
    return validateDefined([xScale, valueScale, colorScale], ['xScale', 'valueScale', 'colorScale']);
}
