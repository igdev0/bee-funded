// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;


interface ITreasureManager {
    event TreasureCreated(uint id, uint _poolId);
    function getTreasures(uint _poolId) external {}
}
