import * as d3 from 'd3';

export interface DataPoint {
    date: Date;
    value: number;
}

export interface SeriesData {
    name: string;
    data: DataPoint[];
}

export interface Feature {
    feature: 'grid' | 'axis' | 'area' | 'bar' | 'line' | 'point' | 'tooltip';
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
    chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null;
    chartHeight: number;
    chartWidth: number;
}

function createTooltip(container: HTMLElement | null, showTooltip: boolean): d3.Selection<HTMLDivElement, unknown, null, undefined> | null {
    if (!showTooltip) return null;
    return d3.select(container as HTMLElement)
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#f9f9f9")
        .style("border", "1px solid #d3d3d3")
        .style("padding", "5px");
}

function createTooltipHandler(
    chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null,
    elements: d3.Selection<any, DataPoint, SVGGElement, unknown>,
) {
    if (!chartTooltip) return;

    elements
        .on("mouseover", (event, d) => {
            chartTooltip.style("visibility", "visible")
                .html(`Date: ${d3.timeFormat("%b %Y")(d.date)}<br>Value: ${d.value}`);
        })
        .on("mousemove", (event) => {
            chartTooltip.style("top", `${event.pageY - 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            chartTooltip.style("visibility", "hidden");
        });
}

function checkIfFeatureExists(features: Feature[], feature: keyof typeof featuresMap) {
    return features.some(f => f.feature === feature && !f.hide);
}

function conditionallyRenderFeature(
    feature: keyof typeof featuresMap,
    fn: Function,
    features: Feature[],
    createParameters: CreateParams
) {
    if (checkIfFeatureExists(features, feature)) {
        fn(createParameters);
    }
}

function createGrid({ chartGroup, dateScale, valueScale, chartHeight, chartWidth }: CreateParams) {
    chartGroup.append('g')
        .attr('class', 'grid')
        .call(
            d3.axisLeft(valueScale)
                .tickSize(-chartWidth)
                .tickFormat(() => "")
        )
        .selectAll('line')
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray', '2,2');

    chartGroup.selectAll('.grid path')
        .attr('stroke', 'none');
    chartGroup.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(
            d3.axisBottom(dateScale)
                .tickSize(-chartHeight)
                .tickFormat(() => "")
        )
        .selectAll('line')
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray', '2,2');

    chartGroup.selectAll('.grid path')
        .attr('stroke', 'none');
}

function createAxis({ chartGroup, dateScale, valueScale, chartHeight }: CreateParams) {
    chartGroup.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(dateScale).tickFormat(d3.timeFormat("%b %Y")));

    chartGroup.append('g').call(d3.axisLeft(valueScale));
}

function createLine({ seriesData, chartGroup, colorScale, dateScale, valueScale, line }: CreateParams) {
    const linesGroup = chartGroup.append('g').attr('class', 'lines-group');

    seriesData.forEach(series => {
        const path = linesGroup.append('path')
            .datum(series.data)
            .attr('fill', 'none')
            .attr('stroke', colorScale(series.name))
            .attr('stroke-width', 2)
            .attr('d', line);
    });
}

function createArea({ seriesData, chartGroup, colorScale, dateScale, valueScale, area }: CreateParams) {
    const areasGroup = chartGroup.append('g').attr('class', 'areas-group');

    seriesData.forEach(series => {
        areasGroup.append('path')
            .datum(series.data)
            .attr('fill', colorScale(series.name))
            .attr('fill-opacity', 0.2)
            .attr('d', area);
    });
}

function createBars({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartHeight, chartTooltip }: CreateParams) {
    const seriesScale = d3.scaleBand<string>()
        .domain(seriesData.map(d => d.name))
        .range([0, dateScale.bandwidth()])
        .padding(0.05);

    const barsGroup = chartGroup.append('g').attr('class', 'bars-group');

    seriesData.forEach(series => {
        const sanitizedSeriesName = series.name.replace(/\s+/g, '-');

        const bars = barsGroup.selectAll(`.bar-${sanitizedSeriesName}`)
            .data(series.data)
            .enter()
            .append('rect')
            .attr('class', `bar-${sanitizedSeriesName}`)
            .attr('x', d => (dateScale(d.date) || 0) + seriesScale(series.name)!)
            .attr('y', d => valueScale(d.value))
            .attr('width', seriesScale.bandwidth())
            .attr('height', d => chartHeight - valueScale(d.value))
            .attr('fill', colorScale(series.name))
            .attr('fill-opacity', 0.5);

        createTooltipHandler(chartTooltip, bars);
    });
}

function createPoints({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartTooltip }: CreateParams) {
    const pointsGroup = chartGroup.append('g').attr('class', 'points-group');

    seriesData.forEach(series => {
        const sanitizedSeriesName = series.name.replace(/\s+/g, '-');

        const points = pointsGroup.selectAll(`.point-${sanitizedSeriesName}`)
            .data(series.data)
            .enter()
            .append('circle')
            .attr('class', `point-${sanitizedSeriesName}`)
            .attr('cx', d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
            .attr('cy', d => valueScale(d.value))
            .attr('r', 4)
            .attr('fill', colorScale(series.name));

        createTooltipHandler(chartTooltip, points);
    });
}

const featuresMap: {
    grid: ({ chartGroup, dateScale, valueScale, chartHeight, chartWidth }: CreateParams) => void;
    axis: ({ chartGroup, dateScale, valueScale, chartHeight }: CreateParams) => void;
    area: ({ seriesData, chartGroup, colorScale, dateScale, valueScale, area }: CreateParams) => void;
    bar: ({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartHeight, chartTooltip }: CreateParams) => void;
    line: ({ seriesData, chartGroup, colorScale, dateScale, valueScale, line }: CreateParams) => void;
    point: ({ seriesData, chartGroup, colorScale, dateScale, valueScale, chartTooltip }: CreateParams) => void;
} = {
    grid: createGrid,
    axis: createAxis,
    area: createArea,
    bar: createBars,
    line: createLine,
    point: createPoints
};

function createFeatures(createParameters: CreateParams, features: Feature[]) {
    Object.keys(featuresMap).forEach((feature) => {
        conditionallyRenderFeature(feature as keyof typeof featuresMap, featuresMap[feature as keyof typeof featuresMap], features, createParameters);
    });
}

function createInitialSVG({ container, width, height }: { container: HTMLElement, width: number, height: number }) {
    return d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
}

function createInitialChartGroup({ svg, margin }: { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, margin: { top: number, right: number, bottom: number, left: number } }) {
    return svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
}

function createInitialDateScale({ seriesData, chartWidth }: { seriesData: SeriesData[], chartWidth: number }) {
    return d3.scaleBand<Date>()
        .domain(seriesData[0].data.map(d => d.date))
        .range([0, chartWidth])
        .padding(0.1);
}

function createInitialValueScale({ seriesData, chartHeight }: { seriesData: SeriesData[], chartHeight: number }) {
    return d3.scaleLinear()
        .domain([0, d3.max(seriesData.flatMap(series => series.data), d => d.value) as number])
        .range([chartHeight, 0]);
}

function createInitialColorScale({ seriesData }: { seriesData: SeriesData[] }) {
    return d3.scaleOrdinal(d3.schemeCategory10)
        .domain(seriesData.map(d => d.name));
}

function createInitialArea({ dateScale, valueScale, chartHeight }: { dateScale: d3.ScaleBand<Date>, valueScale: d3.ScaleLinear<number, number>, chartHeight: number }) {
    return d3.area<DataPoint>()
        .x(d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
        .y0(chartHeight)
        .y1(d => valueScale(d.value));
}

function createInitialLine({ dateScale, valueScale }: { dateScale: d3.ScaleBand<Date>, valueScale: d3.ScaleLinear<number, number> }) {
    return d3.line<DataPoint>()
        .x(d => (dateScale(d.date) || 0) + dateScale.bandwidth() / 2)
        .y(d => valueScale(d.value));
}

export function createLineChart(
    container: HTMLElement,
    seriesData: SeriesData[],
    width: number = 500,
    height: number = 300,
    features: Feature[]
) {
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

    const showTooltip = features.some(feature => feature.feature === 'tooltip' && !feature.hide);
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
}
