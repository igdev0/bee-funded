// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {ISubscriptionManager} from "./interfaces/ISubscriptionManager.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/// @title SubscriptionManager - Handles subscriptions for BeeFunded
/// @notice Manages subscription creation, cancellation, and queries
contract SubscriptionManager is ISubscriptionManager {
    event SubscriptionCreated(uint indexed subscriptionId, uint indexed poolId, address indexed subscriber, address beneficiary, uint amount, uint interval, uint8 duration);
    event Unsubscribed(uint indexed subscriptionId, uint indexed poolId);

    using Counters for Counters.Counter;
    Counters.Counter private subscriptionID;

    mapping(uint => Subscription) public subscriptions;
    IBeeFundedCore public immutable core;
    IDonationManager public immutable donationManager;
    address private automationUpKeepAddress;

/// poolId -> userAddress -> bool
    mapping(uint => mapping(address => bool)) public isSubscribedMap;

    constructor(IBeeFundedCore _core, IDonationManager _donationManager, address _automationUpKeepAddress) {
        core = _core;
        donationManager = _donationManager;
        automationUpKeepAddress = _automationUpKeepAddress;
    }

    /**
     * @dev Returns the list of all active subscriptions stored in the contract.
     *
     * @return An array of `Subscription` structs representing current subscriptions.
     */
    function getSubscriptions() external view returns (Subscription[] memory) {
        uint count = subscriptionID.current();
        Subscription[] memory subs = new Subscription[](count);
        for (uint i; i <= count; i++) {
            subs[i] = subscriptions[i];
        }
        return subs;
    }

    /**
     * @dev Returns a subscription by index stored in the contract.
     *
     * @param index – The index of the subscription in array storage.
     * @return An array of `Subscription` structs representing current subscriptions.
     */
    function getSubscription(uint index) external view returns (Subscription memory) {
        return subscriptions[index];
    }
    /**
     * @dev Creates a new recurring subscription to a donation pool using EIP-2612 permit for gasless approval.
     * The subscriber allows this contract to make periodic donations on their behalf for a specified duration.
     *
     * Requirements:
     * - The specified pool must exist.
     * - Native token (ETH) subscriptions are not supported — only ERC20 tokens.
     * - `interval` must be at least 7 days.
     * - `amount` and `duration` must be greater than 0.
     * - The subscriber must not already have an active subscription to the same pool owner.
     * - A valid permit signature must be provided for approval.
     *
     * Effects:
     * - Uses the permit signature to approve this contract for `amount * duration` tokens.
     * - Immediately performs the first donation.
     * - Stores the subscription metadata and marks the user as subscribed.
     *
     * Emits a {SubscriptionCreated} event.
     *
     * @param subscriber The address of the user initiating the subscription.
     * @param poolId The ID of the pool to subscribe to.
     * @param token The address of the ERC20 token to be donated.
     * @param amount The amount to donate per interval.
     * @param interval The time (in seconds) between each donation.
     * @param duration The number of recurring donations to make.
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
        uint8 duration,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        require(core.getPool(poolId).owner != address(0), "Pool does not exist");
        require(token != address(0), "Native token subscriptions not supported");
        require(interval >= 1 days, "Min interval is 1 day");
        require(amount > 0, "Zero amount");
        require(duration > 0, "Duration must be greater than 0");
        uint id = subscriptionID.current();
        require(!isSubscribedMap[poolId][subscriber], "Already subscribed");

        IERC20Permit(token).permit(subscriber, address(donationManager), amount * duration, deadline, v, r, s);
        donationManager.performSubscription(subscriber, poolId, token, amount);
        subscriptions[id] = Subscription({
            subscriber: subscriber,
            token: token,
            amount: amount,
            nextPaymentTime: block.timestamp + interval,
            interval: interval,
            remainingDuration: duration - 1,
            poolId: poolId,
            active: true,
            expiredAt: 0
        });

        isSubscribedMap[poolId][subscriber] = true;
        emit SubscriptionCreated(id, poolId, subscriber, subscriber, amount, interval, duration);
        subscriptionID.increment();
    }

    /**
     * @dev Allows the caller to unsubscribe themselves from a specific pool.
     * Internally calls `_unsubscribe` to deactivate the subscription.
     *
     * Requirements:
     * - Caller must have an active subscription to the specified pool.
     *
     * Effects:
     * - Deactivates the matching subscription and resets its metadata.
     *
     * Reverts:
     * - If the caller is not actively subscribed to the given pool.
     *
     * @param _subId The ID of the subscription to unsubscribe from.
     */
    function unsubscribe(uint _subId) external override {
        _unsubscribe(_subId, msg.sender);
        emit Unsubscribed(_subId, subscriptions[_subId].poolId);
    }

    /**
     * @dev Internally cancels an active subscription for a given subscriber and pool.
     * Marks the subscription as inactive and resets its schedule metadata.
     *
     * Requirements:
     * - The subscriber must have an active subscription to the specified pool.
     *
     * Effects:
     *   - Sets `active` to false.
     *   - Sets `nextPaymentTime` to 0.
     *   - Sets `remainingDuration` to 0.
     *
     * Reverts:
     * - If no matching active subscription is found.
     *
     * @param _subId The ID of the subscription to unsubscribe from.
     * @param _subscriber The address of the user being unsubscribed.
     */
    function _unsubscribe(uint _subId, address _subscriber) internal {
        Subscription storage sub = subscriptions[_subId];
        require(sub.active, "You are not subscribed to this pool");
        if (sub.subscriber == _subscriber) {
            sub.active = false;
            sub.nextPaymentTime = 0;
            sub.remainingDuration = 0;
            isSubscribedMap[sub.poolId][sub.subscriber] = false;
        }

    }

    /**
     * @dev Internally updates the state of a subscription at a given index.
     * Used by the contract itself to manage subscription lifecycle (e.g., after a recurring donation).
     *
     * Requirements:
     * - Can only be called internally by this contract (i.e., `msg.sender` must be `automationUpKeepAddress`).
     *
     * Effects:
     * - Updates the `active` status, `remainingDuration`, and `nextPaymentTime` of the subscription
     *   at the specified index in the `subscriptions` array.
     *
     * @param _subId The id of the subscription to update in the `subscriptions` array.
     * @param _active Whether the subscription is still active.
     * @param _expired Whether the subscription expired.
     * @param _remainingDuration The number of payments remaining in the subscription.
     * @param _nextPaymentTime The UNIX timestamp for the next scheduled payment.
     */
    function updateSubscription(
        uint _subId,
        bool _active,
        bool _expired,
        uint8 _remainingDuration,
        uint _nextPaymentTime
    ) external override {
        require(msg.sender == automationUpKeepAddress);
        Subscription storage sub = subscriptions[_subId];
        sub.active = _active;
        sub.remainingDuration = _remainingDuration;
        sub.nextPaymentTime = _nextPaymentTime;
        if(_expired) {
            sub.expiredAt = block.timestamp;
        }
        isSubscribedMap[sub.poolId][sub.subscriber] = _active;
    }

}
