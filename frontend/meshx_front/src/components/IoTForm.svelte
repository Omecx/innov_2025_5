<script lang="ts">
  import { blockchainStore, storeIoTData } from '../stores/blockchainStore';
  import { 
    Card, 
    RadioGroup, 
    RadioItem,
    Tab, 
    TabGroup,
    SlideToggle,
    getToastStore
  } from '@skeletonlabs/skeleton-svelte';
  import Icon from '@iconify/svelte';
  
  // Toast notification
  const toastStore = getToastStore();
  
  // Form state
  let deviceId = 'device-001';
  let dataType = 'temperature';
  let location = 'living-room';
  let useJsonFormat = true;
  let sensorValue = '25.5';
  let sensorUnit = '°C';
  let jsonData = '{"temperature": 25.5, "unit": "°C", "battery": 98}';
  let isLoading = false;
  
  // Predefined device IDs for convenience
  const deviceOptions = [
    { id: 'device-001', label: 'Temperature Sensor' },
    { id: 'device-002', label: 'Humidity Sensor' },
    { id: 'device-003', label: 'Pressure Sensor' },
    { id: 'device-004', label: 'Light Sensor' },
    { id: 'device-005', label: 'Motion Sensor' }
  ];
  
  // Predefined locations
  const locationOptions = [
    { id: 'living-room', label: 'Living Room' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'bathroom', label: 'Bathroom' },
    { id: 'garage', label: 'Garage' },
    { id: 'outside', label: 'Outside' }
  ];
  
  // Generate simple data from form inputs
  function generateSimpleData(): string {
    return `${sensorValue} ${sensorUnit}`;
  }
  
  // Generate JSON data from form inputs if not using custom JSON
  function generateJsonData(): string {
    try {
      // When in JSON mode but using the simple form, generate JSON
      if (useJsonFormat && dataType === 'custom') {
        // Use the custom JSON as is
        return jsonData;
      } else if (useJsonFormat) {
        // Generate JSON based on the form fields
        const data: Record<string, any> = {
          value: parseFloat(sensorValue) || sensorValue,
          unit: sensorUnit,
          timestamp: Date.now()
        };
        return JSON.stringify(data);
      } else {
        // Simple string format
        return generateSimpleData();
      }
    } catch (err) {
      console.error('Error generating JSON data:', err);
      return generateSimpleData();
    }
  }
  
  // Handle form submission
  async function handleSubmit() {
    if (!$blockchainStore.walletConnected) {
      toastStore.trigger({
        message: 'Please connect your wallet first',
        background: 'variant-filled-warning'
      });
      return;
    }
    
    isLoading = true;
    
    try {
      // Generate the data in the appropriate format
      const formattedData = generateJsonData();
      
      // Send data to blockchain
      const result = await storeIoTData(deviceId, formattedData, dataType, location);
      
      if (result) {
        toastStore.trigger({
          message: 'Data stored successfully!',
          background: 'variant-filled-success'
        });
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      toastStore.trigger({
        message: errorMessage,
        background: 'variant-filled-error'
      });
    } finally {
      isLoading = false;
    }
  }
  
  // Predefined sensor types and related options
  const sensorTypes = [
    { value: 'temperature', icon: 'mdi:temperature-celsius', 
      defaults: { unit: '°C', value: '22.5' } },
    { value: 'humidity', icon: 'mdi:water-percent', 
      defaults: { unit: '%', value: '58' } },
    { value: 'pressure', icon: 'mdi:gauge', 
      defaults: { unit: 'hPa', value: '1013' } },
    { value: 'light', icon: 'mdi:brightness-7', 
      defaults: { unit: 'lux', value: '850' } },
    { value: 'motion', icon: 'mdi:motion-sensor', 
      defaults: { unit: 'boolean', value: 'true' } },
    { value: 'air-quality', icon: 'mdi:air-filter', 
      defaults: { unit: 'ppm', value: '450' } },
    { value: 'custom', icon: 'mdi:code-json', 
      defaults: { unit: '', value: '' } }
  ];
  
  // Update defaults when sensor type changes
  function updateSensorDefaults() {
    const selected = sensorTypes.find(type => type.value === dataType);
    if (selected && selected.value !== 'custom') {
      sensorUnit = selected.defaults.unit;
      sensorValue = selected.defaults.value;
    }
  }
  
  // Watch for dataType changes
  $: if (dataType) {
    updateSensorDefaults();
  }
</script>

<Card class="w-full">
  <header class="card-header flex justify-between items-center">
    <h3 class="h3">Store IoT Data</h3>
    <SlideToggle 
      name="formatToggle" 
      bind:checked={useJsonFormat} 
      size="sm"
    >
      <span class="text-sm ml-2">JSON Format</span>
    </SlideToggle>
  </header>
  
  <section class="p-4">
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <!-- Device Selection -->
      <label class="label">
        <span>Device ID</span>
        <select class="select" bind:value={deviceId}>
          {#each deviceOptions as device}
            <option value={device.id}>{device.id} - {device.label}</option>
          {/each}
          <option value="custom">Custom Device ID</option>
        </select>
      </label>
      
      {#if deviceId === 'custom'}
        <label class="label">
          <span>Custom Device ID</span>
          <input class="input" type="text" bind:value={deviceId} placeholder="Enter a custom device ID" required />
        </label>
      {/if}
      
      <!-- Location Selection -->
      <label class="label">
        <span>Location</span>
        <select class="select" bind:value={location}>
          {#each locationOptions as loc}
            <option value={loc.id}>{loc.label}</option>
          {/each}
          <option value="custom">Custom Location</option>
        </select>
      </label>
      
      {#if location === 'custom'}
        <label class="label">
          <span>Custom Location</span>
          <input class="input" type="text" bind:value={location} placeholder="Enter a custom location" required />
        </label>
      {/if}
      
      <!-- Sensor Type Selection -->
      <div class="space-y-2">
        <label class="label">
          <span>Sensor Type</span>
        </label>
        <TabGroup>
          {#each sensorTypes as type, i}
            <Tab bind:group={dataType} name="sensorType" value={type.value}>
              <div class="flex items-center gap-2">
                <Icon icon={type.icon} class="size-5" />
                <span class="capitalize">{type.value}</span>
              </div>
            </Tab>
          {/each}
        </TabGroup>
      </div>
      
      <!-- Data Input Section -->
      {#if dataType === 'custom' && useJsonFormat}
        <label class="label">
          <span>Custom JSON Data</span>
          <textarea 
            class="textarea h-32 font-mono" 
            bind:value={jsonData} 
            placeholder='{"key": "value", "nested": {"data": 123}}'
            required
          ></textarea>
        </label>
      {:else}
        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span>Value</span>
            <input class="input" type="text" bind:value={sensorValue} required />
          </label>
          
          <label class="label">
            <span>Unit</span>
            <input class="input" type="text" bind:value={sensorUnit} placeholder="e.g., °C, %, hPa" />
          </label>
        </div>
      {/if}
      
      <!-- Form Submission -->
      <div class="card-footer">
        <button 
          type="submit" 
          class="btn variant-filled-primary w-full" 
          disabled={isLoading || !$blockchainStore.walletConnected}
        >
          {#if isLoading}
            <div class="spinner-border !h-5 !w-5"></div>
            <span>Sending...</span>
          {:else if !$blockchainStore.walletConnected}
            <Icon icon="mdi:wallet-off" class="size-5" />
            <span>Connect Wallet First</span>
          {:else}
            <Icon icon="mdi:database-plus" class="size-5" />
            <span>Store Data</span>
          {/if}
        </button>
      </div>
    </form>
  </section>
</Card>

<script context="module">
  export default {};
</script>