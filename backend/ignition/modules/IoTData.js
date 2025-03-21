const { buildModule } = require("@nomicfoundation/hardhat-ignition-ethers");

// This module defines the deployment for the IoTData smart contract
module.exports = buildModule("IoTDataModule", (m) => {
  // Deploy the IoTData contract
  const iotData = m.contract("IoTData");

  return { iotData };
}); 