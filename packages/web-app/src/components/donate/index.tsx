import {Button} from '@/components/ui/button.tsx';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import useTokenBalances from '@/hooks/use-token-balances.ts';
import {Address, formatUnits, parseAbi, parseUnits} from 'viem';
import {useCallback, useMemo, useState} from 'react';
import "./styles.css";
import {Input} from '@/components/ui/input.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {Textarea} from '@/components/ui/textarea.tsx';
import {useAccount, useSendCalls} from 'wagmi';
import {TESTNET_CONTRACT_ADDRESS} from '@/contracts';

export interface DonateProps {
  address: string;
  donationPoolId: number;
}

export default function Donate(props: DonateProps) {
  const signedInAccount = useAccount();
  const {tokenBalances, tokenMetadata} = useTokenBalances(signedInAccount.address as string);
  const {sendCalls, sendCallsAsync} = useSendCalls();
  const [subscribe, setSubscribe] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Address | null>(null);
  const selectedTokenMetadata = useMemo(() => {
    return selectedToken ? {
      ...tokenMetadata.current.get(selectedToken),
      balance: tokenBalances.find(item => item.contractAddress === selectedToken)?.tokenBalance || null
    } : null;
  }, [selectedToken, tokenMetadata, tokenBalances]);
  const handleTokenSelection = useCallback((address: Address) => {
    return () => {
      setSelectedToken(address);
    };
  }, []);

  const handleDeselect = () => {
    setSelectedToken(null);
  };

  const donate = async (formData: FormData) => {
    const amount = formData.get("amount") ?? "0";
    const message = formData.get("message") ?? "";
    if (selectedTokenMetadata) {
      const amountParsed = parseUnits(amount as string, selectedTokenMetadata!.decimals as number);
      const erc20abi = parseAbi([
        'function approve(address, uint256) returns (bool)',
        'function transferFrom(address,address,uint256)'
      ]);

      const calls = [
        {
          to: selectedToken as Address,
          abi: erc20abi,
          functionName: 'approve',
          value: 0n,
          args: [
            TESTNET_CONTRACT_ADDRESS,
            amountParsed
          ],
        }
      ];

      const hash = await sendCallsAsync({
        calls: calls
      });
      console.log(hash);
    }
  };


  return (
      <Popover>
        <PopoverTrigger asChild={true}><Button disabled={!tokenBalances}>Donate</Button></PopoverTrigger>
        <PopoverContent updatePositionStrategy="always" avoidCollisions={false}>
          <div className="tokens">
            {selectedToken ?
                <Button
                    onClick={handleDeselect}>{selectedTokenMetadata?.name} {selectedTokenMetadata?.balance && selectedTokenMetadata?.decimals && formatUnits(BigInt(selectedTokenMetadata?.balance), selectedTokenMetadata?.decimals)} {selectedTokenMetadata?.symbol}  &times;</Button> :
                <h1>Select token</h1>}
            {
              !selectedToken ? tokenBalances?.map((balance) => {
                    const metadata = tokenMetadata.current.get(balance.contractAddress);
                    return (
                        <div className={`token ${selectedToken === balance.contractAddress ? "selected" : ""}`}
                             key={balance.contractAddress}
                             onClick={handleTokenSelection(balance.contractAddress as Address)}
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
                  }) :
                  <form className="form" action={donate}>
                    <label htmlFor="amount">
                      Amount
                    </label>
                    <Input type="number" step="0.1" placeholder="Amount"
                           id="amount"
                           name="amount"
                           max={formatUnits(BigInt(selectedTokenMetadata!.balance as string), selectedTokenMetadata!.decimals as number)}/>
                    <div className="make-it-monthly">
                      <label>
                        Make it monthly
                      </label>
                      <Checkbox onCheckedChange={event => setSubscribe(!!event)} id="make-it-monthly"/>
                    </div>
                    {
                        subscribe &&
                        <>
                            <label htmlFor="period">
                                How many months?
                            </label>
                            <Input type="number" step="0.1" placeholder="Period of time"
                                   id="period"
                                   name="period"
                                   max={formatUnits(BigInt(selectedTokenMetadata!.balance as string), selectedTokenMetadata!.decimals as number)}/>
                        </>
                    }
                    <label htmlFor="message">Message</label>
                    <Textarea name="message" id="message" placeholder="Type your message ..."/>
                    <Button>Continue</Button>
                  </form>
            }
          </div>
        </PopoverContent>
      </Popover>
  );
}