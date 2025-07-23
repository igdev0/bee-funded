export interface Inputs {
  indexed: boolean;
  internalType: string;
  name: string;
  type: string;
}

export interface Abi {
  anonymous: boolean;
  inputs: Inputs[];
  name: string;
  type: string;
}

export interface ChainConfigI {
  name: string;
  chainId: number;
  wsUrl: string;
  contracts: {
    Counter: {
      address: string;
      abi: Abi[];
    };
  };
}
