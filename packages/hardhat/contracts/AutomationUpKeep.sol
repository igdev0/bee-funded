// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IAutomationUpkeep} from "./interfaces/IAutomationUpKeep.sol";
import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {ISubscriptionManager} from "./interfaces/ISubscriptionManager.sol";

/// @title AutomationUpkeep - Handles Chainlink Automation for BeeFunded
/// @notice Manages upkeep for recurring subscription payments
contract AutomationUpkeep is IAutomationUpkeep {
    event SubscriptionExpired(uint indexed poolId, address indexed subscriber, address indexed beneficiary);
    event SubscriptionPaymentFailed(uint indexed poolId, address indexed subscriber, address indexed beneficiary);

    ISubscriptionManager public immutable subscriptionManager;
    IBeeFundedCore public immutable core;
    IDonationManager public immutable donationManager;

    constructor(ISubscriptionManager _subscriptionManager, IBeeFundedCore _core, IDonationManager _donationManager) {
        subscriptionManager = _subscriptionManager;
        core = _core;
        donationManager = _donationManager;
    }

    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        ISubscriptionManager.Subscription[] memory subscriptions = subscriptionManager.getSubscriptions();

        for (uint i = 0; i < subscriptions.length; i++) {
            ISubscriptionManager.Subscription memory sub = subscriptionManager.getSubscription(i);
            if (sub.active && block.timestamp >= sub.nextPaymentTime) {
                return (true, abi.encode(i));
            }
        }
        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external override {
        uint index = abi.decode(performData, (uint));
        ISubscriptionManager.Subscription memory sub = subscriptionManager.getSubscription(index);
        require(sub.active, "Subscription is not active");
        require(block.timestamp >= sub.nextPaymentTime, "Not due yet");

        try donationManager.performSubscription(sub.subscriber, sub.poolId, sub.token, sub.amount) {
            if (sub.remainingDuration == 1) {
                subscriptionManager.updateSubscription(index, false, true, 0, 0);
                emit SubscriptionExpired(sub.poolId, sub.subscriber, core.getPool(sub.poolId).owner);
            } else {
                subscriptionManager.updateSubscription(index, true,  false,sub.remainingDuration - 1, block.timestamp + sub.interval);
            }
        } catch {
            /// @todo: implement payments attempts, so that the payment can be reprocessed the next day, therefore the payment won't be skipped as is happening now.
            subscriptionManager.updateSubscription(index, true, false, sub.remainingDuration - 1, block.timestamp + sub.interval);
            emit SubscriptionPaymentFailed(sub.poolId, sub.subscriber, core.getPool(sub.poolId).owner);
        }
    }
}
