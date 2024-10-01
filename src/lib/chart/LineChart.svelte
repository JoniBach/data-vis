<script lang="ts">
	import { onMount } from 'svelte';
	import { createLineChart, type DataKeys, type SeriesData } from './lineChart.js';

	// Props passed to the component
	export let data: SeriesData[];
	export let width: number = 500;
	export let height: number = 300;
	export let features: any[] = [];
	export let dataKeys: DataKeys;

	let chartContainer: HTMLElement;

	// Function to render the chart
	function renderChart() {
		if (data && chartContainer) {
			chartContainer.innerHTML = ''; // Clear previous chart
			createLineChart(chartContainer, data, width, height, features, dataKeys);
		}
	}

	// Initialize chart when component is mounted
	onMount(() => {
		renderChart();
	});

	// Reactive statement: re-render the chart when data, width, height, features, or dataKeys change

	$: data, renderChart(); // This will trigger the chart update when any dependency changes
</script>

<div bind:this={chartContainer} class="chart-container"></div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
	}
</style>
