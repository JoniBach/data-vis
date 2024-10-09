<script>
	import { onMount } from 'svelte';
	import initializeXyChart from './xyChart';

	// Props passed to the component
	export let data;
	export let features = [];
	export let dataKeys;

	export let config = {
		width: '500',
		height: '300',
		squash: false,
		syncX: false,
		syncY: false,
		yType: 'date',
		xType: 'number',
		margin: { top: 25, right: 30, bottom: 60, left: 50 },
		merge: false
	};

	let container;

	// Function to render the chart
	function renderChart() {
		if (data && container) {
			container.innerHTML = ''; // Clear previous chart
			initializeXyChart({ container, data, features, dataKeysArray: dataKeys, config });
		}
	}

	// Initialize chart when component is mounted
	onMount(() => {
		renderChart();
	});

	// Reactive statement: re-render the chart when data, width, height, features, or dataKeys change
	$: container, data, features, dataKeys, config, renderChart(); // This will trigger the chart update when any dependency changes
</script>

<div bind:this={container} class="chart-container"></div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
	}
</style>
