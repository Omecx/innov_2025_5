import hre from "hardhat";
import { generateMerkleTree } from "./merkleTree.js"; // Note the .js extension

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Using account: ${deployer.address}`);
    
    // Load the deployed contract
    const IoTData = await hre.ethers.getContractFactory("IoTData");
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      throw new Error("CONTRACT_ADDRESS environment variable not set");
    }
    
    const contract = IoTData.attach(contractAddress);
    
    // Get current record count
    const recordCount = await contract.getRecordCount();
    console.log(`Total records: ${recordCount}`);
    
    // Define batch range
    const fromIndex = process.argv[2] ? parseInt(process.argv[2]) : 0;
    const toIndex = process.argv[3] ? parseInt(process.argv[3]) : Math.min(Number(recordCount) - 1, fromIndex + 9);
    
    if (fromIndex >= Number(recordCount) || toIndex >= Number(recordCount)) {
      throw new Error(`Invalid range: ${fromIndex}-${toIndex}. Max record index is ${Number(recordCount) - 1}`);
    }
    
    console.log(`Creating batch for records ${fromIndex}-${toIndex}`);
    
    // Collect records to batch
    const records = [];
    for (let i = fromIndex; i <= toIndex; i++) {
      const data = await contract.getData(i);
      records.push({
        deviceId: data[0],
        timestamp: Number(data[1]),
        data: data[2],
        dataType: data[3],
        location: data[4]
      });
    }
    
    // Generate Merkle tree
    const { merkleRoot, proofs } = generateMerkleTree(records);
    console.log(`Generated Merkle root: ${merkleRoot}`);
    
    // Create batch
    const description = `Batch ${fromIndex}-${toIndex} created on ${new Date().toISOString()}`;
    const tx = await contract.createBatch(fromIndex, toIndex, merkleRoot, description);
    
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    
    console.log("Batch created successfully");
    console.log("Merkle Proofs:", JSON.stringify(proofs, null, 2));
    
  } catch (error) {
    console.error("Error creating batch:", error);
    process.exit(1);
  }
}

main();