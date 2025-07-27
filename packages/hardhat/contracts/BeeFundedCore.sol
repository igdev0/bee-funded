// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";

/// @title BeeFundedCore - Core state and pool management for BeeFunded
/// @notice Manages pools, balances, and pool creation
contract BeeFundedCore is IBeeFundedCore {
    event DonationPoolCreated(uint indexed id, address indexed creator);
    event PoolMetadataUpdated(uint indexed poolId, string newMetadataUrl);

    mapping(uint => Pool) public pools;
    mapping(uint => mapping(address => uint)) public override poolBalances;

    using Counters for Counters.Counter;
    Counters.Counter private poolID;
    modifier isPoolOwner(uint _poolId) {
        require(pools[_poolId].owner != address(0), "Pool does not exist");
        require(pools[_poolId].owner == msg.sender, "Not pool owner");
        _;
    }

    function getPool(uint poolId) external view returns (Pool memory) {
        return pools[poolId];
    }

    function createPool(uint _maxAmountToken, string calldata metadata) external returns (uint) {
        uint newPoolId = poolID.current();
        Pool storage newPool = pools[newPoolId];
        newPool.id = newPoolId;
        newPool.metadataUrl = metadata;
        newPool.owner = msg.sender;
        newPool.maxAmountToken = _maxAmountToken;
        newPool.chainId = block.chainid;
        emit DonationPoolCreated(newPoolId, msg.sender);
        poolID.increment();
        return newPoolId;
    }

    function updatePoolMetadata(uint poolId, string calldata newMetadata) external isPoolOwner(poolId) {
        pools[poolId].metadataUrl = newMetadata;
        emit PoolMetadataUpdated(poolId, newMetadata);
    }

    function incrementPoolID() external override {
        poolID.increment();
    }

    function currentPoolID() external view override returns (uint) {
        return poolID.current();
    }

    function updatePoolBalance(uint poolId, address tokenAddress, uint amount) external override {
        require(msg.sender == address(this), "Only callable by this contract");
        poolBalances[poolId][tokenAddress] += amount;
    }

    function addDonation(
        uint poolId,
        address donor,
        address tokenAddress,
        uint amount,
        string memory message
    ) external override {
        require(msg.sender == address(this), "Only callable by this contract");
        pools[poolId].donations.push(Donation({
            donor: donor,
            token: tokenAddress,
            amount: amount,
            message: message
        }));
    }
}
