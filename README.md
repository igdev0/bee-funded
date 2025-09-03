<h1 align="center">
<img src="docs/beefunded-logo-buzz.png" width="200">
</h1>

# BeeFunded: A web3 DApp for Community-Powered Support

## Why?
Empowering communities to fund, support, and reward creators through transparent, decentralized tools.

> The DApp is built with **React**, **Ethereum**, and **NestJS**. Key features include:

- Pool donations & subscriptions
- Treasure pool management
- NFT minting and marketplace
- Private text and video content
- User honor system
- Real-time notification system


## Stack

**Frontend**: TypeScript, Vite, React, Redux-Toolkit, React-Query, Wagmi, Viem, Jest and TailwindCSS,

**OnChain**: TypeScript, Hardhat, Solidity, OpenZeppelin, Chainlink.  

**Backend**: NestJS, TypeORM and EthersJS, Jest.

## Architecture

**Frontend**: Feature-Driven Development – Each feature (e.g., donations, NFTs, notifications) has its own folder containing its components, hooks, state, and tests.

**OnChain:** Modular & Composable Smart Contracts – Each contract handles a specific domain (e.g., donations, subscriptions, treasures) and interacts with others to form an integrated system.

**Backend**: Layered approach – controllers → services → repositories, which is closer to Clean Architecture than traditional MVC. 
