import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);
    
    const IoTData = await ethers.getContractFactory("IoTData");
    const contract = await IoTData.deploy();
    
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log(`IoTData deployed to: ${contractAddress}`);
    
    // Save contract address to a file for frontend to use
    const contractsDir = path.join(__dirname, "..", "..", "frontend", "src", "lib", "blockchain");
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(contractsDir, "contract-address.json"),
      JSON.stringify({ address: contractAddress }, null, 2)
    );
    
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exitCode = 1;
  }
}

main();