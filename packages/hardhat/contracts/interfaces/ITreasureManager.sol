// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;


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
        address owner;
        address token;
        uint amount;
        bool transferred;
        uint minBlockTime;
        uint unlockOnNth;
        uint minAmount;
        TreasureKind kind;
    }

    function getTreasures(uint _poolId) external {}
}
