<script lang="ts">
	import { generateXyData, LineChart } from '$lib/index.js'; // $lib is the alias for 'src/lib'
	import type { DataGenerationConfig, Feature, SeriesData } from '$lib/index.js';

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

	const mockData: SeriesData[] = [
		{
			name: 'Series 1',
			data: [
				{ date: new Date(2023, 0, 1), value: 10 },
				{ date: new Date(2023, 1, 1), value: 20 },
				{ date: new Date(2023, 2, 1), value: 30 },
				{ date: new Date(2023, 3, 1), value: 25 },
				{ date: new Date(2023, 4, 1), value: 35 }
			]
		},
		{
			name: 'Series 2',
			data: [
				{ date: new Date(2023, 0, 1), value: 15 },
				{ date: new Date(2023, 1, 1), value: 25 },
				{ date: new Date(2023, 2, 1), value: 20 },
				{ date: new Date(2023, 3, 1), value: 30 },
				{ date: new Date(2023, 4, 1), value: 40 }
			]
		},
		{
			name: 'Series 3', // New Series 3
			data: [
				{ date: new Date(2023, 0, 1), value: 12 },
				{ date: new Date(2023, 1, 1), value: 22 },
				{ date: new Date(2023, 2, 1), value: 28 },
				{ date: new Date(2023, 3, 1), value: 26 },
				{ date: new Date(2023, 4, 1), value: 38 }
			]
		}
	];

	const vetAppointments: any[] = [
		{
			animal: 'Cat',
			results: [
				{ treatedOn: new Date(2023, 0, 1), results: 10 },
				{ treatedOn: new Date(2023, 1, 1), results: 20 },
				{ treatedOn: new Date(2023, 2, 1), results: 30 },
				{ treatedOn: new Date(2023, 3, 1), results: 25 },
				{ treatedOn: new Date(2023, 4, 1), results: 35 }
			]
		},
		{
			animal: 'Dog',
			results: [
				{ treatedOn: new Date(2023, 0, 1), results: 15 },
				{ treatedOn: new Date(2023, 1, 1), results: 25 },
				{ treatedOn: new Date(2023, 2, 1), results: 20 },
				{ treatedOn: new Date(2023, 3, 1), results: 30 },
				{ treatedOn: new Date(2023, 4, 1), results: 40 }
			]
		},
		{
			animal: 'Snake', // New Series 3
			results: [
				{ treatedOn: new Date(2023, 0, 1), results: 12 },
				{ treatedOn: new Date(2023, 1, 1), results: 22 },
				{ treatedOn: new Date(2023, 2, 1), results: 28 },
				{ treatedOn: new Date(2023, 3, 1), results: 26 },
				{ treatedOn: new Date(2023, 4, 1), results: 38 }
			]
		}
	];
	const dataKeys = {
		name: 'animal',
		data: 'results',
		date: 'treatedOn',
		value: 'results'
	};

	const mockDataKeys = {
		name: 'name',
		data: 'data',
		date: 'date',
		value: 'value'
	};
	const generatedData = generateXyData(config);

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
			config: {
				title: 'Dummy Multi Series XY Chart Showing Mock Data',
				xAxis: 'Date',
				yAxis: 'Value'
			}
		}
	];
</script>

<main>
	<h1>XY Chart</h1>
	<LineChart data={mockData} dataKeys={mockDataKeys} width={600} height={400} {features} />
</main>
