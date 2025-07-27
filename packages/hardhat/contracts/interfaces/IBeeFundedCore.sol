// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

/// @title Interface for BeeFundedCore
/// @notice Defines core state accessors and modifiers
interface IBeeFundedCore {
    struct Pool {
        uint id;
        address owner;
        uint maxAmountToken;
        string metadataUrl;
        uint chainId;
        Donation[] donations;
    }

    struct Donation {
        address donor;
        address token;
        uint amount;
        string message;
    }

    function getPool(uint poolId) external view returns (Pool memory);
    function poolBalances(uint poolId, address tokenAddress) external view returns (uint);
    function incrementPoolID() external;
    function currentPoolID() external view returns (uint);
    function updatePoolBalance(uint poolId, address tokenAddress, uint amount) external;
    function addDonation(uint poolId, address donor, address tokenAddress, uint amount, string memory message) external;
}
