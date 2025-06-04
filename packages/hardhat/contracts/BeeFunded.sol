// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract BeeFunded is AutomationCompatibleInterface {
    event NewDonation(address indexed from, address token, uint256 amount, string message);

    struct Subscription {
        address subscriber;
        address token;
        uint256 amount;
        uint256 nextPaymentTime;
        uint256 interval;
        uint256 poolId;
        bool active;
    }

    struct Donation {
        // The donor address
        address donor;
        // The token address, address(0) will be used for native token.
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
        uint256 chainId;
        Donation[] donations;
    }

    mapping(uint => mapping(address => uint256)) public poolBalances;

    mapping(uint => Pool) public pools;
    Subscription[] public subscriptions;

    using Counters for Counters.Counter;
    Counters.Counter public _poolIDs;

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
        newPool.chainId = block.chainid;
        return _poolIDs._value;
    }

    function destroyPool(uint poolId) external isPoolOwner(poolId) {
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

        if (tokenAddress == address(0)) {
            // Native token (ETH/AVAX/BNB/etc)
            require(msg.value > 0 && msg.value == amount, "Invalid Native Token amount");
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

        poolBalances[poolId][tokenAddress] += amount;
        emit NewDonation(msg.sender, tokenAddress, amount, message); // same event works
    }

    function subscribe(
        uint256 poolId,
        address token,
        uint256 amount,
        uint256 interval
    ) external {
        require(interval >= 1 weeks, "Min interval is 1 week");
        require(amount > 0, "Zero amount");
        require(pools[poolId].owner != address(0), "Pool does not exist");

        // Just a record — payment is processed later
        subscriptions.push(Subscription({
            subscriber: msg.sender,
            token: token,
            amount: amount,
            nextPaymentTime: block.timestamp + interval,
            interval: interval,
            poolId: poolId,
            active: true
        }));
    }

    function checkUpkeep(bytes calldata) external view returns (bool, bytes memory) {
        for (uint i = 0; i < subscriptions.length; i++) {
            if (subscriptions[i].active && block.timestamp >= subscriptions[i].nextPaymentTime) {
                return (true, abi.encode(i));
            }
        }
        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external override {
        uint index = abi.decode(performData, (uint));
        Subscription storage sub = subscriptions[index];
        require(sub.active, "Subscription is not active");
        require(block.timestamp >= sub.nextPaymentTime, "Not due yet");

        IERC20 token = IERC20(sub.token);
        require(token.transferFrom(sub.subscriber, address(this), sub.amount), "Insufficient funds");

        pools[sub.poolId].donations.push(Donation({
            donor: sub.subscriber,
            token: sub.token,
            amount: sub.amount,
            message: "Recurring donation"
        }));

        poolBalances[sub.poolId][sub.token] += sub.amount;
        sub.nextPaymentTime += sub.interval;
    }

    function withdraw(uint poolId, address tokenAddress, uint256 amount) external isPoolOwner(poolId) {
        require(amount <= poolBalances[poolId][tokenAddress], "Insufficient balance");
        poolBalances[poolId][tokenAddress] -= amount;

        if (tokenAddress == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.transfer(msg.sender, amount), "Transfer failed");
        }
    }

    receive() external payable {}
}