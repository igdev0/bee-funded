// SPDX-License-Identifier: MIT
pragma solidity >=0.8.30;

import {IBeeFundedCore} from "./interfaces/IBeeFundedCore.sol";
import {IDonationManager} from "./interfaces/IDonationManager.sol";
import {ITreasureManager} from "./interfaces/ITreasureManager.sol";
import {Counters} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/utils/Counters.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

contract TreasureManager is ITreasureManager {
    IDonationManager private immutable donationManager;
    IBeeFundedCore private immutable beeFundedCore;

    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    Counters.Counter private treasureId;

    mapping(uint => mapping(uint => Treasure)) private treasuresByPoolId;
    mapping(uint => uint) private treasureCountByPoolId;

    constructor(IBeeFundedCore _beeFundedCore, IDonationManager _donationManager) {
        donationManager = _donationManager;
        beeFundedCore = _beeFundedCore;
    }

    modifier onlyPoolOwner(uint _poolId) {
        require(beeFundedCore.getPool(_poolId).owner == msg.sender);
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

    function _createTreasure(uint _poolId, address _token, uint _tokenId, uint _amount, uint _minBlockTime, uint _minDonationTime, uint _unlockOnNth, TreasureKind _kind) internal onlyPoolOwner(_poolId) returns(uint) {
        require(uint8(_kind) <= uint8(TreasureKind.Native), "Invalid treasure kind");

        if(_token == address(0) && _kind == TreasureKind.Native) {
            require(_amount > 0, "Native treasure must have amount");
        }

        if (_kind == TreasureKind.ERC20) {
            require(_amount > 0, "ERC20 treasure must have amount");
            require(
                IERC20(_token).balanceOf(address(this)) >= _amount,
                "Insufficient ERC20 balance in contract"
            );
        }

        if (_kind == TreasureKind.ERC721) {
            require(_tokenId > 0, "ERC721 treasure must have tokenId");
            require(
                IERC721(_token).ownerOf(_tokenId) == address(this),
                "Contract does not own the ERC721 token"
            );
        }
        if (_kind == TreasureKind.ERC1155) {
            require(_tokenId > 0, "ERC1155 treasure must have tokenId");
            require(_amount > 0, "ERC1155 treasure must have amount");
            require(
                IERC1155(_token).balanceOf(address(this), _tokenId) >= _amount,
                "Insufficient ERC1155 balance in contract"
            );
        }

        uint id = treasureId.current();
        Treasure memory treasure = Treasure({
            id: id,
            owner: msg.sender,
            token: _token,
            tokenId: _tokenId,
            amount: _amount,
            transferred: false,
            minBlockTime: _minBlockTime,
            minDonationTime: _minDonationTime,
            unlockOnNth: _unlockOnNth,
            kind: _kind
        });

        treasuresByPoolId[_poolId][id] = treasure;
        treasureId.increment();
        treasureCountByPoolId[_poolId] = treasureId.current();
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
        uint id = _createTreasure(_poolId, _token, _tokenId, actualAmount, _minBlockTime, _minDonationTime, _unlockOnNth, _kind);
        emit TreasureCreatedSuccess(_poolId, id, msg.sender, _kind);
    }

    /**
    @dev It retrieves the unlocked treasures based on the poolId and _donationNth provided
    @param _poolId – The poolId of the treasures
    @return Treasure[] – The filtered treasure
    */
    function getUnlockedTreasures(uint _poolId, uint _donationNth) external view onlyDonationManager returns (Treasure[] memory) {
        uint count;
        for (uint i; i < treasureCountByPoolId[_poolId]; i++) {
            Treasure memory treasure = treasuresByPoolId[_poolId][i];
            if (block.timestamp > treasure.minBlockTime) {
                if (treasure.unlockOnNth > 0 && treasure.unlockOnNth % _donationNth != 0) {
                    continue;
                }
                count++;
            }
        }
        Treasure[] memory treasures = new Treasure[](count);
        uint j;
        for (uint i; i < treasureCountByPoolId[_poolId]; i++) {
            Treasure memory treasure = treasuresByPoolId[_poolId][i];
            if (block.timestamp > treasure.minBlockTime) {
                if (treasure.unlockOnNth > 0 && treasure.unlockOnNth % _donationNth != 0) {
                    continue;
                }
                treasures[j] = treasure;
                j++;
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

    receive() external payable {}

}
