import {Alchemy, Network, TokenBalance, TokenBalanceType, TokenMetadataResponse} from 'alchemy-sdk';
import {useEffect, useRef, useState} from 'react';

const alchemy = new Alchemy({apiKey: import.meta.env.VITE_ALCHEMY_API_KEY, network: Network.ETH_SEPOLIA});
export default function useTokenBalances(address: string) {
  const pageKey = useRef<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const tokenMetadata = useRef<Map<string, TokenMetadataResponse>>(new Map());
  useEffect(() => {
    if (address) {
      alchemy.core.getTokenBalances(address, {type: TokenBalanceType.ERC20}).then(async (value) => {
        await Promise.all(value.tokenBalances.map(async (item) => {
          const res = await alchemy.core.getTokenMetadata(item.contractAddress);
          tokenMetadata.current.set(item.contractAddress, res);
        }));
        setTokenBalances(value.tokenBalances);
        pageKey.current = value.pageKey ?? null;
      });
    }
  }, []);


  return {tokenBalances, pageKey, tokenMetadata};
}