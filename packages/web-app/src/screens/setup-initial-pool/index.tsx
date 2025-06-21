import Screen from '@/components/screen';
import useAppStore from '@/stores/app.ts';
import {useEffect} from 'react';

export default function SetupInitialPoolScreen() {
  const user = useAppStore().user;

  useEffect(() => {
    console.log('setup initial pool: ', user);
  }, [user]);
  return (
      <Screen className="initial-pool" requiresAuth={true}>
        <h1>Setup initial pool</h1>
      </Screen>
  );
}