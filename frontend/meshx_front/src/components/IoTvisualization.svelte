<!-- frontend/meshx_front/src/components/IoTVisualization.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { 
      blockchainStore, 
      getDeviceRecords, 
      getIoTData 
    } from '../stores/blockchainStore';
    import type { FormattedSensorData, ChartDataPoint } from '$lib/types';
    import { 
      Card, 
      ProgressRadial
    } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
    
    let isLoading = false;
    let error: string | null = null;
    let selectedDeviceId = 'device-001';
    let chartData: ChartDataPoint[] = [];
    let chartType = 'line';
    
    // Track available devices
    let availableDevices: string[] = [];
    
    // Generate data series for a given device ID
    async function generateDataSeries(deviceId: string) {
      isLoading = true;
      error = null;
      
      try {
        // Get all record indices for this device
        const recordIndices = await getDeviceRecords(deviceId);
        
        // If no records found
        if (!recordIndices || recordIndices.length === 0) {
          chartData = [];
          error = `No data found for device ${deviceId}`;
          return;
        }
        
        // Fetch data for each record
        const recordsPromises = recordIndices.map(index => getIoTData(index));
        const records = await Promise.all(recordsPromises);
        const validRecords = records.filter(r => r !== null) as FormattedSensorData[];
        
        // Map records to chart data points
        const dataPoints: ChartDataPoint[] = [];
        
        for (const record of validRecords) {
          try {
            // Extract value from parsed data if available
            if (record.parsedData) {
              // Different strategies to find the value
              let value: number | undefined;
              
              // Try to find a value property
              if (record.parsedData.value !== undefined && !isNaN(Number(record.parsedData.value))) {
                value = Number(record.parsedData.value);
              } 
              // Look for a property that matches the dataType
              else if (record.dataType && record.parsedData[record.dataType] !== undefined && 
                      !isNaN(Number(record.parsedData[record.dataType]))) {
                value = Number(record.parsedData[record.dataType]);
              }
              // Try the first numeric property
              else {
                for (const key in record.parsedData) {
                  if (!isNaN(Number(record.parsedData[key]))) {
                    value = Number(record.parsedData[key]);
                    break;
                  }
                }
              }
              
              if (value !== undefined) {
                dataPoints.push({
                  timestamp: new Date(record.timestamp).getTime(),
                  value,
                  deviceId: record.deviceId,
                  formattedTime: new Date(record.timestamp).toLocaleTimeString(),
                  formattedDate: new Date(record.timestamp).toLocaleDateString()
                });
              }
            }
            // Try to parse the raw data if no parsed data available
            else {
              const rawValue = parseFloat(record.sensorData);
              if (!isNaN(rawValue)) {
                dataPoints.push({
                  timestamp: new Date(record.timestamp).getTime(),
                  value: rawValue,
                  deviceId: record.deviceId,
                  formattedTime: new Date(record.timestamp).toLocaleTimeString(),
                  formattedDate: new Date(record.timestamp).toLocaleDateString()
                });
              }
            }
          } catch (err) {
            console.warn('Error processing record for chart:', err);
            // Continue with other records
          }
        }
        
        // Sort data points by timestamp
        dataPoints.sort((a, b) => a.timestamp - b.timestamp);
        
        // Format for charts
        chartData = dataPoints;
        
      } catch (err) {
        console.error('Error generating data series:', err);
        error = err instanceof Error ? err.message : 'Failed to generate chart data';
      } finally {
        isLoading = false;
      }
    }
    
    // Load available devices
    async function loadDevices() {
      try {
        // This is a simple example - in a real app you'd query all device IDs from events
        // or have a mechanism to track unique deviceIds seen in the contract
        availableDevices = ['device-001', 'device-002', 'device-003', 'device-004', 'device-005'];
        
        // Check if the selected device is in the available devices
        if (!selectedDeviceId || !availableDevices.includes(selectedDeviceId)) {
          selectedDeviceId = availableDevices[0] || 'device-001';
        }
      } catch (err) {
        console.error('Error loading devices:', err);
      }
    }
    
    // Initialize component
    onMount(async () => {
      if ($blockchainStore.walletConnected) {
        await loadDevices();
        await generateDataSeries(selectedDeviceId);
      }
    });
    
    // Watch for wallet connection changes
    $: if ($blockchainStore.walletConnected && selectedDeviceId) {
      generateDataSeries(selectedDeviceId);
    }
    
    // Handle device selection
    function handleDeviceChange(event: Event) {
      const select = event.target as HTMLSelectElement;
      selectedDeviceId = select.value;
      generateDataSeries(selectedDeviceId);
    }
    
    // Get the value domain for the chart
    $: valueDomain = chartData.length > 0 
      ? [
          Math.min(...chartData.map(d => d.value)) * 0.9,
          Math.max(...chartData.map(d => d.value)) * 1.1
        ]
      : [0, 100];
  </script>
  
  <Card class="w-full">
    <header class="card-header flex justify-between items-center">
      <h3 class="h3">IoT Data Visualization</h3>
      
      <div class="flex items-center gap-2">
        <select 
          class="select w-40" 
          bind:value={selectedDeviceId} 
          on:change={handleDeviceChange}
          disabled={isLoading || !$blockchainStore.walletConnected}
        >
          {#each availableDevices as deviceId}
            <option value={deviceId}>{deviceId}</option>
          {/each}
        </select>
        
        <button 
          class="btn btn-sm variant-ghost-surface" 
          on:click={() => generateDataSeries(selectedDeviceId)}
          disabled={isLoading || !$blockchainStore.walletConnected}
        >
          <Icon icon="mdi:refresh" class="size-5" />
        </button>
      </div>
    </header>
    
    <section class="p-4">
      {#if !$blockchainStore.walletConnected}
        <div class="flex flex-col items-center justify-center p-16 space-y-4">
          <Icon icon="mdi:wallet-off" class="size-16 text-surface-500" />
          <p class="text-center">Connect your wallet to view charts.</p>
        </div>
      {:else if isLoading}
        <div class="flex justify-center p-16">
          <ProgressRadial
            stroke={100}
            meter="stroke-primary-500"
            track="stroke-primary-500/30"
          />
        </div>
      {:else if error}
        <div class="alert variant-filled-warning">
          <Icon icon="mdi:alert-circle" class="size-5" />
          <span>{error}</span>
        </div>
      {:else if chartData.length === 0}
        <div class="flex flex-col items-center justify-center p-16 space-y-4">
          <Icon icon="mdi:chart-bell-curve" class="size-16 text-surface-500" />
          <p class="text-center">No chart data available for this device.</p>
          <p class="text-center text-sm opacity-70">Try selecting a different device or add some sensor data.</p>
        </div>
      {:else}
        <div class="h-[400px] w-full flex items-center justify-center">
          <p>Chart would be displayed here using actual data from {chartData.length} data points</p>
          <!-- Placeholder for actual chart implementation -->
        </div>
        
        <div class="mt-4 p-2 bg-surface-500/10 rounded text-sm">
          <p class="font-semibold">Chart Info:</p>
          <ul class="list-disc list-inside space-y-1 mt-1">
            <li>Device: {selectedDeviceId}</li>
            <li>Data Points: {chartData.length}</li>
            <li>Time Range: {new Date(chartData[0]?.timestamp).toLocaleString()} to {new Date(chartData[chartData.length-1]?.timestamp).toLocaleString()}</li>
          </ul>
        </div>
      {/if}
    </section>
  </Card>