import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Counter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const counterAbi = [
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
      {
        name: '_count',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Decremented',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
      {
        name: '_count',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Incremented',
  },
  {
    type: 'function',
    inputs: [],
    name: 'count',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decrement',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'increment',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'sayHello',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
] as const

/**
 *
 */
export const counterAddress = {
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
} as const

/**
 *
 */
export const counterConfig = {
  address: counterAddress,
  abi: counterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link counterAbi}__
 *
 *
 */
export const useReadCounter = /*#__PURE__*/ createUseReadContract({
  abi: counterAbi,
  address: counterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link counterAbi}__ and `functionName` set to `"count"`
 *
 *
 */
export const useReadCounterCount = /*#__PURE__*/ createUseReadContract({
  abi: counterAbi,
  address: counterAddress,
  functionName: 'count',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link counterAbi}__ and `functionName` set to `"sayHello"`
 *
 *
 */
export const useReadCounterSayHello = /*#__PURE__*/ createUseReadContract({
  abi: counterAbi,
  address: counterAddress,
  functionName: 'sayHello',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link counterAbi}__
 *
 *
 */
export const useWriteCounter = /*#__PURE__*/ createUseWriteContract({
  abi: counterAbi,
  address: counterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link counterAbi}__ and `functionName` set to `"decrement"`
 *
 *
 */
export const useWriteCounterDecrement = /*#__PURE__*/ createUseWriteContract({
  abi: counterAbi,
  address: counterAddress,
  functionName: 'decrement',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link counterAbi}__ and `functionName` set to `"increment"`
 *
 *
 */
export const useWriteCounterIncrement = /*#__PURE__*/ createUseWriteContract({
  abi: counterAbi,
  address: counterAddress,
  functionName: 'increment',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link counterAbi}__
 *
 *
 */
export const useSimulateCounter = /*#__PURE__*/ createUseSimulateContract({
  abi: counterAbi,
  address: counterAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link counterAbi}__ and `functionName` set to `"decrement"`
 *
 *
 */
export const useSimulateCounterDecrement =
  /*#__PURE__*/ createUseSimulateContract({
    abi: counterAbi,
    address: counterAddress,
    functionName: 'decrement',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link counterAbi}__ and `functionName` set to `"increment"`
 *
 *
 */
export const useSimulateCounterIncrement =
  /*#__PURE__*/ createUseSimulateContract({
    abi: counterAbi,
    address: counterAddress,
    functionName: 'increment',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link counterAbi}__
 *
 *
 */
export const useWatchCounterEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: counterAbi,
  address: counterAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link counterAbi}__ and `eventName` set to `"Decremented"`
 *
 *
 */
export const useWatchCounterDecrementedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: counterAbi,
    address: counterAddress,
    eventName: 'Decremented',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link counterAbi}__ and `eventName` set to `"Incremented"`
 *
 *
 */
export const useWatchCounterIncrementedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: counterAbi,
    address: counterAddress,
    eventName: 'Incremented',
  })
