<!-- frontend/meshx_front/src/components/IoTVisualization.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { 
      blockchainStore, 
      getDeviceRecords, 
      getIoTData 
    } from '../stores/blockchainStore';
    import type { ChartDataPoint, FormattedSensorData } from '$lib/types';
    import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';
    
    export let deviceId = '';
    export let dataType = '';
    export let limit = 20;
    
    let loading = false;
    let error: string | null = null;
    let chartData: ChartDataPoint[] = [];
    
    $: if ($blockchainStore.walletConnected && deviceId) {
        loadChartData();
    }
    
    async function loadChartData() {
      if (!deviceId || !$blockchainStore.walletConnected) return;
      
      loading = true;
      error = null;
      chartData = [];
      
      try {
        // Get all records for the device
        const recordIndices = await getDeviceRecords(deviceId);
        if (!recordIndices.length) {
          error = 'No data available for this device';
          loading = false;
          return;
        }
        
        // Take the most recent records (limited by 'limit')
        const indices = recordIndices
          .slice(Math.max(0, recordIndices.length - limit))
          .reverse();
        
        // Fetch each record
        const dataPromises = indices.map(index => getIoTData(index));
        const records = await Promise.all(dataPromises);
        
        // Process records to extract chart data
        const processedData: ChartDataPoint[] = records
          .filter((record): record is FormattedSensorData => 
            record !== null && 
            (!dataType || record.dataType === dataType)
          )
          .map(record => {
            // Try to parse the data to get a numeric value
            let value = 0;
            
            if (record.parsedData && typeof record.parsedData === 'object') {
              // Try to extract numeric value from parsedData
              if ('value' in record.parsedData && typeof record.parsedData.value === 'number') {
                value = record.parsedData.value;
              } else if ('temperature' in record.parsedData && typeof record.parsedData.temperature === 'number') {
                value = record.parsedData.temperature;
              } else {
                // Try to find any numeric property
                const numericValue = Object.values(record.parsedData).find(v => typeof v === 'number');
                if (numericValue !== undefined) {
                  value = numericValue as number;
                }
              }
            } else {
              // Try to parse the sensor data as a number
              const parsedValue = parseFloat(record.sensorData);
              if (!isNaN(parsedValue)) {
                value = parsedValue;
              }
            }
            
            // Format date/time for display
            const date = new Date(record.timestamp);
            const formattedTime = date.toLocaleTimeString();
            const formattedDate = date.toLocaleDateString();
            
            return {
              timestamp: date.getTime(),
              value,
              deviceId: record.deviceId,
              formattedTime,
              formattedDate
            };
          });
          
        chartData = processedData;
      } catch (err) {
        console.error('Error loading chart data:', err);
        error = err instanceof Error ? err.message : 'Failed to load chart data';
      } finally {
        loading = false;
      }
    }
</script>

<div class="p-4 border rounded-lg shadow-sm">
  <header>
    <h3 class="text-xl font-bold">Sensor Data Visualization</h3>
    {#if deviceId}
      <p class="text-sm">Device: {deviceId} {dataType ? `| Type: ${dataType}` : ''}</p>
    {/if}
  </header>
  
  <section class="p-4">
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <ProgressRing size="md" />
      </div>
    {:else if error}
      <div class="bg-error-600 p-4 rounded-md text-white">
        <p>{error}</p>
      </div>
    {:else if chartData.length === 0}
      <div class="bg-warning-600 p-4 rounded-md text-white">
        <p>No data available to visualize. Please select a device or collect some data first.</p>
      </div>
    {:else}
      <!-- Basic data display - replace with your preferred charting library like Chart.js/D3 -->
      <div class="chart-container h-64 relative">
        <svg width="100%" height="100%" class="chart">
          <!-- Simple line chart SVG implementation -->
          <g class="axis-y">
            <!-- Y-axis would go here -->
          </g>
          <g class="axis-x">
            <!-- X-axis would go here -->
          </g>
          <g class="data-points">
            <!-- Data points and lines would go here -->
          </g>
        </svg>
        
        <!-- Fallback table view -->
        <div class="overflow-x-auto">
          <table class="table-auto w-full">
            <thead>
              <tr>
                <th class="px-4 py-2">Date/Time</th>
                <th class="px-4 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {#each chartData as point}
                <tr>
                  <td class="border px-4 py-2">{point.formattedDate} {point.formattedTime}</td>
                  <td class="border px-4 py-2">{point.value}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </section>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
  }
  
  .chart {
    background-color: rgba(0,0,0,0.05);
    border-radius: 0.5rem;
  }
</style>