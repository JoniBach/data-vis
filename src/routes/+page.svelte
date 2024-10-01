<script lang="ts">
  import { LineChart } from '$lib'; // $lib is the alias for 'src/lib'
  export interface DataPoint {
    date: Date;
    value: number;
}

export interface SeriesData {
    name: string;      // Name of the series
    data: DataPoint[]; // Data points for the series
}
const multiSeriesData: SeriesData[] = [
  {
    name: 'Series 1',
    data: [
      { date: new Date(2023, 0, 1), value: 10 },
      { date: new Date(2023, 1, 1), value: 20 },
      { date: new Date(2023, 2, 1), value: 30 },
      { date: new Date(2023, 3, 1), value: 25 },
      { date: new Date(2023, 4, 1), value: 35 },
    ],
  },
  {
    name: 'Series 2',
    data: [
      { date: new Date(2023, 0, 1), value: 15 },
      { date: new Date(2023, 1, 1), value: 25 },
      { date: new Date(2023, 2, 1), value: 20 },
      { date: new Date(2023, 3, 1), value: 30 },
      { date: new Date(2023, 4, 1), value: 40 },
    ],
  }
];

</script>

<main>
  <h1>Line Chart on Page.svelte</h1>
  <LineChart data={multiSeriesData} width={600} height={400} />
</main>
