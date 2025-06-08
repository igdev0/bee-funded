import {create} from 'zustand/react';


interface AppStore {
  accessToken: string | null;
  updateAccessToken: (accessToken: string | null) => void;
}

const useAppStore = create<AppStore>((setState,) => ({
  accessToken: null,
  updateAccessToken(accessToken) {
    setState({accessToken});
  }
}));


export default useAppStore;