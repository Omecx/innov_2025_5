import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

dotenv.config();

// Get private key from environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "0x0000000000000000000000000000000000000000000000000000000000000000";
// Optional Etherscan API key for contract verification
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? "";
// Optional Moonbeam Moonscan API key
const MOONSCAN_API_KEY = process.env.MOONSCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 1337
    },
    // Moonbase Alpha TestNet
    moonbase: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      accounts: [PRIVATE_KEY],
      chainId: 1287,
      // Gas price is set to zero for Moonbase Alpha TestNet
      gasPrice: 0,
      timeout: 100000
    },
    // Moonbeam MainNet (for production)
    moonbeam: {
      url: "https://rpc.api.moonbeam.network",
      accounts: [PRIVATE_KEY],
      chainId: 1284
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  },
  etherscan: {
    apiKey: {
      moonbaseAlpha: MOONSCAN_API_KEY,
      moonbeam: MOONSCAN_API_KEY
    },
    customChains: [
      {
        network: "moonbaseAlpha",
        chainId: 1287,
        urls: {
          apiURL: "https://api-moonbase.moonscan.io/api",
          browserURL: "https://moonbase.moonscan.io/"
        }
      },
      {
        network: "moonbeam",
        chainId: 1284,
        urls: {
          apiURL: "https://api-moonbeam.moonscan.io/api",
          browserURL: "https://moonscan.io/"
        }
      }
    ]
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  }
};

export default config;