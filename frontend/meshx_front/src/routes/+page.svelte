<script lang="ts">import { onMount } from 'svelte';
  import { blockchainStore, connectPolkadot } from '../stores/blockchainStore';
  import Header from '../components/Header.svelte';
  import IoTForm from '../components/IoTForm.svelte';
  import IoTData from '../components/IoTData.svelte';
  import IoTVisualization from '../components/IoTvisualization.svelte';
  import AdminPanel from '../components/AdminPanel.svelte';
  import MerkleVerification from '../components/MerkleVerification.svelte';
  import { UserRole } from '$lib/types';
  import Icon from '@iconify/svelte';
  import { Progress } from '@skeletonlabs/skeleton-svelte';
  
  let isConnecting = true;
  let connectionError = '';
  
  onMount(async () => {
    try {
      const connected = await connectPolkadot();
      if (!connected) {
        connectionError = 'Failed to connect to blockchain. Please check your connection and try again.';
      }
    } catch (err) {
      console.error('Error connecting to blockchain:', err);
      connectionError = err instanceof Error ? err.message : 'Unknown error connecting to blockchain';
    } finally {
      isConnecting = false;
    }
  });
  
  // Check if user has appropriate roles
  $: isAdmin = $blockchainStore.userRoles && $blockchainStore.userRoles.includes(UserRole.ADMIN);
  $: canAddData = $blockchainStore.userRoles && 
    ($blockchainStore.userRoles.includes(UserRole.ADMIN) || 
     $blockchainStore.userRoles.includes(UserRole.DEVICE));
</script>

<div class="app">
  <Header />
  
  <main class="container mx-auto p-4">
    <!-- Main Grid Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column -->
      <section>
        {#if isConnecting}
          <div class="card p-8">
            <div class="placeholder-circle">
              <span class="spinner-border"></span>
            </div>
            <p class="text-center mt-4">Connecting to blockchain...</p>
          </div>
        {:else if connectionError}
          <div class="alert variant-filled-error">
            <span>{connectionError}</span>
          </div>
        {:else if canAddData}
          <IoTForm />
        {:else}
          <div class="card p-8">
            <div class="flex flex-col items-center">
              <Icon icon="mdi:lock-outline" class="size-16 text-surface-500" />
              <p class="text-center mt-4">You don't have permission to add data.</p>
              <p class="text-center text-sm opacity-70 mt-2">
                Connect with an account that has Device or Admin role to add data.
              </p>
            </div>
          </div>
        {/if}
        
        <!-- Admin Panel (only shown to admins) -->
        {#if isAdmin}
          <div class="mt-6">
            <AdminPanel />
          </div>
        {/if}
      </section>
      
      <!-- Right Column -->
      <section class="space-y-6">
        {#if !isConnecting && !connectionError}
          <IoTData />
          <IoTVisualization />
          <MerkleVerification />
        {/if}
      </section>
    </div>
  </main>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  main {
    flex: 1;
    padding: 1rem;
  }
</style>