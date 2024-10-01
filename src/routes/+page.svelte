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
	<LineChart data={generatedData} width={600} height={400} {features} />
</main>
