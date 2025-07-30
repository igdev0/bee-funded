// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "hardhat-deploy/solc_0.8/openzeppelin/access/Ownable.sol";

contract MockPromiseNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("MockPromiseNFT", "MPN") {}

    function mint(address to, string calldata uri) external onlyOwner returns (uint256) {
        uint256 newTokenId = ++_tokenIdCounter;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);
        return newTokenId;
    }

    function burn(uint256 tokenId) external {
        require(_isAuthorized(_owner, _msgSender(), tokenId), "Not authorized");
        _burn(tokenId);
    }

    function nextTokenId() external view returns (uint256) {
        return _tokenIdCounter + 1;
    }
}
