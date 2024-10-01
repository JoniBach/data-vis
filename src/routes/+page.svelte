<script lang="ts">
  import { LineChart } from '$lib'; // $lib is the alias for 'src/lib'

  // Example data to pass to the LineChart component
  const data = [
    { date: new Date(2023, 0, 1), value: 10 },
    { date: new Date(2023, 1, 1), value: 20 },
    { date: new Date(2023, 2, 1), value: 30 },
    { date: new Date(2023, 3, 1), value: 25 },
    { date: new Date(2023, 4, 1), value: 35 },
  ];
</script>

<main>
  <h1>Line Chart on Page.svelte</h1>
  <LineChart {data} width={600} height={400} />
</main>
