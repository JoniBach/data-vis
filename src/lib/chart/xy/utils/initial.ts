import { isValidMargin } from "./validator.js";
import * as d3 from 'd3';

// (7/10): Useful function but could further validate the scaleFn return type.
export function createInitialScale<T>(
    scaleFn: () => d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<T>,
    range: [number, number],
    domain: [number, number] | [Date, Date]
) {
    if (!Array.isArray(range) || !Array.isArray(domain)) {
        console.error("Invalid range or domain provided. Both must be arrays.");
        return;
    }

    return scaleFn()
        .domain(domain)
        .range(range);
}


// (9/10): Well-structured function but could use type checks on container.
export function createInitialSVG({ container, width, height }: { container: HTMLElement, width: number, height: number }) {
    return d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
}

// (8/10): Good practice of transforming chart groups, though it could further abstract the margin check.
export function createInitialChartGroup({ svg, margin }: { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, margin: { top: number, right: number, bottom: number, left: number } }) {
    if (!isValidMargin(margin)) {
        console.error("Invalid margin object provided. Ensure top, right, bottom, and left are numbers.");
        return;
    }

    return svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
}

