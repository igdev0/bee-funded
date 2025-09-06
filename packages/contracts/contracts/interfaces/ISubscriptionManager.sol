// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

/// @title Interface for SubscriptionManager
/// @notice Defines subscription-related functions
interface ISubscriptionManager {
    struct Subscription {
        address subscriber;
        address token;
        uint amount;
        uint nextPaymentTime;
        uint interval;
        uint poolId;
        uint8 remainingPayments;
        bool active;
        uint expiredAt;
    }

    function getSubscriptions() external view returns (Subscription[] memory);
    function getSubscription(uint index) external view returns (Subscription memory);
    /**
     * @param subscriber The address of the user initiating the subscription.
     * @param poolId The ID of the pool to subscribe to.
     * @param token The address of the ERC20 token to be donated.
     * @param amount The amount to donate per interval.
     * @param interval The time (in seconds) between each donation.
     * @param totalPayments The number of recurring donations to make.
     * @param deadline The expiry timestamp for the permit signature.
     * @param v The recovery byte of the permit signature.
     * @param r Half of the permit signature.
     * @param s Half of the permit signature.
    */
    function subscribe(
        address subscriber,
        uint poolId,
        address token,
        uint amount,
        uint interval,
        uint8 totalPayments,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    function unsubscribe(uint _subId) external;
    function updateSubscription(
        uint index,
        bool active,
        bool expired,
        uint8 remainingPayments,
        uint nextPaymentTime
    ) external;
}
