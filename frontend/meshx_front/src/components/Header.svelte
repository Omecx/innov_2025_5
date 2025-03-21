<script lang="ts">
  import { AppBar, Avatar, ListBox, ListBoxItem, popup } from '@skeletonlabs/skeleton';
  import { 
    blockchainStore, 
    connectWallet, 
    disconnectWallet, 
    NETWORKS
  } from '../stores/blockchainStore';
  import Icon from '@iconify/svelte';
  
  let loading = false;
  
  // Handle wallet connection
  async function handleConnect() {
    loading = true;
    await connectWallet();
    loading = false;
  }
  
  // Handle wallet disconnection
  function handleDisconnect() {
    disconnectWallet();
  }
  
  // Format an address for display
  function formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  }
  
  // Get current network info
  $: networkInfo = $blockchainStore.chainId && NETWORKS[$blockchainStore.chainId] 
    ? NETWORKS[$blockchainStore.chainId] 
    : null;
</script>

<AppBar class="border-b border-surface-500/30 bg-surface-100-800-token">
  <svelte:fragment slot="lead">
    <a href="/" class="flex items-center gap-2">
      <Icon icon="solar:blockchain-bold-duotone" class="size-8 text-primary-500" />
      <strong class="text-xl uppercase">IoT Blockchain</strong>
    </a>
  </svelte:fragment>
  
  <svelte:fragment slot="trail">
    <!-- Network Status -->
    {#if $blockchainStore.network}
      <div class="hidden md:flex items-center mr-2">
        <div class="badge {networkInfo?.isTestnet ? 'variant-soft-warning' : 'variant-soft-primary'} flex gap-1 items-center">
          <span class="size-2 rounded-full {networkInfo?.isTestnet ? 'bg-warning-500' : 'bg-primary-500'}"></span>
          <span>{$blockchainStore.network}</span>
        </div>
      </div>
    {/if}
    
    <!-- Connection Status -->
    {#if $blockchainStore.account}
      <div class="flex items-center gap-2">
        <div class="popupWrapper">
          <button class="btn variant-soft-surface flex items-center gap-2" use:popup={{ event: 'click', target: 'accountMenu' }}>
            <Avatar 
              width="w-8" 
              initials={$blockchainStore.account.substring(2, 4)} 
              background="bg-primary-500" 
            />
            <span class="hidden sm:inline">{formatAddress($blockchainStore.account)}</span>
            <Icon icon="mdi:chevron-down" class="size-5" />
          </button>
          
          <div class="card p-2 w-48 shadow-xl" data-popup="accountMenu">
            <ListBox>
              <ListBoxItem bind:group={""} name="account" value="view">
                <div class="flex items-center gap-2">
                  <Icon icon="mdi:eye" class="size-5" />
                  <span>View on Explorer</span>
                </div>
              </ListBoxItem>
              <ListBoxItem bind:group={""} name="account" value="copy">
                <div class="flex items-center gap-2">
                  <Icon icon="mdi:content-copy" class="size-5" />
                  <span>Copy Address</span>
                </div>
              </ListBoxItem>
              <ListBoxItem bind:group={""} name="account" value="disconnect" on:click={handleDisconnect}>
                <div class="flex items-center gap-2">
                  <Icon icon="mdi:logout" class="size-5" />
                  <span>Disconnect</span>
                </div>
              </ListBoxItem>
            </ListBox>
          </div>
        </div>
      </div>
    {:else}
      <button 
        class="btn variant-filled-primary" 
        on:click={handleConnect}
        disabled={loading}
      >
        {#if loading}
          <div class="spinner-border !h-5 !w-5"></div>
          <span>Connecting...</span>
        {:else}
          <Icon icon="mdi:wallet" class="size-5" />
          <span>Connect Wallet</span>
        {/if}
      </button>
    {/if}
  </svelte:fragment>
</AppBar>