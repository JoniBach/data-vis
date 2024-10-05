import { isValidMargin } from "./validator.js";
import * as d3 from 'd3';

// DRY: Utility function to validate arrays
const validateArray = (input: any, name: string) => {
    if (!Array.isArray(input)) {
        console.error(`Invalid ${name} provided. It must be an array.`);
        return false;
    }
    return true;
};

// DRY: Generalized validation for margins
const validateMargin = (margin: { top: number, right: number, bottom: number, left: number }) => {
    if (!isValidMargin(margin)) {
        console.error("Invalid margin object provided. Ensure top, right, bottom, and left are numbers.");
        return false;
    }
    return true;
};

// Optimized: Create initial scale with better validation
export function createInitialScale<T>(
    scaleFn: () => d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<T>,
    range: [number, number],
    domain: [number, number] | [Date, Date]
) {
    if (!validateArray(range, 'range') || !validateArray(domain, 'domain')) {
        return;
    }

    return scaleFn().domain(domain).range(range);
}

// Optimized: Create initial SVG with container type validation
export function createInitialSVG({ container, width, height }: { container: HTMLElement, width: number, height: number }) {
    if (!(container instanceof HTMLElement)) {
        console.error("Invalid container provided. It must be an instance of HTMLElement.");
        return;
    }

    return d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
}

// Optimized: Create initial chart group with abstracted margin validation
export function createInitialChartGroup({ svg, margin }: { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, margin: { top: number, right: number, bottom: number, left: number } }) {
    if (!validateMargin(margin)) {
        return;
    }

    return svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
}
