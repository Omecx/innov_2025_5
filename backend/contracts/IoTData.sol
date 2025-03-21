// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title IoTData
 * @dev Smart contract for storing and verifying IoT sensor data
 */
contract IoTData is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEVICE_ROLE = keccak256("DEVICE_ROLE");
    bytes32 public constant ANALYST_ROLE = keccak256("ANALYST_ROLE");
    
    struct SensorData {
        string deviceId;
        uint256 timestamp;
        string data;
        string dataType;
        string location;
        bytes32 dataHash;
    }
    
    // Batch data for Merkle root storage
    struct DataBatch {
        bytes32 merkleRoot;
        uint256 fromIndex;
        uint256 toIndex;
        uint256 timestamp;
        string description;
    }
    
    // State variables
    mapping(uint256 => SensorData) private sensorRecords;
    mapping(string => uint256[]) private deviceRecords;
    mapping(bytes32 => bool) private verifiedMerkleRoots;
    mapping(bytes32 => DataBatch) private dataBatches;
    bytes32[] private batchList;
    
    Counters.Counter private _recordCounter;
    Counters.Counter private _batchCounter;
    
    // Events
    event DataStored(uint256 indexed recordId, string deviceId, uint256 timestamp, string dataType, string data);
    event BatchCreated(bytes32 indexed batchId, bytes32 merkleRoot, uint256 fromIndex, uint256 toIndex, uint256 timestamp);
    event RoleGranted(bytes32 role, address account, address sender);
    
    /**
     * @dev Constructor sets up admin role for the deployer
     */
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Store IoT sensor data on the blockchain
     * @param _deviceId Identifier of the IoT device
     * @param _data The sensor reading data (JSON string)
     * @param _dataType Type of data being recorded
     * @param _location Optional location information
     */
    function storeData(
        string calldata _deviceId, 
        string calldata _data, 
        string calldata _dataType, 
        string calldata _location
    ) external nonReentrant returns (uint256) {
        require(hasRole(DEVICE_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Must have device or admin role");
        
        // Create data hash for this record
        bytes32 dataHash = keccak256(abi.encodePacked(_deviceId, block.timestamp, _data, _dataType, _location));
        
        // Get current record ID and increment counter
        uint256 recordId = _recordCounter.current();
        _recordCounter.increment();
        
        // Store record
        sensorRecords[recordId] = SensorData(_deviceId, block.timestamp, _data, _dataType, _location, dataHash);
        deviceRecords[_deviceId].push(recordId);
        
        // Emit event
        emit DataStored(recordId, _deviceId, block.timestamp, _dataType, _data);
        
        return recordId;
    }
    
    /**
     * @dev Create a Merkle root for a batch of records
     * @param _fromIndex Starting index of records in batch
     * @param _toIndex Ending index of records in batch
     * @param _merkleRoot Computed Merkle root for the batch
     * @param _description Description of this batch
     */
    function createBatch(
        uint256 _fromIndex,
        uint256 _toIndex,
        bytes32 _merkleRoot,
        string calldata _description
    ) external nonReentrant returns (bytes32) {
        require(hasRole(ADMIN_ROLE, msg.sender), "Must have admin role");
        require(_toIndex >= _fromIndex, "Invalid index range");
        require(_toIndex < _recordCounter.current(), "To-index out of range");
        
        // Create batch ID using keccak256
        bytes32 batchId = keccak256(abi.encodePacked(_fromIndex, _toIndex, _merkleRoot, block.timestamp));
        
        // Store batch information
        dataBatches[batchId] = DataBatch(_merkleRoot, _fromIndex, _toIndex, block.timestamp, _description);
        batchList.push(batchId);
        verifiedMerkleRoots[_merkleRoot] = true;
        
        // Emit event
        emit BatchCreated(batchId, _merkleRoot, _fromIndex, _toIndex, block.timestamp);
        
        return batchId;
    }
    
    /**
     * @dev Verify a data record against a Merkle proof
     * @param _recordId Record to verify
     * @param _merkleRoot Merkle root to verify against
     * @param _merkleProof Proof showing the record is in the Merkle tree
     */
    function verifyRecord(
        uint256 _recordId,
        bytes32 _merkleRoot,
        bytes32[] calldata _merkleProof
    ) external view returns (bool) {
        require(verifiedMerkleRoots[_merkleRoot], "Unknown Merkle root");
        require(_recordId < _recordCounter.current(), "Record doesn't exist");
        
        // Get record hash
        bytes32 leaf = sensorRecords[_recordId].dataHash;
        
        // Verify the proof
        return MerkleProof.verify(_merkleProof, _merkleRoot, leaf);
    }
    
    /**
     * @dev Get total number of batches created
     */
    function getBatchCount() external view returns (uint256) {
        return batchList.length;
    }
    
    /**
     * @dev Get batch information by index
     * @param _index Index in the batch list
     */
    function getBatchByIndex(uint256 _index) external view returns (
        bytes32 batchId,
        bytes32 merkleRoot,
        uint256 fromIndex,
        uint256 toIndex,
        uint256 timestamp,
        string memory description
    ) {
        require(_index < batchList.length, "Batch index out of range");
        
        batchId = batchList[_index];
        DataBatch storage batch = dataBatches[batchId];
        
        return (
            batchId,
            batch.merkleRoot,
            batch.fromIndex,
            batch.toIndex,
            batch.timestamp,
            batch.description
        );
    }
    
    /**
     * @dev Retrieve IoT sensor data by index
     */
    function getData(uint256 index) external view returns (
        string memory, 
        uint256, 
        string memory, 
        string memory, 
        string memory
    ) {
        require(index < _recordCounter.current(), "Record does not exist");
        SensorData storage record = sensorRecords[index];
        return (
            record.deviceId, 
            record.timestamp, 
            record.data, 
            record.dataType, 
            record.location
        );
    }
    
    /**
     * @dev Get the total number of records
     */
    function getRecordCount() external view returns (uint256) {
        return _recordCounter.current();
    }
    
    /**
     * @dev Get all record indices for a specific device
     */
    function getDeviceRecords(string calldata _deviceId) external view returns (uint256[] memory) {
        return deviceRecords[_deviceId];
    }
    
    /**
     * @dev Get the latest record for a specific device
     */
    function getLatestDeviceData(string calldata _deviceId) external view returns (
        uint256, 
        uint256, 
        string memory, 
        string memory, 
        string memory
    ) {
        uint256[] storage records = deviceRecords[_deviceId];
        require(records.length > 0, "No records for this device");
        
        uint256 latestIndex = records[records.length - 1];
        SensorData storage record = sensorRecords[latestIndex];
        
        return (
            latestIndex,
            record.timestamp, 
            record.data, 
            record.dataType, 
            record.location
        );
    }
    
    /**
     * @dev Get aggregated data metrics for a device
     * @param _deviceId The device ID to get aggregated data for
     * @param _dataType The type of data to aggregate (optional)
     * @param _fromTimestamp Starting timestamp for aggregation period
     * @param _toTimestamp Ending timestamp for aggregation period
     */
    function getDeviceMetrics(
        string calldata _deviceId,
        string calldata _dataType,
        uint256 _fromTimestamp,
        uint256 _toTimestamp
    ) external view returns (
        uint256 recordCount,
        uint256 firstTimestamp,
        uint256 lastTimestamp
    ) {
        uint256[] storage records = deviceRecords[_deviceId];
        
        uint256 count = 0;
        uint256 firstTs = 0;
        uint256 lastTs = 0;
        
        for (uint256 i = 0; i < records.length; i++) {
            SensorData storage record = sensorRecords[records[i]];
            
            // Apply filters
            if (_fromTimestamp > 0 && record.timestamp < _fromTimestamp) continue;
            if (_toTimestamp > 0 && record.timestamp > _toTimestamp) continue;
            if (bytes(_dataType).length > 0 && keccak256(bytes(record.dataType)) != keccak256(bytes(_dataType))) continue;
            
            // Count this record
            count++;
            
            // Track first and last timestamps
            if (firstTs == 0 || record.timestamp < firstTs) {
                firstTs = record.timestamp;
            }
            
            if (record.timestamp > lastTs) {
                lastTs = record.timestamp;
            }
        }
        
        return (count, firstTs, lastTs);
    }
    
    /**
     * @dev Grant a role to an account (admin only)
     */
    function grantDeviceRole(address account) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        grantRole(DEVICE_ROLE, account);
        emit RoleGranted(DEVICE_ROLE, account, msg.sender);
    }
    
    /**
     * @dev Grant analyst role to an account (admin only)
     */
    function grantAnalystRole(address account) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        grantRole(ANALYST_ROLE, account);
        emit RoleGranted(ANALYST_ROLE, account, msg.sender);
    }
    
    /**
     * @dev Revoke a role from an account (admin only)
     */
    function revokeRole(bytes32 role, address account) public override {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        super.revokeRole(role, account);
    }
}