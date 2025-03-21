<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    blockchainStore,
    grantDeviceRole,
    grantAnalystRole,
    revokeRole,
    createBatch,
    getBatches
  } from '../stores/blockchainStore';
  import { 
    Accordion,
    AppBar,
    Avatar,
    Modal,
    Pagination,
    Progress,
    ProgressRing,
    Tabs
  } from '@skeletonlabs/skeleton';
  import Icon from '@iconify/svelte';
  import type { DataBatch } from '$lib/types';
  import { UserRole } from '$lib/types';
  import { ethers } from 'ethers';
  
  // Component state
  let isLoading = false;
  let activeTab = 'roles';
  let newRole = '';
  let addressToModify = '';
  let roleToRevoke = '';
  
  // Batch creation state
  let fromIndex = 0;
  let toIndex = 10;
  let batchDescription = '';
  let merkleRoot = '';
  let batches: DataBatch[] = [];
  
  // Modal state
  let modalOpen = false;
  let currentBatch: DataBatch | null = null;
  
  // Update the current tab
  function updateTab(tab: string) {
    activeTab = tab;
    
    // Load data based on active tab
    if (tab === 'batches') {
      loadBatches();
    }
  }
  
  // Load all batches
  async function loadBatches() {
    isLoading = true;
    batches = await getBatches();
    isLoading = false;
  }
  
  // Handle role assignment
  async function handleRoleAssignment() {
    if (!addressToModify) {
      toastStore.trigger({ message: 'Please enter a valid address', background: 'variant-filled-warning' });
      return;
    }
    
    if (!ethers.isAddress(addressToModify)) {
      toastStore.trigger({ message: 'Invalid Ethereum address', background: 'variant-filled-warning' });
      return;
    }
    
    isLoading = true;
    
    try {
      let success = false;
      
      if (newRole === UserRole.DEVICE) {
        success = await grantDeviceRole(addressToModify);
      } else if (newRole === UserRole.ANALYST) {
        success = await grantAnalystRole(addressToModify);
      }
      
      if (success) {
        // Clear the form on success
        addressToModify = '';
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toastStore.trigger({ 
        message: 'Error assigning role: ' + (error instanceof Error ? error.message : 'Unknown error'), 
        background: 'variant-filled-error' 
      });
    } finally {
      isLoading = false;
    }
  }
  
  // Handle role revocation
  async function handleRoleRevocation() {
    if (!addressToModify) {
      toastStore.trigger({ message: 'Please enter a valid address', background: 'variant-filled-warning' });
      return;
    }
    
    if (!ethers.isAddress(addressToModify)) {
      toastStore.trigger({ message: 'Invalid Ethereum address', background: 'variant-filled-warning' });
      return;
    }
    
    if (!roleToRevoke) {
      toastStore.trigger({ message: 'Please select a role to revoke', background: 'variant-filled-warning' });
      return;
    }
    
    isLoading = true;
    
    try {
      const success = await revokeRole(roleToRevoke, addressToModify);
      
      if (success) {
        // Clear the form on success
        addressToModify = '';
        roleToRevoke = '';
      }
    } catch (error) {
      console.error('Error revoking role:', error);
      toastStore.trigger({ 
        message: 'Error revoking role: ' + (error instanceof Error ? error.message : 'Unknown error'), 
        background: 'variant-filled-error' 
      });
    } finally {
      isLoading = false;
    }
  }
  
  // Handle batch creation
  async function handleBatchCreation() {
    if (fromIndex >= toIndex) {
      toastStore.trigger({ message: 'From index must be less than to index', background: 'variant-filled-warning' });
      return;
    }
    
    if (!batchDescription) {
      toastStore.trigger({ message: 'Please enter a batch description', background: 'variant-filled-warning' });
      return;
    }
    
    // If merkleRoot is not provided, we'll generate one (this would be handled by a backend service)
    // For testing, we'll use a dummy value
    const batchRoot = merkleRoot || ethers.keccak256(ethers.toUtf8Bytes(`batch-${Date.now()}`));
    
    isLoading = true;
    
    try {
      const batchId = await createBatch(fromIndex, toIndex, batchRoot, batchDescription);
      
      if (batchId) {
        // Clear the form on success
        batchDescription = '';
        merkleRoot = '';
        
        // Reload batches
        await loadBatches();
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      toastStore.trigger({ 
        message: 'Error creating batch: ' + (error instanceof Error ? error.message : 'Unknown error'), 
        background: 'variant-filled-error' 
      });
    } finally {
      isLoading = false;
    }
  }
  
  // View batch details
  function viewBatchDetails(batch: DataBatch) {
    currentBatch = batch;
    modalOpen = true;
  }
  
  // Format timestamp
  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }
  
  // Format address
  function formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  // Initialize component
  onMount(() => {
    // Load batches if active tab is batches
    if (activeTab === 'batches') {
      loadBatches();
    }
  });
</script>

<!-- Component HTML remains unchanged -->