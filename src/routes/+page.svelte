<script lang="ts">
	import { LineChart } from '$lib/index.js'; // $lib is the alias for 'src/lib'
	import type { Feature, SeriesData } from '$lib/index.js';

	const data: SeriesData[] = [
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
			hide: false
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
	<LineChart {data} width={600} height={400} {features} />
</main>
