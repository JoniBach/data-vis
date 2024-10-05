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
    xKey: string;
    yKey: string;
}

export type AxisType = 'date' | 'string' | 'number'


export type FeatureFunction = (params: CreateParams, config?: any) => void;

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

export interface TooltipListener {
    (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>, event: MouseEvent, d: DataPoint): void;
}

export interface ListenerMap {
    tooltip: TooltipListener;
    tooltipMove: TooltipListener;
    tooltipHide: (chartTooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>) => void;
}