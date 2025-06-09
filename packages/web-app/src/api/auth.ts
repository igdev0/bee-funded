import {apiClient} from '../stores/app.ts';
import {SignInInput, SignOutput, SignUpInput, UserEntity} from './types.ts';

export const getNonce = async (): Promise<string> => {
  const {data} = await apiClient.get<{ nonce: string }>("/auth/nonce");
  return data.nonce;
}

export const getUser = async () => {
  const {data} = await apiClient.get<UserEntity>("/auth/me");
  return data;
};

export const signIn = async (input: SignInInput): Promise<SignOutput> => {
  const {data} = await apiClient.post<SignOutput>("/auth/signin", input);
  return data;
};

export const signUp = async (input: SignUpInput): Promise<SignOutput> => {
  const {data} = await apiClient.post<SignOutput>("/auth/signup", input);
  return data;
};

export const userExists = async (address: string): Promise<boolean> => {
  const {data} = await apiClient.post<boolean>("/auth/exists", {address});
  return data;
};

export const signOut = async ():Promise<void> => {
  const {data} = await apiClient.post("/auth/signout");
  return data;
}

export const refreshToken = async (): Promise<string> => {
  const {data} = await apiClient.get<{ access_token: string }>("/auth/refresh-token");
  return data.access_token;
}