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
  
    let chartContainer: HTMLElement;
  
    onMount(() => {
      if (data && chartContainer) {
        createLineChart(chartContainer, data, width, height);
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
  