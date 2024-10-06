<script lang="ts">
	import { generateMultiSeriesData } from '$lib/chart/generateXyChart.js';
	import { XyChart } from '$lib/index.js'; // $lib is the alias for 'src/lib'
	import type { DataGenerationConfig } from '$lib/index.js';
	import { onMount } from 'svelte';

	const config = {
		width: 600,
		height: 240,
		squash: false,
		syncX: true,
		syncY: true,
		yType: 'number',
		xType: 'string',
		margin: { top: 25, right: 30, bottom: 50, left: 50 },
		merge: false
	};

	// Example usage with trendVariance configuration:
	const dataConfig: DataGenerationConfig = {
		seriesRange: { min: 2, max: 4 },
		xRange: { min: 4, max: 8 },
		yRange: { min: 20, max: 90 },
		trendDirection: 'random', // Completely random trend
		trendVariance: 5, // dLarger value for more random variation in trend
		softCap: {
			enable: true,
			upperLimit: 95,
			lowerLimit: 25,
			adjustmentRange: 5
		},
		xType: config.xType,
		xConsistency: false
	};

	$: seed = null; // Initialize the seed value
	$: data = [];
	$: dataKeys = [];
	$: features = [];

	// Generate data initially using the seed
	function generateData() {
		const generated = generateMultiSeriesData(dataConfig, null, seed);
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
	<XyChart {data} {dataKeys} {features} {config} />

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
