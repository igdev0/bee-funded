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

    function getSubscriptions() external view returns (Subscription[] memory) {
        return subscriptions;
    }

    function getSubscription(uint index) external view returns (Subscription memory) {
        return subscriptions[index];
    }

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
