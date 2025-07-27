// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";

/// @title BeeFundedCore - Core state and pool management for BeeFunded
/// @notice Manages pools, balances, and pool creation
contract BeeFundedCore is IBeeFundedCore {
    event DonationPoolCreated(uint indexed id, address indexed creator);
    event PoolMetadataUpdated(uint indexed poolId, uint indexed newMetadataId);

    mapping(uint => Pool) public pools;
    mapping(uint => mapping(address => uint)) public override poolBalances;

    using Counters for Counters.Counter;
    Counters.Counter private poolID;
    modifier isPoolOwner(uint _poolId) {
        require(pools[_poolId].owner != address(0), "Pool does not exist");
        require(pools[_poolId].owner == msg.sender, "Not pool owner");
        _;
    }

    /**
    @dev This function should be used to retrieve a whole pool from pools mapping.
    @param poolId – The Pool.id
    */
    function getPool(uint poolId) external view returns (Pool memory) {
        return pools[poolId];
    }

    /**
    @dev This function can be used to retrieve the owner for a given pool
    @param poolId – The Pool.id incremented above (see poolID)
    */
    function getPoolOwner(uint poolId) external view returns (address) {
        return pools[poolId].owner;
    }

    /**
    @dev This function can be used to create new pools.
    When creating a new pool, the counter is increased by one after creating the pool, therefore
    the id is zero-based.
    @param _maxAmountToken – The token that each of the donations will be compared to, in order to measure how close
    your pool is to reach the maxAmount or the goal. Choosing a stable coin like USDC will enable the donation pool to
    have a wider range of tokens that users can use to donate.
    @param metadataId – This is the keccak256 hash of the ID generated outside the contract.
    */
    function createPool(uint _maxAmountToken, uint metadataId) external returns (uint) {
        uint newPoolId = poolID.current();
        Pool storage newPool = pools[newPoolId];
        newPool.id = newPoolId;
        newPool.metadataId = metadataId;
        newPool.owner = msg.sender;
        newPool.maxAmountToken = _maxAmountToken;
        newPool.chainId = block.chainid;
        poolID.increment();
        emit DonationPoolCreated(newPoolId, msg.sender);
        return newPoolId;
    }

    /**
    @dev This function can only be called externally by the owner, its functionality is to provide a easy way to update the metadataId
    @param poolId – The Pool.id incremented above (see poolID).
    @param newMetadataId – The hash of a given id generated outside the contract.
    */
    function updatePoolMetadataId(uint poolId, uint newMetadataId) external isPoolOwner(poolId) {
        pools[poolId].metadataId = newMetadataId;
        emit PoolMetadataUpdated(poolId, newMetadataId);
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
