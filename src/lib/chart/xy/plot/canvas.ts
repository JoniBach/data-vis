import type { LabelConfig } from '$lib/chart/generateXyChart.js';
import * as d3 from 'd3';
import type { CreateParams, TooltipConfig } from '../utils/types.js';
import { eventSystem } from '../utils/event.js';

// (8/10): Simple but useful helper function for sanitizing input.
export function escapeHTML(str: number | string): string {
    if (typeof str !== 'string' && typeof str !== 'number') {
        console.warn('Invalid input type for escapeHTML. Expected a string or number.');
        return '';
    }

    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


export function createAxis(params: CreateParams, config: any) {
    const { chartGroup, dateScale, xScale, valueScale, chartHeight } = params;

    const xTickFormat = config?.xTickFormat || "%b %Y";
    const xAxis = xScale
        ? d3.axisBottom(xScale).tickFormat(d => d3.timeFormat(xTickFormat)(new Date(d as number)))
        : d3.axisBottom(dateScale!).tickFormat(d3.timeFormat(xTickFormat));

    const yTickDecimals = config?.yTickDecimals !== undefined ? config.yTickDecimals : 2;
    const yTickFormat = d3.format(`.${yTickDecimals}f`);

    const xTicks = config?.xTicks || 5;
    const yTicks = config?.yTicks || 10;

    chartGroup.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(xAxis.ticks(xTicks));

    chartGroup.append('g')
        .call(d3.axisLeft(valueScale).ticks(yTicks).tickFormat(yTickFormat));
}


export function createGrid({ chartGroup, dateScale, xScale, valueScale, chartHeight, chartWidth }: CreateParams) {
    const gridGroup = chartGroup.append('g').attr('class', 'grid');

    gridGroup.call(d3.axisLeft(valueScale).tickSize(-chartWidth).tickFormat(() => ""))
        .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');

    if (xScale || dateScale) {
        gridGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call((xScale ? d3.axisBottom(xScale) : d3.axisBottom(dateScale!)).tickSize(-chartHeight).tickFormat(() => ""))
            .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
    }
}



export function createLabel({ chartGroup, chartWidth, chartHeight }: CreateParams, config?: LabelConfig) {

    const createTitle = (title: string) => {
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .text(title);
    };

    const createXAxisLabel = (xAxis: string) => {
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', chartHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(xAxis);
    };

    const createYAxisLabel = (yAxis: string) => {
        chartGroup.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -chartHeight / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(yAxis);
    };

    if (config?.title) {
        createTitle(config.title);
    }

    if (config?.xAxis) {
        createXAxisLabel(config.xAxis);
    }

    if (config?.yAxis) {
        createYAxisLabel(config.yAxis);
    }
}

// (8/10): Solid function for creating tooltips but lacks support for dynamic content updates.
export function createTooltip(container: HTMLElement | null, showTooltip: boolean, config: TooltipConfig): d3.Selection<HTMLDivElement, unknown, null, undefined> {
    if (!showTooltip) {
        return d3.select(document.createElement('div'));
    }
    return d3.select(container as HTMLElement)
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", config?.background || "#f9f9f9")
        .style("border", config?.border || "1px solid #d3d3d3")
        .style("padding", config?.padding || "5px");
}// Attach tooltip handlers
export function attachTooltipHandlers(selection: d3.Selection<SVGRectElement, any, SVGGElement, any>, chartTooltip: any, dataKeys: any) {
    selection.on('mouseover', (event, d) => eventSystem.trigger('tooltip', chartTooltip, event, d, dataKeys))
        .on('mousemove', (event) => eventSystem.trigger('tooltipMove', chartTooltip, event))
        .on('mouseout', () => eventSystem.trigger('tooltipHide', chartTooltip));
}
