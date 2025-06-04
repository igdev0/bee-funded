// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract BeeFunded {
    event NewDonation(address indexed from, address token, uint256 amount, string message);

    struct Donation {
        // The donor address
        address donor;
        // The token address, address(1) will be used for native token.
        address token;
        // Token amount;
        uint256 amount;
        // Message text
        string message;
    }

    struct Pool {
        uint id;
        address owner;
        uint goal;
        Donation[] donations;
    }

    mapping(uint => Pool) public pools;

    using Counters for Counters.Counter;
    Counters.Counter public _poolIDs;

    constructor() {}

    modifier isPoolOwner(uint _poolId) {
        require(pools[_poolId].owner == msg.sender, "Not pool owner");
        _;
    }

    function createPool(uint _goal) external returns (uint) {
        _poolIDs.increment();
        Pool storage newPool = pools[_poolIDs._value];
        newPool.id = _poolIDs._value;
        newPool.owner = msg.sender;
        newPool.goal = _goal;
        return _poolIDs._value;
    }

    function destroyPool(uint poolId) external {
        require(pools[poolId].owner == msg.sender, "Not pool owner");
        delete pools[poolId];
    }

    function donate(
        uint poolId,
        address tokenAddress,
        uint256 amount,
        string calldata message
    ) external payable {
        Pool storage pool = pools[poolId];
        require(pool.owner != address(0), "Pool does not exist");

        if (tokenAddress == address(1)) {
            // Native token (ETH/AVAX/BNB/etc)
            require(msg.value > 0 && msg.value == amount, "Invalid ETH amount");
        } else {
            require(amount > 0, "Amount must be > 0");
            IERC20 token = IERC20(tokenAddress);
            require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        }

        pool.donations.push(Donation({
            donor: msg.sender,
            token: tokenAddress,
            amount: amount,
            message: message
        }));

        emit NewDonation(msg.sender, tokenAddress, amount, message); // same event works
    }

    function withdraw(uint poolId, address tokenAddress, uint256 amount) external isPoolOwner(poolId) {
        Pool storage pool = pools[poolId];

        if (tokenAddress == address(1)) {
            require(address(this).balance >= amount, "Insufficient ETH");
            payable(msg.sender).transfer(amount);
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");
            require(token.transfer(msg.sender, amount), "Transfer failed");
        }
    }

    receive() external payable {}
}