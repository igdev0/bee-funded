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

export interface DonateProps {
  address: string;
  donationPoolId: number;
}

export default function Donate(props: DonateProps) {
  const signedInAccount = useAccount();
  const {tokenBalances, tokenMetadata} = useTokenBalances(props.address as string);
  const {writeContract, isPending} = useWriteContract();
  const {signTypedDataAsync} = useSignTypedData();
  const client = useClient();
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
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(60 * 5); // 5 minutes
    if (selectedTokenMetadata && signedInAccount.chainId) {

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

      const parsedAmount = parseUnits(amount as string, selectedTokenMetadata!.decimals as number);

      const signMessage = {
        owner: signedInAccount.address,
        spender: TESTNET_CONTRACT_ADDRESS,
        value: parsedAmount,
        nonce: nonce,
        deadline,
      };

      const sign = await signTypedDataAsync({
        types,
        primaryType: "Permit",
        message: signMessage,
        domain
      });
      const {v, r, s} = parseSignature(sign);
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
  };


  return (
      <Popover>
        <PopoverTrigger asChild={true}><Button disabled={!tokenBalances || isPending}>Donate</Button></PopoverTrigger>
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