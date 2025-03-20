import { ethers } from 'ethers';

// The ABI of the IoTData smart contract
const abi = [
  "function storeData(string _deviceId, string _data) public",
  "function getData(uint256 index) public view returns (string, uint256, string)"
];

export async function storeIoTData(contractAddress, deviceId, data) {
  try {
    if (!window.ethereum) throw new Error('No crypto wallet found');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const tx = await contract.storeData(deviceId, data);
    await tx.wait();
    console.log("Data stored successfully on-chain");
  } catch (error) {
    console.error("Error storing IoT data:", error);
  }
}

export async function getIoTData(contractAddress, index) {
  try {
    if (!window.ethereum) throw new Error('No crypto wallet found');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const data = await contract.getData(index);
    return {
      deviceId: data[0],
      timestamp: new Date(data[1] * 1000).toLocaleString(),
      sensorData: data[2]
    };
  } catch (error) {
    console.error("Error retrieving IoT data:", error);
  }
}
