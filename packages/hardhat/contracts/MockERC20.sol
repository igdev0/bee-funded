// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MockERC20 is ERC20, ERC20Permit {
    constructor(string memory name, string memory symbol)
    ERC20(name, symbol) ERC20Permit(name) {}

    function mint(address account, uint amount) external {
        _mint(account, amount);
    }
}