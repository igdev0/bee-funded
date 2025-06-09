import axios from 'axios';
import {
  SignUpPayload,
  SignOutput,
  SignInPayload,
  UserEntity
} from './types.ts';

export const defaultClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000', // Set your API base URL
  timeout: 10000, // Optional: Set a timeout
  headers: {
    'Content-Type': 'application/json', // Optional: Common headers
  },
  withCredentials: true,
})

export const createAuthApi = (client = defaultClient ) => ({

  getNonce: async (): Promise<string> => {
    const { data } = await client.get<{ nonce: string }>('/auth/nonce');
    return data.nonce;
  },

  getUser: async (): Promise<UserEntity> => {
    const { data } = await client.get<UserEntity>('/auth/me');
    return data;
  },

  signIn: async (input: SignInPayload): Promise<SignOutput> => {
    const { data } = await client.post<SignOutput>('/auth/signin', input);
    defaultClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    return data;
  },

  signUp: async (input: SignUpPayload): Promise<SignOutput> => {
    const { data } = await client.post<SignOutput>('/auth/signup', input);
    defaultClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    return data;
  },

  userExists: async (address: string): Promise<boolean> => {
    const { data } = await client.post<boolean>('/auth/exists', { address });
    return data;
  },

  signOut: async (): Promise<void> => {
    await client.post('/auth/signout');
  },

  refreshToken: async (): Promise<string> => {
    const { data } = await client.get<{ access_token: string }>('/auth/refresh-token');
    return data.access_token;
  }
});

export const api = createAuthApi();