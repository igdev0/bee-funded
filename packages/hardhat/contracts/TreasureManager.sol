// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {ITreasureManager} from "./interfaces/ITreasureManager.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";


contract TreasureManager is ERC1155Holder, ITreasureManager {
    IDonationManager private immutable donationManager;
    IBeeFundedCore private immutable beeFundedCore;

    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    mapping(uint => mapping(uint => Treasure)) private treasuresByPoolId;

    mapping(uint => Counters.Counter) private treasureIdByPoolId;

    constructor(IBeeFundedCore _beeFundedCore, IDonationManager _donationManager) {
        donationManager = _donationManager;
        beeFundedCore = _beeFundedCore;
    }

    modifier onlyPoolOwner(uint _poolId) {
        require(beeFundedCore.getPool(_poolId).owner == msg.sender);
        _;
    }

    modifier onlyPoolOr1155TokenOwner(uint _poolId, uint _tokenId) {
        IBeeFundedCore.Pool memory pool = beeFundedCore.getPool(_poolId);

        require(pool.owner == msg.sender || IERC1155(msg.sender).balanceOf(address(this), _tokenId) > 0);
        _;
    }

    modifier onlyDonationManager {
        require(msg.sender == address(donationManager));
        _;
    }

    /**
     * @notice Generates a pseudo-random number using block properties.
     * @dev This method is not secure for randomness in production environments
     *      where manipulation by miners is a concern. Suitable for testing or non-critical logic.
     * @return A uint representing the pseudo-random number.
     */
    function getRandomNumber() external view returns (uint) {
        uint random = uint(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            blockhash(block.number - 1)
        )));
        return random;
    }

    function _createTreasure(TreasureParams memory _treasure) internal onlyPoolOr1155TokenOwner(_treasure.poolId, _treasure.tokenId) returns (uint) {
        require(uint8(_treasure.kind) <= uint8(TreasureKind.ERC20), "Invalid treasure kind");

        if (_treasure.token == address(0) && _treasure.kind == TreasureKind.Native) {
            require(_treasure.amount > 0, "Native treasure must have amount");
        }

        if (_treasure.kind == TreasureKind.ERC20) {
            require(_treasure.amount > 0, "ERC20 treasure must have amount");
            require(
                IERC20(_treasure.token).balanceOf(address(this)) >= _treasure.amount,
                "Insufficient ERC20 balance in contract"
            );
        }

        if (_treasure.kind == TreasureKind.ERC721) {
            require(_treasure.tokenId > 0, "ERC721 treasure must have tokenId");
            require(
                IERC721(_treasure.token).ownerOf(_treasure.tokenId) == address(this),
                "Contract does not own the ERC721 token"
            );
        }

        uint id = treasureIdByPoolId[_treasure.poolId].current();
        treasuresByPoolId[_treasure.poolId][id] = Treasure({
            id: id,
            owner: _treasure.owner,
            token: _treasure.token,
            tokenId: _treasure.tokenId,
            amount: _treasure.amount,
            transferred: false,
            minBlockTime: _treasure.minBlockTime,
            minDonationTime: _treasure.minDonationTime,
            unlockOnNth: _treasure.unlockOnNth,
            kind: _treasure.kind
        });

        treasureIdByPoolId[_treasure.poolId].increment();
        return id;
    }

    /**
  * @notice Creates and registers a new treasure in a specific donation pool.
     * @dev Supports ERC20, ERC721, ERC1155, and Native (ETH) treasures.
     *      Performs validation based on the treasure kind, and stores the treasure in the pool.
     *      For Native treasures, `msg.value` is used as the amount.
     * @param _poolId The ID of the donation pool to associate with the treasure.
     * @param _token The token address (ERC20, ERC721, or ERC1155). Should be address(0) for Native.
     * @param _tokenId The token ID (used for ERC721 and ERC1155). Should be 0 for ERC20 and Native.
     * @param _amount The amount of the token. Must be >0 for ERC20 and ERC1155. Ignored for ERC721.
     * @param _minBlockTime The minimum block timestamp required to unlock the treasure.
     * @param _minDonationTime The minimum donation duration required before treasure can be unlocked.
     * @param _unlockOnNth The Nth donation condition that must be met to unlock the treasure.
     * @param _kind The type of the treasure: ERC20, ERC721, ERC1155, or Native.
     * @custom:access Only callable by the owner of the donation pool.
     */


    function createTreasure(uint _poolId, address _token, uint _tokenId, uint _amount, uint _minBlockTime, uint _minDonationTime, uint _unlockOnNth, TreasureKind _kind) external payable onlyPoolOwner(_poolId) {
        require(_kind != TreasureKind.ERC1155, "Transfer tokens using safeTransfer(), this contract implements IERC1155Receiver");
        uint actualAmount = _kind == TreasureKind.Native ? msg.value : _amount;
        uint id = _createTreasure(TreasureParams(_poolId, msg.sender, _token, _tokenId, actualAmount, _minBlockTime, _minDonationTime, _unlockOnNth, _kind));
        emit TreasureCreatedSuccess(_poolId, id, msg.sender, _kind);
    }

    function getAllTreasures(uint _poolId) external view returns (Treasure[] memory) {

        Treasure[] memory treasures = new Treasure[](treasureIdByPoolId[_poolId].current());
        for (uint i; i < treasureIdByPoolId[_poolId].current(); i++) {
            Treasure memory treasure = treasuresByPoolId[_poolId][i];
            treasures[i] = treasure;
        }

        return treasures;
    }

    function getTreasureCount(uint _poolId) external view returns (uint) {
        return treasureIdByPoolId[_poolId].current();
    }


    /**
    @dev It retrieves the unlocked treasures based on the poolId and _donationNth provided
    @param _poolId – The poolId of the treasures
    @return Treasure[] – The filtered treasure
    */
    function getUnlockedTreasures(uint _poolId, uint _donationNth) external view onlyDonationManager returns (Treasure[] memory) {
        uint count;
        for (uint i; i < treasureIdByPoolId[_poolId].current(); i++) {
            Treasure memory treasure = treasuresByPoolId[_poolId][i];
            if (block.timestamp > treasure.minBlockTime && !treasure.transferred) {
                if (_donationNth % treasure.unlockOnNth == 0) {
                    count++;
                }
            }
        }
        Treasure[] memory treasures = new Treasure[](count);
        uint j;
        for (uint i; i < treasureIdByPoolId[_poolId].current(); i++) {
            Treasure memory treasure = treasuresByPoolId[_poolId][i];
            if (block.timestamp > treasure.minBlockTime && !treasure.transferred) {
                if (_donationNth % treasure.unlockOnNth == 0) {
                    treasures[j] = treasure;
                    j++;
                }
            }
        }

        return treasures;
    }

    function _safeERC20Transfer(address token, address to, uint amount) external {
        require(msg.sender == address(this));
        IERC20(token).safeTransfer(to, amount);
    }
    /**
    * @notice Sends a treasure reward to the winner based on its kind.
     * @dev Supports ERC721, ERC20, ERC1155, and native token transfers.
     *      Only callable by the DonationManager contract.
     * @param _winner The address of the winner receiving the treasure.
     * @param _poolId The id of the donation pool;
     * @param _treasureId The id of the treasure found in {Treasure}.id;
     */
    function airdropTreasure(address payable _winner, uint _poolId, uint _treasureId) external onlyDonationManager {
        Treasure storage treasure = treasuresByPoolId[_poolId][_treasureId];

        if (treasure.transferred) {
            revert("Treasure already airdropped");
        }

        bool success;

        if (treasure.kind == TreasureKind.ERC721) {
            try IERC721(treasure.token).safeTransferFrom(address(this), _winner, treasure.tokenId) {
                success = true;
            } catch {}
        } else if (treasure.kind == TreasureKind.ERC20) {
            try this._safeERC20Transfer(treasure.token, _winner, treasure.amount) {
                success = true;
            } catch {}
        } else if (treasure.kind == TreasureKind.ERC1155) {
            try IERC1155(treasure.token).safeTransferFrom(address(this), _winner, treasure.tokenId, treasure.amount, "") {
                success = true;
            } catch {}
        } else if (treasure.kind == TreasureKind.Native) {
            _winner.transfer(treasure.amount);
            success = true;
        }

        if (success) {
            treasure.transferred = true;
            emit TreasureAirdropSuccess(_poolId, _treasureId, _winner, treasure.kind);
        } else {
            emit TreasureAirdropFailed(_poolId, _treasureId, treasure.owner);
        }
    }

    function onERC1155Received(
        address,
        address from,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public override returns (bytes4) {
        (
            uint poolId,
            uint minBlockTime,
            uint minDonationTime,
            uint unlockOnNth
        ) = abi.decode(data, (uint256, uint256, uint256, uint256));
        require(unlockOnNth != 0, "unlockOnNth cannot be zero.");
        uint _treasureId = _createTreasure(TreasureParams({
            poolId: poolId,
            owner: from,
            token: msg.sender,
            tokenId: id,
            amount: value,
            minBlockTime: minBlockTime,
            minDonationTime: minDonationTime,
            unlockOnNth: unlockOnNth,
            kind: TreasureKind.ERC1155
        }));

        emit TreasureCreatedSuccess(poolId, _treasureId, from, TreasureKind.ERC1155);

        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address from,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public override returns (bytes4) {
        require(ids.length == values.length, "Mismatched ids/values length");
        (
            uint poolId,
            uint minBlockTime,
            uint minDonationTime,
            uint unlockOnNth
        ) = abi.decode(data, (uint256, uint256, uint256, uint256));

        for (uint i = 0; i < ids.length; i++) {

            uint _treasureId = _createTreasure(TreasureParams({
                poolId: poolId,
                owner: from,
                token: msg.sender,
                tokenId: ids[i],
                amount: values[i],
                minBlockTime: minBlockTime,
                minDonationTime: minDonationTime,
                unlockOnNth: unlockOnNth,
                kind: TreasureKind.ERC1155
            }));

            emit TreasureCreatedSuccess(poolId, _treasureId, from, TreasureKind.ERC1155);
        }

        return this.onERC1155BatchReceived.selector;
    }

    receive() external payable {}

}
