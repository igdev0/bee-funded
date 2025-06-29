import Screen from '@/components/screen';
import "./styles.css";
import Avatar from '@/components/avatar';
import {useLoaderData} from 'react-router';
import {DonationPoolEntity, UserEntity} from '@/api/types.ts';
import {formatDistanceToNow} from 'date-fns';
import Donate from '@/components/donate';
import Projects, {CreateProject} from '@/components/projects';
import SettingsBar from '@/components/settings-bar';

const DEMO_IMAGE = "/public/male.png";
export default function PlatformScreen() {
  const {user, mainPoolChainId, pools} = useLoaderData<{
    user: UserEntity,
    mainPoolChainId: number,
    pools: DonationPoolEntity[]
  }>();

  if (!user) {
    return <h1>User Not found</h1>;
  }
  const joined = new Date(user.created_at);
  const result = formatDistanceToNow(joined);
  return (
      <Screen requiresAuth={false} className="page" wrapperClassName="platform">
        <SettingsBar/>
        <main>
          <header>
            <div className="avatar-wrapper">
              <Avatar imageUrl={DEMO_IMAGE}/>
              <p>@{user?.username}</p>
              <p>Joined {result} ago</p>
              <Donate text="Donate" donationPoolId={mainPoolChainId}/>
            </div>
          </header>
          <section>
            <div className="flex justify-between">
              <h1 className="text-3xl font-bold">Projects</h1>
              <CreateProject/>
            </div>
            <Projects pools={pools}/>
          </section>
        </main>
      </Screen>
  );
}