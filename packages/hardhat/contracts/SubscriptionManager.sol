// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {ISubscriptionManager} from "./interfaces/ISubscriptionManager.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/// @title SubscriptionManager - Handles subscriptions for BeeFunded
/// @notice Manages subscription creation, cancellation, and queries
contract SubscriptionManager is ISubscriptionManager {
    event SubscriptionCreated(uint indexed poolId, address indexed subscriber, address indexed beneficiary, uint amount, uint interval, uint8 duration);

    Subscription[] public subscriptions;
    IBeeFundedCore public immutable core;
    IDonationManager public immutable donationManager;

    mapping(address => mapping(address => bool)) public override isSubscribedMap;

    constructor(IBeeFundedCore _core, IDonationManager _donationManager) {
        core = _core;
        donationManager = _donationManager;
    }

    /**
     * @dev Returns the list of all active subscriptions stored in the contract.
     *
     * @return An array of `Subscription` structs representing current subscriptions.
     */
    function getSubscriptions() external view returns (Subscription[] memory) {
        return subscriptions;
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
        require(interval >= 7 days, "Min interval is 7 days");
        require(amount > 0, "Zero amount");
        require(duration > 0, "Duration must be greater than 0");
        require(!isSubscribedMap[subscriber][core.getPool(poolId).owner], "Already subscribed");

        IERC20Permit(token).permit(subscriber, address(this), amount * duration, deadline, v, r, s);
        donationManager.performSubscription(subscriber, poolId, token, amount);

        subscriptions.push(Subscription({
            subscriber: subscriber,
            token: token,
            amount: amount,
            nextPaymentTime: block.timestamp + interval,
            interval: interval,
            remainingDuration: duration - 1,
            poolId: poolId,
            active: true
        }));

        isSubscribedMap[subscriber][core.getPool(poolId).owner] = true;
        emit SubscriptionCreated(poolId, subscriber, core.getPool(poolId).owner, amount, interval, duration);
    }
    
    /**
     * @dev Cancels all active subscriptions for the caller.
     * Marks any matching subscriptions as inactive and updates the subscription mapping.
     *
     * Requirements:
     * - Caller must have at least one active subscription.
     *
     * Effects:
     * - Loops through the `subscriptions` array.
     * - For each active subscription belonging to the caller, sets `active` to false.
     * - Updates `isSubscribedMap` to allow re-subscribing to the same pool owner.
     *
     * Reverts:
     * - If the caller has no active subscriptions.
     *
     * Note:
     * - This function does not delete subscription records, it only marks them as inactive.
     * - Multiple active subscriptions (if allowed in the future) will all be canceled.
     */
    function unsubscribe() external override {
        bool found;
        for (uint i; i < subscriptions.length; i++) {
            if (subscriptions[i].subscriber == msg.sender && subscriptions[i].active) {
                subscriptions[i].active = false;
                isSubscribedMap[msg.sender][core.getPool(subscriptions[i].poolId).owner] = false;
                found = true;
            }
        }
        require(found, "No active subscriptions found");
    }

    function getSubsByPoolIds(uint[] calldata _poolIds) external view override returns (Subscription[] memory) {
        uint len;
        for (uint i; i < subscriptions.length; i++) {
            for (uint j; j < _poolIds.length; j++) {
                if (subscriptions[i].poolId == _poolIds[j]) {
                    len++;
                }
            }
        }

        Subscription[] memory _subs = new Subscription[](len);
        uint index;
        for (uint i; i < subscriptions.length; i++) {
            for (uint j; j < _poolIds.length; j++) {
                if (subscriptions[i].poolId == _poolIds[j]) {
                    _subs[index] = subscriptions[i];
                    index++;
                }
            }
        }
        return _subs;
    }

    function updateSubscription(
        uint index,
        bool active,
        uint8 remainingDuration,
        uint nextPaymentTime
    ) external override {
        require(msg.sender == address(this), "Only callable by this contract");
        subscriptions[index].active = active;
        subscriptions[index].remainingDuration = remainingDuration;
        subscriptions[index].nextPaymentTime = nextPaymentTime;
    }

    function setSubscribedMap(address subscriber, address creator, bool subscribed) external override {
        require(msg.sender == address(this), "Only callable by this contract");
        isSubscribedMap[subscriber][creator] = subscribed;
    }
}
