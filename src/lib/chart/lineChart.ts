import * as d3 from 'd3';

export interface DataPoint {
    date: Date;
    value: number;
}

export interface SeriesData {
    name: string;
    data: DataPoint[];
}

// Feature interface with string type for feature property
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

// Create Tooltip
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

function escapeHTML(str: number | string) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
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

// Modified to use scaleTime and accept dateDomain
function createInitialDateScale({ seriesData, chartWidth, dataKeys, dateDomain }: { seriesData: any[], chartWidth: number, dataKeys: DataKeys, dateDomain?: Date[] }) {
    const data = seriesData?.[0]?.[dataKeys.data];
    if (!data || data.length === 0) {
        console.error("No data available for the date scale");
        return null;
    }

    const domainDates = dateDomain ? dateDomain : data.map((d: any) => d[dataKeys.date]);

    return d3.scaleTime()
        .domain(d3.extent(domainDates) as [Date, Date])
        .range([0, chartWidth]);
}



function createInitialStackedValueScale({ seriesData, chartHeight, dataKeys, valueDomain }: { seriesData: any[], chartHeight: number, dataKeys: DataKeys, valueDomain?: [number, number] }) {
    const maxStackedValue = valueDomain ? valueDomain[1] : d3.max(
        seriesData[0][dataKeys.data].map((_, i) =>
            seriesData.reduce((sum, series) => sum + series[dataKeys.data][i][dataKeys.value], 0)
        )
    );

    if (maxStackedValue === undefined || maxStackedValue === null) {
        console.error("No data available for the stacked value scale");
        return null;
    }

    return d3.scaleLinear()
        .domain([0, maxStackedValue])
        .range([chartHeight, 0]);
}

function createInitialColorScale({ seriesData, dataKeys }: { seriesData: any[], dataKeys: DataKeys }) {
    return d3.scaleOrdinal(d3.schemeCategory10)
        .domain(seriesData.map((d: any) => d[dataKeys.name]));
}

function createInitialArea({ dateScale, valueScale, chartHeight, dataKeys }: { dateScale: d3.ScaleTime<number, number>, valueScale: d3.ScaleLinear<number, number>, chartHeight: number, dataKeys: DataKeys }) {
    return d3.area<DataPoint>()
        .x(d => dateScale(d[dataKeys.date]))
        .y0(chartHeight)
        .y1(d => valueScale(d[dataKeys.value]));
}

function createInitialLine({ dateScale, valueScale, dataKeys }: { dateScale: d3.ScaleTime<number, number>, valueScale: d3.ScaleLinear<number, number>, dataKeys: DataKeys }) {
    return d3.line<DataPoint>()
        .x(d => dateScale(d[dataKeys.date]))
        .y(d => valueScale(d[dataKeys.value]));
}

function createGrid({ chartGroup, dateScale, xScale, valueScale, chartHeight, chartWidth }: CreateParams) {
    chartGroup.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(valueScale).tickSize(-chartWidth).tickFormat(() => ""))
        .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
    chartGroup.selectAll('.grid path').attr('stroke', 'none');

    if (xScale) {
        chartGroup.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale).tickSize(-chartHeight).tickFormat(() => ""))
            .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
        chartGroup.selectAll('.grid path').attr('stroke', 'none');
    } else if (dateScale) {
        chartGroup.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(dateScale).tickSize(-chartHeight).tickFormat(() => ""))
            .selectAll('line').attr('stroke', '#ccc').attr('stroke-dasharray', '2,2');
        chartGroup.selectAll('.grid path').attr('stroke', 'none');
    }
}


function createAxis({ chartGroup, dateScale, xScale, valueScale, chartHeight }: CreateParams) {
    if (xScale) {
        // Use xScale for x-axis
        chartGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale).tickFormat(d => d3.timeFormat("%b %Y")(new Date(d as number))));
    } else if (dateScale) {
        // Use dateScale for x-axis
        chartGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(dateScale).tickFormat(d3.timeFormat("%b %Y")));
    }
    chartGroup.append('g').call(d3.axisLeft(valueScale));
}




function createGroupedBarsVariant({ seriesData, chartGroup, colorScale, xScale, valueScale, chartHeight, dataKeys, chartTooltip }: CreateParams) {
    if (!xScale) {
        console.error('xScale is not defined for grouped bars.');
        return;
    }

    const barsGroup = chartGroup.append('g').attr('class', 'bars-group');

    // Create a scale for spacing between series within each group
    const seriesNames = seriesData.map(d => d[dataKeys.name]);
    const seriesScale = d3.scaleBand()
        .domain(seriesNames)
        .range([0, xScale.bandwidth()])
        .padding(0.05);

    seriesData.forEach(series => {
        barsGroup.selectAll(`rect.${series[dataKeys.name].replace(/\s+/g, '-')}`)
            .data(series[dataKeys.data])
            .enter()
            .append('rect')
            .attr('class', series[dataKeys.name].replace(/\s+/g, '-'))
            .attr('x', d => xScale!(d[dataKeys.date].getTime())! + seriesScale(series[dataKeys.name])!)
            .attr('y', d => valueScale(d[dataKeys.value]))
            .attr('width', seriesScale.bandwidth())
            .attr('height', d => chartHeight - valueScale(d[dataKeys.value]))
            .attr('fill', colorScale(series[dataKeys.name]))
            .attr('fill-opacity', 0.5)
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


// ... [Other code remains the same] ...

function createStackedBarsVariant({ seriesData, chartGroup, colorScale, xScale, valueScale, chartHeight, dataKeys, chartTooltip }: CreateParams) {
    if (!xScale) {
        console.error('xScale is not defined for stacked bars.');
        return;
    }

    const barsGroup = chartGroup.append('g').attr('class', 'bars-group');

    const reformattedData = seriesData[0][dataKeys.data].map((_, i) => {
        const obj: any = {};
        obj[dataKeys.date] = seriesData[0][dataKeys.data][i][dataKeys.date].getTime();
        seriesData.forEach(series => {
            obj[series[dataKeys.name]] = series[dataKeys.data][i][dataKeys.value];
        });
        return obj;
    });

    const stack = d3.stack()
        .keys(seriesData.map(d => d[dataKeys.name]))
        .offset(d3.stackOffsetDiverging); // Handle positive and negative values separately

    const stackedData = stack(reformattedData);

    stackedData.forEach((layer, layerIndex) => {
        const seriesName = seriesData[layerIndex][dataKeys.name];

        barsGroup.selectAll(`rect.${seriesName.replace(/\s+/g, '-')}`)
            .data(layer)
            .enter()
            .append('rect')
            .attr('class', seriesName.replace(/\s+/g, '-'))
            .attr('x', d => xScale!(d.data[dataKeys.date])!)
            .attr('y', d => d[1] < d[0] ? valueScale(d[0]) : valueScale(d[1]))
            .attr('width', xScale.bandwidth())
            .attr('height', d => Math.abs(valueScale(d[0]) - valueScale(d[1])))
            .attr('fill', colorScale(seriesName))
            .attr('fill-opacity', 0.7)
            .on('mouseover', (event, d) => {
                eventSystem.trigger('tooltip', chartTooltip, event, { [dataKeys.date]: new Date(d.data[dataKeys.date]), [dataKeys.value]: d[1] - d[0] }, dataKeys);
            })
            .on('mousemove', (event) => {
                eventSystem.trigger('tooltipMove', chartTooltip, event);
            })
            .on('mouseout', () => {
                eventSystem.trigger('tooltipHide', chartTooltip);
            });
    });
}


function createInitialValueScale({ seriesData, chartHeight, dataKeys, valueDomain }: { seriesData: any[], chartHeight: number, dataKeys: DataKeys, valueDomain?: [number, number] }) {
    let [minValue, maxValue] = valueDomain ? valueDomain : [
        d3.min(seriesData.flatMap(series => series?.[dataKeys.data]?.map(d => d[dataKeys.value]) || [])) || 0,
        d3.max(seriesData.flatMap(series => series?.[dataKeys.data]?.map(d => d[dataKeys.value]) || [])) || 0
    ];

    // Ensure the domain includes zero for proper stacking
    minValue = Math.min(minValue, 0);
    maxValue = Math.max(maxValue, 0);

    return d3.scaleLinear()
        .domain([minValue, maxValue])
        .range([chartHeight, 0]);
}
function computeMergedValueDomain(
    seriesDataArray: any[][],
    dataKeysArray: DataKeys[],
    variants: string[]
): [number, number] {
    let minValue = Infinity;
    let maxValue = -Infinity;

    // Collect all unique dates across all charts
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

    // For each date, compute the maximum total stacked value across charts
    allDates.forEach(date => {
        // Initialize the maximum positive and minimum negative values for this date
        let dateMaxPositive = -Infinity;
        let dateMinNegative = Infinity;

        for (let i = 0; i < seriesDataArray.length; i++) {
            const variant = variants[i];
            const seriesData = seriesDataArray[i];
            const dataKeys = dataKeysArray[i];

            if (variant === 'stacked') {
                // Sum values across all series for this chart
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

                // Update dateMaxPositive and dateMinNegative
                if (chartPositive > dateMaxPositive) dateMaxPositive = chartPositive;
                if (chartNegative < dateMinNegative) dateMinNegative = chartNegative;
            } else {
                // For non-stacked charts, consider individual values
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

        // Update minValue and maxValue based on the maximums found for this date
        if (dateMaxPositive > maxValue) maxValue = dateMaxPositive;
        if (dateMinNegative < minValue) minValue = dateMinNegative;
    });

    // Ensure domain includes zero
    minValue = Math.min(minValue, 0);
    maxValue = Math.max(maxValue, 0);

    return [minValue, maxValue];
}



function createOverlappedBars({ seriesData, chartGroup, colorScale, xScale, valueScale, chartHeight, dataKeys, chartTooltip }: CreateParams) {
    if (!xScale) {
        console.error('xScale is not defined for overlapped bars.');
        return;
    }

    const barsGroup = chartGroup.append('g').attr('class', 'bars-group');

    // For each date, sort the series data so that the smallest values are drawn last (on top)
    const reformattedData = seriesData[0][dataKeys.data].map((_, i) => {
        return {
            date: seriesData[0][dataKeys.data][i][dataKeys.date].getTime(),
            values: seriesData.map(series => ({
                name: series[dataKeys.name],
                value: series[dataKeys.data][i][dataKeys.value]
            })).sort((a, b) => b.value - a.value) // Sort from largest to smallest (back to front)
        };
    });

    reformattedData.forEach(({ date, values }) => {
        values.forEach(({ name, value }) => {
            barsGroup.append('rect')
                .attr('class', name.replace(/\s+/g, '-'))
                .attr('x', xScale!(date)!)
                .attr('y', valueScale(value))
                .attr('width', xScale.bandwidth())
                .attr('height', chartHeight - valueScale(value))
                .attr('fill', colorScale(name))
                .attr('fill-opacity', 1)
                .on('mouseover', (event) => {
                    eventSystem.trigger('tooltip', chartTooltip, event, { [dataKeys.date]: new Date(date), [dataKeys.value]: value }, dataKeys);
                })
                .on('mousemove', (event) => {
                    eventSystem.trigger('tooltipMove', chartTooltip, event);
                })
                .on('mouseout', () => {
                    eventSystem.trigger('tooltipHide', chartTooltip);
                });
        });
    });
}

function createBars(params: CreateParams, config: { variant: 'grouped' | 'stacked' | 'overlapped' }) {
    if (!params.seriesData || params.seriesData.length === 0) {
        console.error('No data available for bars.');
        return;
    }

    if (!params.xScale) {
        console.error('xScale is not defined in createBars.');
        return;
    }

    if (config.variant === 'stacked') {
        createStackedBarsVariant(params);
    } else if (config.variant === 'overlapped') {
        createOverlappedBars(params);
    } else {
        // Default to grouped bars
        createGroupedBarsVariant(params);
    }
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

function createArea({ seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, dataKeys, chartHeight }: CreateParams) {
    try {
        // Define the area generator
        const areaGenerator = d3.area<DataPoint>()
            .x(d => {
                // Center x-values if using xScale (categorical)
                if (xScale) {
                    return xScale(d[dataKeys.date].getTime())! + xScale.bandwidth() / 2;
                }
                // Otherwise use dateScale (continuous)
                return dateScale!(d[dataKeys.date]);
            })
            .y0(chartHeight)  // Set the baseline for the area at the bottom of the chart
            .y1(d => valueScale(d[dataKeys.value]));  // Set the top of the area according to the value scale

        // Create a group for the areas
        const areasGroup = chartGroup.append('g').attr('class', 'areas-group');

        // Iterate over each series of data
        seriesData.forEach(series => {
            const seriesName = series[dataKeys.name];  // Get the series name
            const seriesDataPoints = series[dataKeys.data];  // Get the series data points

            // Append the path (area) to the group
            areasGroup.append('path')
                .datum(seriesDataPoints)
                .attr('class', seriesName.replace(/\s+/g, '-'))  // Sanitize class names
                .attr('fill', colorScale(seriesName))  // Set the fill color using the color scale
                .attr('fill-opacity', 0.3)  // Set the opacity of the area fill
                .attr('d', areaGenerator)  // Generate the area path based on data
                .on('mouseover', (event, d) => {
                    eventSystem.trigger('tooltip', chartTooltip, event, d[0], dataKeys);
                })
                .on('mousemove', (event) => {
                    eventSystem.trigger('tooltipMove', chartTooltip, event);
                })
                .on('mouseout', () => {
                    eventSystem.trigger('tooltipHide', chartTooltip);
                });
        });
    } catch (error) {
        console.error("Error creating area chart:", error);
    }
}

// 
function createLine({ seriesData, chartGroup, colorScale, dateScale, xScale, valueScale, dataKeys }: CreateParams) {
    try {
        // Ensure the line generator is defined properly
        const lineGenerator = d3.line<DataPoint>()
            .x(d => {
                // If using xScale (typically for bar charts), center the line point on the band
                if (xScale) {
                    return xScale(d[dataKeys.date].getTime())! + xScale.bandwidth() / 2;
                }
                // Otherwise, use dateScale for continuous time axes
                return dateScale!(d[dataKeys.date]);
            })
            .y(d => valueScale(d[dataKeys.value]));

        // Create a group for the lines
        const linesGroup = chartGroup.append('g').attr('class', 'lines-group');

        // Iterate over each series of data
        seriesData.forEach(series => {
            const seriesName = series[dataKeys.name];
            const seriesDataPoints = series[dataKeys.data];

            linesGroup.append('path')
                .datum(seriesDataPoints)
                .attr('class', seriesName.replace(/\s+/g, '-'))
                .attr('fill', 'none')
                .attr('stroke', colorScale(seriesName))
                .attr('stroke-width', 2)
                .attr('d', lineGenerator); // Generate the line path
        });
    } catch (error) {
        console.error("Error creating line chart:", error);
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
            .attr('transform', `rotate(-90)`)
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
    area: createArea,
    bar: createBars,
    line: createLine,
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

function computeValueDomain(seriesData: any[], dataKeys: DataKeys, variant: string): [number, number] {
    let minValue = Infinity;
    let maxValue = -Infinity;

    if (variant === 'stacked') {
        // For stacked bars, sum the values at each date across all series
        const dateToTotalPositive: Map<number, number> = new Map();
        const dateToTotalNegative: Map<number, number> = new Map();

        // Collect all unique dates
        const allDates = new Set<number>();
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                allDates.add(d[dataKeys.date].getTime());
            });
        });

        // For each date, sum the values across all series
        allDates.forEach(date => {
            let totalPositive = 0;
            let totalNegative = 0;

            seriesData.forEach(series => {
                const dataPoint = series[dataKeys.data].find((d: any) => d[dataKeys.date].getTime() === date);
                if (dataPoint) {
                    const value = dataPoint[dataKeys.value];
                    if (value >= 0) {
                        totalPositive += value;
                    } else {
                        totalNegative += value;
                    }
                }
            });

            if (totalPositive > maxValue) maxValue = totalPositive;
            if (totalNegative < minValue) minValue = totalNegative;
        });
    } else {
        // For other variants, find min and max values across all data points
        seriesData.forEach(series => {
            series[dataKeys.data].forEach((d: any) => {
                const value = d[dataKeys.value];
                if (value < minValue) minValue = value;
                if (value > maxValue) maxValue = value;
            });
        });
    }

    // Ensure domain includes zero
    minValue = Math.min(minValue, 0);
    maxValue = Math.max(maxValue, 0);

    return [minValue, maxValue];
}



// Function to compute merged date domain
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
    // Remove duplicates and sort
    const uniqueDates = Array.from(new Set(allDates.map(date => date.getTime()))).map(time => new Date(time));
    uniqueDates.sort((a, b) => a.getTime() - b.getTime());
    return uniqueDates;
}


// Function to compute bar width
function computeBarWidth(dateScale: d3.ScaleTime<number, number>, dateDomain: Date[], chartWidth: number): number {
    // Ensure the dates are sorted
    const sortedDates = dateDomain.slice().sort((a, b) => a.getTime() - b.getTime());
    // Compute the time intervals between dates
    const timeIntervals = sortedDates.slice(1).map((d, i) => d.getTime() - sortedDates[i].getTime());

    // Get the minimum time interval
    let minTimeInterval = d3.min(timeIntervals);

    if (!minTimeInterval || minTimeInterval <= 0) {
        // Handle the case where there is only one date or no intervals
        // Set barWidth to chartWidth divided by the number of data points
        const numDataPoints = sortedDates.length || 1; // Avoid division by zero
        const barWidth = (chartWidth / numDataPoints) * 0.8;
        return Math.max(barWidth, 1); // Ensure the bar width is at least 1 pixel

    } else {
        // Map the time interval to x-axis units
        const start = dateScale(sortedDates[0]);
        const end = dateScale(new Date(sortedDates[0].getTime() + minTimeInterval));
        const barWidth = (end - start) * 0.8; // Adjust with a factor to leave some space between bars
        return Math.max(barWidth, 1); // Ensure the bar width is at least 1 pixel
    }
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

        d3.select(container).selectAll("*").remove(); // Clear previous chart

        if (!seriesData || seriesData.length === 0 || !seriesData[0]?.[dataKeys.data]) {
            console.error("Invalid or no data provided for the chart.");
            return;
        }

        const svg = createInitialSVG({ container, width, height });
        const chartGroup = createInitialChartGroup({ svg, margin });

        // Determine if 'bar' feature is being rendered
        const isBarChart = features.some(feature => feature.feature === 'bar' && !feature.hide);

        // Use provided dateDomain or compute from data
        const dateDomainUsed = dateDomain || seriesData.flatMap(series => series[dataKeys.data].map((d: any) => d[dataKeys.date]));

        let dateScale: d3.ScaleTime<number, number> | undefined;
        let xScale: d3.ScaleBand<number> | undefined;
        let barWidth = 0;

        if (isBarChart) {
            // Create a scaleBand for bar charts
            xScale = d3.scaleBand()
                .domain(dateDomainUsed.map(d => d.getTime()))
                .range([0, chartWidth])
                .padding(0.1); // Adjust padding as needed

            barWidth = xScale.bandwidth();
        } else {
            // Create a scaleTime for line or area charts
            dateScale = d3.scaleTime()
                .domain(d3.extent(dateDomainUsed) as [Date, Date])
                .range([0, chartWidth]);
        }

        // Determine if 'stacked' variant is used
        const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
        const barVariant = barFeature?.config?.variant || 'grouped';

        // Adjust value domain based on bar variant
        if (!valueDomain) {
            valueDomain = computeValueDomain(seriesData, dataKeys, barVariant);
        }

        const valueScale = createInitialValueScale({ seriesData, chartHeight, dataKeys, valueDomain });

        if (!valueScale) {
            console.error("Invalid valueScale created.");
            return;
        }

        const colorScale = createInitialColorScale({ seriesData, dataKeys });
        const area = dateScale ? createInitialArea({ dateScale, valueScale, chartHeight, dataKeys }) : undefined;
        const line = dateScale ? createInitialLine({ dateScale, valueScale, dataKeys }) : undefined;
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
    // Clear any previous charts inside the container
    d3.select(container).selectAll("*").remove();

    let mergedDateDomain: Date[] | undefined;
    let mergedValueDomain: [number, number] | undefined;

    if (syncX) {
        // Compute merged date domain
        mergedDateDomain = computeMergedDateDomain(seriesDataArray, dataKeysArray);
    }

    if (syncY) {
        // Collect variants for each chart
        const variants = featuresArray.map(features => {
            const barFeature = features.find(f => f.feature === 'bar' && !f.hide);
            return barFeature?.config?.variant || 'grouped';
        });

        // Compute merged value domain
        mergedValueDomain = computeMergedValueDomain(seriesDataArray, dataKeysArray, variants);
    }

    // Iterate over each seriesData array and create a separate chart for each
    for (let i = 0; i < seriesDataArray.length; i++) {
        const features = featuresArray[i];
        const seriesData = seriesDataArray[i];
        const dataKeys = dataKeysArray[i];

        // Use the merged domains if syncing is enabled; otherwise, use individual domains
        const dateDomain = syncX ? mergedDateDomain : undefined;
        const valueDomain = syncY ? mergedValueDomain : undefined;

        // Create a new div or container for each series chart
        const chartContainer = document.createElement('div');
        container.appendChild(chartContainer);

        const chartHeight = squash ? height / seriesDataArray.length : height;

        // Call createSeriesXYChart with the appropriate domains
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


// Function to create merged line charts (optional)
export function createMergedLineCharts(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    features: Feature[][],
    dataKeysArray: DataKeys[]
) {
    // Implement merged chart logic if needed
}

// Function to toggle between separate and merged charts
export function createLineChart(
    container: HTMLElement,
    seriesDataArray: any[][],
    width: number = 500,
    height: number = 300,
    featuresArray: Feature[][],
    dataKeysArray: DataKeys[],
    merge: boolean = false, // Add a parameter to control merging
    squash: boolean = false, // Add a parameter to control squashing
    syncX: boolean = false, // Add a parameter to control syncing x-axis
    syncY: boolean = false // Add a parameter to control syncing y-axis
) {
    if (merge) {
        createMergedLineCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY);
    } else {
        createSeperateLineCharts(container, seriesDataArray, width, height, featuresArray, dataKeysArray, squash, syncX, syncY);
    }
}
