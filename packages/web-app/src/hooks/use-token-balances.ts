import {Alchemy, Contract, Network, TokenBalance, TokenBalanceType, TokenMetadataResponse} from 'alchemy-sdk';
import {useEffect, useRef, useState} from 'react';
import {Address, parseAbi} from 'viem';

const permitAbi = parseAbi([
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  "function nonces(address owner) external view returns (uint256)",
  "function DOMAIN_SEPARATOR() external view returns (bytes32)",
]);

export const ADDRESS_ZERO: Address = "0x0000000000000000000000000000000000000000";

async function isPermitToken({contractAddress}: TokenBalance) {

  const provider = await alchemy.config.getProvider();
  const tokenContract = new Contract(contractAddress, permitAbi, provider);
  try {
    await tokenContract.nonces(ADDRESS_ZERO);
    await tokenContract.DOMAIN_SEPARATOR();
    return true;
  } catch (error) {
    return false;
  }
}

const alchemy = new Alchemy({apiKey: import.meta.env.VITE_ALCHEMY_API_KEY, network: Network.ETH_SEPOLIA});
export default function useTokenBalances(address: string) {
  const pageKey = useRef<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const tokenMetadata = useRef<Map<string, TokenMetadataResponse>>(new Map());
  useEffect(() => {
    if (address) {
      alchemy.core.getTokenBalances(address, {type: TokenBalanceType.ERC20}).then(async (value) => {
        await Promise.all(value.tokenBalances.filter(isPermitToken).map(async (item) => {
          const res = await alchemy.core.getTokenMetadata(item.contractAddress);
          tokenMetadata.current.set(item.contractAddress, res);
        }));
        setTokenBalances(value.tokenBalances);
        pageKey.current = value.pageKey ?? null;
      });
    }
  }, [address]);


  return {tokenBalances, pageKey, tokenMetadata};
}