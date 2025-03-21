// backend/scripts/merkleTree.ts
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

interface SensorDataRecord {
  deviceId: string;
  timestamp: number;
  data: string;
  dataType: string;
  location: string;
}

export function generateMerkleTree(records: SensorDataRecord[]): { 
  merkleTree: MerkleTree;
  merkleRoot: string;
  leaves: Buffer[];
  proofs: { [index: number]: string[][] };
} {
  // Generate leaf nodes by hashing each record
  const leaves = records.map((record, index) => {
    const hash = ethers.solidityPackedKeccak256(
      ["string", "uint256", "string", "string", "string"],
      [record.deviceId, record.timestamp, record.data, record.dataType, record.location]
    );
    return Buffer.from(hash.slice(2), 'hex');
  });

  // Create Merkle tree
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const merkleRoot = merkleTree.getHexRoot();
  
  // Generate proofs for each leaf node
  const proofs: { [index: number]: string[][] } = {};
  leaves.forEach((leaf, index) => {
    proofs[index] = merkleTree.getHexProof(leaf).map(p => p.toString());
  });
  
  return {
    merkleTree,
    merkleRoot,
    leaves,
    proofs
  };
}

export function verifyProof(
  leaf: Buffer, 
  proof: string[], 
  root: string
): boolean {
  return MerkleTree.verify(proof, leaf, root, keccak256, { sortPairs: true });
}

// Example usage for scripts
export async function batchRecords(
  contract: ethers.Contract,
  fromIndex: number,
  toIndex: number,
  description: string
): Promise<string> {
  // Fetch records from the contract
  const records: SensorDataRecord[] = [];
  
  for (let i = fromIndex; i <= toIndex; i++) {
    const record = await contract.getData(i);
    records.push({
      deviceId: record[0],
      timestamp: record[1].toNumber(),
      data: record[2],
      dataType: record[3],
      location: record[4]
    });
  }
  
  // Generate Merkle tree
  const { merkleRoot } = generateMerkleTree(records);
  
  // Create batch on the contract
  const tx = await contract.createBatch(
    fromIndex,
    toIndex,
    merkleRoot,
    description
  );
  
  const receipt = await tx.wait();
  console.log(`Batch created with root: ${merkleRoot}`);
  
  return merkleRoot;
}