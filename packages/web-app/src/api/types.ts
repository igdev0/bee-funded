export interface UserEntity {
  id: string;
  email: string;
  name: string;
  username: string;
  address: string;
  complete: boolean;
  is_creator: boolean | null;
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

export interface UserExistsPayload {
  address?: string;
  email?: string;
  username?: string;
}


// Donation pools

export interface DonationPoolEntity {
  id: string;
  user: string; // or: User if you're referencing the full object elsewhere
  title: string;
  on_chain_pool_id: number | null;
  description: string;
  card_image: string;
  tx_hash: string;
  max_amount?: number;
  max_amount_token: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateDonationPoolPayload {
  id: string;
  title?: string
  description?: string
  card_image?: string
  tx_hash?: string
  on_chain_pool_id?: number
}