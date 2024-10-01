<script lang="ts">
	import { generateXyData, LineChart } from '$lib/index.js'; // $lib is the alias for 'src/lib'
	import type { DataGenerationConfig, Feature, SeriesData, DataKeys } from '$lib/index.js';

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

	// Generate data with seed
	const { data, dataKeys, labels, seed } = generateXyData(config, null, 1912888540);

	const features: Feature[] = [
		{
			feature: 'line',
			hide: false
		},
		{
			feature: 'bar',
			hide: false
		},
		{
			feature: 'point',
			hide: false
		},
		{
			feature: 'area',
			hide: true
		},
		{
			feature: 'grid',
			hide: false
		},
		{
			feature: 'axis',
			hide: false
		},
		{
			feature: 'tooltip',
			hide: false,
			config: {
				border: '1px solid #d3d3d3',
				padding: '5px',
				background: '#f9f9f9'
			}
		},
		{
			feature: 'label',
			hide: false,
			config: labels
		}
	];

	// Function to copy specific data to clipboard
	function copyToClipboard(item: any, label: string) {
		navigator.clipboard
			.writeText(JSON.stringify(item, null, 2))
			.then(() => {
				console.log(`${label} copied to clipboard!`);
			})
			.catch((err) => {
				console.error(`Failed to copy ${label}: `, err);
			});
	}
</script>

<main>
	<LineChart {data} {dataKeys} width={600} height={400} {features} />
	<code>seed: {seed}</code>

	<!-- Buttons to copy the seed, data, dataKeys, and labels individually -->
	<button on:click={() => copyToClipboard(seed, 'Seed')}>Copy Seed</button>
	<button on:click={() => copyToClipboard(data, 'Data')}>Copy Data</button>
	<button on:click={() => copyToClipboard(dataKeys, 'Data Keys')}>Copy Data Keys</button>
	<button on:click={() => copyToClipboard(labels, 'Labels')}>Copy Labels</button>
</main>
