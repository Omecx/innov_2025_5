import { writable } from 'svelte/store';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';
import type { BlockchainStore, FormattedSensorData } from '$lib/types';

// IoTData contract ABI
const abi = [
  "function storeData(string calldata _deviceId, string calldata _data) external",
  "function getData(uint256 index) external view returns (string memory, uint256, string memory)",
  "function getRecordCount() external view returns (uint256)",
  "event DataStored(uint256 indexed recordId, string deviceId, uint256 timestamp, string data)"
];

// Initial state
const initialState: BlockchainStore = {
  connected: false,
  api: null,
  contractAddress: '',
  provider: null,
  signer: null,
  contract: null,
  account: ''
};

// Create the store
export const blockchainStore = writable<BlockchainStore>(initialState);

// Connect to Polkadot
export async function connectPolkadot(): Promise<boolean> {
  try {
    // Connect to a Moonbase Alpha endpoint
    const provider = new WsProvider('wss://wss.api.moonbase.moonbeam.network');
    const api = await ApiPromise.create({ provider });
    
    blockchainStore.update(state => ({ ...state, api, connected: true }));
    console.log('Connected to Polkadot network');
    return true;
  } catch (error) {
    console.error('Polkadot connection failed:', error);
    return false;
  }
}

// Connect to Ethereum-compatible wallet (MetaMask or similar)
export async function connectWallet(contractAddress: string): Promise<boolean> {
  try {
    if (!window.ethereum) throw new Error('No crypto wallet found');
    
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    
    // Create Web3 provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, abi, signer);
    
    // Update store
    blockchainStore.update(state => ({
      ...state,
      contractAddress,
      provider,
      signer,
      contract,
      account
    }));
    
    console.log('Wallet connected');
    return true;
  } catch (error) {
    console.error('Wallet connection failed:', error);
    return false;
  }
}

// Store IoT data on the blockchain
export async function storeIoTData(deviceId: string, data: string): Promise<boolean> {
  try {
    let state: BlockchainStore;
    blockchainStore.subscribe(s => { state = s; })();
    
    if (!state.contract) throw new Error('Contract not connected');
    
    const tx = await state.contract.storeData(deviceId, data);
    await tx.wait();
    
    console.log("Data stored successfully on-chain");
    return true;
  } catch (error) {
    console.error("Error storing IoT data:", error);
    return false;
  }
}

// Get IoT data from the blockchain by index
export async function getIoTData(index: number): Promise<FormattedSensorData | null> {
  try {
    let state: BlockchainStore;
    blockchainStore.subscribe(s => { state = s; })();
    
    if (!state.contract) throw new Error('Contract not connected');
    
    const data = await state.contract.getData(index);
    
    return {
      deviceId: data[0],
      timestamp: new Date(Number(data[1]) * 1000).toLocaleString(),
      sensorData: data[2]
    };
  } catch (error) {
    console.error("Error retrieving IoT data:", error);
    return null;
  }
}

// Get the total number of records
export async function getRecordCount(): Promise<number> {
  try {
    let state: BlockchainStore;
    blockchainStore.subscribe(s => { state = s; })();
    
    if (!state.contract) throw new Error('Contract not connected');
    
    const count = await state.contract.getRecordCount();
    return Number(count);
  } catch (error) {
    console.error("Error getting record count:", error);
    return 0;
  }
}