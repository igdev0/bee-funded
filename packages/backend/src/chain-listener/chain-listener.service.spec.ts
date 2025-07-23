import { ChainListenerService } from './chain-listener.service';
import { Mocked, TestBed } from '@suites/unit';
import { ChainConfigI } from './chain-listener.interface';
import { ConfigService } from '@nestjs/config';
import { ethers, WebSocketProvider } from 'ethers';
import { UserService } from '../user/user.service';

type CallbackFnType = (address: string, value: string) => Promise<void>;
const config = {
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
};
const contractOnFn = jest.fn();
jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn().mockImplementation(() => ({
      on: contractOnFn,
    })),
  },
  WebSocketProvider: jest.fn(),
}));

describe('ChainListenerService', () => {
  let service: ChainListenerService;
  let configService: Mocked<ConfigService>;
  let userService: Mocked<UserService>;

  beforeEach(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(ChainListenerService).compile();
    service = unit;
    configService = unitRef.get(ConfigService);
    userService = unitRef.get(UserService);

    configService.get.mockImplementation(
      (key: string) => config[key.split('.')[1]],
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('On module initialization', () => {
    let chains: ChainConfigI[] = [];
    const address = '0x000';
    beforeEach(async () => {
      await service.onModuleInit();
      chains = configService.get<ChainConfigI[]>(
        'chain-listener.chains',
      ) as ChainConfigI[];

      for (const [eventName, cb] of contractOnFn.mock.calls as [
        string,
        CallbackFnType,
      ][]) {
        switch (eventName) {
          case 'Incremented':
            await cb(address, '42');
            break;
          case 'Decrement':
            await cb(address, '41');
            break;
        }
      }
    });

    it('should initialize WS provider from config url ', () => {
      for (const chain of chains) {
        expect(WebSocketProvider).toHaveBeenCalledWith(chain.wsUrl);
      }
    });

    it('should create a new contract from config', () => {
      for (const chain of chains) {
        const provider = new WebSocketProvider(chain.wsUrl);
        expect(ethers.Contract).toHaveBeenCalledWith(
          chain.contracts.Counter.address,
          chain.contracts.Counter.abi,
          provider,
        );
      }
    });

    it('should listen to "Increment" event', () => {
      expect(contractOnFn).toHaveBeenCalledWith(
        'Incremented',
        expect.any(Function),
      );
    });

    it('should listen to "Decrement" event', () => {
      expect(contractOnFn).toHaveBeenCalledWith(
        'Incremented',
        expect.any(Function),
      );
    });

    it('should listen to "Decrement" event', () => {
      expect(contractOnFn).toHaveBeenCalledWith(
        'Incremented',
        expect.any(Function),
      );
    });

    it('should look for a user once an onchain event is fired', () => {
      expect(userService.findOneByWalletAddress).toHaveBeenCalledWith(address);
    });
  });
});
