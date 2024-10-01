<script lang="ts">
    import { onMount } from 'svelte';
    import { createLineChart } from './lineChart.ts';
  
    // Define the structure of the data points
    interface DataPoint {
      date: Date;
      value: number;
    }
  
    // Props passed to the component
    export let data: DataPoint[];
    export let width: number = 500;
    export let height: number = 300;
    export let features: any[] = [];
  
    let chartContainer: HTMLElement;
  
    onMount(() => {
      if (data && chartContainer) {
        createLineChart(chartContainer, data, width, height, features);
      }
    });
  </script>
  
  <div bind:this={chartContainer} class="chart-container"></div>
  
  <style>
    .chart-container {
      width: 100%;
      height: 100%;
    }
  </style>
  