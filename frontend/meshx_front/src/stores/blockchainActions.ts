import { get } from 'svelte/store';
import { blockchainStore, addNotification } from './blockchainStore';
import { NotificationType } from '$lib/types';
import type { FormattedSensorData, ChartDataPoint } from '$lib/types';

/**
 * Format timestamp for display in charts
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Parse IoT sensor data
 * @param jsonData String data from the blockchain
 * @returns Parsed object or null if parsing fails
 */
export function parseSensorData(jsonData: string): Record<string, any> | null {
  try {
    return JSON.parse(jsonData);
  } catch (e) {
    console.warn('Failed to parse JSON data:', e);
    return null;
  }
}

/**
 * Extract numeric value from sensor data
 * @param data FormattedSensorData record
 * @returns Numeric value extracted from the data or null
 */
export function extractNumericValue(data: FormattedSensorData): number | null {
  try {
    // Try parsedData first if available
    if (data.parsedData) {
      // Check for value property
      if (typeof data.parsedData.value === 'number') {
        return data.parsedData.value;
      }

      // Check for a property matching the dataType
      if (data.dataType && typeof data.parsedData[data.dataType] === 'number') {
        return data.parsedData[data.dataType];
      }

      // Find the first numeric property
      for (const key in data.parsedData) {
        if (typeof data.parsedData[key] === 'number') {
          return data.parsedData[key];
        }
      }
    }

    // Try to parse the raw sensorData as a number
    const numericValue = parseFloat(data.sensorData);
    if (!isNaN(numericValue)) {
      return numericValue;
    }

    return null;
  } catch (error) {
    console.warn('Error extracting numeric value:', error);
    return null;
  }
}

/**
 * Convert FormattedSensorData array to ChartDataPoint array for visualization
 */
export function prepareChartData(records: FormattedSensorData[]): ChartDataPoint[] {
  const validPoints: ChartDataPoint[] = [];
  
  for (const record of records) {
    const value = extractNumericValue(record);
    if (value !== null) {
      const timestamp = new Date(record.timestamp).getTime();
      validPoints.push({
        timestamp,
        value,
        deviceId: record.deviceId,
        formattedTime: new Date(timestamp).toLocaleTimeString(),
        formattedDate: new Date(timestamp).toLocaleDateString()
      });
    }
  }
  
  return validPoints.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

/**
 * Get transaction URL for block explorer
 */
export function getTransactionUrl(txHash: string): string {
  const state = get(blockchainStore);
  
  if (!state.chainId) return '';
  
  let networkUrl = '';
  if (state.chainId === 1287) {
    networkUrl = 'https://moonbase.moonscan.io/tx/';
  } else if (state.chainId === 1284) {
    networkUrl = 'https://moonscan.io/tx/';
  }
  
  return `${networkUrl}${txHash}`;
}

/**
 * Get address URL for block explorer
 */
export function getAddressUrl(address: string): string {
  const state = get(blockchainStore);
  
  if (!state.chainId) return '';
  
  let networkUrl = '';
  if (state.chainId === 1287) {
    networkUrl = 'https://moonbase.moonscan.io/address/';
  } else if (state.chainId === 1284) {
    networkUrl = 'https://moonscan.io/address/';
  }
  
  return `${networkUrl}${address}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    addNotification(NotificationType.SUCCESS, 'Copied to clipboard');
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    addNotification(NotificationType.ERROR, 'Failed to copy to clipboard');
    return false;
  }
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Add Moonbase Alpha network to MetaMask
 */
export async function addMoonbaseToMetaMask(): Promise<boolean> {
  if (!isMetaMaskInstalled()) {
    addNotification(NotificationType.ERROR, 'MetaMask is not installed');
    return false;
  }

  try {
    await window.ethereum!.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x507', // 1287 in hex
          chainName: 'Moonbase Alpha',
          nativeCurrency: {
            name: 'DEV',
            symbol: 'DEV',
            decimals: 18,
          },
          rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
          blockExplorerUrls: ['https://moonbase.moonscan.io/'],
        },
      ],
    });
    
    addNotification(NotificationType.SUCCESS, 'Moonbase Alpha network added to MetaMask');
    return true;
  } catch (error) {
    console.error('Error adding Moonbase Alpha to MetaMask:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addNotification(NotificationType.ERROR, `Failed to add network: ${errorMessage}`);
    return false;
  }
}