export interface UserEntity {
  id: string;
  email: string;
  name: string;
  address: string;
  complete: string;
  created_at: string;
  updated_at: string;
}

export interface SignInInput {
  signature: string;
  nonce: string;
  message: string;
  address: string;
}

export interface SignUpInput extends SignInInput {
  address: string;
  name: string;
  username: string;
  complete: boolean;
}

export interface SignOutput {
  accessToken: string;
}