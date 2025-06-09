import {create} from 'zustand/react';
import {getUser, refreshToken} from '../api/auth.ts';
import axios from 'axios';
import {UserEntity} from '../api/types.ts';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000', // Set your API base URL
  timeout: 10000, // Optional: Set a timeout
  headers: {
    'Content-Type': 'application/json', // Optional: Common headers
  },
});

interface AppStore {
  accessToken: string | null;
  user: UserEntity | null;
  initialized: boolean;
  initialize: () => Promise<void>;
}

const useAppStore = create<AppStore>((setState, getState,) => ({
  accessToken: null,
  initialized: false,
  user: null,
  async initialize() {
    let accessToken: string | null;
    try {
      accessToken = await refreshToken();
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      const user = await getUser();
      setState({ user, accessToken });
    } catch (_error) {
      // ignore the error
    }

  }
}));


export default useAppStore;