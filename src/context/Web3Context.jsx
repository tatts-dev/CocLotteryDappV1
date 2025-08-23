import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

const CONTRACT_ADDRESS = '0x5Ec44e535e1634A478ca1b8bdF5cc1d9d6D92697';

const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "enter",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pickWinner", 
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "getBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPlayers",
		"outputs": [
			{
				"internalType": "address payable[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getRandomNumber",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "lottery",
				"type": "uint256"
			}
		],
		"name": "getWinnerByLottery",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "lotteryHistory",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lotteryId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "players",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const switchToSupportedNetwork = async () => {
    try {
    
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x8274f' }], 
      });
    } catch (switchError) {
     
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x8274f',
                chainName: 'Scroll Sepolia Testnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia-rpc.scroll.io/'],
                blockExplorerUrls: ['https://sepolia.scrollscan.com/'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Scroll Sepolia network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to Scroll Sepolia network');
      }
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }
      
      // Request account access first
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Check if current network is supported
      if (!SUPPORTED_NETWORKS[chainId]) {
        // Prompt user to switch network
        await switchToSupportedNetwork();
        // ✅ Recursively call connectWallet after network switch
        return await connectWallet();
      }
      
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      
      // Use network-specific contract address
      const contractAddress = SUPPORTED_NETWORKS[chainId].contractAddress;
      
      // Check if contract exists
      const contractCode = await provider.getCode(contractAddress);
      if (contractCode === '0x') {
        throw new Error(`Contract not deployed on ${SUPPORTED_NETWORKS[chainId].name}`);
      }
      
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      
      try {
        await contract.getBalance();
        await contract.owner();
      } catch (testError) {
        throw new Error('Contract methods not working - wrong ABI or contract');
      }
      
      setAccount(account);
      setProvider(provider);
      setContract(contract);
      
      console.log('Wallet connected successfully');
      
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    console.log('Disconnecting wallet...');
    setAccount(null);
    setContract(null);
    setProvider(null);
    setError(null);
  };

  useEffect(() => {
    // Handle account changes
    const handleAccountsChanged = (accounts) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]); // Only updates account, doesn't recreate contract
      }
    };

    // Handle chain changes
    const handleChainChanged = (chainId) => {
      console.log('Chain changed:', chainId);
      // Reload the page to reset the connection
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Cleanup event listeners
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const value = {
    account,
    contract,
    provider,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    setError,
    setLoading
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Around line 331 - Update SUPPORTED_NETWORKS contractAddress
const SUPPORTED_NETWORKS = {
  534351: { // Scroll Sepolia
    name: 'Scroll Sepolia',
    contractAddress: '0x5Ec44e535e1634A478ca1b8bdF5cc1d9d6D92697',
    rpcUrl: 'https://sepolia-rpc.scroll.io/',
    blockExplorer: 'https://sepolia.scrollscan.com'
  }
};
