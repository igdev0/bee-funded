import {create} from 'zustand/react';
import {api} from '../api/auth.ts';
import {UserEntity} from '../api/types.ts';


interface AppStore {
  accessToken: string | null;
  user: UserEntity | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  updateUser: (user: UserEntity | null) => void;
  updateAccessToken: (accessToken: string | null) => void;
}

const useAppStore = create<AppStore>((setState,) => ({
  accessToken: null,
  initialized: false,
  user: null,
  updateAccessToken(accessToken) {
    setState({accessToken});
  },
  updateUser(user) {
    setState({user});
  },
  async initialize() {
    let accessToken: string | null;
    try {
      accessToken = await api.refreshToken();
      const user = await api.getUser();
      setState({user, accessToken, initialized: true});
    } catch (_error) {
      // ignore the error
    }

  }
}));


export default useAppStore;