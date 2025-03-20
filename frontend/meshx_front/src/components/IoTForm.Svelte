<script lang="ts">
    import { storeIoTData } from '../stores/blockchainStore';
    
    let deviceId = 'device-001';
    let sensorData = 'Temperature:25°C';
    let isLoading = false;
    let success = false;
    let error = '';
    
    async function handleSubmit() {
      isLoading = true;
      error = '';
      success = false;
      
      try {
        const result = await storeIoTData(deviceId, sensorData);
        if (result) {
          success = true;
          // Optional: reset form
          // deviceId = '';
          // sensorData = '';
        } else {
          error = 'Failed to store data. Check console for details.';
        }
      } catch (err) {
        console.error('Error in form submission:', err);
        error = err instanceof Error ? err.message : 'Unknown error occurred';
      } finally {
        isLoading = false;
      }
    }
  </script>
  
  <div class="card p-4 w-full max-w-md">
    <header class="card-header">
      <h3 class="h3">Store IoT Data</h3>
    </header>
    
    <section class="p-4">
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <label class="label">
          <span>Device ID</span>
          <input class="input" type="text" bind:value={deviceId} required />
        </label>
        
        <label class="label">
          <span>Sensor Data</span>
          <input class="input" type="text" bind:value={sensorData} required />
        </label>
        
        <button type="submit" class="btn variant-filled-primary w-full" disabled={isLoading}>
          {#if isLoading}
            <span class="spinner-border"></span>
          {:else}
            Store Data
          {/if}
        </button>
        
        {#if success}
          <div class="alert variant-filled-success">
            <span>Data stored successfully!</span>
          </div>
        {/if}
        
        {#if error}
          <div class="alert variant-filled-error">
            <span>{error}</span>
          </div>
        {/if}
      </form>
    </section>
  </div>