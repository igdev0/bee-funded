// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;


/// @title Interface for DonationManager
/// @notice Defines donation-related functions
interface IDonationManager {
    enum DonationType {
        OneTimeDonation,
        Subscription
    }

    struct Donation {
        uint poolId;
        address donor;
        address token;
        uint amount;
        uint timestamp;
        DonationType kind;
    }

    /**
    @dev Gets Donations by pool id
    @param _poolId The ID of the pool
    */
    function getDonations(uint _poolId) external view returns(Donation[] memory);

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

    function donateNative(uint poolId, string calldata message) external payable;

    function performSubscription(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount) external;
}
