import {DonationPoolEntity} from '@/api/types.ts';
import "./styles.css";
import {useCallback} from 'react';
import Donate from '@/components/donate';
import {useAccount, useReadContract, useWriteContract} from 'wagmi';
import donationPool from '@/api/donation-pool.ts';
import abi, {TESTNET_CONTRACT_ADDRESS} from '@/contracts';
import {createResourceUrl} from '@/lib/utils.ts';
import useAppStore from '@/stores/app.ts';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Textarea} from '@/components/ui/textarea.tsx';
import {useRevalidator} from 'react-router';

export interface ProjectsProps {
  pools: DonationPoolEntity[];
}

export function ProjectCard(props: DonationPoolEntity) {
  return (
      <div className="bg-white p-4 rounded-md shadow-2xl">
        <img src="/demo-project.png" alt="demo"/>
        <h3 className="mt-2 text-right">Max amount: <strong>{props.max_amount} USD</strong> Current value: <strong>3,000 USD</strong></h3>
        <h3 className="text-lg mt-4 font-bold">{props.title}</h3>
        <p>{props.description}</p>
        <Donate donationPoolId={props.on_chain_pool_id} text="Support this project"/>
      </div>
  );
}

export function CreateProject() {
  const {user} = useAppStore();
  const signedInAccount = useAccount();
  const {revalidate} = useRevalidator();
  const {writeContractAsync} = useWriteContract();
  const {data: onChainPoolId} = useReadContract({abi, address: TESTNET_CONTRACT_ADDRESS, functionName: "poolID"});
  const handleCreate = useCallback(async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const goal = formData.get("goal") as string;
    const poolId = await donationPool.initDonationPool(user?.id as string, title, description, false, Number(goal));

    const tx_hash = await writeContractAsync({
      abi: abi,
      address: TESTNET_CONTRACT_ADDRESS,
      functionName: "createPool",
      args: [
        goal,
        createResourceUrl(poolId),
      ]
    });

    await donationPool.updateDonationPool({
      id: poolId,
      tx_hash,
      on_chain_pool_id: Number(onChainPoolId) + 1, // next pool id will be this one
    });
    await revalidate();
  }, []);

  if (!user || user?.address !== signedInAccount.address) {
    return null;
  }

  return (

      <Popover>
        <PopoverTrigger asChild={true}>
          <Button>
            Create new project
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <form action={handleCreate}>
            <label className="font-bold inline-block mt-4" htmlFor="title">
              Project Title
            </label>
            <Input required={true} maxLength={40} className="mt-4" type="text" id="title" name="title"
                   placeholder="Project title"/>
            <label className="font-bold inline-block mt-4" htmlFor="title">
              Funding goal (in USD)
            </label>
            <Input required={true} className="mt-4" type="number" id="goal" name="goal" placeholder="1,000"/>
            <label className="font-bold inline-block mt-4" htmlFor="description">
              Project Description
            </label>
            <Textarea required={true} name="description" id="description" placeholder="Description"/>
            <Button className="mt-4">Create project</Button>
          </form>
        </PopoverContent>
      </Popover>
  );
}

export default function Projects(props: ProjectsProps) {


  if (props.pools.length === 0) {
    return (
        <div className="projects-not-found">
          <h1 className="text-2xl font-bold">Looks like you haven't got any projects 😳</h1>
          <CreateProject/>
        </div>
    );
  }

  return (
      <>
        <div className="projects-container mt-4">
          {
            props.pools.map((pool: DonationPoolEntity) => (
                <ProjectCard key={pool.id} {...pool}/>
            ))
          }
        </div>
      </>
  );
}