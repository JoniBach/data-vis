import { isValidMargin } from "./validator.js";
import * as d3 from 'd3';
import type { Margin, Range, Domain } from './xy/utils/types.js'; // Assuming these types are defined in your project

// DRY: Utility function to validate arrays (range and domain)
const validateArray = <T>(input: T[], name: string): boolean => {
    if (!Array.isArray(input)) {
        console.error(`Invalid ${name} provided. It must be an array.`);
        return false;
    }
    if (input.length !== 2) {
        console.error(`Invalid ${name} array length. It must contain exactly two elements.`);
        return false;
    }
    return true;
};

// DRY: Generalized validation for margins
const validateMargin = (margin: Margin): boolean => {
    if (!isValidMargin(margin)) {
        console.error("Invalid margin object provided. Ensure top, right, bottom, and left are numbers.");
        return false;
    }
    return true;
};

// Optimized: Create initial scale with better validation and enhanced typing
export function createInitialScale<T extends string | number | Date>(
    scaleFn: () => d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<T>,
    range: Range,
    domain: Domain<T>
) {
    if (!validateArray(range, 'range') || !validateArray(domain, 'domain')) {
        return null;
    }

    return scaleFn().domain(domain).range(range);
}

// Optimized: Create initial SVG with container type validation and enhanced typing
export function createInitialSVG({ container, width, height }: { container: HTMLElement, width: number, height: number }) {
    if (!(container instanceof HTMLElement)) {
        console.error("Invalid container provided. It must be an instance of HTMLElement.");
        return null;
    }

    return d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
}

// Optimized: Create initial chart group with abstracted margin validation and enhanced typing
export function createInitialChartGroup({ svg, margin }: { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, margin: Margin }) {
    if (!validateMargin(margin)) {
        return null;
    }

    return svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
}
