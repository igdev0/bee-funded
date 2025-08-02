// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IDonationManager} from "./IDonationManager.sol";

interface ITreasureManager {
    event TreasureCreated(uint id, uint _poolId);
    error CreateTreasureFail();

    enum TreasureKind {
        ERC721,
        ERC1155,
        ERC20,
        Native
    }

    struct Treasure {
        uint id;
        address owner;
        address token;
        uint tokenId;
        uint amount;
        bool transferred;
        uint minBlockTime;
        uint unlockOnNth;
        uint minAmount;
        TreasureKind kind;
    }

    function getRandomNumber() external view returns (uint);

    function getUnlockedTreasures(uint _poolId, uint _donationNth) external view returns (Treasure[] memory);

    function airdropTreasure(address payable _winner, Treasure calldata _treasure) external;
}
