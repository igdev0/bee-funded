// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract BeeFunded is AutomationCompatibleInterface {
    event DonationPoolCreated(uint indexed id, address indexed creator);
    event NewDonation(address indexed from, address indexed token, uint amount, string message);

    event SubscriptionExpired(uint indexed poolId, address indexed subscriber, address indexed beneficiary);
    event SubscriptionPaymentFailed(uint indexed poolId, address indexed subscriber, address indexed beneficiary);
    event SubscriptionCreated(uint indexed poolId, address indexed subscriber, address indexed beneficiary, uint amount, uint interval, uint8 duration);

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
        uint maxAmountToken;
        address maxAmountTokenToken;
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

    function createPool(uint _maxAmountToken, string calldata metadata) external returns (uint) {
        poolID.increment();
        Pool storage newPool = pools[poolID._value];
        newPool.id = poolID._value;
        newPool.metadataUrl = metadata;
        newPool.owner = msg.sender;
        newPool.maxAmountToken = _maxAmountToken;
        newPool.chainId = block.chainid;
        emit DonationPoolCreated(poolID._value, msg.sender);

        return poolID._value;
    }


    function donate(
        uint poolId,
        address tokenAddress,
        uint amount,
        string calldata message
    ) public payable {
        _donate(msg.sender, poolId, tokenAddress, amount, message);
    }

    function donateWithPermit(
        address _donor,
        uint poolId,
        address tokenAddress,
        uint amount,
        string calldata message,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(tokenAddress != address(0), "Cannot use permit with native token"); // Permit is for ERC-20 tokens only
        IERC20Permit(tokenAddress).permit(_donor, address(this), amount, deadline, v, r, s);
        _donate(_donor, poolId, tokenAddress, amount, message);
    }

    function _donate(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount,
        string memory message
    ) internal {
        Pool storage pool = pools[poolId];
        require(pool.owner != address(0), "Pool does not exist");

        if (tokenAddress == address(0)) {
            require(msg.value > 0 && msg.value == amount, "Invalid Native Token amount");
        } else {
            require(amount > 0, "Amount must be > 0");
            IERC20 token = IERC20(tokenAddress);
            require(token.transferFrom(donor, address(this), amount), "Transfer failed");
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
        address subscriber,
        uint poolId, // The pool at which the user will be subscribed
        address token, // The token to be donated
        uint amount, // The value of token paid every interval
        uint interval, // This value should be in days
        uint8 duration, // The total amount of intervals user will be subscribed
        uint8 v,
        bytes32 r,
        bytes32 s

    ) external {
        // The interval should be at least one day
        require(interval >= 7 days, "Min interval is 1 week");
        require(amount > 0, "Zero amount");
        require(pools[poolId].owner != address(0), "Pool does not exist");

        IERC20Permit(token).permit(subscriber, address(this), amount * duration, block.timestamp + (interval * duration), v, r, s);

        // Now add the subscription to the subscriptions array
        subscriptions.push(Subscription({
            subscriber: subscriber,
            token: token,
            amount: amount,
            nextPaymentTime: block.timestamp + interval,
            interval: interval,
            remainingDuration: duration,
            poolId: poolId,
            active: true
        }));

        _donate(subscriber, poolId, token, amount, "Subscription");
        emit SubscriptionCreated(poolId, subscriber, pools[poolId].owner, amount, interval, duration);
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

        _donate(sub.subscriber, sub.poolId, sub.token, sub.amount, "Recurring donation");

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