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
    IDonationManager public immutable donationManager;

    constructor(IBeeFundedCore _core) {
        core = _core;
    }

    function donate(
        uint poolId,
        address tokenAddress,
        uint amount,
        string calldata message
    ) external payable override {
        require(core.getPool(poolId).owner != address(0), "Pool does not exist");
        _donate(msg.sender, poolId, tokenAddress, amount, message);
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

    /// @notice External wrapper for _donate to allow try-catch in performUpkeep
    function _donateExternal(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount,
        string memory message
    ) external {
        require(msg.sender == address(this), "Only callable by this contract");
        _donate(donor, poolId, tokenAddress, amount, message);
    }

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

        core.updatePoolBalance(poolId, tokenAddress, amount);
        emit NewDonation(donor, tokenAddress, amount, message);
    }

    function withdraw(uint poolId, address tokenAddress, uint amount) external nonReentrant {
        require(core.getPool(poolId).owner != address(0), "Pool does not exist");
        require(core.getPool(poolId).owner == msg.sender, "Not pool owner");
        require(amount <= core.balances(poolId, tokenAddress), "Insufficient balance");
        uint poolBalance = core.balances(poolId, tokenAddress);
        core.updatePoolBalance(poolId, tokenAddress, poolBalance - amount);

        if (tokenAddress == address(0)) {
            (bool success,) = payable(msg.sender).call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.transfer(msg.sender, amount), "Transfer failed");
        }
    }
}
