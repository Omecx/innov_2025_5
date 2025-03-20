import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("IoTData Contract", function () {
  let ioTDataContract: Contract;
  
  beforeEach(async function () {
    const [owner] = await ethers.getSigners();
    const IoTData = await ethers.getContractFactory("IoTData");
    ioTDataContract = await IoTData.deploy();
    await ioTDataContract.waitForDeployment();
  });
  
  it("should have record count initialized to 0", async function () {
    const count = await ioTDataContract.recordCount();
    expect(count).to.equal(0);
  });
  
  it("should store and retrieve sensor data correctly", async function () {
    const deviceId = "device-001";
    const data = "Temperature:25°C";
    
    const tx = await ioTDataContract.storeData(deviceId, data);
    await tx.wait();
    
    const record = await ioTDataContract.getData(0);
    
    expect(record[0]).to.equal(deviceId);
    expect(record[2]).to.equal(data);
  });
  
  it("should increment record count after storing data", async function () {
    const deviceId = "device-002";
    const data = "Humidity:60%";
    
    const txn = await ioTDataContract.storeData(deviceId, data);
    await txn.wait();
    
    const count = await ioTDataContract.recordCount();
    expect(count).to.equal(1);
  });
  
  it("should emit DataStored event when storing data", async function () {
    const deviceId = "device-003";
    const data = "Pressure:1013hPa";
    
    await expect(ioTDataContract.storeData(deviceId, data))
      .to.emit(ioTDataContract, "DataStored")
      .withArgs(0, deviceId, await ethers.provider.getBlock("latest").then(b => b?.timestamp), data);
  });
});