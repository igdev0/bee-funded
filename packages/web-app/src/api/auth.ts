import axios from '../axios.ts';
import {SignInInput, SignOutput, SignUpInput, UserEntity} from './types.ts';

export const getNonce = async (): Promise<string> => {
  const {data} = await axios.get<string>("/auth/nonce");
  return data;
}

export const getUser = async () => {
  const {data} = await axios.get<UserEntity>("/auth/me");
  return data;
};

export const signIn = async (input: SignInInput): Promise<SignOutput> => {
  const {data} = await axios.post<SignOutput>("/auth/signin", input);
  return data;
};

export const signUp = async (input: SignUpInput): Promise<SignOutput> => {
  const {data} = await axios.post<SignOutput>("/auth/signup", input);
  return data;
};

export const userExists = async (address: string): Promise<boolean> => {
  const {data} = await axios.post<boolean>("/auth/exists", {address});
  return data;
};

export const signOut = async ():Promise<void> => {
  const {data} = await axios.post("/auth/signout");
  return data;
}