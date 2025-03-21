<!-- frontend/meshx_front/src/components/MerkleVerification.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
  import { blockchainStore, verifyRecord } from '../stores/blockchainStore';
  import { 
    AppBar,
    Modal,
    Progress,
    ProgressRing
  } from '@skeletonlabs/skeleton-svelte';
  import Icon from '@iconify/svelte';
  import type { MerkleProof } from '$lib/types';
    // Toast notification
    const toastStore = getToastStore();
    
    // Component state
    let recordId = 0;
    let merkleRoot = '';
    let merkleProof = '';
    let isLoading = false;
    let verificationResult: boolean | null = null;
    
    // Handle verification
    async function handleVerification() {
      if (!merkleRoot || !merkleProof) {
        toastStore.trigger({ message: 'Please enter a Merkle root and proof', background: 'variant-filled-warning' });
        return;
      }
      
      try {
        // Parse the Merkle proof
        const proofArray = JSON.parse(merkleProof);
        
        if (!Array.isArray(proofArray)) {
          toastStore.trigger({ message: 'Merkle proof must be a JSON array', background: 'variant-filled-warning' });
          return;
        }
        
        isLoading = true;
        
        // Verify the record
        verificationResult = await verifyRecord(recordId, merkleRoot, proofArray);
        
        if (verificationResult) {
          toastStore.trigger({ message: 'Record verified successfully!', background: 'variant-filled-success' });
        } else {
          toastStore.trigger({ message: 'Record verification failed', background: 'variant-filled-error' });
        }
      } catch (error) {
        console.error('Error verifying record:', error);
        toastStore.trigger({ 
          message: 'Error verifying record: ' + (error instanceof Error ? error.message : 'Unknown error'), 
          background: 'variant-filled-error' 
        });
        verificationResult = false;
      } finally {
        isLoading = false;
      }
    }
  </script>
  
  <Card class="w-full">
    <header class="card-header">
      <h3 class="h3">Merkle Verification</h3>
    </header>
    
    <div class="p-4">
      {#if !$blockchainStore.walletConnected}
        <div class="alert variant-filled-warning">
          <Icon icon="mdi:wallet-outline" class="size-5" />
          <span>Please connect your wallet to use verification features.</span>
        </div>
      {:else}
        <div class="space-y-4">
          <label class="label">
            <span>Record ID</span>
            <input type="number" class="input" bind:value={recordId} min="0" disabled={isLoading} />
          </label>
          
          <label class="label">
            <span>Merkle Root</span>
            <input type="text" class="input font-mono text-xs" bind:value={merkleRoot} placeholder="0x..." disabled={isLoading} />
          </label>
          
          <label class="label">
            <span>Merkle Proof (JSON Array)</span>
            <textarea class="textarea font-mono text-xs h-32" bind:value={merkleProof} placeholder='["0x1234...", "0xabcd..."]' disabled={isLoading}></textarea>
          </label>
          
          <button 
            class="btn variant-filled-primary w-full" 
            on:click={handleVerification}
            disabled={isLoading || !merkleRoot || !merkleProof}
          >
            {#if isLoading}
              <ProgressRadial width="w-6" />
              <span>Verifying...</span>
            {:else}
              <Icon icon="mdi:check-decagram" class="size-5" />
              <span>Verify Record</span>
            {/if}
          </button>
          
          {#if verificationResult !== null}
            <div class={`alert ${verificationResult ? 'variant-filled-success' : 'variant-filled-error'}`}>
              <Icon icon={verificationResult ? 'mdi:check-circle' : 'mdi:alert-circle'} class="size-5" />
              <span>{verificationResult ? 'Record verified successfully!' : 'Record verification failed'}</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </Card>