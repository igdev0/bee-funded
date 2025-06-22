import Screen from '@/components/screen';
import useAppStore from '@/stores/app.ts';
import "./styles.css";
import {useReadContract, useWriteContract} from 'wagmi';
import abi, {TESTNET_CONTRACT_ADDRESS} from '@/contracts';
import donationPool from '@/api/donation-pool.ts';
import {createResourceUrl} from '@/lib/utils.ts';

export default function SetupInitialPoolScreen() {
  const user = useAppStore().user;
  const {data: onChainPoolId} = useReadContract({abi, address: TESTNET_CONTRACT_ADDRESS, functionName: "poolID"});
  const {writeContractAsync} = useWriteContract();


  const handleCreator = async () => {
    const poolId = await donationPool.initDonationPool(user?.id as string);
    const tx_hash = await writeContractAsync({
      abi: abi,
      address: TESTNET_CONTRACT_ADDRESS,
      functionName: "createPool",
      args: [
        "1000000",
        createResourceUrl(poolId),
      ]
    });

    await donationPool.updateDonationPool({
      id: poolId,
      title: "",
      tx_hash,
      on_chain_pool_id: Number(onChainPoolId) + 1, // next pool id will be this one
      description: ""
    });
  };

  return (
      <Screen className="initial-pool" requiresAuth={true}>
        <h1>How are you planning to use this platform?</h1>
        <p>Continuing as a creator, will require to create a donation pool.</p>
        <div className="cards-container">
          <button className="card" onClick={handleCreator}>
            I want to be funded by 🐝
          </button>
          <button className="card card--active">
            I want to be a 🐝
          </button>
        </div>
      </Screen>
  );
}