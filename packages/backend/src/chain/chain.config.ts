import { registerAs } from '@nestjs/config';

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

export interface ContractConfig {
  address: string;
  abi: Abi[];
}

export interface ContractsConfig {
  BeeFundedCore: ContractConfig;
  SubscriptionManager: ContractConfig;
  DonationManager: ContractConfig;
  AutomationUpkeep: ContractConfig;
  TreasureManager: ContractConfig;
}

export interface ChainConfig {
  chainId: number;
  chainName: string;
  wsUrl: string;
  rpcUrl: string;
  explorerUrl: string;
  contracts: ContractsConfig;
}

export default registerAs(
  'chains',
  () =>
    [
      {
        chainName: 'contracts',
        rpcUrl: 'http://127.0.0.1:8545',
        wsUrl: 'ws://127.0.0.1:8545',
        chainId: 31337,
        explorerUrl: 'http://127.0.0.1:8545',
        contracts: {
          BeeFundedCore: {
            address: '0x58cF3AAd02CE9C9c6f8a3fDCe16E431186A1E6a1',
            abi: [
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: '_donationManagerAddress',
                    type: 'address',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'constructor',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'id',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'creator',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'metadataId',
                    type: 'uint256',
                  },
                ],
                name: 'DonationPoolCreated',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'newMetadataId',
                    type: 'uint256',
                  },
                ],
                name: 'PoolMetadataUpdated',
                type: 'event',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                name: 'balances',
                outputs: [
                  {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: '_valuationToken',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: '_cap',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: '_metadataId',
                    type: 'uint256',
                  },
                ],
                name: 'createPool',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [],
                name: 'currentPoolID',
                outputs: [
                  {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'tokenAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                name: 'decreaseTokenBalance',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                ],
                name: 'getPool',
                outputs: [
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'id',
                        type: 'uint256',
                      },
                      {
                        internalType: 'address',
                        name: 'owner',
                        type: 'address',
                      },
                      {
                        internalType: 'address',
                        name: 'valuationToken',
                        type: 'address',
                      },
                      {
                        internalType: 'uint256',
                        name: 'cap',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'metadataId',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'chainId',
                        type: 'uint256',
                      },
                    ],
                    internalType: 'struct IBeeFundedCore.Pool',
                    name: '',
                    type: 'tuple',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                ],
                name: 'getPoolOwner',
                outputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'tokenAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                name: 'increaseTokenBalance',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                  },
                ],
                name: 'pools',
                outputs: [
                  {
                    internalType: 'uint256',
                    name: 'id',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: 'valuationToken',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'cap',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'metadataId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'chainId',
                    type: 'uint256',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'newMetadataId',
                    type: 'uint256',
                  },
                ],
                name: 'updatePoolMetadataId',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
          },
          SubscriptionManager: {
            address: '0x0A082182e5Fe2498DD0c8306130DED843c9905B7',
            abi: [
              {
                inputs: [
                  {
                    internalType: 'contract IBeeFundedCore',
                    name: '_core',
                    type: 'address',
                  },
                  {
                    internalType: 'contract IDonationManager',
                    name: '_donationManager',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: '_automationUpKeepAddress',
                    type: 'address',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'constructor',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'subscriptionId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'subscriber',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'address',
                    name: 'beneficiary',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'interval',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'totalPayments',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'deadline',
                    type: 'uint256',
                  },
                ],
                name: 'SubscriptionCreated',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'subscriptionId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                ],
                name: 'Unsubscribed',
                type: 'event',
              },
              {
                inputs: [],
                name: 'core',
                outputs: [
                  {
                    internalType: 'contract IBeeFundedCore',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'donationManager',
                outputs: [
                  {
                    internalType: 'contract IDonationManager',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: 'index',
                    type: 'uint256',
                  },
                ],
                name: 'getSubscription',
                outputs: [
                  {
                    components: [
                      {
                        internalType: 'address',
                        name: 'subscriber',
                        type: 'address',
                      },
                      {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                      },
                      {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'nextPaymentTime',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'interval',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'poolId',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'remainingPayments',
                        type: 'uint256',
                      },
                      {
                        internalType: 'bool',
                        name: 'active',
                        type: 'bool',
                      },
                      {
                        internalType: 'uint256',
                        name: 'expiredAt',
                        type: 'uint256',
                      },
                    ],
                    internalType: 'struct ISubscriptionManager.Subscription',
                    name: '',
                    type: 'tuple',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'getSubscriptions',
                outputs: [
                  {
                    components: [
                      {
                        internalType: 'address',
                        name: 'subscriber',
                        type: 'address',
                      },
                      {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                      },
                      {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'nextPaymentTime',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'interval',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'poolId',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'remainingPayments',
                        type: 'uint256',
                      },
                      {
                        internalType: 'bool',
                        name: 'active',
                        type: 'bool',
                      },
                      {
                        internalType: 'uint256',
                        name: 'expiredAt',
                        type: 'uint256',
                      },
                    ],
                    internalType: 'struct ISubscriptionManager.Subscription[]',
                    name: '',
                    type: 'tuple[]',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                name: 'isSubscribedMap',
                outputs: [
                  {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: 'subscriber',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'interval',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'totalPayments',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'deadline',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint8',
                    name: 'v',
                    type: 'uint8',
                  },
                  {
                    internalType: 'bytes32',
                    name: 'r',
                    type: 'bytes32',
                  },
                  {
                    internalType: 'bytes32',
                    name: 's',
                    type: 'bytes32',
                  },
                ],
                name: 'subscribe',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                  },
                ],
                name: 'subscriptions',
                outputs: [
                  {
                    internalType: 'address',
                    name: 'subscriber',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'nextPaymentTime',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'interval',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'remainingPayments',
                    type: 'uint256',
                  },
                  {
                    internalType: 'bool',
                    name: 'active',
                    type: 'bool',
                  },
                  {
                    internalType: 'uint256',
                    name: 'expiredAt',
                    type: 'uint256',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '_subId',
                    type: 'uint256',
                  },
                ],
                name: 'unsubscribe',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '_subId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'bool',
                    name: '_active',
                    type: 'bool',
                  },
                  {
                    internalType: 'bool',
                    name: '_expired',
                    type: 'bool',
                  },
                  {
                    internalType: 'uint256',
                    name: '_remainingPayments',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: '_nextPaymentTime',
                    type: 'uint256',
                  },
                ],
                name: 'updateSubscription',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
          },
          DonationManager: {
            address: '0x64bcC240308db721179d67F8Fe70b2219EA7A5A0',
            abi: [
              {
                inputs: [
                  {
                    internalType: 'contract IBeeFundedCore',
                    name: '_core',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: '_automationUpKeepAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: '_subscriptionManagerAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'contract ITreasureManager',
                    name: '_treasureManager',
                    type: 'address',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'constructor',
              },
              {
                inputs: [],
                name: 'ReentrancyGuardReentrantCall',
                type: 'error',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'donor',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'string',
                    name: 'message',
                    type: 'string',
                  },
                ],
                name: 'DonationFailed',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'donor',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'string',
                    name: 'message',
                    type: 'string',
                  },
                  {
                    indexed: false,
                    internalType: 'bool',
                    name: 'recuring',
                    type: 'bool',
                  },
                ],
                name: 'DonationSuccess',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'donor',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                name: 'WithdrawFailed',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'donor',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                name: 'WithdrawSuccess',
                type: 'event',
              },
              {
                inputs: [],
                name: 'core',
                outputs: [
                  {
                    internalType: 'contract IBeeFundedCore',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'string',
                    name: 'message',
                    type: 'string',
                  },
                ],
                name: 'donateNative',
                outputs: [],
                stateMutability: 'payable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: 'donor',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'tokenAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                  {
                    internalType: 'string',
                    name: 'message',
                    type: 'string',
                  },
                  {
                    internalType: 'uint256',
                    name: 'deadline',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint8',
                    name: 'v',
                    type: 'uint8',
                  },
                  {
                    internalType: 'bytes32',
                    name: 'r',
                    type: 'bytes32',
                  },
                  {
                    internalType: 'bytes32',
                    name: 's',
                    type: 'bytes32',
                  },
                ],
                name: 'donateWithPermit',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '_poolId',
                    type: 'uint256',
                  },
                ],
                name: 'getDonations',
                outputs: [
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'poolId',
                        type: 'uint256',
                      },
                      {
                        internalType: 'address',
                        name: 'donor',
                        type: 'address',
                      },
                      {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                      },
                      {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'timestamp',
                        type: 'uint256',
                      },
                      {
                        internalType: 'enum IDonationManager.DonationType',
                        name: 'kind',
                        type: 'uint8',
                      },
                    ],
                    internalType: 'struct IDonationManager.Donation[]',
                    name: '',
                    type: 'tuple[]',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: 'donor',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'tokenAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                name: 'performSubscription',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'tokenAddress',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                name: 'withdraw',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
          },
          AutomationUpkeep: {
            address: '0xeAbAf20E15250E9dB81799e08bf16f820C293819',
            abi: [
              {
                inputs: [
                  {
                    internalType: 'contract ISubscriptionManager',
                    name: '_subscriptionManager',
                    type: 'address',
                  },
                  {
                    internalType: 'contract IBeeFundedCore',
                    name: '_core',
                    type: 'address',
                  },
                  {
                    internalType: 'contract IDonationManager',
                    name: '_donationManager',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: '_chainlinkRegistry',
                    type: 'address',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'constructor',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'subscriptionId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'subscriber',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'beneficiary',
                    type: 'address',
                  },
                ],
                name: 'SubscriptionExpired',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'subscriptionId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'subscriber',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'remainingPayments',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'nextPaymentTime',
                    type: 'uint256',
                  },
                ],
                name: 'SubscriptionPaymentFailed',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'subscriptionId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'address',
                    name: 'subscriber',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'remainingPayments',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'nextPaymentTime',
                    type: 'uint256',
                  },
                ],
                name: 'SubscriptionPaymentSuccess',
                type: 'event',
              },
              {
                inputs: [],
                name: 'chainlinkRegistry',
                outputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'bytes',
                    name: 'checkData',
                    type: 'bytes',
                  },
                ],
                name: 'checkUpkeep',
                outputs: [
                  {
                    internalType: 'bool',
                    name: 'upkeepNeeded',
                    type: 'bool',
                  },
                  {
                    internalType: 'bytes',
                    name: 'performData',
                    type: 'bytes',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'core',
                outputs: [
                  {
                    internalType: 'contract IBeeFundedCore',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'donationManager',
                outputs: [
                  {
                    internalType: 'contract IDonationManager',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'bytes',
                    name: 'performData',
                    type: 'bytes',
                  },
                ],
                name: 'performUpkeep',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [],
                name: 'subscriptionManager',
                outputs: [
                  {
                    internalType: 'contract ISubscriptionManager',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
            ],
          },
          TreasureManager: {
            address: '0xea6c86D8E470c72fe51fd189Fdad5b0443AC1ac2',
            abi: [
              {
                inputs: [
                  {
                    internalType: 'contract IBeeFundedCore',
                    name: '_beeFundedCore',
                    type: 'address',
                  },
                  {
                    internalType: 'contract IDonationManager',
                    name: '_donationManager',
                    type: 'address',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'constructor',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: 'target',
                    type: 'address',
                  },
                ],
                name: 'AddressEmptyCode',
                type: 'error',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: 'account',
                    type: 'address',
                  },
                ],
                name: 'AddressInsufficientBalance',
                type: 'error',
              },
              {
                inputs: [],
                name: 'FailedInnerCall',
                type: 'error',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                ],
                name: 'SafeERC20FailedOperation',
                type: 'error',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'treasureId',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                  },
                ],
                name: 'TreasureAirdropFailed',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'treasureId',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'address',
                    name: 'winner',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'enum ITreasureManager.TreasureKind',
                    name: 'kind',
                    type: 'uint8',
                  },
                ],
                name: 'TreasureAirdropSuccess',
                type: 'event',
              },
              {
                anonymous: false,
                inputs: [
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'poolId',
                    type: 'uint256',
                  },
                  {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'treasureId',
                    type: 'uint256',
                  },
                  {
                    indexed: false,
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    internalType: 'enum ITreasureManager.TreasureKind',
                    name: 'kind',
                    type: 'uint8',
                  },
                ],
                name: 'TreasureCreatedSuccess',
                type: 'event',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: 'to',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                name: '_safeERC20Transfer',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'address payable',
                    name: '_winner',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: '_poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: '_treasureId',
                    type: 'uint256',
                  },
                ],
                name: 'airdropTreasure',
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '_poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: '_token',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: '_tokenId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: '_amount',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: '_minBlockTime',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: '_minDonationTime',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: '_unlockOnNth',
                    type: 'uint256',
                  },
                  {
                    internalType: 'enum ITreasureManager.TreasureKind',
                    name: '_kind',
                    type: 'uint8',
                  },
                ],
                name: 'createTreasure',
                outputs: [],
                stateMutability: 'payable',
                type: 'function',
              },
              {
                inputs: [],
                name: 'getRandomNumber',
                outputs: [
                  {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'uint256',
                    name: '_poolId',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: '_donationNth',
                    type: 'uint256',
                  },
                ],
                name: 'getUnlockedTreasures',
                outputs: [
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'id',
                        type: 'uint256',
                      },
                      {
                        internalType: 'address',
                        name: 'owner',
                        type: 'address',
                      },
                      {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                      },
                      {
                        internalType: 'uint256',
                        name: 'tokenId',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                      },
                      {
                        internalType: 'bool',
                        name: 'transferred',
                        type: 'bool',
                      },
                      {
                        internalType: 'uint256',
                        name: 'minBlockTime',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'minDonationTime',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'unlockOnNth',
                        type: 'uint256',
                      },
                      {
                        internalType: 'enum ITreasureManager.TreasureKind',
                        name: 'kind',
                        type: 'uint8',
                      },
                    ],
                    internalType: 'struct ITreasureManager.Treasure[]',
                    name: '',
                    type: 'tuple[]',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: 'from',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256[]',
                    name: 'ids',
                    type: 'uint256[]',
                  },
                  {
                    internalType: 'uint256[]',
                    name: 'values',
                    type: 'uint256[]',
                  },
                  {
                    internalType: 'bytes',
                    name: 'data',
                    type: 'bytes',
                  },
                ],
                name: 'onERC1155BatchReceived',
                outputs: [
                  {
                    internalType: 'bytes4',
                    name: '',
                    type: 'bytes4',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                  {
                    internalType: 'address',
                    name: 'from',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'id',
                    type: 'uint256',
                  },
                  {
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256',
                  },
                  {
                    internalType: 'bytes',
                    name: 'data',
                    type: 'bytes',
                  },
                ],
                name: 'onERC1155Received',
                outputs: [
                  {
                    internalType: 'bytes4',
                    name: '',
                    type: 'bytes4',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'bytes4',
                    name: 'interfaceId',
                    type: 'bytes4',
                  },
                ],
                name: 'supportsInterface',
                outputs: [
                  {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                stateMutability: 'payable',
                type: 'receive',
              },
            ],
          },
        },
      },
    ] as ChainConfig[],
);
