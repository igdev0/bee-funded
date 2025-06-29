import {Button} from '@/components/ui/button.tsx';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import useTokenBalances from '@/hooks/use-token-balances.ts';
import {Address, formatUnits, parseAbi, parseSignature, parseUnits} from 'viem';
import {useCallback, useMemo, useState} from 'react';
import {Input} from '@/components/ui/input.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {Textarea} from '@/components/ui/textarea.tsx';
import {useAccount, useClient, useSignTypedData, useWriteContract} from 'wagmi';
import abi, {TESTNET_CONTRACT_ADDRESS} from '@/contracts';
import "./styles.css";
import {readContract} from 'viem/actions';
import {Calendar} from '@/components/ui/calendar.tsx';

export interface DonateProps {
  donationPoolId: number | null;
  text: string;
}

export default function Donate(props: DonateProps) {
  const signedInAccount = useAccount();
  const [subscriptionDuration, setSubscriptionDuration] = useState<Date | undefined>(new Date());
  const {tokenBalances, tokenMetadata} = useTokenBalances(signedInAccount.address as string);
  const {writeContract, isPending} = useWriteContract();
  const {signTypedDataAsync} = useSignTypedData();
  const client = useClient();
  const [subscriptionInterval, setSubscriptionInterval] = useState<null | number>(null);
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

  const handleSignPermit = async (amount: bigint, deadline: bigint) => {
    if (!selectedTokenMetadata) {
      throw new Error("You must select a token");
    }
    const domain = {
      name: selectedTokenMetadata.name as string, // Name of the ERC20Permit token (e.g., "MockToken")
      version: "1", // EIP-2612 standard version
      chainId: signedInAccount.chainId,
      verifyingContract: selectedToken as Address, // Address of the ERC20Permit token contract
    };

    const permitAbi = parseAbi([
      'function nonces(address owner) external view returns (uint256)'
    ]);

    const nonce = await readContract(client as keyof object, {
      address: selectedToken as Address,
      abi: permitAbi,
      functionName: "nonces",
      args: [signedInAccount.address as Address],
    });

    const types = {
      Permit: [
        {name: "owner", type: "address"},
        {name: "spender", type: "address"},
        {name: "value", type: "uint256"},
        {name: "nonce", type: "uint256"},
        {name: "deadline", type: "uint256"},
      ],
    };

    const signMessage = {
      owner: signedInAccount.address,
      spender: TESTNET_CONTRACT_ADDRESS,
      value: amount,
      nonce: nonce,
      deadline,
    };

    const sign = await signTypedDataAsync({
      types,
      primaryType: "Permit",
      message: signMessage,
      domain
    });
    return parseSignature(sign);
  };

  const donate = async (formData: FormData) => {
    const amount = formData.get("amount") ?? "0";
    const parsedAmount = parseUnits(amount as string, selectedTokenMetadata!.decimals as number);
    const message = formData.get("message") ?? "";
    let deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(60 * 5); // 5 default time minutes
    const ONE_DAY = 60 * 60 * 24;
    const SUBSCRIPTION_PADDING = ONE_DAY * 7;
    let intervalTimes: null | number = null;
    if (subscriptionInterval && subscriptionDuration) {
      const durationInSeconds = (subscriptionDuration.getTime() / 1000);
      deadline = BigInt(durationInSeconds + SUBSCRIPTION_PADDING);
      intervalTimes = Math.floor((durationInSeconds - (Date.now() / 1000)) / (subscriptionInterval * ONE_DAY));
    }

    if (selectedTokenMetadata && signedInAccount.chainId) {
      const totalAmount = subscriptionInterval ? parsedAmount * BigInt(intervalTimes ?? 0) : parsedAmount;
      const {v, r, s} = await handleSignPermit(totalAmount, deadline);

      if (subscriptionInterval) {

        writeContract({
          abi,
          address: TESTNET_CONTRACT_ADDRESS,
          functionName: 'subscribe',
          args: [
            signedInAccount.address as Address,
            props.donationPoolId,
            selectedToken,
            parsedAmount,
            subscriptionInterval * ONE_DAY,
            intervalTimes,
            deadline,
            v,
            r,
            s
          ],
        });
      } else {

        writeContract({
          abi,
          address: TESTNET_CONTRACT_ADDRESS,
          functionName: 'donateWithPermit',
          args: [
            signedInAccount.address as Address,
            props.donationPoolId,
            selectedToken,
            parsedAmount,
            message,
            deadline,
            v,
            r,
            s
          ],
        });
      }
    }
  };

  return (
      <Popover >
        <PopoverTrigger asChild={true}><Button disabled={!tokenBalances.length || isPending || !props.donationPoolId}>{props.text}</Button></PopoverTrigger>
        <PopoverContent updatePositionStrategy="always" avoidCollisions={true}>
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
                        Make it every 7 days (weekly)
                      </label>
                      <Checkbox onCheckedChange={event => setSubscriptionInterval(event ? 7 : null)}
                                checked={subscriptionInterval === 7}
                                id="make-it-monthly"/>
                    </div>
                    <div className="make-it-monthly">
                      <label>
                        Make it every 30 days (monthly)
                      </label>
                      <Checkbox onCheckedChange={event => setSubscriptionInterval(event ? 30 : null)}
                                checked={subscriptionInterval === 30}
                                id="make-it-monthly"/>
                    </div>
                    {
                        subscriptionInterval &&
                        <>
                            <label htmlFor="period">
                                Subscribe until when?
                            </label>
                            <Calendar
                                mode="single"
                                disabled={date => date.getTime() < new Date().getTime()}
                                modifiers={{}}
                                showOutsideDays={false}
                                selected={subscriptionDuration}
                                onSelect={setSubscriptionDuration}
                                className="rounded-lg border"
                            />
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