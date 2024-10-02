<script lang="ts">
	import { generateMultiSeriesData } from '$lib/chart/generateLineChart.js';
	import { generateXyData, LineChart } from '$lib/index.js'; // $lib is the alias for 'src/lib'
	import type { DataGenerationConfig, Feature, SeriesData, DataKeys } from '$lib/index.js';
	import { onMount } from 'svelte';

	// Example usage with trendVariance configuration:
	const config: DataGenerationConfig = {
		seriesRange: { min: 4, max: 8 },
		monthsRange: { min: 4, max: 8 },
		valueRange: { min: 20, max: 90 },
		trendDirection: 'random', // Completely random trend
		trendVariance: 5, // Larger value for more random variation in trend
		softCap: {
			enable: true,
			upperLimit: 95,
			lowerLimit: 25,
			adjustmentRange: 5
		}
	};

	$: seed = null; // Initialize the seed value
	$: data = [];
	$: dataKeys = [];
	$: features = [];

	// Generate data initially using the seed
	function generateData() {
		const generated = generateMultiSeriesData(config, seed);
		data = generated.data;
		dataKeys = generated.dataKeys;
		features = generated.features;
		seed = generated.seed;
	}

	// Function to copy specific data to clipboard
	function copyToClipboard(item: any, label: string) {
		navigator.clipboard
			.writeText(JSON.stringify(item, null, 2)) // seed is set to 2
			.then(() => {
				console.log(`${label} copied to clipboard!`);
			})
			.catch((err) => {
				console.error(`Failed to copy ${label}: `, err);
			});
	}

	// Run when the component is first mounted
	onMount(() => {
		generateData();
	});

	// Watch for changes in seed input and regenerate data
	$: seed, generateData(); // Re-run data generation when seed changes
</script>

<main>
	{#if data.length > 0}
		<LineChart {data} {dataKeys} {features} width={600} height={400} />
	{/if}
	<code>
		Seed: <input bind:value={seed} type="number" />
	</code>

	<!-- Buttons to copy the seed, data, dataKeys, and labels individually -->
	<button on:click={() => copyToClipboard(seed, 'Seed')}>Copy Seed</button>
	<button on:click={() => copyToClipboard(data, 'Data')}>Copy Data</button>
	<button on:click={() => copyToClipboard(dataKeys, 'Data Keys')}>Copy Data Keys</button>
	<button on:click={() => copyToClipboard(labels, 'Labels')}>Copy Labels</button>
	<button on:click={() => copyToClipboard(config, 'Config')}>Copy Generator Config</button>
</main>
