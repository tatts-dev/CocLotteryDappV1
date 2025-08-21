<img width="500" height="500" alt="ChanceOnChainLogo2" src="https://github.com/user-attachments/assets/4eb29a70-e0f1-4556-b3b8-b2e1d156ae6f" />  

# ChanceOnChain - Decentralized Lottery DApp

A decentralized lottery application built with React, Vite, and smart contracts. Players can enter the lottery by sending ETH, and the owner can pick a random winner who receives the entire prize pool.

## Features

- **Web3 Integration**: Connect with MetaMask wallet
- **Smart Contract Interaction**: Built on Ethereum blockchain
- **Lottery System**: 
  - Players enter by sending minimum 0.01 ETH
  - Owner can pick random winners
  - Winner receives entire prize pool
  - Lottery history tracking
- **Modern UI**: Built with React and styled with TailwindCSS
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Web3**: ethers.js v6
- **Smart Contract**: Solidity ^0.8.17
- **Routing**: React Router DOM
- **Styling**: TailwindCSS v4

## Prerequisites

- Node.js (v16 or higher)
- MetaMask browser extension
- Ethereum testnet ETH (for testing)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chancev1app
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start the development server**
   ```bash
   npm run dev
   ```
4. **Open your browser and navigate to**
   ```
   http://localhost:xxxx
   ```

## Smart Contract
The lottery smart contract is located in contracts/lotto.sol and includes:

- enter() : Players can enter the lottery (minimum 0.001 ETH)
- pickWinner() : Owner-only function to select a random winner
- getBalance() : View current prize pool
- getPlayers() : View all current players
- getWinnerByLottery() : View winner of specific lottery round

### Contract Address
The contract is deployed at: 0xA64A55ed006B390D21eB56E64188Cd246ca65909

## Available Scripts
- npm run dev - Start development server
- npm run build - Build for production
- npm run preview - Preview production build
- npm run lint - Run ESLint

## Environment Setup
1. MetaMask Configuration :
   
   - Install MetaMask browser extension
   - Connect to Ethereum testnet (Sepolia recommended)
   - Ensure you have testnet ETH for transactions
2. Network Configuration :
   
   - The app works with Ethereum mainnet and testnets
   - Make sure MetaMask is connected to the correct network


### License
This project is licensed under the MIT License.

### Disclaimer
This is a demonstration project. Use at your own risk. Always test thoroughly on testnets before deploying to mainnet.

### Author
Thato Mashifana / AfricasblockchainClub
