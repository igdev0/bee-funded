import {create} from 'zustand/react';
import {api} from '../api/auth.ts';
import {UserEntity} from '../api/types.ts';


interface AppStore {
  user: UserEntity | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  updateUser: (user: UserEntity | null) => void;
}

const useAppStore = create<AppStore>((setState,) => ({
  initialized: false,
  user: null,
  updateUser(user) {
    setState({user});
  },
  async initialize() {
    try {
      await api.refreshToken();
      const user = await api.getUser();
      setState({user, initialized: true});
    } catch (error) {
      setState({user: null, initialized: true});
    }
  }
}));


export default useAppStore;