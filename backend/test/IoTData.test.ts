import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";
import { Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("IoTData Contract", function () {
  let ioTDataContract: Contract;
  let owner: any;
  let addr1: any;
  
  beforeEach(async function () {
    // Get signers
    [owner, addr1] = await hre.ethers.getSigners();
    
    // Deploy contract
    const IoTData = await hre.ethers.getContractFactory("IoTData");
    ioTDataContract = await IoTData.deploy();
    await ioTDataContract.waitForDeployment();
  });
  
  it("should set the correct owner", async function () {
    expect(await ioTDataContract.owner()).to.equal(owner.address);
  });
  
  it("should have record count initialized to 0", async function () {
    const count = await ioTDataContract.recordCount();
    expect(count).to.equal(0n);
  });
  
  it("should store and retrieve sensor data correctly", async function () {
    const deviceId = "device-001";
    const data = '{"temperature":25.5,"unit":"celsius"}';
    const dataType = "temperature";
    const location = "kitchen";
    
    // Store data
    const tx = await ioTDataContract.storeData(deviceId, data, dataType, location);
    await tx.wait();
    
    // Retrieve data
    const record = await ioTDataContract.getData(0);
    
    // Verify all fields
    expect(record[0]).to.equal(deviceId);
    expect(record[2]).to.equal(data);
    expect(record[3]).to.equal(dataType);
    expect(record[4]).to.equal(location);
  });
  
  it("should increment record count after storing data", async function () {
    // Store first record
    await ioTDataContract.storeData(
      "device-002",
      '{"humidity":60,"unit":"%"}',
      "humidity",
      "living-room"
    );
    
    // Store second record
    await ioTDataContract.storeData(
      "device-003",
      '{"pressure":1013,"unit":"hPa"}',
      "pressure",
      "outside"
    );
    
    // Check record count
    const count = await ioTDataContract.recordCount();
    expect(count).to.equal(2n);
  });
  
  it("should emit DataStored event when storing data", async function () {
    const deviceId = "device-003";
    const data = '{"pressure":1013,"unit":"hPa"}';
    const dataType = "pressure";
    const location = "outside";
    
    // Check event emission
    await expect(ioTDataContract.storeData(deviceId, data, dataType, location))
      .to.emit(ioTDataContract, "DataStored")
      .withArgs(0, deviceId, await time.latest(), dataType, data);
  });
  
  it("should track device records correctly", async function () {
    const deviceId = "device-004";
    
    // Store multiple records for the same device
    await ioTDataContract.storeData(
      deviceId,
      '{"temp":22.1,"unit":"C"}',
      "temperature",
      "bedroom"
    );
    
    await ioTDataContract.storeData(
      deviceId,
      '{"temp":22.5,"unit":"C"}',
      "temperature",
      "bedroom"
    );
    
    await ioTDataContract.storeData(
      deviceId,
      '{"temp":23.0,"unit":"C"}',
      "temperature",
      "bedroom"
    );
    
    // Get device records
    const records = await ioTDataContract.getDeviceRecords(deviceId);
    
    // Check that we have 3 records for this device
    expect(records.length).to.equal(3);
    expect(records[0]).to.equal(0n);
    expect(records[1]).to.equal(1n);
    expect(records[2]).to.equal(2n);
  });
  
  it("should retrieve latest device data", async function () {
    const deviceId = "device-005";
    
    // Store multiple records
    await ioTDataContract.storeData(
      deviceId,
      '{"level":50,"unit":"%"}',
      "battery",
      "garage"
    );
    
    await ioTDataContract.storeData(
      deviceId,
      '{"level":48,"unit":"%"}',
      "battery",
      "garage"
    );
    
    // Get latest record
    const latestData = await ioTDataContract.getLatestDeviceData(deviceId);
    
    // Should be the second record (index 1)
    expect(latestData[0]).to.equal(1n);
    expect(latestData[2]).to.equal('{"level":48,"unit":"%"}');
  });
  
  it("should revert when accessing non-existent record", async function () {
    await expect(ioTDataContract.getData(999))
      .to.be.revertedWith("Record does not exist");
  });
  
  it("should revert when trying to get latest data for non-existent device", async function () {
    await expect(ioTDataContract.getLatestDeviceData("non-existent-device"))
      .to.be.revertedWith("No records for this device");
  });
});