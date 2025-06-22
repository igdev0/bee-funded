import Screen from '@/components/screen';
import useAppStore from '@/stores/app.ts';

export default function PlatformScreen() {
  const user = useAppStore().user;
  return (
      <Screen requiresAuth={false}>
        <h1>Hello {user?.username}</h1>
      </Screen>
  );
}