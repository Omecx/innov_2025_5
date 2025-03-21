// frontend/meshx_front/src/lib/types/index.ts
import type { ethers } from 'ethers';

/**
 * Raw sensor data from the blockchain
 */
export interface SensorData {
  deviceId: string;
  timestamp: number;
  data: string;
  dataType: string;
  location: string;
  dataHash?: string;
}

/**
 * Event data emitted by the contract
 */
export interface DataStoredEvent {
  recordId: number;
  deviceId: string;
  timestamp: number;
  dataType: string;
  data: string;
  event: any;
}

/**
 * Formatted sensor data for display
 */
export interface FormattedSensorData {
  id: number;
  deviceId: string;
  timestamp: string;
  sensorData: string;
  dataType: string;
  location: string;
  parsedData?: Record<string, any>;
}

/**
 * Batch information from blockchain
 */
export interface DataBatch {
  batchId: string;
  merkleRoot: string;
  fromIndex: number;
  toIndex: number;
  timestamp: number;
  description: string;
}

/**
 * Merkle proof information
 */
export interface MerkleProof {
  recordId: number;
  proof: string[];
  verified: boolean;
}

/**
 * State for the blockchain store
 */
export interface BlockchainStore {
  connected: boolean;
  polkadotConnected: boolean;
  walletConnected: boolean;
  loading: boolean;
  error: string | null;
  api: any;
  contractAddress: string;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  account: string;
  chainId: number | null;
  network: string | null;
  userRoles: string[];
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorerUrl: string;
  isTestnet: boolean;
  wsRpcUrl?: string;
}

/**
 * Chart data point for visualization
 */
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  deviceId: string;
  formattedTime: string;
  formattedDate: string;
}

/**
 * Device metrics
 */
export interface DeviceMetrics {
  deviceId: string;
  recordCount: number;
  firstTimestamp: number;
  lastTimestamp: number;
  dataTypes: string[];
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * User roles
 */
export enum UserRole {
  ADMIN = 'admin',
  DEVICE = 'device',
  ANALYST = 'analyst',
  NONE = 'none'
}

/**
 * Notification type
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}