// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {ITreasureManager} from "./interfaces/ITreasureManager.sol";


contract TreasureManager is ITreasureManager {
    IDonationManager private immutable donationManager;
    IBeeFundedCore private immutable beeFundedCore;

    error CreateTreasureFail();

    enum TreasureKind {
        ERC721,
        ERC1155,
        ERC20,
        Native
    }

    struct Treasure {
        address owner;
        address token;
        uint amount;
        uint minDonationTime;
        uint lockedUntil;
        bool transferred;
        TreasureKind kind;
    }

    using Counters for Counters.Counter;
    Counters.Counter private treasureId;

    mapping(uint => mapping(uint => Treasure)) private treasuresByPoolId;
    mapping(uint => uint) private treasureCountByPoolId;

    // treasureIdx => donationId => bool
    mapping(uint => mapping(uint => bool)) private donationsEligible;

    constructor(IDonationManager _donationManager, IBeeFundedCore _beeFundedCore) {
        donationManager = _donationManager;
        beeFundedCore = _beeFundedCore;
    }

    modifier isPoolOwner(uint _poolId) {
        require(beeFundedCore.getPool(_poolId).owner == msg.sender);
        _;
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
        treasuresByPoolId[_poolId][id](treasure);
        treasureId.increment();
        treasureCountByPoolId[_poolId] = treasureId.current();
    }

    function getTreasureCount(uint _poolId) external returns(uint) {
        return treasureCountByPoolId[_poolId];
    }
    /**
    @dev It retrieves the unlocked treasures found in the treasures mapping
    @param _poolId – The poolId of the treasures
    @return Treasure[] – The filtered treasure
    */
    function getUnlockedTreasures(uint _poolId) internal returns (Treasure[] memory) {
        uint count;
        for(uint i; i < treasureCountByPoolId[_poolId]; i++) {
            if(block.timestamp > treasuresByPoolId[_poolId][i].lockedUntil) {
             count++;
            }
        }
        Treasure[] treasures = new Treasure[count];
        uint j;
        for(uint i; i < treasureCountByPoolId[_poolId]; i++) {
            if(block.timestamp > treasuresByPoolId[_poolId][i].lockedUntil) {
                treasures[j] = treasuresByPoolId[_poolId][i];
                j++;
            }
        }

        return treasures;
    }


    function updateDonationEligibility(uint _treasureIdx, uint _donationId, bool _eligible) external {
        require(msg.sender, address(donationManager));
        donationsEligible[_treasureIdx][_donationId] = _eligible;
    }

    function shouldAirdrop() external view returns(bool, string memory){
        uint currentPoolId = beeFundedCore.currentPoolID();

        return (false, "");
    }

}
