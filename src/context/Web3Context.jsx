import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

const CONTRACT_ADDRESS = '0xA64A55ed006B390D21eB56E64188Cd246ca65909';

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

  
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      
      // 🔍 CRITICAL DEBUGGING - Check network and contract
      const network = await provider.getNetwork();
      console.log('🌐 Connected to network:', network.chainId, network.name);
      
      // Check if contract exists
      const contractCode = await provider.getCode(CONTRACT_ADDRESS);
      console.log('📄 Contract code exists:', contractCode !== '0x');
      console.log('📄 Contract code length:', contractCode.length);
      
      if (contractCode === '0x') {
        throw new Error(`No contract found at ${CONTRACT_ADDRESS} on network ${network.name}`);
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // 🧪 Test contract methods
      try {
        console.log('🧪 Testing contract methods...');
        const balance = await contract.getBalance();
        console.log('✅ getBalance works:', ethers.formatEther(balance));
        
        const owner = await contract.owner();
        console.log('✅ owner works:', owner);
        
        // 🔍 CRITICAL: Check if enter method exists
        console.log('🔍 Checking enter method...');
        console.log('📋 Contract enter function:', typeof contract.enter);
        console.log('📋 Contract pickWinner function:', typeof contract.pickWinner);
        
      } catch (testError) {
        console.error('❌ Contract method test failed:', testError);
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
        setAccount(accounts[0]);
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