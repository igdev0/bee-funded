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
        uint8 remainingDuration;
        bool active;
    }

    function getSubscriptions() external view returns (Subscription[] memory);
    function getSubscription(uint index) external view returns (Subscription memory);
    function isSubscribedMap(address subscriber, address creator) external view returns (bool);
    function subscribe(
        address subscriber,
        uint poolId,
        address token,
        uint amount,
        uint interval,
        uint8 duration,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    function unsubscribe() external;
    function getSubsByPoolIds(uint[] calldata poolIds) external view returns (Subscription[] memory);
    function updateSubscription(
        uint index,
        bool active,
        uint8 remainingDuration,
        uint nextPaymentTime
    ) external;
    function setSubscribedMap(address subscriber, address creator, bool subscribed) external;
}
