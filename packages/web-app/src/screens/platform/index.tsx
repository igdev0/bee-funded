import Screen from '@/components/screen';
import "./styles.css";
import Avatar from '@/components/avatar';
import Donate from '@/components/donate';
import {useLoaderData} from 'react-router';
import {UserEntity} from '@/api/types.ts';
import {formatDistanceToNow} from 'date-fns';

const DEMO_IMAGE = "/public/male.png";
export default function PlatformScreen() {
  const user = useLoaderData<UserEntity>();
  const joined = new Date(user.created_at);
  const result = formatDistanceToNow(joined);
  return (
      <Screen requiresAuth={false} className="page" wrapperClassName="platform">
        <div className="banner"/>
        <div className="avatar-wrapper">
          <Avatar imageUrl={DEMO_IMAGE}/>
          <p>@{user?.username}</p>
          <p>Joined {result}</p>
        </div>
        <Donate address={user.address} donationPoolId={36}/>
      </Screen>
  );
}