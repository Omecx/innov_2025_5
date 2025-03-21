# MeshSense: IoT Blockchain Project

MeshSense is a comprehensive blockchain-based platform for secure IoT data management and verification. It leverages the Polkadot ecosystem through Moonbeam/Moonbase Alpha to create an immutable and verifiable ledger of IoT sensor data.

## Project Structure

```
MeshSense/
├── backend/                   # Smart contract and blockchain interaction
│   ├── contracts/             # Solidity contracts
│   ├── ignition/              # Hardhat Ignition deployment modules
│   ├── scripts/               # Deployment and utility scripts
│   ├── test/                  # Contract tests
│   └── hardhat.config.ts      # Hardhat configuration
├── frontend/
│   └── meshx_front/           # Svelte frontend application
│       ├── src/
│       │   ├── components/    # UI components
│       │   ├── lib/           # Shared libraries and types
│       │   ├── routes/        # SvelteKit routes
│       │   └── stores/        # State management
│       └── static/            # Static assets
```

## Technology Stack

### Backend
- Blockchain: Polkadot ecosystem (Moonbeam/Moonbase Alpha)
- Smart Contracts: Solidity 0.8.20
- Development Framework: Hardhat with Ignition
- Testing: Mocha/Chai
- Cryptography: Merkle trees for data verification

### Frontend
- Framework: SvelteKit
- UI Components: Skeleton UI
- Language: TypeScript
- Web3 Integration: ethers.js, Polkadot.js
- Styling: Tailwind CSS

## Setup Instructions

### Backend

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your private key and API keys:
   ```
   PRIVATE_KEY=your_private_key_here
   MOONSCAN_API_KEY=your_moonscan_api_key_here
   ```

### Frontend

1. Install dependencies:
   ```bash
   cd frontend/meshx_front
   npm install
   ```

## Deployment to Moonbase Alpha

### Getting DEV Tokens

Before deploying to Moonbase Alpha, you need DEV tokens:

1. Join the Moonbeam Discord: https://discord.gg/moonbeam
2. Use the faucet bot to request tokens:
   ```
   !faucet send your_address_here
   ```

### Deploying Smart Contracts

Using Hardhat Ignition for deployment:

```bash
cd backend
npx hardhat ignition deploy ./ignition/modules/IoTData.js --network moonbase
```

### Contract Verification

After deployment, verify your contract on Moonbase Alpha Moonscan:

```bash
npx hardhat verify --network moonbase DEPLOYED_CONTRACT_ADDRESS
```

### Frontend Configuration

After deploying the contract:

1. The deployment script automatically updates the contract address in the frontend
2. Build the frontend:
   ```bash
   cd frontend/meshx_front
   npm run build
   ```

## Running Locally

### Backend

Start a local Hardhat node:

```bash
cd backend
npx hardhat node
```

In another terminal, deploy to the local node:

```bash
cd backend
npx hardhat ignition deploy ./ignition/modules/IoTData.js --network localhost
```

### Frontend

Start the frontend development server:

```bash
cd frontend/meshx_front
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Connecting to Moonbase Alpha

To connect MetaMask to Moonbase Alpha:

1. Open MetaMask and go to Networks
2. Add a new network with these settings:
   - Network Name: Moonbase Alpha
   - RPC URL: https://rpc.api.moonbase.moonbeam.network
   - Chain ID: 1287
   - Symbol: DEV
   - Block Explorer URL: https://moonbase.moonscan.io/

## License

MIT

