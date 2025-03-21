import { writable, get } from 'svelte/store';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';
import type { BlockchainStore, FormattedSensorData, NetworkConfig, DataStoredEvent, DataBatch } from '$lib/types';
import { NotificationType, UserRole } from '$lib/types';
import contractAbi from '$lib/blockchain/contract-abi.json';
import contractAddressFile from '$lib/blockchain/contract-address.json';

export const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
export const DEVICE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEVICE_ROLE"));
export const ANALYST_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ANALYST_ROLE"));


// Create a notification store
export const notifications = writable<{ type: NotificationType; message: string; id: string; timeout?: number }[]>([]);

// Add notification
export function addNotification(type: NotificationType, message: string, timeout = 5000) {
  const id = Date.now().toString();
  const notification = { type, message, id, timeout };
  
  notifications.update(items => [notification, ...items]);
  
  if (timeout > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, timeout);
  }
  
  return id;
}

// Remove notification
export function removeNotification(id: string) {
  notifications.update(items => items.filter(item => item.id !== id));
}

// Network configurations
export const NETWORKS: Record<number, NetworkConfig> = {
  1284: {
    name: 'Moonbeam',
    chainId: 1284,
    rpcUrl: 'https://rpc.api.moonbeam.network',
    blockExplorerUrl: 'https://moonscan.io',
    isTestnet: false
  },
  1287: {
    name: 'Moonbase Alpha',
    chainId: 1287,
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
    blockExplorerUrl: 'https://moonbase.moonscan.io',
    isTestnet: true,
    wsRpcUrl: 'wss://wss.api.moonbase.moonbeam.network'
  },
  1337: {
    name: 'Local Hardhat',
    chainId: 1337,
    rpcUrl: 'http://localhost:8545',
    blockExplorerUrl: '',
    isTestnet: true
  }
};

// Get contract address
const contractAddress = contractAddressFile.address;

// Initial state
const initialState: BlockchainStore = {
  connected: false,
  polkadotConnected: false,
  walletConnected: false,
  loading: false,
  error: null,
  api: null,
  contractAddress,
  provider: null,
  signer: null,
  contract: null,
  account: '',
  chainId: null,
  network: null,
  userRoles: []
};
// Create the store
export const blockchainStore = writable<BlockchainStore>(initialState);

// Connect to Polkadot
export async function connectPolkadot(): Promise<boolean> {
  try {
    blockchainStore.update(state => ({ ...state, loading: true, error: null }));
    
    // Get network information from the contract address file
    const chainId = (contractAddressFile as any).chainId ?? 1287;
    
    // Find the network configuration
    const networkConfig = NETWORKS[chainId];
    if (!networkConfig) {
      throw new Error(`Network configuration not found for chain ID ${chainId}`);
    }
    
    // Get the WebSocket URL from the network configuration
    const wsUrl = networkConfig.wsRpcUrl ?? 'wss://wss.api.moonbase.moonbeam.network';
    console.log(`Connecting to Polkadot network at ${wsUrl}`);
    
    // Connect to the endpoint
    const provider = new WsProvider(wsUrl);
    const api = await ApiPromise.create({ provider });
    
    // Verify the connection is ready
    await api.isReady;
    
    blockchainStore.update(state => ({ 
      ...state, 
      api, 
      polkadotConnected: true, 
      connected: state.walletConnected, 
      loading: false,
      network: networkConfig.name,
      chainId
    }));
    
    addNotification(NotificationType.SUCCESS, `Connected to ${networkConfig.name} network`);
    return true;
  } catch (error) {
    console.error('Polkadot connection failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Polkadot network';
    
    blockchainStore.update(state => ({ 
      ...state, 
      loading: false, 
      error: errorMessage
    }));
    
    addNotification(NotificationType.ERROR, errorMessage);
    return false;
  }
}

// Connect to Ethereum-compatible wallet (MetaMask or similar)
export async function connectWallet(): Promise<boolean> {
  try {
    blockchainStore.update(state => ({ ...state, loading: true, error: null }));
    
    if (!window.ethereum) {
      throw new Error('No crypto wallet found. Please install MetaMask or similar.');
    }
    
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    
    // Get network information
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);
    
    // Check if the network is supported
    if (!NETWORKS[chainId]) {
      throw new Error(`Unsupported network. Please connect to Moonbeam or Moonbase Alpha. Current chain ID: ${chainId}`);
    }
    
    // Create Web3 provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);
    
    // Setup event listeners for account and network changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    // Update store
    blockchainStore.update(state => ({
      ...state,
      contractAddress,
      provider,
      signer,
      contract,
      account,
      chainId,
      network: NETWORKS[chainId].name,
      walletConnected: true,
      connected: state.polkadotConnected,
      loading: false
    }));
    
    addNotification(NotificationType.SUCCESS, `Connected to wallet: ${account.substring(0, 6)}...${account.substring(38)}`);
    return true;
  } catch (error) {
    console.error('Wallet connection failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
    
    blockchainStore.update(state => ({ 
      ...state, 
      loading: false, 
      error: errorMessage
    }));
    
    addNotification(NotificationType.ERROR, errorMessage);
    return false;
  }
}

// Handle account changes
function handleAccountsChanged(accounts: string[]) {
  if (accounts.length === 0) {
    // User disconnected their wallet
    disconnectWallet();
  } else {
    // Update the current account
    blockchainStore.update(state => ({
      ...state,
      account: accounts[0]
    }));
    
    addNotification(NotificationType.INFO, `Account changed to: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
  }
}

// Handle chain/network changes
function handleChainChanged(_chainIdHex: string) {
  // MetaMask requires a page refresh after chain changes
  window.location.reload();
}

// Disconnect wallet
export function disconnectWallet() {
  if (window.ethereum) {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  }
  
  blockchainStore.update(state => ({
    ...state,
    walletConnected: false,
    connected: false,
    account: '',
    signer: null,
    contract: null,
    chainId: null,
    network: null
  }));
  
  addNotification(NotificationType.INFO, 'Wallet disconnected');
}

// Store IoT data on the blockchain
export async function storeIoTData(
  deviceId: string, 
  data: string, 
  dataType: string, 
  location: string
): Promise<boolean> {
  try {
    const state = get(blockchainStore);
    
    if (!state.contract) throw new Error('Contract not connected');
    
    // Store the data on chain
    const tx = await state.contract.storeData(deviceId, data, dataType, location);
    const receipt = await tx.wait();
    
    console.log("Transaction receipt:", receipt);
    addNotification(NotificationType.SUCCESS, "Data stored successfully on-chain");
    return true;
  } catch (error) {
    console.error("Error storing IoT data:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error storing data';
    addNotification(NotificationType.ERROR, errorMessage);
    return false;
  }
}

// Get IoT data from the blockchain by index
export async function getIoTData(index: number): Promise<FormattedSensorData | null> {
  try {
    const state = get(blockchainStore);
    
    if (!state.contract) throw new Error('Contract not connected');
    
    const data = await state.contract.getData(index);
    
    // Parse the JSON data if possible
    let parsedData: Record<string, any> | undefined;
    try {
      parsedData = JSON.parse(data[2]);
    } catch (e) {
      // If data is not valid JSON, just use the raw data string
    }
    
    return {
      id: index,
      deviceId: data[0],
      timestamp: new Date(Number(data[1]) * 1000).toLocaleString(),
      sensorData: data[2],
      dataType: data[3],
      location: data[4],
      parsedData
    };
  } catch (error) {
    console.error("Error retrieving IoT data:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error retrieving data';
    addNotification(NotificationType.ERROR, errorMessage);
    return null;
  }
}

// Get the total number of records
export async function getRecordCount(): Promise<number> {
  try {
    const state = get(blockchainStore);
    
    if (!state.contract) throw new Error('Contract not connected');
    
    const count = await state.contract.getRecordCount();
    return Number(count);
  } catch (error) {
    console.error("Error getting record count:", error);
    return 0;
  }
}

// Get all record indices for a specific device
export async function getDeviceRecords(deviceId: string): Promise<number[]> {
  try {
    const state = get(blockchainStore);
    
    if (!state.contract) throw new Error('Contract not connected');
    
    const indices = await state.contract.getDeviceRecords(deviceId);
    return indices.map(Number);
  } catch (error) {
    console.error("Error getting device records:", error);
    return [];
  }
}

// Get the latest record for a specific device
export async function getLatestDeviceData(deviceId: string): Promise<FormattedSensorData | null> {
  try {
    const state = get(blockchainStore);
    
    if (!state.contract) throw new Error('Contract not connected');
    
    const data = await state.contract.getLatestDeviceData(deviceId);
    
    // Parse the JSON data if possible
    let parsedData: Record<string, any> | undefined;
    try {
      parsedData = JSON.parse(data[2]);
    } catch (e) {
      // If data is not valid JSON, just use the raw data string
    }
    
    return {
      id: Number(data[0]),
      deviceId,
      timestamp: new Date(Number(data[1]) * 1000).toLocaleString(),
      sensorData: data[2],
      dataType: data[3],
      location: data[4],
      parsedData
    };
  } catch (error) {
    console.error("Error retrieving latest device data:", error);
    return null;
  }
}

// Listen for new IoT data events
export function listenForDataEvents(callback: (event: any) => void) {
  const state = get(blockchainStore);
  
  if (!state.contract) {
    console.error('Contract not connected');
    return () => {};
  }
  
  // Listen for DataStored events
  state.contract.on('DataStored', (recordId, deviceId, timestamp, dataType, data, event) => {
    const formattedEvent: DataStoredEvent = {
      recordId: Number(recordId),
      deviceId,
      timestamp: Number(timestamp),
      dataType,
      data,
      event
    };
    callback(formattedEvent);
  });
  
  // Return a function to remove the listener
  return () => {
    if (state.contract) {
      state.contract.off('DataStored');
    }
  };
}

// Grant device role
export async function grantDeviceRole(address: string): Promise<boolean> {
  try {
    const state = get(blockchainStore);
    if (!state.contract || !state.signer) {
      throw new Error('Contract or signer not available');
    }
    
    const tx = await state.contract.grantRole(DEVICE_ROLE, address);
    await tx.wait();
    
    addNotification(NotificationType.SUCCESS, `Device role granted to ${address}`);
    return true;
  } catch (error) {
    console.error('Error granting device role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to grant device role';
    addNotification(NotificationType.ERROR, errorMessage);
    return false;
  }
}

// Grant analyst role
export async function grantAnalystRole(address: string): Promise<boolean> {
  try {
    const state = get(blockchainStore);
    if (!state.contract || !state.signer) {
      throw new Error('Contract or signer not available');
    }
    
    const tx = await state.contract.grantRole(ANALYST_ROLE, address);
    await tx.wait();
    
    addNotification(NotificationType.SUCCESS, `Analyst role granted to ${address}`);
    return true;
  } catch (error) {
    console.error('Error granting analyst role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to grant analyst role';
    addNotification(NotificationType.ERROR, errorMessage);
    return false;
  }
}

// Revoke role
export async function revokeRole(role: string, address: string): Promise<boolean> {
  try {
    const state = get(blockchainStore);
    if (!state.contract || !state.signer) {
      throw new Error('Contract or signer not available');
    }
    
    const tx = await state.contract.revokeRole(role, address);
    await tx.wait();
    
    let roleName = 'Unknown';
    if (role === ADMIN_ROLE) roleName = 'Admin';
    if (role === DEVICE_ROLE) roleName = 'Device';
    if (role === ANALYST_ROLE) roleName = 'Analyst';
    
    addNotification(NotificationType.SUCCESS, `${roleName} role revoked from ${address}`);
    return true;
  } catch (error) {
    console.error('Error revoking role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to revoke role';
    addNotification(NotificationType.ERROR, errorMessage);
    return false;
  }
}

// Create a new batch of records with Merkle proof
export async function createBatch(
  fromIndex: number,
  toIndex: number,
  merkleRoot: string,
  description: string
): Promise<string | null> {
  try {
    const state = get(blockchainStore);
    if (!state.contract || !state.signer) {
      throw new Error('Contract or signer not available');
    }
    
    const tx = await state.contract.createBatch(fromIndex, toIndex, merkleRoot, description);
    const receipt = await tx.wait();
    
    // Get the batch ID from the event logs
    const event = receipt.logs.find(
      (log: any) => log.eventName === 'BatchCreated'
    );
    
    if (event && event.args) {
      const batchId = event.args[0].toString();
      addNotification(NotificationType.SUCCESS, `Batch created with ID: ${batchId}`);
      return batchId;
    }
    
    addNotification(NotificationType.SUCCESS, 'Batch created successfully');
    return '0'; // Default batch ID if we couldn't extract it
  } catch (error) {
    console.error('Error creating batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create batch';
    addNotification(NotificationType.ERROR, errorMessage);
    return null;
  }
}

// Get all batches
export async function getBatches(): Promise<DataBatch[]> {
  try {
    const state = get(blockchainStore);
    if (!state.contract) {
      throw new Error('Contract not available');
    }
    
    const batchCount = await state.contract.getBatchCount();
    const batches: DataBatch[] = [];
    
    for (let i = 0; i < batchCount; i++) {
      const batch = await state.contract.getBatch(i);
      batches.push({
        batchId: i.toString(),
        merkleRoot: batch.merkleRoot,
        fromIndex: Number(batch.fromIndex),
        toIndex: Number(batch.toIndex),
        timestamp: Number(batch.timestamp),
        description: batch.description
      });
    }
    
    return batches;
  } catch (error) {
    console.error('Error getting batches:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get batches';
    addNotification(NotificationType.ERROR, errorMessage);
    return [];
  }
}

// Verify a record against a Merkle proof
export async function verifyRecord(
  recordId: number,
  merkleRoot: string,
  merkleProof: string[]
): Promise<boolean> {
  try {
    const state = get(blockchainStore);
    
    if (!state.contract) throw new Error('Contract not connected');
    
    const verified = await state.contract.verifyRecord(
      recordId,
      merkleRoot,
      merkleProof
    );
    
    return verified;
  } catch (error) {
    console.error("Error verifying record:", error);
    return false;
  }
}