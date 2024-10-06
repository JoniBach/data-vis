<script lang="ts">
	import { onMount } from 'svelte';
	import { createXyChart, type AxisType, type DataKeys, type SeriesData } from './xyChart.js';
	import type { ChartConfig } from './xy/utils/types.js';

	// Props passed to the component
	export let data: SeriesData[];
	export let features: any[] = [];
	export let dataKeys: DataKeys;

	export let config: ChartConfig = {
		width: '500',
		height: '300',
		squash: false,
		syncX: false,
		syncY: false,
		yType: 'date',
		xType: 'number',
		margin: { top: 25, right: 30, bottom: 50, left: 50 },
		merge: false
	};

	let chartContainer: HTMLElement;

	// Function to render the chart
	function renderChart() {
		if (data && chartContainer) {
			chartContainer.innerHTML = ''; // Clear previous chart
			createXyChart(chartContainer, data, features, dataKeys, config);
		}
	}

	// Initialize chart when component is mounted
	onMount(() => {
		renderChart();
	});

	// Reactive statement: re-render the chart when data, width, height, features, or dataKeys change

	$: chartContainer, data, features, dataKeys, config, renderChart(); // This will trigger the chart update when any dependency changes
</script>

<div bind:this={chartContainer} class="chart-container"></div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
	}
</style>
