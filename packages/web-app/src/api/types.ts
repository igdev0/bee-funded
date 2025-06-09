export interface UserEntity {
  id: string;
  email: string;
  name: string;
  address: string;
  complete: string;
  created_at: string;
  updated_at: string;
}

export interface SignInPayload {
  signature: string;
  nonce: string;
  message: string;
  address: string;
}

export interface SignUpPayload extends SignInPayload {
  email: string;
  username: string;
  bio?: string;
  display_name?: string;
  is_creator?: boolean;
  categories?: string[];
  accepted_terms: boolean;
}

export interface SignOutput {
  accessToken: string;
}