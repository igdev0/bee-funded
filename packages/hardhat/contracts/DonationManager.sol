// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DonationManager - Handles donations for BeeFunded
/// @notice Manages donation logic, including token transfers and permit
contract DonationManager is IDonationManager, ReentrancyGuard {
    event NewDonation(address indexed from, address indexed token, uint amount, string message);

    IBeeFundedCore public immutable core;
    address private automationUpKeepAddress;
    address private subscriptionManagerAddress;
    constructor(IBeeFundedCore _core, address _automationUpKeepAddress, address _subscriptionManagerAddress) {
        core = _core;
        automationUpKeepAddress = _automationUpKeepAddress;
        subscriptionManagerAddress = _subscriptionManagerAddress;
    }
    /**
    @dev The Donate native function should be used to donate native tokens.
    @param poolId – The id of the pool the funds go to.
    @param message – The message
    */
    function donateNative(
        uint poolId,
        string calldata message
    ) external payable override {
        require(core.getPool(poolId).owner != address(0), "Pool does not exist");
        _donate(msg.sender, poolId, address(0), msg.value, message);
    }

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
    ) external override {
        require(tokenAddress != address(0), "Cannot use permit with native token");
        require(core.getPool(poolId).owner != address(0), "Pool does not exist");
        IERC20Permit(tokenAddress).permit(donor, address(this), amount, deadline, v, r, s);
        _donate(donor, poolId, tokenAddress, amount, message);
    }

    /**
     * @dev Executes a scheduled subscription donation on behalf of a donor.
     * Can only be called by the AutomationUpKeep or SubscriptionManager contract.
     *
     * Requirements:
     * - Caller must be the authorized AutomationUpKeep contract.
     *
     * Effects:
     * - Internally calls the `_donate` function with the provided parameters and an empty message.
     *
     * @param donor The address of the user whose subscription is being executed.
     * @param poolId The ID of the pool receiving the donation.
     * @param tokenAddress The address of the token to be donated.
     * @param amount The amount of tokens or native currency to donate.
     */
    function performSubscription(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount
    ) external {
        require(msg.sender == automationUpKeepAddress || msg.sender == subscriptionManagerAddress, "Only callable by AutomationUpKeep or SubscriptionManager");
        _donate(donor, poolId, tokenAddress, amount, "");
    }
    /**
     * @dev Handles the internal logic for donating to a pool.
     * Performs validation, transfers tokens, and updates balances.
     *
     * Requirements:
     * - `amount` must be greater than 0.
     * - The new total for the pool/token must not exceed the pool's max allowed amount.
     * - If donating native tokens (tokenAddress == address(0)), msg.value must match the amount.
     * - If donating ERC20 tokens, the donor must have approved this contract to transfer the amount.
     *
     * Emits a {NewDonation} event after a successful donation.
     *
     * @param donor – The address of the user making the donation.
     * @param poolId – The ID of the pool receiving the donation.
     * @param tokenAddress – The address of the token being donated (0x0 for native token).
     * @param amount – The amount of tokens to donate.
     * @param message – Optional message attached to the donation.
     */
    function _donate(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount,
        string memory message
    ) internal {
        require(amount > 0, "Amount must be > 0");
        require(
            core.balances(poolId, tokenAddress) + amount <= core.getPool(poolId).maxAmountToken,
            "Exceeds max pool amount"
        );

        if (tokenAddress == address(0)) {
            require(msg.value == amount, "Invalid native token amount");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.transferFrom(donor, address(this), amount), "Transfer failed");
        }

        core.increaseTokenBalance(poolId, tokenAddress, amount);
        emit NewDonation(donor, tokenAddress, amount, message);
    }

    /**
     * @dev Allows the pool owner to withdraw a specified amount of tokens or native currency from the pool.
     *
     * Requirements:
     * - The pool must exist.
     * - The caller must be the owner of the pool.
     * - The pool must have sufficient balance of the specified token.
     *
     * Effects:
     * - Decreases the token balance of the pool by the specified amount.
     * - Transfers the requested amount to the pool owner (msg.sender), either in native currency or ERC20 tokens.
     *
     * Reverts:
     * - If the pool does not exist.
     * - If the caller is not the pool owner.
     * - If the withdrawal amount exceeds the pool’s token balance.
     * - If the transfer fails (for either native or ERC20 token).
     *
     * @param poolId The ID of the pool from which to withdraw.
     * @param tokenAddress The address of the token to withdraw (0x0 for native token).
     * @param amount The amount of tokens or native currency to withdraw.
     */
    function withdraw(uint poolId, address tokenAddress, uint amount) external nonReentrant {
        require(core.getPool(poolId).owner != address(0), "Pool does not exist");
        require(core.getPool(poolId).owner == msg.sender, "Not pool owner");
        require(amount <= core.balances(poolId, tokenAddress), "Insufficient balance");
        core.decreaseTokenBalance(poolId, tokenAddress, amount);

        if (tokenAddress == address(0)) {
            (bool success,) = payable(msg.sender).call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.transfer(msg.sender, amount), "Transfer failed");
        }
    }
}
