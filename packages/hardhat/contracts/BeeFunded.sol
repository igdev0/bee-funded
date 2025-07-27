// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BeeFunded - A decentralized donation and subscription platform
/// @notice Allows users to create donation pools, donate tokens, and subscribe to recurring donations with Chainlink Automation
contract BeeFunded is AutomationCompatibleInterface, ReentrancyGuard {
    /// @notice Emitted when a new donation pool is created
    event DonationPoolCreated(uint indexed id, address indexed creator);
    /// @notice Emitted when a donation is made
    event NewDonation(address indexed from, address indexed token, uint amount, string message);
    /// @notice Emitted when a subscription expires
    event SubscriptionExpired(uint indexed poolId, address indexed subscriber, address indexed beneficiary);
    /// @notice Emitted when a subscription payment fails
    event SubscriptionPaymentFailed(uint indexed poolId, address indexed subscriber, address indexed beneficiary);
    /// @notice Emitted when a subscription is created
    event SubscriptionCreated(uint indexed poolId, address indexed subscriber, address indexed beneficiary, uint amount, uint interval, uint8 duration);
    /// @notice Emitted when pool metadata is updated
    event PoolMetadataUpdated(uint indexed poolId, string newMetadataUrl);

    /// @notice Subscription details for recurring donations
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

    /// @notice Donation details
    struct Donation {
        address donor;
        address token; // address(0) for native token
        uint amount;
        string message;
    }

    /// @notice Donation pool details
    struct Pool {
        uint id;
        address owner;
        uint maxAmountToken; // Maximum donation amount allowed per token
        string metadataUrl;
        uint chainId;
        Donation[] donations;
    }

    /// @notice Tracks pool balances by pool ID and token address
    mapping(uint => mapping(address => uint)) public poolBalances;
    /// @notice Tracks pools by ID
    mapping(uint => Pool) public pools;
    /// @notice Tracks subscriptions
    Subscription[] public subscriptions;
    /// @notice Tracks if a subscriber is subscribed to a creator's pool
    mapping(address => mapping(address => bool)) public isSubscribedMap;

    using Counters for Counters.Counter;
    Counters.Counter private poolID;

    /// @notice Ensures the caller is the pool owner
    modifier isPoolOwner(uint _poolId) {
        require(pools[_poolId].owner != address(0), "Pool does not exist");
        require(pools[_poolId].owner == msg.sender, "Not pool owner");
        _;
    }

    /**
     @notice Creates a new donation pool
     @param _maxAmountToken Maximum donation amount allowed
     @param metadata URL for pool metadata
     @return The ID of the created pool
    */
    function createPool(uint _maxAmountToken, string calldata metadata) external returns (uint) {
        poolID.increment();
        uint newPoolId = poolID.current(); // Use current() instead of _value for clarity
        Pool storage newPool = pools[newPoolId];
        newPool.id = newPoolId;
        newPool.metadataUrl = metadata;
        newPool.owner = msg.sender;
        newPool.maxAmountToken = _maxAmountToken;
        newPool.chainId = block.chainid;
        emit DonationPoolCreated(newPoolId, msg.sender);
        return newPoolId;
    }

    /**
     @notice Updates the metadata URL of a pool
     @param poolId The ID of the pool
     @param newMetadata The new metadata URL
    */
    function updatePoolMetadata(uint poolId, string calldata newMetadata) external isPoolOwner(poolId) {
        pools[poolId].metadataUrl = newMetadata;
        emit PoolMetadataUpdated(poolId, newMetadata);
    }
    /**
     @notice Allows a user to donate to a pool
     @param poolId The ID of the pool
     @param tokenAddress The token address (address(0) for native token)
     @param amount The donation amount
     @param message An optional message
    */
    function donate(
        uint poolId,
        address tokenAddress,
        uint amount,
        string calldata message
    ) external payable {
        require(pools[poolId].owner != address(0), "Pool does not exist");
        _donate(msg.sender, poolId, tokenAddress, amount, message);
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

    /**
     @notice Allows donation using ERC-20 permit
     @param _donor The donor's address
     @param poolId The ID of the pool
     @param tokenAddress The ERC-20 token address
     @param amount The donation amount
     @param message An optional message
     @param deadline The permit deadline
     @param v ECDSA signature parameter
     @param r ECDSA signature parameter
     @param s ECDSA signature parameter
    */
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
        require(tokenAddress != address(0), "Cannot use permit with native token");
        require(pools[poolId].owner != address(0), "Pool does not exist");
        IERC20Permit(tokenAddress).permit(_donor, address(this), amount, deadline, v, r, s);
        _donate(_donor, poolId, tokenAddress, amount, message);
    }

    /// @notice Internal function to handle donations
    function _donate(
        address donor,
        uint poolId,
        address tokenAddress,
        uint amount,
        string memory message
    ) internal {
        require(amount > 0, "Amount must be > 0");
        require(poolBalances[poolId][tokenAddress] + amount <= pools[poolId].maxAmountToken, "Exceeds max pool amount");

        if (tokenAddress == address(0)) {
            require(msg.value == amount, "Invalid native token amount");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.transferFrom(donor, address(this), amount), "Transfer failed");
        }

        pools[poolId].donations.push(Donation({
            donor: donor,
            token: tokenAddress,
            amount: amount,
            message: message
        }));

        poolBalances[poolId][tokenAddress] += amount;
        emit NewDonation(donor, tokenAddress, amount, message);
    }
    /**
     @notice Checks if a subscriber is subscribed to a creator's pool
     @param subscriber The subscriber's address
     @param creator The pool creator's address
     @return True if subscribed, false otherwise
    */
    function isSubscribed(address subscriber, address creator) external view returns (bool) {
        return isSubscribedMap[subscriber][creator];
    }

    /**
     @notice Retrieves subscriptions filtered by pool IDs
     @param _poolIds Array of pool IDs to filter subscriptions
     @return Array of matching subscriptions
    */
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
    /**
      @notice Subscribes a user to a pool with recurring donations
      @param subscriber The subscriber's address
      @param poolId The ID of the pool
      @param token The ERC-20 token address
      @param amount The donation amount per interval
      @param interval The interval in seconds (minimum 7 days)
      @param duration The number of intervals
      @param deadline The permit deadline
      @param v ECDSA signature parameter
      @param r ECDSA signature parameter
      @param s ECDSA signature parameter
    */
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
    ) external {
        require(pools[poolId].owner != address(0), "Pool does not exist");
        require(token != address(0), "Native token subscriptions not supported");
        require(interval >= 7 days, "Min interval is 7 days");
        require(amount > 0, "Zero amount");
        require(duration > 0, "Duration must be greater than 0");
        require(!isSubscribedMap[subscriber][pools[poolId].owner], "Already subscribed");

        IERC20Permit(token).permit(subscriber, address(this), amount * duration, deadline, v, r, s);
        _donate(subscriber, poolId, token, amount, "Subscription");

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

        isSubscribedMap[subscriber][pools[poolId].owner] = true;
        emit SubscriptionCreated(poolId, subscriber, pools[poolId].owner, amount, interval, duration);
    }

    /// @notice Unsubscribes the caller from all their subscriptions
    function unsubscribe() external {
        bool found;
        for (uint i; i < subscriptions.length; i++) {
            if (subscriptions[i].subscriber == msg.sender && subscriptions[i].active) {
                subscriptions[i].active = false;
                isSubscribedMap[msg.sender][pools[subscriptions[i].poolId].owner] = false;
                found = true;
            }
        }
        require(found, "No active subscriptions found");
    }
    /**
     @notice Withdraws funds from a pool
     @param poolId The ID of the pool
     @param tokenAddress The token address
     @param amount The amount to withdraw
    */
    function withdraw(uint poolId, address tokenAddress, uint amount) external isPoolOwner(poolId) nonReentrant {
        require(amount <= poolBalances[poolId][tokenAddress], "Insufficient balance");
        poolBalances[poolId][tokenAddress] -= amount; // Update state first

        if (tokenAddress == address(0)) {
            (bool success,) = payable(msg.sender).call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.transfer(msg.sender, amount), "Transfer failed");
        }
    }
    /**
     @notice Returns the balance of a pool for a specific token
     @param poolId The ID of the pool
     @param tokenAddress The token address
     @return The balance
    */
    function balanceOf(uint poolId, address tokenAddress) external view returns (uint) {
        return poolBalances[poolId][tokenAddress];
    }

    /**
     @notice Checks if upkeep is needed for subscriptions
     @param checkData Unused
     @return upkeepNeeded True if upkeep is needed
     @return performData Encoded subscription index
    */
    function checkUpkeep(bytes calldata checkData) external view override returns (bool upkeepNeeded, bytes memory performData) {
        for (uint i = 0; i < subscriptions.length; i++) {
            if (subscriptions[i].active && block.timestamp >= subscriptions[i].nextPaymentTime) {
                return (true, abi.encode(i));
            }
        }
        return (false, "");
    }
    /**
    @notice Performs upkeep for due subscriptions
    @param performData Encoded subscription index
    */
    function performUpkeep(bytes calldata performData) external override {
        uint index = abi.decode(performData, (uint));
        Subscription storage sub = subscriptions[index];
        require(sub.active, "Subscription is not active");
        require(block.timestamp >= sub.nextPaymentTime, "Not due yet");

        try this._donateExternal(sub.subscriber, sub.poolId, sub.token, sub.amount, "Recurring donation") {
            if (sub.remainingDuration == 1) {
                sub.active = false;
                isSubscribedMap[sub.subscriber][pools[sub.poolId].owner] = false;
                emit SubscriptionExpired(sub.poolId, sub.subscriber, pools[sub.poolId].owner);
            }
            sub.remainingDuration -= 1;
            sub.nextPaymentTime += sub.interval;
        } catch {
            sub.active = false;
            isSubscribedMap[sub.subscriber][pools[sub.poolId].owner] = false;
            emit SubscriptionPaymentFailed(sub.poolId, sub.subscriber, pools[sub.poolId].owner);
        }
    }

    /// @notice Allows the contract to receive native tokens
    receive() external payable {}
}
