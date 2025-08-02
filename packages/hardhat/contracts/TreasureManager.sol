// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {ITreasureManager} from "./interfaces/ITreasureManager.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";


contract TreasureManager is ITreasureManager {
    IDonationManager private immutable donationManager;
    IBeeFundedCore private immutable beeFundedCore;

    using Counters for Counters.Counter;
    Counters.Counter private treasureId;

    mapping(uint => mapping(uint => Treasure)) private treasuresByPoolId;
    mapping(uint => uint) private treasureCountByPoolId;

    constructor(IBeeFundedCore _beeFundedCore, IDonationManager _donationManager) {
        donationManager = _donationManager;
        beeFundedCore = _beeFundedCore;
    }

    modifier isPoolOwner(uint _poolId) {
        require(beeFundedCore.getPool(_poolId).owner == msg.sender);
        _;
    }

    modifier isDonationManager {
        require(msg.sender == address(donationManager));
        _;
    }

    function getRandomNumber() external view returns (uint) {
        uint random = uint(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            blockhash(block.number - 1)
        )));
        return random;
    }

    /**
    @notice Adds a new treasure to the specified donation pool.
    @dev Only the owner of the pool can call this function.
    @param _poolId The ID of the donation pool to add the treasure to.
    @param treasure The Treasure struct containing metadata about the treasure.
    @custom:access Only callable by the pool owner.
    */
    function createTreasure(uint _poolId, Treasure calldata treasure) external payable isPoolOwner(_poolId) {
        uint id = treasureId.current();
        treasuresByPoolId[_poolId][id] = treasure;
        treasureId.increment();
        treasureCountByPoolId[_poolId] = treasureId.current();
    }

    function getTreasureCount(uint _poolId) external returns (uint) {
        return treasureCountByPoolId[_poolId];
    }
    /**
    @dev It retrieves the unlocked treasures based on the poolId and _donationNth provided
    @param _poolId – The poolId of the treasures
    @return Treasure[] – The filtered treasure
    */
    function getUnlockedTreasures(uint _poolId, uint _donationNth) external view isDonationManager returns (Treasure[] memory) {
        uint count;
        for (uint i; i < treasureCountByPoolId[_poolId]; i++) {
            Treasure memory treasure = treasuresByPoolId[_poolId][i];
            if (block.timestamp > treasure.minBlockTime) {
                if(treasure.unlockOnNth > 0 && treasure.unlockOnNth % _donationNth != 0) {
                    continue;
                }
                count++;
            }
        }
        Treasure[] memory treasures = new Treasure[](count);
        uint j;
        for (uint i; i < treasureCountByPoolId[_poolId]; i++) {
            Treasure memory treasure = treasuresByPoolId[_poolId][i];
            if (block.timestamp > treasure.minBlockTime) {
                if(treasure.unlockOnNth > 0 && treasure.unlockOnNth % _donationNth != 0) {
                    continue;
                }
                treasures[j] = treasure;
                j++;
            }
        }

        return treasures;
    }

}
