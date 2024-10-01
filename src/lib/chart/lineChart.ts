import * as d3 from 'd3';

export interface DataPoint {
    date: Date;
    value: number;
}

export interface SeriesData {
    name: string;
    data: DataPoint[];
}

export enum FeatureType {
    GRID = 'grid',
    AXIS = 'axis',
    AREA = 'area',
    BAR = 'bar',
    LINE = 'line',
    POINT = 'point',
    TOOLTIP = 'tooltip'
}

export interface Feature {
    feature: FeatureType;
    hide: boolean;
}

export interface CreateParams {
    seriesData: SeriesData[];
    chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    colorScale: d3.ScaleOrdinal<string, string>;
    dateScale: d3.ScaleBand<Date>;
    valueScale: d3.ScaleLinear<number, number>;
    area: d3.Area<DataPoint>;
    line: d3.Line<DataPoint>;
    chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    chartHeight: number;
    chartWidth: number;
}

interface ListenerMap {
    [eventType: string]: (...args: any[]) => void;
}

const eventSystem = {
    listeners: {} as ListenerMap,
    on(eventType: string, callback: (...args: any[]) => void) {
        this.listeners[eventType] = callback;
    },
    trigger(eventType: string, ...args: any[]) {
        if (this.listeners[eventType]) {
            this.listeners[eventType](...args);
        }
    }
};

function createTooltip(container: HTMLElement | null, showTooltip: boolean): d3.Selection<HTMLDivElement, unknown, null, undefined> {
    try {
        if (!showTooltip) {
            return d3.select(document.createElement('div'));
        }
        return d3.select(container as HTMLElement)
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "#f9f9f9")
            .style("border", "1px solid #d3d3d3")
            .style("padding", "5px");
    } catch (error) {
        console.error("Error creating tooltip: ", error);
        return d3.select(document.createElement('div'));
    }
}

eventSystem.on('tooltip', (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>, event: MouseEvent, d: DataPoint) => {
    try {
        chartTooltip.style("visibility", "visible")
            .html(`Date: ${d3.timeFormat("%b %Y")(d.date)}<br>Value: ${d.value}`);
    } catch (error) {
        console.error("Error in tooltip handler: ", error);
    }
});

eventSystem.on('tooltip-move', (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>, event: MouseEvent) => {
    try {
        chartTooltip.style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
    } catch (error) {
        console.error("Error in tooltip move handler: ", error);
    }
});

eventSystem.on('tooltip-hide', (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>) => {
    try {
        chartTooltip.style("visibility", "hidden");
    } catch (error) {
        console.error("Error in tooltip hide handler: ", error);
    }
});

function createGrid({ chartGroup, dateScale, valueScale, chartHeight, chartWidth }: CreateParams) {
    try {
        chartGroup.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(valueScale).tickSize(-chartWidth).tickFormat(() => ""))
            .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
        chartGroup.selectAll('.grid path').attr('stroke', 'none');

        chartGroup.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(dateScale).tickSize(-chartHeight).tickFormat(() => ""))
            .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
        chartGroup.selectAll('.grid path').attr('stroke', 'none');
    } catch (error) {
        console.error("Error creating grid: ", error);
    }
}

function createAxis({ chartGroup, dateScale, valueScale, chartHeight }: CreateParams) {
    try {
        chartGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(dateScale).tickFormat(d3.timeFormat("%b %Y")));
        chartGroup.append('g').call(d3.axisLeft(valueScale));
    } catch (error) {
        console.error("Error creating axis: ", error);
    }
}

function createLine({ seriesData, chartGroup, colorScale, line }: CreateParams) {
    try {
        const linesGroup = chartGroup.append('g').attr('class', 'lines-group');
        seriesData.forEach(series => {
            linesGroup.append('path')
                .datum(series.data)
                .attr('fill', 'none')
                .attr('stroke', colorScale(series.name))
                .attr('stroke-width', 2)
                .attr('d', line);
        });
    } catch (error) {
        console.error("Error creating line chart: ", error);
    }
}

function createArea({ seriesData, chartGroup, colorScale, area }: CreateParams) {
    try {
        const areasGroup = chartGroup.append('g').attr('class', 'areas-group');
        seriesData.forEach(series => {
            areasGroup.append('path')
                .datum(series.data)
                .attr('fill', colorScale(series.name))
                .attr('fill-opacity', 0.2)
                .attr('d', area);
        });
    } catch (error) {
        console.error("Error creating area chart: ", error);
    }
}

function createBars({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartHeight }: CreateParams) {
    try {
        const barsGroup = chartGroup.append('g').attr('class', 'bars-group');

        const seriesScale = d3.scaleBand()
            .domain(seriesData.map(d => d.name))
            .range([0, dateScale.bandwidth()])
            .padding(0.05);

        seriesData.forEach(series => {
            barsGroup.selectAll(`rect.${series.name.replace(/\s+/g, '-')}`)
                .data(series.data)
                .enter()
                .append('rect')
                .attr('class', series.name.replace(/\s+/g, '-'))
                .attr('x', d => (dateScale(d.date) || 0) + seriesScale(series.name)!)
                .attr('y', d => valueScale(d.value))
                .attr('width', seriesScale.bandwidth())
                .attr('height', d => chartHeight - valueScale(d.value))
                .attr('fill', colorScale(series.name))
                .attr('fill-opacity', 0.5);
        });
    } catch (error) {
        console.error("Error creating bar chart: ", error);
    }
}

function createPoints({ seriesData, chartGroup, colorScale, dateScale, valueScale }: CreateParams) {
    try {
        const pointsGroup = chartGroup.append('g').attr('class', 'points-group');
        seriesData.forEach(series => {
            pointsGroup.selectAll(`circle.${series.name.replace(/\s+/g, '-')}`)
                .data(series.data)
                .enter()
                .append('circle')
                .attr('class', series.name.replace(/\s+/g, '-'))
                .attr('cx', d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
                .attr('cy', d => valueScale(d.value))
                .attr('r', 4)
                .attr('fill', colorScale(series.name));
        });
    } catch (error) {
        console.error("Error creating points: ", error);
    }
}

const featureRegistry: Record<FeatureType, Function> = {
    [FeatureType.GRID]: createGrid,
    [FeatureType.AXIS]: createAxis,
    [FeatureType.AREA]: createArea,
    [FeatureType.BAR]: createBars,
    [FeatureType.LINE]: createLine,
    [FeatureType.POINT]: createPoints,
    [FeatureType.TOOLTIP]: () => { }
};

function createFeatures(createParameters: CreateParams, features: Feature[]) {
    try {
        features.forEach(({ feature, hide }) => {
            if (!hide && featureRegistry[feature]) {
                featureRegistry[feature](createParameters);
            }
        });
    } catch (error) {
        console.error("Error rendering features: ", error);
    }
}

function createInitialSVG({ container, width, height }: { container: HTMLElement, width: number, height: number }) {
    try {
        return d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
    } catch (error) {
        console.error("Error creating SVG: ", error);
        throw error;
    }
}

function createInitialChartGroup({ svg, margin }: { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, margin: { top: number, right: number, bottom: number, left: number } }) {
    try {
        return svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
    } catch (error) {
        console.error("Error creating chart group: ", error);
        throw error;
    }
}

function createInitialDateScale({ seriesData, chartWidth }: { seriesData: SeriesData[], chartWidth: number }) {
    try {
        return d3.scaleBand<Date>()
            .domain(seriesData[0].data.map(d => d.date))
            .range([0, chartWidth])
            .padding(0.1);
    } catch (error) {
        console.error("Error creating date scale: ", error);
        throw error;
    }
}

function createInitialValueScale({ seriesData, chartHeight }: { seriesData: SeriesData[], chartHeight: number }) {
    try {
        return d3.scaleLinear()
            .domain([0, d3.max(seriesData.flatMap(series => series.data), d => d.value) as number])
            .range([chartHeight, 0]);
    } catch (error) {
        console.error("Error creating value scale: ", error);
        throw error;
    }
}

function createInitialColorScale({ seriesData }: { seriesData: SeriesData[] }) {
    try {
        return d3.scaleOrdinal(d3.schemeCategory10)
            .domain(seriesData.map(d => d.name));
    } catch (error) {
        console.error("Error creating color scale: ", error);
        throw error;
    }
}

function createInitialArea({ dateScale, valueScale, chartHeight }: { dateScale: d3.ScaleBand<Date>, valueScale: d3.ScaleLinear<number, number>, chartHeight: number }) {
    try {
        return d3.area<DataPoint>()
            .x(d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
            .y0(chartHeight)
            .y1(d => valueScale(d.value));
    } catch (error) {
        console.error("Error creating area chart: ", error);
        throw error;
    }
}

function createInitialLine({ dateScale, valueScale }: { dateScale: d3.ScaleBand<Date>, valueScale: d3.ScaleLinear<number, number> }) {
    try {
        return d3.line<DataPoint>()
            .x(d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
            .y(d => valueScale(d.value));
    } catch (error) {
        console.error("Error creating line chart: ", error);
        throw error;
    }
}

export function createLineChart(
    container: HTMLElement,
    seriesData: SeriesData[],
    width: number = 500,
    height: number = 300,
    features: Feature[]
) {
    try {
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        d3.select(container).selectAll("*").remove();

        if (seriesData.length === 0 || seriesData[0].data.length === 0) {
            console.warn("No data available for the chart.");
            return;
        }

        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });
        const dateScale = createInitialDateScale({ seriesData, chartWidth });
        const valueScale = createInitialValueScale({ seriesData, chartHeight });
        const colorScale = createInitialColorScale({ seriesData });
        const area = createInitialArea({ dateScale, valueScale, chartHeight });
        const line = createInitialLine({ dateScale, valueScale });

        const showTooltip = features.some(feature => feature.feature === FeatureType.TOOLTIP && !feature.hide);
        const chartTooltip = createTooltip(container, showTooltip);

        const createParameters: CreateParams = {
            seriesData,
            chartGroup,
            colorScale,
            dateScale,
            valueScale,
            area,
            line,
            chartTooltip,
            chartHeight,
            chartWidth
        };

        createFeatures(createParameters, features);
    } catch (error) {
        console.error("Error creating line chart: ", error);
    }
}
