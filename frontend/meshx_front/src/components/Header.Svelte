<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton';
    import { blockchainStore, connectWallet } from '../stores/blockchainStore';
    
    // Default contract address - in production this would be loaded from env variable
    let contractAddress = '0xYourDeployedContractAddress';
    
    async function handleConnect() {
      await connectWallet(contractAddress);
    }
  </script>
  
  <AppBar>
    <svelte:fragment slot="lead">
      <strong class="text-xl uppercase">IoT Blockchain</strong>
    </svelte:fragment>
    <svelte:fragment slot="trail">
      {#if $blockchainStore.account}
        <div class="flex items-center gap-2">
          <span class="badge variant-filled-primary">Connected: {$blockchainStore.account.substring(0, 6)}...{$blockchainStore.account.substring(38)}</span>
        </div>
      {:else}
        <button class="btn variant-filled-primary" on:click={handleConnect}>
          Connect Wallet
        </button>
      {/if}
    </svelte:fragment>
  </AppBar>