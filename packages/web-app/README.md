<h1 align="center">
<img src="public/beefunded-logo-buzz.png" width="300">
</h1>

# 🐝 BeeFunded: A web3 donation platform.

> BeeFunded is a web3 platform that empowers creators to launch projects and connect with supporters.

# Table of contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)

# Features

# Overview

BeeFunded is a Web3-native funding platform that empowers creators to build sustainable, community-supported projects
through on-chain subscriptions, one-time donations, and targeted fundraising. Supporters can contribute using
permit-enabled tokens and earn rewards like NFTs or token airdrops. With features like customizable creator profiles,
funding analytics, milestone alerts, and $BEF-powered governance, BeeFunded makes creative work discoverable, fundable,
and rewarding for everyone involved.

# Features

- 👨🏼‍💻 **Creator Profile**: Showcase your work, customize your page, and engage your
  audience. [Read more](../../docs/core-features.md#-creator-profile)
- 🔃 **Subscriptions**: Enable recurring, permit-based support with on-chain
  tokens. [Read more](../../docs/core-features.md#-subscriptions)
- ⚡ **One-Time Donations**: Allow quick, flexible contributions without
  commitments. [Read more](../../docs/core-features.md#-easy-one-time-donation)
- 🎯 **Targeted Fundraising**: Create funding pools tied to specific content or
  tags. [Read more](../../docs/core-features.md#-targeted-fundraising)
- 🔍 **Pool Insights**: Access analytics on donations and performance over
  time. [Read more](../../docs/core-features.md#-pool-insights)
- 🎁 **Gifted Pools**: Reward contributors with automated token/NFT
  airdrops. [Read more](../../docs/core-features.md#-gifted-pools-rewarding-your-supporters)
- 📬 **Notifications**: Get real-time alerts for platform activity and
  contributions. [Read more](../../docs/core-features.md#-notifications)
- 🏅 **Project Spotlight**: Highlight top-voted projects via $BEF governance
  token. [Read more](../../docs/core-features.md#-project-spotlight)

# Architecture

![beefunded-architecture.png](public/beefunded-architecture.png)

# 🗒️ Prerequisites

- Node.js 20+
- Git
- MetaMask or other Web3 wallet
- Sepolia testnet ETH
- Testnet permit tokens

# 🚀 Installation

1. Clone the Repository

````
git clone https://github.com/igdev/bee-funded.git
cd bee-funded
````

2. Install Dependencies

````
yarn install
````

3. Environment Setup
````
# packages/backend directory
cp .env.example .env

# packages/web-app directory
cp .env.example .env.local
````
# Deployment
````
yarn start:dev
````

# Usage
Before following thru, ensure you have plenty of Sepolia ETH in your wallet (0.1 should be more than enough), and also ensure that you have some ERC20 token that inherits the Permit Token extension. 
1. Visit the [landing page](http://localhost:5173/)
2. Connect your wallet
3. Fill in the username and email fields and click "sign".
4. From the [onboarding / setting up initial pool](http://localhost:5173/onboarding/setup-initial-pool) screen click "I want to be funded" button. (this will initiate your very first donation pool).
5. Sign the transaction

# Challenges & Solutions

# Chainlink Integration

# Contributing

# License
