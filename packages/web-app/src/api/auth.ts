import {SignInPayload, SignOutput, SignUpPayload, UserEntity, UserExistsPayload} from './types.ts';
import {defaultClient} from '@/api/client.ts';

export const createAuthApi = (client = defaultClient) => ({

  getNonce: async (): Promise<string> => {
    const {data} = await client.get<{ nonce: string }>('/auth/nonce');
    return data.nonce;
  },

  getUser: async (): Promise<UserEntity> => {
    const {data} = await client.get<UserEntity>('/auth/me');
    return data;
  },

  signIn: async (input: SignInPayload): Promise<SignOutput> => {
    const {data} = await client.post<SignOutput>('/auth/signin', input);
    return data;
  },

  signUp: async (input: SignUpPayload): Promise<SignOutput> => {
    const {data} = await client.post<SignOutput>('/auth/signup', input);
    return data;
  },

  userExists: async (payload: UserExistsPayload): Promise<boolean> => {
    const {data} = await client.post<{ exists: boolean }>('/auth/exists', payload);
    return data.exists;
  },

  signOut: async (): Promise<void> => {
    await client.post('/auth/signout');
  },

  refreshToken: async (): Promise<string> => {
    const {data} = await client.get<{ accessToken: string }>('/auth/refresh-token');
    return data.accessToken;
  }
});

export const api = createAuthApi();