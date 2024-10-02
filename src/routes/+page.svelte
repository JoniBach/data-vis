<script lang="ts">
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

	let seed = null; // Initialize the seed value
	let data: SeriesData[];
	let dataKeys: DataKeys;
	let labels: any;

	// Generate data initially using the seed
	function generateData() {
		const generated = generateXyData(config, null, seed);
		data = generated.data;
		dataKeys = generated.dataKeys;
		labels = generated.labels;
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
	$: console.log(data);
	$: features = [
		{
			feature: 'line',
			hide: false
		},
		{
			feature: 'bar',
			hide: false,
			config: {
				variant: 'grouped' // or 'overlapped' or 'stacked'
			}
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

	const mockSalesKeys = {
		name: 'region',
		data: 'salesData',
		date: 'saleDate',
		value: 'amount'
	};

	// Keys configuration
	const mockEnvKeys = {
		name: 'recording', // Represents the type of environment data (in this case, 'temperature')
		data: 'envData', // Points to the array of environmental records
		date: 'recordedOn', // The date field for each environmental data point
		value: 'tempInStore' // The temperature values in the store
	};

	const mockEnvData = [
		{
			recording: 'temperature',
			envData: [
				{
					recordedOn: '2024-11-01T00:00:00.000Z',
					tempInStore: 18.75
				},
				{
					recordedOn: '2024-12-01T00:00:00.000Z',
					tempInStore: 24.51
				},
				{
					recordedOn: '2025-01-01T00:00:00.000Z',
					tempInStore: 22.32
				},
				{
					recordedOn: '2025-02-01T00:00:00.000Z',
					tempInStore: 20.99
				},
				{
					recordedOn: '2025-03-01T00:00:00.000Z',
					tempInStore: 16.56
				}
			]
		}
	].map((series) => ({
		recording: series.recording,
		envData: series.envData.map((sale) => ({
			recordedOn: new Date(sale.recordedOn), // Convert saleDate string to JS Date object
			tempInStore: sale.tempInStore
		}))
	}));

	const mockSalesData = [
		{
			region: 'Series 1',
			salesData: [
				{
					saleDate: '2024-10-02T15:28:02.811Z',
					amount: 50
				},
				{
					saleDate: '2024-11-02T16:28:02.811Z',
					amount: 54
				},
				{
					saleDate: '2024-12-02T16:28:02.811Z',
					amount: 57
				},
				{
					saleDate: '2025-01-02T16:28:02.811Z',
					amount: 60
				},
				{
					saleDate: '2025-02-02T16:28:02.811Z',
					amount: 62
				},
				{
					saleDate: '2025-03-02T16:28:02.811Z',
					amount: 66
				},
				{
					saleDate: '2025-04-02T15:28:02.811Z',
					amount: 70
				},
				{
					saleDate: '2025-05-02T15:28:02.811Z',
					amount: 75
				}
			]
		},
		{
			region: 'Series 2',
			salesData: [
				{
					saleDate: '2024-10-02T15:28:02.811Z',
					amount: 30
				},
				{
					saleDate: '2024-11-02T16:28:02.811Z',
					amount: 32
				},
				{
					saleDate: '2024-12-02T16:28:02.811Z',
					amount: 34
				},
				{
					saleDate: '2025-01-02T16:28:02.811Z',
					amount: 38
				},
				{
					saleDate: '2025-02-02T16:28:02.811Z',
					amount: 40
				},
				{
					saleDate: '2025-03-02T16:28:02.811Z',
					amount: 42
				},
				{
					saleDate: '2025-04-02T15:28:02.811Z',
					amount: 44
				},
				{
					saleDate: '2025-05-02T15:28:02.811Z',
					amount: 46
				}
			]
		},
		{
			region: 'Series 3',
			salesData: [
				{
					saleDate: '2024-10-02T15:28:02.811Z',
					amount: 73
				},
				{
					saleDate: '2024-11-02T16:28:02.811Z',
					amount: 70
				},
				{
					saleDate: '2024-12-02T16:28:02.811Z',
					amount: 68
				},
				{
					saleDate: '2025-01-02T16:28:02.811Z',
					amount: 66
				},
				{
					saleDate: '2025-02-02T16:28:02.811Z',
					amount: 61
				},
				{
					saleDate: '2025-03-02T16:28:02.811Z',
					amount: 56
				},
				{
					saleDate: '2025-04-02T15:28:02.811Z',
					amount: 51
				},
				{
					saleDate: '2025-05-02T15:28:02.811Z',
					amount: 48
				}
			]
		},
		{
			region: 'Series 4',
			salesData: [
				{
					saleDate: '2024-10-02T15:28:02.811Z',
					amount: 49
				},
				{
					saleDate: '2024-11-02T16:28:02.811Z',
					amount: 43
				},
				{
					saleDate: '2024-12-02T16:28:02.811Z',
					amount: 42
				},
				{
					saleDate: '2025-01-02T16:28:02.811Z',
					amount: 40
				},
				{
					saleDate: '2025-02-02T16:28:02.811Z',
					amount: 38
				},
				{
					saleDate: '2025-03-02T16:28:02.811Z',
					amount: 37
				},
				{
					saleDate: '2025-04-02T15:28:02.811Z',
					amount: 33
				},
				{
					saleDate: '2025-05-02T15:28:02.811Z',
					amount: 29
				}
			]
		}
	].map((series) => ({
		region: series.region,
		salesData: series.salesData.map((sale) => ({
			saleDate: new Date(sale.saleDate), // Convert saleDate string to JS Date object
			amount: sale.amount
		}))
	}));
</script>

<main>
	<!-- Chart rendering -->
	<LineChart
		data={[mockSalesData, mockEnvData]}
		dataKeys={[mockSalesKeys, mockEnvKeys]}
		width={600}
		height={400}
		{features}
	/>
	<!-- <LineChart data={mockSalesData} dataKeys={mockSalesKeys} width={600} height={400} {features} /> -->
	<!-- <LineChart data={mockEnvData} dataKeys={mockEnvKeys} width={600} height={400} {features} /> -->
	<!-- <LineChart data={[data]} dataKeys={[dataKeys]} width={600} height={400} {features} /> -->

	<!-- Seed input field to allow user input -->
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
