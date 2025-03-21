<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    blockchainStore, 
    getIoTData, 
    getRecordCount, 
    listenForDataEvents,
    addNotification,
    NotificationType
  } from '../stores/blockchainStore';
  import type { FormattedSensorData } from '$lib/types';
  import { 
    Card, 
    Table, 
    TableBody, 
    TableBodyCell, 
    TableBodyRow, 
    TableHead, 
    TableHeadCell,
    ProgressRadial,
    Accordion,
    AccordionItem,
    Paginator
  } from '@skeletonlabs/skeleton-svelte';
  import Icon from '@iconify/svelte';

  // Component state
  let records: FormattedSensorData[] = [];
  let isLoading = true;
  let error = '';
  let unsubscribe: (() => void) | null = null;
  
  // Filter and pagination
  let filterDevice = '';
  let currentPage = 0;
  let pageSize = 10;
  let totalRecords = 0;
  
  // Auto-refresh toggle
  let autoRefresh = true;
  let refreshInterval: number;
  
  // Apply filters to records
  $: filteredRecords = filterDevice
    ? records.filter(r => r.deviceId.includes(filterDevice))
    : records;
    
  // Pagination
  $: paginatedRecords = filteredRecords.slice(
    currentPage * pageSize, 
    (currentPage + 1) * pageSize
  );
  
  // Handle new events
  function handleNewDataEvent(event: any) {
    addNotification(
      NotificationType.INFO, 
      `New data received from device: ${event.deviceId}`
    );
    
    // Refresh data
    loadData();
  }
  
  // Load data from blockchain
  async function loadData() {
    isLoading = true;
    error = '';
    
    try {
      const count = await getRecordCount();
      totalRecords = count;
      
      if (count > 0) {
        // Fetch the latest records (limited to prevent overloading)
        const fetchCount = Math.min(count, 50);
        const promises = [];
        
        // Start from the most recent records
        for (let i = count - 1; i >= Math.max(0, count - fetchCount); i--) {
          promises.push(getIoTData(i));
        }
        
        const results = await Promise.all(promises);
        records = results
          .filter(r => r !== null) as FormattedSensorData[];
      } else {
        records = [];
      }
    } catch (err) {
      console.error('Error fetching IoT data:', err);
      error = err instanceof Error ? error.message : 'Failed to load IoT data';
    } finally {
      isLoading = false;
    }
  }
  
  // Get CSS class for a data type
  function getDataTypeClass(dataType: string): string {
    switch (dataType?.toLowerCase()) {
      case 'temperature': return 'bg-warning-500';
      case 'humidity': return 'bg-primary-500';
      case 'pressure': return 'bg-secondary-500';
      case 'light': return 'bg-yellow-500';
      case 'motion': return 'bg-tertiary-500';
      case 'air-quality': return 'bg-green-500';
      default: return 'bg-surface-500';
    }
  }
  
  // Format data value for display
  function formatDataValue(record: FormattedSensorData): string {
    if (record.parsedData) {
      // If we have parsed data, get the first value-unit pair if possible
      const { value, unit } = record.parsedData;
      if (value !== undefined && unit !== undefined) {
        return `${value} ${unit}`;
      }
      
      // Try to extract a meaningful value
      for (const key in record.parsedData) {
        if (key !== 'timestamp' && key !== 'unit') {
          return `${key}: ${record.parsedData[key]}`;
        }
      }
    }
    
    // Fall back to showing the raw data, with some truncation if needed
    const maxLength = 30;
    return record.sensorData.length > maxLength 
      ? `${record.sensorData.substring(0, maxLength)}...` 
      : record.sensorData;
  }
  
  // Pretty print JSON
  function prettyPrintJson(data: string): string {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return data;
    }
  }
  
  // Toggle auto-refresh
  function toggleAutoRefresh(enabled: boolean) {
    if (enabled) {
      // Set up refresh interval (every 30 seconds)
      refreshInterval = window.setInterval(() => {
        if ($blockchainStore.walletConnected) {
          loadData();
        }
      }, 30000);
    } else {
      // Clear interval if it exists
      if (refreshInterval) {
        window.clearInterval(refreshInterval);
      }
    }
  }
  
  // Initialize component
  onMount(async () => {
    // Load initial data
    await loadData();
    
    // Set up event listener for new data
    if ($blockchainStore.contract) {
      unsubscribe = listenForDataEvents(handleNewDataEvent);
    }
    
    // Set up auto-refresh
    toggleAutoRefresh(autoRefresh);
  });
  
  // Clean up when component is destroyed
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
    
    if (refreshInterval) {
      window.clearInterval(refreshInterval);
    }
  });
  
  // Watch for wallet connection changes
  $: if ($blockchainStore.walletConnected && !isLoading) {
    loadData();
  }
  
  // Watch for auto-refresh changes
  $: toggleAutoRefresh(autoRefresh);
</script>

<Card class="w-full">
  <header class="card-header flex justify-between items-center flex-wrap gap-2">
    <div class="flex items-center gap-2">
      <h3 class="h3">IoT Sensor Records</h3>
      <span class="badge variant-soft-tertiary">{totalRecords} Total</span>
    </div>
    
    <div class="flex items-center gap-2">
      <label class="flex items-center space-x-2">
        <input 
          class="checkbox" 
          type="checkbox" 
          bind:checked={autoRefresh}
        />
        <span>Auto-refresh</span>
      </label>
      
      <button class="btn btn-sm variant-ghost-surface" on:click={() => loadData()}>
        <Icon icon="mdi:refresh" class="size-5" />
      </button>
    </div>
  </header>
  
  <!-- Filter Section -->
  <div class="p-4 border-b border-surface-500/20">
    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">
        <Icon icon="mdi:filter-outline" class="size-5" />
      </div>
      <input 
        type="search" 
        placeholder="Filter by device ID..." 
        bind:value={filterDevice} 
        class="input"
      />
      {#if filterDevice}
        <button class="variant-filled-surface" on:click={() => filterDevice = ''}>
          <Icon icon="mdi:close" class="size-5" />
        </button>
      {/if}
    </div>
  </div>
  
  <section class="p-4">
    {#if isLoading && records.length === 0}
      <div class="flex justify-center p-16">
        <ProgressRadial
          stroke={100}
          meter="stroke-primary-500"
          track="stroke-primary-500/30"
        />
      </div>
    {:else if error}
      <div class="alert variant-filled-error">
        <Icon icon="mdi:alert-circle" class="size-5" />
        <span>{error}</span>
      </div>
    {:else if paginatedRecords.length === 0}
      <div class="flex flex-col items-center justify-center p-16 space-y-4">
        <Icon icon="mdi:database-off" class="size-16 text-surface-500" />
        <p class="text-center">No IoT records found.</p>
        {#if $blockchainStore.walletConnected}
          <p class="text-center text-sm opacity-70">Add some data using the form to get started.</p>
        {:else}
          <p class="text-center text-sm opacity-70">Please connect your wallet to interact with IoT data.</p>
        {/if}
      </div>
    {:else}
      <Table class="table-hover">
        <TableHead>
          <tr>
            <TableHeadCell class="w-16">ID</TableHeadCell>
            <TableHeadCell>Device</TableHeadCell>
            <TableHeadCell>Type</TableHeadCell>
            <TableHeadCell>Data</TableHeadCell>
            <TableHeadCell>Location</TableHeadCell>
            <TableHeadCell>Timestamp</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {#each paginatedRecords as record (record.id)}
            <TableBodyRow>
              <TableBodyCell>{record.id}</TableBodyCell>
              <TableBodyCell>
                <span class="font-mono text-sm">{record.deviceId}</span>
              </TableBodyCell>
              <TableBodyCell>
                <span class="badge {getDataTypeClass(record.dataType)} capitalize">
                  {record.dataType || 'Unknown'}
                </span>
              </TableBodyCell>
              <TableBodyCell>
                <span class="whitespace-nowrap">{formatDataValue(record)}</span>
              </TableBodyCell>
              <TableBodyCell>{record.location}</TableBodyCell>
              <TableBodyCell>{record.timestamp}</TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
      
      <!-- Pagination -->
      {#if filteredRecords.length > pageSize}
        <div class="flex justify-center mt-4">
          <Paginator
            bind:settings={{ offset: currentPage * pageSize, limit: pageSize, size: filteredRecords.length }}
            offset={currentPage * pageSize}
            limit={pageSize}
            size={filteredRecords.length}
            on:page={(e) => currentPage = e.detail / pageSize}
          />
        </div>
      {/if}
      
      <!-- Details Accordion for Mobile -->
      <div class="md:hidden mt-4">
        <Accordion>
          {#each paginatedRecords as record, i}
            <AccordionItem>
              <svelte:fragment slot="lead">
                <span class="badge {getDataTypeClass(record.dataType)}">
                  {record.dataType || 'Data'}
                </span>
              </svelte:fragment>
              <svelte:fragment slot="summary">
                <p class="flex justify-between items-center w-full">
                  <span class="font-mono">{record.deviceId}</span>
                  <span class="text-xs opacity-70">{record.timestamp}</span>
                </p>
              </svelte:fragment>
              <svelte:fragment slot="content">
                <div class="space-y-2">
                  <p><strong>Location:</strong> {record.location}</p>
                  <div>
                    <strong>Data:</strong>
                    <pre class="whitespace-pre-wrap text-xs mt-2 p-2 rounded bg-surface-500/20 font-mono">
                      {prettyPrintJson(record.sensorData)}
                    </pre>
                  </div>
                </div>
              </svelte:fragment>
            </AccordionItem>
          {/each}
        </Accordion>
      </div>
    {/if}
    
    {#if isLoading && records.length > 0}
      <div class="flex justify-center mt-4">
        <ProgressRadial
          width="w-8"
          stroke={100}
          meter="stroke-primary-500"
          track="stroke-primary-500/30"
        />
      </div>
    {/if}
  </section>
</Card>