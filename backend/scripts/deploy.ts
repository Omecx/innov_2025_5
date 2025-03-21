// backend/scripts/deploy.ts
import { ethers } from "ethers";
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  try {
    // Get the contract factory and signer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Network: ${hre.network.name}`);
    console.log(`Deploying contracts with account: ${deployer.address}`);
    
    // Check balance before deployment
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} DEV`);
    
    if (balance <= ethers.parseEther("1")) {
      console.warn("Warning: Your account balance is low. Make sure you have enough DEV tokens from the faucet.");
      console.warn("You can get DEV tokens from the Moonbase Alpha Discord: !faucet send <your-address>");
    }
    
    // Deploy the contract
    console.log("Deploying IoTData contract...");
    const IoTData = await hre.ethers.getContractFactory("IoTData");
    const contract = await IoTData.deploy();
    
    console.log("Waiting for deployment transaction to be mined...");
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log(`IoTData deployed to: ${contractAddress}`);
    console.log(`View on Moonbase Explorer: https://moonbase.moonscan.io/address/${contractAddress}`);
    
    // Get the contract ABI from the artifacts
    const contractArtifact = hre.artifacts.readArtifactSync("IoTData");
    
    // Create directories for saving contract information
    const frontendDir = path.join(__dirname, "..", "..", "frontend", "meshx_front");
    const contractsDir = path.join(frontendDir, "src", "lib", "blockchain");
    
    // Create the directories if they don't exist
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }
    
    // Save contract address
    fs.writeFileSync(
      path.join(contractsDir, "contract-address.json"),
      JSON.stringify({ 
        address: contractAddress,
        network: hre.network.name,
        chainId: hre.network.config.chainId
      }, null, 2)
    );
    
    // Save contract ABI
    fs.writeFileSync(
      path.join(contractsDir, "contract-abi.json"),
      JSON.stringify(contractArtifact.abi, null, 2)
    );
    
    console.log("Contract address and ABI saved to frontend directory");
    
    // Set up roles for a test device
    const testDevice = deployer;
    console.log(`Granting DEVICE role to ${testDevice.address}...`);
    const DEVICE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEVICE_ROLE"));
    await contract.grantRole(DEVICE_ROLE, testDevice.address);
    console.log("DEVICE role granted.");
    
    // Wait for explorer to index the contract before verification
    if (hre.network.name === "moonbase" || hre.network.name === "moonbeam") {
      console.log("Waiting for 60 seconds before verifying contract on Moonscan...");
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      try {
        console.log("Verifying contract on Moonscan...");
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: []
        });
        console.log("Contract verified successfully on Moonscan");
        console.log(`View verified contract: https://moonbase.moonscan.io/address/${contractAddress}#code`);
      } catch (verifyError) {
        console.error("Error verifying contract:", verifyError);
        console.log("Verification information for manual verification:");
        console.log(`- Contract Address: ${contractAddress}`);
        console.log("- Constructor Arguments: []");
        console.log("- Compiler: v0.8.20");
        console.log("- Optimization: Enabled with 200 runs");
      }
    }
    
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exitCode = 1;
  }
}

// Run the deployment
main();