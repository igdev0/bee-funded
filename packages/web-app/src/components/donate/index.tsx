import {Button} from '@/components/ui/button.tsx';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import useTokenBalances from '@/hooks/use-token-balances.ts';
import {useEffect} from 'react';
import {formatUnits} from 'viem';

export interface DonateProps {
  address: string;
}

export default function Donate(props: DonateProps) {
  const {tokenBalances, tokenMetadata} = useTokenBalances(props.address);

  useEffect(() => {
    console.log({tokenBalances, tokenMetadata});
  }, [tokenBalances]);
  return (
      <div>
        <Popover>
          <PopoverTrigger asChild={true}><Button>Donate</Button></PopoverTrigger>
          <PopoverContent updatePositionStrategy="always">
            <h1>Select token</h1>
            {
              tokenBalances?.map((balance) => {
                const metadata = tokenMetadata.current.get(balance.contractAddress);
                return (
                    <div key={balance.contractAddress}>
                      <img src={metadata?.logo ?? ""}
                           alt={metadata?.name ?? "icon"}/>
                      <strong>{tokenMetadata.current.get(balance.contractAddress)?.name} ({metadata?.symbol})</strong>
                      {balance?.tokenBalance && metadata?.decimals && formatUnits(BigInt(balance.tokenBalance), metadata.decimals)}
                    </div>
                );
              })
            }
          </PopoverContent>
        </Popover>
      </div>
  );
}