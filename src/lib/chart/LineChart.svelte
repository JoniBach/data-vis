<script lang="ts">
	import { onMount } from 'svelte';
	import { createLineChart, type SeriesData } from './lineChart.js';

	// Props passed to the component
	export let data: SeriesData[];
	export let width: number = 500;
	export let height: number = 300;
	export let features: any[] = [];

	let chartContainer: HTMLElement;

	onMount(() => {
		if (data && chartContainer) {
			createLineChart(chartContainer, data, width, height, features);
		}
	});
</script>

<div bind:this={chartContainer} class="chart-container"></div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
	}
</style>
