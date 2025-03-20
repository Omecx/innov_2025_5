// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IoTData {
    struct SensorData {
        string deviceId;
        uint256 timestamp;
        string data;
    }
    
    mapping(uint256 => SensorData) private sensorRecords;
    uint256 public recordCount;
    
    event DataStored(uint256 indexed recordId, string deviceId, uint256 timestamp, string data);
    
    // Store IoT sensor data on the blockchain
    function storeData(string calldata _deviceId, string calldata _data) external {
        sensorRecords[recordCount] = SensorData(_deviceId, block.timestamp, _data);
        emit DataStored(recordCount, _deviceId, block.timestamp, _data);
        recordCount++;
    }
    
    // Retrieve IoT sensor data by index
    function getData(uint256 index) external view returns (string memory, uint256, string memory) {
        SensorData memory record = sensorRecords[index];
        return (record.deviceId, record.timestamp, record.data);
    }
    
    // Get the total number of records
    function getRecordCount() external view returns (uint256) {
        return recordCount;
    }
}