// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

/// @title Interface for DonationManager
/// @notice Defines donation-related functions
interface IDonationManager {
    function donateNative(uint poolId, string calldata message) external payable;

    function donateWithPermit(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount,
        string calldata message,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function performSubscription(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount) external;
}
