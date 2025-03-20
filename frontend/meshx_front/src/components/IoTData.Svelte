<script lang="ts">
  import { onMount } from 'svelte';
  import { getIoTData, getRecordCount } from '../stores/blockchainStore';
  import type { FormattedSensorData } from '$lib/types';
  
  let records: FormattedSensorData[] = [];
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    try {
      const count = await getRecordCount();
      
      if (count > 0) {
        // Fetch the latest 5 records (or fewer if there aren't that many)
        const fetchCount = Math.min(count, 5);
        const promises = [];
        
        for (let i = count - 1; i >= count - fetchCount; i--) {
          promises.push(getIoTData(i));
        }
        
        const results = await Promise.all(promises);
        records = results.filter(r => r !== null) as FormattedSensorData[];
      }
    } catch (err) {
      console.error('Error fetching IoT data:', err);
      error = err instanceof Error ? err.message : 'Failed to load IoT data';
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="card w-full">
  <header class="card-header">
    <h3 class="h3">IoT Sensor Records</h3>
  </header>
  
  <section class="p-4">
    {#if isLoading}
      <div class="flex justify-center p-4">
        <div class="spinner-border"></div>
      </div>
    {:else if error}
      <div class="alert variant-filled-error">
        <span>{error}</span>
      </div>
    {:else if records.length === 0}
      <p class="text-center p-4">No IoT records found.</p>
    {:else}
      <div class="table-container">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Timestamp</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {#each records as record}
              <tr>
                <td>{record.deviceId}</td>
                <td>{record.timestamp}</td>
                <td>{record.sensorData}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</div>
