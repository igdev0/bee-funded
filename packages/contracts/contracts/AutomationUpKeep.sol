// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IAutomationUpkeep} from "./interfaces/IAutomationUpKeep.sol";
import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {ISubscriptionManager} from "./interfaces/ISubscriptionManager.sol";

/// @title AutomationUpkeep - Handles Chainlink Automation for BeeFunded
/// @notice Manages upkeep for recurring subscription payments
contract AutomationUpkeep is IAutomationUpkeep {
    event SubscriptionPaymentSuccess(uint indexed subscriptionId, address indexed subscriber, uint indexed remainingPayments, uint nextPaymentTime);
    event SubscriptionExpired(uint indexed poolId, address indexed subscriber, address indexed beneficiary);
    event SubscriptionPaymentFailed(uint indexed poolId, address indexed subscriber, address indexed beneficiary);

    ISubscriptionManager public immutable subscriptionManager;
    IBeeFundedCore public immutable core;
    IDonationManager public immutable donationManager;
    address public immutable chainlinkRegistry;

    constructor(ISubscriptionManager _subscriptionManager, IBeeFundedCore _core, IDonationManager _donationManager, address _chainlinkRegistry) {
        subscriptionManager = _subscriptionManager;
        core = _core;
        donationManager = _donationManager;
        chainlinkRegistry = _chainlinkRegistry;
    }

    modifier onlyChainlink {
        require(msg.sender == chainlinkRegistry);
        _;
    }
    /**
     * @dev Called by Chainlink Automation to determine whether upkeep (i.e., subscription processing)
     * is needed. Checks all active subscriptions to see if any are due for their next payment.
     *
     * Logic:
     * - Fetches the list of all subscriptions from the SubscriptionManager.
     * - Iterates through them to find any active subscription whose `nextPaymentTime` has passed.
     * - If one is found, returns `true` along with encoded perform data (subscription index).
     * - Otherwise, returns `false` and empty perform data.
     *
     * @param checkData Unused in this implementation, but kept for compatibility with Chainlink Automation.
     * @return upkeepNeeded True if at least one subscription is due for processing.
     * @return performData Encoded subscription index to be used in `performUpkeep`.
     */
    function checkUpkeep(bytes calldata checkData /* checkData */) external view override onlyChainlink returns (bool upkeepNeeded, bytes memory performData) {
        ISubscriptionManager.Subscription[] memory subscriptions = subscriptionManager.getSubscriptions();
        uint[] memory dueIndexesTemp = new uint[](subscriptions.length);
        uint count = 0;

        for (uint i = 0; i < subscriptions.length; i++) {
            ISubscriptionManager.Subscription memory sub = subscriptionManager.getSubscription(i);
            if (sub.active && block.timestamp >= sub.nextPaymentTime) {
                dueIndexesTemp[count] = i;
                count++;
            }
        }

        if (count > 0) {
            uint[] memory dueIndexes = new uint[](count);
            for (uint j = 0; j < count; j++) {
                dueIndexes[j] = dueIndexesTemp[j];
            }
            return (true, abi.encode(dueIndexes));
        }

        return (false, "");
    }
    /**
     * @dev Called by Chainlink Automation to process a due subscription payment.
     * Executes the payment, updates subscription metadata, and emits appropriate events.
     *
     * Requirements:
     * - The subscription at the provided index must be active.
     * - The current time must be greater than or equal to `nextPaymentTime`.
     *
     * Logic:
     * - Decodes the subscription indexes list from `performData` (passed from `checkUpkeep`).
     * - Attempts to perform the subscription payment via `donationManager.performSubscription`.
     * - If `remainingPayments == 1`, the subscription is marked as expired and deactivated.
     * - Otherwise, the subscription is updated with a decremented `remainingPayments`
     *   and a new `nextPaymentTime` based on its interval.
     * - If the payment fails (e.g., user has insufficient funds or allowance), the subscription
     *   is still updated to move forward (avoiding permanent stalling), and a failure event is emitted.
     *
     * @param performData Encoded subscription indexes, obtained from `checkUpkeep`.
     *
     * Emits:
     * - {SubscriptionExpired} when a subscription completes its final payment.
     * - {SubscriptionPaymentFailed} when a payment attempt fails (e.g., transfer fails).
     *
     * @notice Currently, failed payments are not retried. To avoid skipping a payment entirely,
     * consider adding retry logic (e.g., via queued retry or marking payment as pending).
     */
    function performUpkeep(bytes calldata performData) external override onlyChainlink {
        uint[] memory ids = abi.decode(performData, (uint[]));

        for (uint i = 0; i < ids.length; i++) {
            uint id = ids[i];
            ISubscriptionManager.Subscription memory sub = subscriptionManager.getSubscription(id);
            if (!sub.active || block.timestamp < sub.nextPaymentTime) {
                continue;
            }

            try donationManager.performSubscription(sub.subscriber, sub.poolId, sub.token, sub.amount) {
                uint remainingPayments = sub.remainingPayments - 1;
                uint nextPaymentTime = block.timestamp + sub.interval;
                if (sub.remainingPayments == 1) {
                    subscriptionManager.updateSubscription(id, false, true, 0, 0);
                    emit SubscriptionExpired(sub.poolId, sub.subscriber, core.getPool(sub.poolId).owner);
                } else {
                    subscriptionManager.updateSubscription(id, true, false, remainingPayments, nextPaymentTime);
                }
                emit SubscriptionPaymentSuccess(id, sub.subscriber, remainingPayments, nextPaymentTime);
            } catch {
                subscriptionManager.updateSubscription(id, true, false, sub.remainingPayments - 1, block.timestamp + sub.interval);
                emit SubscriptionPaymentFailed(sub.poolId, sub.subscriber, core.getPool(sub.poolId).owner);
            }
        }
    }
}
