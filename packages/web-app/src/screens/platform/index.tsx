import Screen from '@/components/screen';
import useAppStore from '@/stores/app.ts';
import "./styles.css";
import Avatar from '@/components/avatar';

const DEMO_IMAGE = "/public/male.png"
export default function PlatformScreen() {
  const user = useAppStore().user;
  return (
      <Screen requiresAuth={false} className="page">
        <div className="banner">
        </div>
        <div className="avatar-wrapper">
          <Avatar imageUrl={DEMO_IMAGE}/>
          @{user?.username}
        </div>
      </Screen>
  );
}