import { registerAs } from '@nestjs/config';
import { ChainConfigI } from './chain-listener.interface';

export default registerAs('chain-listener', () => ({
  chains: [
    {
      chainId: 31337,
      name: 'hardhat',
      contracts: {
        Counter: {
          address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          abi: [
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: 'address',
                  name: 'addr',
                  type: 'address',
                },
                {
                  indexed: true,
                  internalType: 'uint256',
                  name: '_count',
                  type: 'uint256',
                },
              ],
              name: 'Decremented',
              type: 'event',
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: 'address',
                  name: 'addr',
                  type: 'address',
                },
                {
                  indexed: true,
                  internalType: 'uint256',
                  name: '_count',
                  type: 'uint256',
                },
              ],
              name: 'Incremented',
              type: 'event',
            },
            {
              inputs: [],
              name: 'count',
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
              inputs: [],
              name: 'decrement',
              outputs: [
                {
                  internalType: 'uint256',
                  name: '',
                  type: 'uint256',
                },
              ],
              stateMutability: 'nonpayable',
              type: 'function',
            },
            {
              inputs: [],
              name: 'increment',
              outputs: [
                {
                  internalType: 'uint256',
                  name: '',
                  type: 'uint256',
                },
              ],
              stateMutability: 'nonpayable',
              type: 'function',
            },
            {
              inputs: [],
              name: 'sayHello',
              outputs: [
                {
                  internalType: 'string',
                  name: '',
                  type: 'string',
                },
              ],
              stateMutability: 'pure',
              type: 'function',
            },
          ],
        },
      },
      wsUrl: 'ws://127.0.0.1:8545',
    },
  ] as ChainConfigI[],
}));
