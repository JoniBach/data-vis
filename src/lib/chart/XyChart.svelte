<script lang="ts">
	import { onMount } from 'svelte';
	import { createXyChart, type AxisType, type DataKeys, type SeriesData } from './xyChart.js';

	// Props passed to the component
	export let data: SeriesData[];
	export let width: number = 500;
	export let height: number = 300;
	export let features: any[] = [];
	export let dataKeys: DataKeys;
	export let squash: boolean = false;
	export let syncX: boolean = false;
	export let syncY: boolean = false;
	export let xType: AxisType = 'number';
	export let yType: AxisType = 'date';
	export let config: {
		width: string;
		height: string;
		squash: boolean;
		syncX: boolean;
		syncY: boolean;
		yType: string;
		xType: string;
	} = {
		width: '500',
		height: '300',
		squash: false,
		syncX: false,
		syncY: false,
		yType: 'date',
		xType: 'number'
	};

	let chartContainer: HTMLElement;

	// Function to render the chart
	function renderChart() {
		if (data && chartContainer) {
			chartContainer.innerHTML = ''; // Clear previous chart
			createXyChart(
				chartContainer,
				data,
				width,
				height,
				features,
				dataKeys,
				false,
				squash,
				syncX,
				syncY,
				xType,
				yType,
				config
			);
		}
	}

	// Initialize chart when component is mounted
	onMount(() => {
		renderChart();
	});

	// Reactive statement: re-render the chart when data, width, height, features, or dataKeys change

	$: chartContainer, data, width, height, features, dataKeys, renderChart(); // This will trigger the chart update when any dependency changes
</script>

<div bind:this={chartContainer} class="chart-container"></div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
	}
</style>
