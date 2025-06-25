import {Button} from '@/components/ui/button.tsx';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import useTokenBalances from '@/hooks/use-token-balances.ts';
import {formatUnits} from 'viem';
import {useCallback, useState} from 'react';
import "./styles.css";

export interface DonateProps {
  address: string;
}

export default function Donate(props: DonateProps) {
  const {tokenBalances, tokenMetadata} = useTokenBalances(props.address);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const handleTokenSelection = useCallback((address: string) => {
    return () => {
      setSelectedToken(address);
    };
  }, []);

  return (
      <Popover>
        <PopoverTrigger asChild={true}><Button>Donate</Button></PopoverTrigger>
        <PopoverContent updatePositionStrategy="always" avoidCollisions={false}>
          <div className="tokens">
            <h1>Select token</h1>
            {
              tokenBalances?.map((balance) => {
                const metadata = tokenMetadata.current.get(balance.contractAddress);
                return (
                    <div className={`token ${selectedToken === balance.contractAddress ? "selected" : ""}`}
                         key={balance.contractAddress}
                         onClick={handleTokenSelection(balance.contractAddress)}
                    >
                      <div className="token__icon-symbol">
                        {metadata?.logo ? <img src={metadata?.logo ?? ""}
                                               alt={metadata?.name ?? "icon"}/> :
                            <div className="token__placeholder">{metadata?.symbol?.charAt(0)}</div>}
                        <p>{tokenMetadata.current.get(balance.contractAddress)?.name} ({metadata?.symbol})</p>
                      </div>
                      <strong>{balance?.tokenBalance && metadata?.decimals && formatUnits(BigInt(balance.tokenBalance), metadata.decimals)} {metadata?.symbol}</strong>
                    </div>
                );
              })
            }
          </div>
        </PopoverContent>
      </Popover>
  );
}