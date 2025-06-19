// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {console} from "hardhat/console.sol";

contract BeeFunded is AutomationCompatibleInterface {
    event NewDonation(address indexed from, address token, uint amount, string message);
    event SubscriptionExpired(uint poolId, address subscriber, address beneficiary);
    event SubscriptionPaymentFailed(uint poolId, address subscriber, address beneficiary);

    struct Subscription {
        address subscriber;
        address token;
        uint amount;
        uint nextPaymentTime;
        uint interval;
        uint poolId;
        uint8 remainingDuration;
        bool active;
    }

    struct Donation {
        // The donor address
        address donor;
        // The token address, address(0) will be used for native token.
        address token;
        // Token amount;
        uint amount;
        // Message text
        string message;
    }

    struct Pool {
        uint id;
        address owner;
        uint maxAmount;
        address maxAmountToken;
        string metadataUrl;
        uint chainId;
        Donation[] donations;
    }

    mapping(uint => mapping(address => uint)) public poolBalances;

    mapping(uint => Pool) public pools;
    Subscription[] public subscriptions;

    using Counters for Counters.Counter;
    Counters.Counter public poolID;

    modifier isPoolOwner(uint _poolId) {
        require(pools[_poolId].owner == msg.sender, "Not pool owner");
        _;
    }

    function createPool(uint _maxAmount, string calldata metadata) external returns (uint) {
        poolID.increment();
        Pool storage newPool = pools[poolID._value];
        newPool.id = poolID._value;
        newPool.metadataUrl = metadata;
        newPool.owner = msg.sender;
        newPool.maxAmount = _maxAmount;
        newPool.chainId = block.chainid;
        return poolID._value;
    }


    function donate(
        uint poolId,
        address tokenAddress,
        uint amount,
        string calldata message
    ) public payable {
        _donate(msg.sender, poolId, tokenAddress, amount, message, false);
    }

    function _donate(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount,
        string memory message,
        bool gasless
    ) internal {
        Pool storage pool = pools[poolId];
        require(pool.owner != address(0), "Pool does not exist");

        if (tokenAddress == address(0)) {
            require(msg.value > 0 && msg.value == amount, "Invalid Native Token amount");
        } else {
            require(amount > 0, "Amount must be > 0");
            IERC20 token = IERC20(tokenAddress);
            if(!gasless) {
                token.transfer(address(this), amount);
            } else {
                require(token.transferFrom(donor, address(this), amount), "Transfer failed");
            }
        }

        pool.donations.push(Donation({
            donor: donor,
            token: tokenAddress,
            amount: amount,
            message: message
        }));

        poolBalances[poolId][tokenAddress] += amount;
        emit NewDonation(donor, tokenAddress, amount, message);
    }

    function isSubscribed(address subscriber, address creator) external view returns (bool) {
        for (uint i; i < subscriptions.length; i++) {
            if (subscriptions[i].active && subscriptions[i].subscriber == subscriber && pools[subscriptions[i].poolId].owner == creator) {
                return true;
            }
        }
        return false;
    }

    // This method retrieves the subscriptions, filtered by pool ids
    function getSubsByPoolIds(uint[] calldata _poolIds) public view returns (Subscription[] memory) {
        uint len;
        for (uint i; i < subscriptions.length; i++) {
            for (uint j; j < _poolIds.length; j++) {
                if (subscriptions[i].poolId == _poolIds[j]) {
                    len++;
                }
            }
        }

        Subscription[] memory _subs = new Subscription[](len);
        for (uint i; i < subscriptions.length; i++) {
            for (uint j; j < _poolIds.length; j++) {
                if (subscriptions[i].poolId == _poolIds[j]) {
                    _subs[i] = subscriptions[i];
                }
            }
        }
        return _subs;
    }

    function subscribe(
        uint poolId, // The pool at which the user will be subscribed
        address token, // The token to be donated
        uint amount, // The value of token paid every interval
        uint interval, // This value should be in days
        uint8 duration // The total amount of intervals user will be subscribed

    ) external {
        // The interval should be at least one day
        require(interval >= 7 days, "Min interval is 1 week");
        require(amount > 0, "Zero amount");
        require(pools[poolId].owner != address(0), "Pool does not exist");

        require(IERC20(token).allowance(msg.sender, address(this)) > amount, "Insufficient allowance");
        // Now add the subscription to the subscriptions array
        subscriptions.push(Subscription({
            subscriber: msg.sender,
            token: token,
            amount: amount,
            nextPaymentTime: block.timestamp + interval,
            interval: interval,
            remainingDuration: duration,
            poolId: poolId,
            active: true
        }));

        console.log("Token = ", token, "msg.sender = ", msg.sender);
        // Donate initially the amount specified
        _donate(msg.sender, poolId, token, amount, "Subscription", true);

    }

    function unsubscribe() external {
        for (uint i; i < subscriptions.length; i++) {
            if (subscriptions[i].subscriber == msg.sender) {
                subscriptions[i].active = false;
                break;
            }
        }
    }

    function withdraw(uint poolId, address tokenAddress, uint amount) external isPoolOwner(poolId) {
        require(amount <= poolBalances[poolId][tokenAddress], "Insufficient balance");
        IERC20 token = IERC20(tokenAddress);

        console.log(token.balanceOf(address(this)), " = The balance of contract");

        if (tokenAddress == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            require(token.transfer(msg.sender, amount), "Transfer failed");
        }
        poolBalances[poolId][tokenAddress] -= amount;
    }

    function balanceOf(uint poolId, address tokenAddress) external view returns (uint) {
        return _balanceOf(poolId, tokenAddress);
    }

    function _balanceOf(uint poolId, address tokenAddress) internal view returns (uint) {
        return poolBalances[poolId][tokenAddress];
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

        _donate(sub.subscriber, sub.poolId, sub.token, sub.amount, "Recurring donation", true);

        // Set the active to false if this is the last subscription
        if (sub.remainingDuration == 1) {
            sub.active = false;
            // Subscription expired, emit an event and let the user know, perhaps send an email or notify from the app.
            emit SubscriptionExpired(sub.poolId, sub.subscriber, pools[sub.poolId].owner);
        }

        sub.remainingDuration -= 1;

        sub.nextPaymentTime += sub.interval;
    }

    receive() external payable {}
}