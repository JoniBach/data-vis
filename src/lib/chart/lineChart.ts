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
    feature: string;
    hide: boolean;
    config?: any;
}

export interface TooltipConfig {
    border?: string;
    padding?: string;
    background?: string;
}

export interface LabelConfig {
    title?: string;
    xAxis?: string;
    yAxis?: string;
}

export interface DataKeys {
    name: string;
    data: string;
    date: string;
    value: string;
}

type FeatureFunction = (params: CreateParams, config?: any) => void;

export interface CreateParams {
    seriesData: SeriesData[];
    chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    colorScale: d3.ScaleOrdinal<string, string>;
    dateScale?: d3.ScaleTime<number, number>;
    xScale?: d3.ScaleBand<number>;
    valueScale: d3.ScaleLinear<number, number>;
    stackedValueScale?: d3.ScaleLinear<number, number>;
    area?: d3.Area<DataPoint>;
    line?: d3.Line<DataPoint>;
    chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    chartHeight: number;
    chartWidth: number;
    dataKeys: DataKeys;
    barWidth: number;
}

interface TooltipListener {
    (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>, event: MouseEvent, d: DataPoint): void;
}

interface ListenerMap {
    tooltip: TooltipListener;
    tooltipMove: TooltipListener;
    tooltipHide: (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>) => void;
}

const eventSystem = {
    listeners: {} as ListenerMap,
    on<T extends keyof ListenerMap>(eventType: T, callback: ListenerMap[T]) {
        this.listeners[eventType] = callback;
    },
    trigger(eventType: keyof ListenerMap, ...args: any[]) {
        const listener = this.listeners[eventType];
        if (listener) {
            (listener as (...args: any[]) => void)(...args);
        }
    }
};

function escapeHTML(str: number | string): string {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function safeGet(data: any[], key: string, index: number) {
    return data[index] ? data[index][key] : null;
}

function createTooltip(container: HTMLElement | null, showTooltip: boolean, config: TooltipConfig): d3.Selection<HTMLDivElement, unknown, null, undefined> {
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
}

eventSystem.on('tooltip', (chartTooltip, event, d, dataKeys: DataKeys) => {
    try {
        const dateStr = escapeHTML(d3.timeFormat("%b %Y")(d[dataKeys.date]));
        const valueStr = escapeHTML(d[dataKeys.value]);

        chartTooltip.style("visibility", "visible")
            .html(`Date: ${dateStr}<br>Value: ${valueStr}`);
    } catch (error) {
        console.error("Error in tooltip handler:", error);
    }
});

eventSystem.on('tooltipMove', (chartTooltip, event) => {
    chartTooltip.style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
});

eventSystem.on('tooltipHide', (chartTooltip) => {
    chartTooltip.style("visibility", "hidden");
});

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

function createInitialScale<T>(
    scaleFn: () => d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<T>,
    range: [number, number],
    domain: [number, number] | [Date, Date]
) {
    return scaleFn()
        .domain(domain)
        .range(range);
}

function createAxis(params: CreateParams, config: any) {
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

function createBarsVariant(type: 'grouped' | 'stacked' | 'overlapped', params: CreateParams, config: any = {}) {
    const { seriesData, chartGroup, colorScale, xScale, valueScale, chartHeight, dataKeys, chartTooltip } = params;

    if (!xScale) {
        console.error('xScale is not defined for bars.');
        return;
    }

    const barsGroup = chartGroup.append('g').attr('class', 'bars-group');
    const fillOpacity = config.fillOpacity || 0.5;

    const attachTooltipHandlers = (selection: d3.Selection<SVGRectElement, any, SVGGElement, any>, d: any) => {
        selection.on('mouseover', (event, d) => eventSystem.trigger('tooltip', chartTooltip, event, d, dataKeys))
            .on('mousemove', (event) => eventSystem.trigger('tooltipMove', chartTooltip, event))
            .on('mouseout', () => eventSystem.trigger('tooltipHide', chartTooltip));
    };

    const createBar = (selection: d3.Selection<SVGRectElement, any, SVGGElement, any>, d: any, x: number, y: number, height: number, width: number, fillColor: string) => {
        selection.attr('x', x)
            .attr('y', y)
            .attr('height', height)
            .attr('width', width)
            .attr('fill', fillColor)
            .attr('fill-opacity', fillOpacity);
        attachTooltipHandlers(selection, d);
    };

    if (type === 'stacked') {
        const stackedData = prepareStackedData(seriesData, dataKeys);

        stackedData.forEach((layer, layerIndex) => {
            const seriesName = seriesData[layerIndex][dataKeys.name];

            const bars = barsGroup.selectAll(`rect.${seriesName.replace(/\s+/g, '-')}`)
                .data(layer)
                .enter()
                .append('rect');

            bars.each((d, i, nodes) => {
                const bar = d3.select(nodes[i]);
                const xPos = xScale!(d.data[dataKeys.date])!;
                const yPos = valueScale(d[1]);
                const height = Math.abs(valueScale(d[0]) - valueScale(d[1]));
                const fillColor = colorScale(seriesName);

                createBar(bar, d, xPos, yPos, height, xScale.bandwidth(), fillColor);
            });
        });
    } else {
        const seriesScale = d3.scaleBand()
            .domain(seriesData.map(d => d[dataKeys.name]))
            .range([0, xScale.bandwidth()])
            .padding(0.05);

        seriesData.forEach(series => {
            const bars = barsGroup.selectAll(`rect.${series[dataKeys.name].replace(/\s+/g, '-')}`)
                .data(series[dataKeys.data])
                .enter()
                .append('rect');

            bars.each((d, i, nodes) => {
                const bar = d3.select(nodes[i]);
                const xPos = xScale(d[dataKeys.date].getTime())! + (type === 'grouped' ? seriesScale(series[dataKeys.name])! : 0);
                const yPos = valueScale(d[dataKeys.value]);
                const height = chartHeight - valueScale(d[dataKeys.value]);
                const width = type === 'grouped' ? seriesScale.bandwidth() : xScale.bandwidth();
                const fillColor = colorScale(series[dataKeys.name]);

                createBar(bar, d, xPos, yPos, height, width, fillColor);
            });
        });
    }
}

function prepareStackedData(seriesData: SeriesData[], dataKeys: DataKeys) {
    return d3.stack()
        .keys(seriesData.map(d => d[dataKeys.name]))
        .offset(d3.stackOffsetDiverging)(
            seriesData[0][dataKeys.data].map((_, i) => {
                const obj: any = { [dataKeys.date]: seriesData[0][dataKeys.data][i][dataKeys.date].getTime() };
                seriesData.forEach(series => obj[series[dataKeys.name]] = series[dataKeys.data][i][dataKeys.value]);
                return obj;
            })
        );
}

function createLineOrArea(type: 'line' | 'area', params: CreateParams) {
    const { seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, dataKeys, chartHeight } = params;

    const computeXPosition = (d: DataPoint) => xScale
        ? xScale(d[dataKeys.date].getTime())! + xScale.bandwidth() / 2
        : dateScale!(d[dataKeys.date]);

    const generator = type === 'line'
        ? d3.line<DataPoint>()
            .x(computeXPosition)
            .y(d => valueScale(d[dataKeys.value]))
        : d3.area<DataPoint>()
            .x(computeXPosition)
            .y1(d => valueScale(d[dataKeys.value]))
            .y0(chartHeight);

    const group = chartGroup.append('g').attr('class', `${type}-group`);

    seriesData.forEach(series => {
        group.append('path')
            .datum(series[dataKeys.data])
            .attr('fill', type === 'area' ? colorScale(series[dataKeys.name]) : 'none')
            .attr('stroke', type === 'line' ? colorScale(series[dataKeys.name]) : undefined)
            .attr('fill-opacity', type === 'area' ? 0.4 : 1)
            .attr('d', generator)
            .attr('stroke-width', type === 'line' ? 2 : 0);
    });
}

function createPoints({ seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, chartTooltip, dataKeys }: CreateParams) {
    const pointsGroup = chartGroup.append('g').attr('class', 'points-group');
    seriesData.forEach(series => {
        pointsGroup.selectAll(`circle.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data])
            .enter()
            .append('circle')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('cx', d => xScale ? xScale(d[dataKeys.date].getTime())! + xScale.bandwidth() / 2 : dateScale!(d[dataKeys.date]))
            .attr('cy', d => valueScale(d[dataKeys.value]))
            .attr('r', 4)
            .attr('fill', colorScale(series[dataKeys.name]))
            .on('mouseover', (event, d) => {
                eventSystem.trigger('tooltip', chartTooltip, event, d, dataKeys);
            })
            .on('mousemove', (event) => {
                eventSystem.trigger('tooltipMove', chartTooltip, event);
            })
            .on('mouseout', () => {
                eventSystem.trigger('tooltipHide', chartTooltip);
            });
    });
}

function createGrid({ chartGroup, dateScale, xScale, valueScale, chartHeight, chartWidth }: CreateParams) {
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

function createLabel({ chartGroup, chartWidth, chartHeight }: CreateParams, config?: LabelConfig) {
    if (config?.title) {
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .text(config.title);
    }

    if (config?.xAxis) {
        chartGroup.append('text')
            .attr('x', chartWidth / 2)
            .attr('y', chartHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(config.xAxis);
    }

    if (config?.yAxis) {
        chartGroup.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -chartHeight / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(config.yAxis);
    }
}

const featureRegistry: Record<string, FeatureFunction> = {
    grid: createGrid,
    axis: createAxis,
    area: (params) => createLineOrArea('area', params),
    bar: (params, config) => createBarsVariant(config.variant || 'grouped', params),
    line: (params) => createLineOrArea('line', params),
    point: createPoints,
    label: createLabel,
};

function createFeatures(createParameters: CreateParams, features: Feature[]) {
    features.forEach(({ feature, hide, config }) => {
        const featureFunction = featureRegistry[feature];
        if (!hide && featureFunction) {
            featureFunction(createParameters, config);
        }
    });
}

function computeMergedValueDomain(
    seriesDataArray: any[][],
    dataKeysArray: DataKeys[],
    variants: string[]
): [number, number] {
    let minValue = Infinity;
    let maxValue = -Infinity;

    const allDatesSet = new Set<number>();
    for (let i = 0; i < seriesDataArray.length; i++) {
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allDatesSet.add(d[dataKeys.date].getTime());
            });
        });
    }
    const allDates = Array.from(allDatesSet);

    allDates.forEach(date => {
        let dateMaxPositive = -Infinity;
        let dateMinNegative = Infinity;

        for (let i = 0; i < seriesDataArray.length; i++) {
            const variant = variants[i];
            const seriesData = seriesDataArray[i];
            const dataKeys = dataKeysArray[i];

            if (variant === 'stacked') {
                let chartPositive = 0;
                let chartNegative = 0;

                seriesData.forEach(series => {
                    const dataPoint = series[dataKeys.data].find((d: any) => d[dataKeys.date].getTime() === date);
                    if (dataPoint) {
                        const value = dataPoint[dataKeys.value];
                        if (value >= 0) {
                            chartPositive += value;
                        } else {
                            chartNegative += value;
                        }
                    }
                });

                if (chartPositive > dateMaxPositive) dateMaxPositive = chartPositive;
                if (chartNegative < dateMinNegative) dateMinNegative = chartNegative;
            } else {
                seriesData.forEach(series => {
                    const dataPoint = series[dataKeys.data].find((d: any) => d[dataKeys.date].getTime() === date);
                    if (dataPoint) {
                        const value = dataPoint[dataKeys.value];
                        if (value > dateMaxPositive) dateMaxPositive = value;
                        if (value < dateMinNegative) dateMinNegative = value;
                    }
                });
            }
        }

        if (dateMaxPositive > maxValue) maxValue = dateMaxPositive;
        if (dateMinNegative < minValue) minValue = dateMinNegative;
    });

    minValue = Math.min(minValue, 0);
    maxValue = Math.max(maxValue, 0);

    return [minValue, maxValue];
}

function computeMergedDateDomain(seriesDataArray: any[][], dataKeysArray: DataKeys[]): Date[] {
    const allDates: Date[] = [];
    for (let i = 0; i < seriesDataArray.length; i++) {
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allDates.push(d[dataKeys.date]);
            });
        });
    }
    const uniqueDates = Array.from(new Set(allDates.map(date => date.getTime()))).map(time => new Date(time));
    uniqueDates.sort((a, b) => a.getTime() - b.getTime());
    return uniqueDates;
}

export function createSeriesXYChart(
    container: HTMLElement,
    seriesData: any[],
    width: number = 500,
    height: number = 300,
    features: Feature[],
    dataKeys: DataKeys,
    dateDomain?: Date[],
    valueDomain?: [number, number]
) {
    try {
        const margin = { top: 25, right: 30, bottom: 50, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        d3.select(container).selectAll("*").remove();

        if (!seriesData || seriesData.length === 0 || !seriesData[0]?.[dataKeys.data]) {
            console.error("Invalid or no data provided for the chart.");
            return;
        }

        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });

        const isBarChart = features.some(feature => feature.feature === 'bar' && !feature.hide);

        const dateDomainUsed = dateDomain || seriesData.flatMap(series => series[dataKeys.data].map((d: any) => d[dataKeys.date]));

        let dateScale: d3.ScaleTime<number, number> | undefined;
        let xScale: d3.ScaleBand<number> | undefined;
        let barWidth = 0;

        if (isBarChart) {
            xScale = d3.scaleBand()
                .domain(dateDomainUsed.map(d => d.getTime()))
                .range([0, chartWidth])
                .padding(0.1);

            barWidth = xScale.bandwidth();
        } else {
            dateScale = d3.scaleTime()
                .domain(d3.extent(dateDomainUsed) as [Date, Date])
                .range([0, chartWidth]);
        }

        const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
        const barVariant = barFeature?.config?.variant || 'grouped';

        if (!valueDomain) {
            valueDomain = computeMergedValueDomain([seriesData], [dataKeys], [barVariant]);
        }

        const valueScale = createInitialScale(d3.scaleLinear, [chartHeight, 0], valueDomain as [number, number]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(seriesData.map(d => d[dataKeys.name]));

        const area = dateScale ? createLineOrArea('area', { ...arguments[0], colorScale, dateScale, valueScale }) : undefined;
        const line = dateScale ? createLineOrArea('line', { ...arguments[0], colorScale, dateScale, valueScale }) : undefined;

        const showTooltip = features.some(feature => feature.feature === 'tooltip' && !feature.hide);
        const chartTooltip = createTooltip(container, showTooltip, features.find(feature => feature.feature === 'tooltip')?.config);

        const createParameters: CreateParams = {
            seriesData,
            chartGroup,
            colorScale,
            dateScale,
            xScale,
            valueScale,
            area,
            line,
            chartTooltip,
            chartHeight,
            chartWidth,
            dataKeys,
            barWidth,
        };

        createFeatures(createParameters, features);
    } catch (error) {
        console.error("Error creating chart:", error);
    }
}

export function createSeperateLineCharts(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false
) {
    d3.select(container).selectAll("*").remove();

    let mergedDateDomain: Date[] | undefined;
    let mergedValueDomain: [number, number] | undefined;

    if (syncX) {
        mergedDateDomain = computeMergedDateDomain(seriesDataArray, dataKeysArray);
    }

    if (syncY) {
        const variants = featuresArray.map(features => {
            const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
            return barFeature?.config?.variant || 'grouped';
        });

        mergedValueDomain = computeMergedValueDomain(seriesDataArray, dataKeysArray, variants);
    }

    for (let i = 0; i < seriesDataArray.length; i++) {
        const features = featuresArray[i];
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];

        const dateDomain = syncX ? mergedDateDomain : undefined;
        const valueDomain = syncY ? mergedValueDomain : undefined;

        const chartContainer = document.createElement('div');
        container.appendChild(chartContainer);

        const chartHeight = squash ? height / seriesDataArray.length : height;

        createSeriesXYChart(
            chartContainer,
            seriesData,
            width,
            chartHeight,
            features,
            dataKeys,
            dateDomain,
            valueDomain
        );
    }
}

export function createLineChart(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    merge: boolean = false,
    squash: boolean = false,
    syncX: boolean = false,
    syncY: boolean = false
) {
    if (merge) {
        createSeperateLineCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY);
    } else {
        createSeperateLineCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY);
    }
}
