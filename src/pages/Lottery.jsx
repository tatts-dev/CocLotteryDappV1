import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const Lottery = () => {
  
  const { account, contract, connectWallet, loading, error, setError, setLoading } = useWeb3();
  
  useEffect(() => {
    console.log('Lottery component state:', { account, contract, loading, error });
  }, [account, contract, loading, error]);
  
  <button
    onClick={() => {
      console.log('Connect wallet button clicked');
      connectWallet().catch(err => {
        console.error('Connect wallet failed:', err);
      });
    }}
    disabled={loading}
    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 sm:px-8 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 active:scale-95"
  >
    {loading ? 'Connecting...' : 'Connect Wallet'}
  </button>
  const [lotteryData, setLotteryData] = useState({
    lotteryId: 0,
    balance: '0',
    players: [],
    previousWinner: null,
    owner: null
  });
  const [entryAmount, setEntryAmount] = useState('0.00001');
 
  const [enterLoading, setEnterLoading] = useState(false);
  const [pickWinnerLoading, setPickWinnerLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchLotteryData = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const [lotteryId, balance, players, owner] = await Promise.all([
        contract.lotteryId(),
        contract.getBalance(),
        contract.getPlayers(),
        contract.owner()
      ]);
      
      let previousWinner = null;
      if (lotteryId > 1) {
        try {
          previousWinner = await contract.getWinnerByLottery(lotteryId - 1n);
        } catch (err) {
          console.log('No previous winner found');
        }
      }
      
      setLotteryData({
        lotteryId: lotteryId.toString(),
        balance: ethers.formatEther(balance),
        players,
        previousWinner,
        owner
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkContractState = async () => {
    if (!contract) return;
    
    try {
      console.log('=== CONTRACT STATE CHECK ===');
      
      const balance = await contract.getBalance();
      const players = await contract.getPlayers();
      const lotteryId = await contract.lotteryId();
      const owner = await contract.owner();
      
      console.log('Contract Balance:', ethers.formatEther(balance), 'ETH');
      console.log('Current Players:', players.length);
      console.log('Player addresses:', players);
      console.log('Lottery ID:', lotteryId.toString());
      console.log('Contract Owner:', owner);
      console.log('Your Address:', account);
      console.log('Are you owner?', owner.toLowerCase() === account.toLowerCase());
      
      if (players.length === 0) {
        console.log('✓ No players yet - you can be the first!');
      } else {
        console.log(`✓ ${players.length} players already in lottery`);
      }
      
      return {
        balance: ethers.formatEther(balance),
        playersCount: players.length,
        lotteryId: lotteryId.toString(),
        owner,
        isOwner: owner.toLowerCase() === account.toLowerCase()
      };
      
    } catch (err) {
      console.error('Contract state check failed:', err);
      return null;
    }
  };
  
  const enterLottery = async () => {
    if (!contract || !entryAmount) return;
    
    try {
      setEnterLoading(true);
      
      const entryValue = parseFloat(entryAmount);
      if (entryValue <= 0) {
        showNotification('Please enter a valid amount greater than 0', 'error');
        return;
      }
      
      if (entryValue <= 0.0001) {
        showNotification('Minimum entry amount is 0.0001 ETH. Please increase your entry amount.', 'error');
        return;
      }
      
      console.log('=== ENTERING LOTTERY ===');
      console.log('Entry amount:', entryAmount, 'ETH');
      console.log('Contract address:', contract.target || contract.address);
      
      console.log('Calling contract.enter()');
  
      const gasEstimate = await contract.enter.estimateGas({
        value: ethers.parseEther(entryAmount.toString())
      });
      
      console.log('Gas estimate for ENTER function:', gasEstimate.toString());
      
      const tx = await contract.enter({
        value: ethers.parseEther(entryAmount.toString()),
        gasLimit: gasEstimate * 120n / 100n 
      });
      
      showNotification('Transaction submitted! Waiting for confirmation...', 'info');
      console.log('Transaction hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Successfully entered lottery!', receipt);
      
      showNotification('Successfully entered the lottery!', 'success');
      await fetchLotteryData();
      
    } catch (err) {
      console.error('=== ENTER LOTTERY ERROR ===');
      console.error('Full error:', err);
      
      let errorMessage = 'Failed to enter lottery';
      let errorType = 'error';
      
      // Handle specific error cases with user-friendly messages
      if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds! You need more ETH in your wallet to cover the entry amount plus gas fees.';
      } else if (err.code === 'USER_REJECTED' || err.code === 4001) {
        errorMessage = 'Transaction cancelled. You rejected the transaction in MetaMask.';
        errorType = 'info';
      } else if (err.code === -32603 || err.message?.includes('could not coalesce error') || err.message?.includes('Cannot use \'in\' operator')) {
        errorMessage = 'Transaction submitted. Please wait for it to be processed or reload the page once';
      } else if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') {
        errorMessage = 'Network timeout. Please wait a moment and try again.';
      } else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Unable to estimate gas fees. Please try again in a few minutes.';
      } else if (err.reason) {
        // Handle contract-specific errors
        if (err.reason.includes('insufficient funds')) {
          errorMessage = 'Transaction submitted. Please wait for it to be processed or reload the page once';
        } else if (err.reason.includes('gas')) {
          errorMessage = 'Gas estimation failed. Try increasing your gas limit in MetaMask or wait for network congestion to reduce.';
        } else {
          errorMessage = `Contract Error: ${err.reason}. Please check the transaction requirements and try again.`;
        }
      }
      
      showNotification(errorMessage, errorType);
    } finally {
      setEnterLoading(false);
    }
  };

  const pickWinner = async () => {
    if (!contract) return;
    
    if (lotteryData.players.length === 0) {
      showNotification('No players in the lottery yet!', 'error');
      return;
    }
    
    if (!isOwner) {
      showNotification('Only the contract owner can pick a winner!', 'error');
      return;
    }
    
    try {
      setPickWinnerLoading(true); 

      const gasEstimate = await contract.pickWinner.estimateGas();
      console.log('Gas estimate:', gasEstimate.toString());
      
      const tx = await contract.pickWinner();
      
      showNotification('Picking winner... Please wait for confirmation.', 'info');
      await tx.wait();
      
      showNotification('Winner picked successfully!', 'success');
      await fetchLotteryData();
    } catch (err) {
      console.error('Pick winner error:', err);

      if (err.code === 'CALL_EXCEPTION') {
        showNotification('Transaction failed: Contract requirements not met. Check if you are the owner and there are players in the lottery.', 'error');
      } else {
        showNotification(`Error: ${err.message}`, 'error');
      }
    } finally {
      setPickWinnerLoading(false); 
    }
  };

  useEffect(() => {
    if (contract) {
      fetchLotteryData();
    }
  }, [contract]);

  const isOwner = account && lotteryData.owner && account.toLowerCase() === lotteryData.owner.toLowerCase();

  
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100">
      {/* Top Bar Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            {/* Logo and ChanceonChain Text */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src="/logo.png" alt="Chance On Chain" className="h-16 w-auto sm:h-18 md:h-20 lg:h-22 xl:h-24 drop-shadow-md" />
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-white bg-clip-text text-transparent tracking-tight">
                ChanceOnChain
              </h1>
            </div>
            
            {/* Connected Wallet on Right */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {account ? (
                <div className="bg-gradient-to-r from-purple-100 to-purple-200 px-3 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-purple-800 shadow-md">
                  <span className="hidden sm:inline">Connected: </span>
                  {account.slice(0, 4)}...{account.slice(-4)}
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 sm:px-8 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 active:scale-95"
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {!account ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md mx-auto border border-purple-100 hover:shadow-3xl hover:shadow-purple-500/10 transition-all duration-500 w-full">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Connect Your Wallet to Continue
                </h2>
                <p className="text-gray-600 mb-8 sm:mb-10 text-base sm:text-lg font-light">
                  You need to connect your MetaMask wallet to participate in the lottery.
                </p>
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 active:scale-95"
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Card 1: Lottery Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border border-purple-100 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer group">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 group-hover:text-purple-700 transition-colors duration-300">Lottery Information</h2>
              {loading ? (
                <div className="space-y-4">
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-purple-100 gap-2 sm:gap-0">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">Current Lottery Round:</span>
                    <span className="font-bold text-lg sm:text-xl text-gray-900">{lotteryData.lotteryId}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-purple-100 gap-2 sm:gap-0">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">Lottery Balance:</span>
                    <span className="font-bold text-lg sm:text-xl text-purple-700">{lotteryData.balance} ETH</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 gap-2 sm:gap-0">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">Number of Players:</span>
                    <span className="font-bold text-lg sm:text-xl text-gray-900">{lotteryData.players.length}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Previous Winner */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border border-purple-100 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer group">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 group-hover:text-purple-700 transition-colors duration-300">Previous Winner</h2>
              {loading ? (
                <LoadingSkeleton />
              ) : lotteryData.previousWinner ? (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-purple-200">
                  <p className="text-xs sm:text-sm font-mono text-purple-800 break-all font-medium leading-relaxed">
                    {lotteryData.previousWinner}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 sm:h-32">
                  <p className="text-gray-500 text-center font-light text-sm sm:text-base">No previous winner yet</p>
                </div>
              )}
            </div>

            {/* Card 3: Players List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border border-purple-100 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer group">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 group-hover:text-purple-700 transition-colors duration-300">Current Players</h2>
              {loading ? (
                <div className="space-y-2">
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                </div>
              ) : lotteryData.players.length === 0 ? (
                <div className="flex items-center justify-center h-24 sm:h-32">
                  <p className="text-gray-500 text-center font-light text-sm sm:text-base">No players yet. Be the first to enter!</p>
                </div>
              ) : (
                <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-50">
                  {lotteryData.players.map((player, index) => (
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-300">
                      <p className="text-xs sm:text-sm font-mono text-purple-800 break-all font-medium">{player}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 4: Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border border-purple-100 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer group">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 group-hover:text-purple-700 transition-colors duration-300">Actions</h2>
              
              {/* Enter Lottery Section */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Entry Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-purple-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-base sm:text-lg bg-white/80 backdrop-blur-sm transition-all duration-300"
                  placeholder="0.00001"
                />
                <button
                  onClick={enterLottery}
                  disabled={enterLoading || !entryAmount}
                  className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 active:scale-95"
                >
                  {enterLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                      Processing...
                    </div>
                  ) : (
                    'Enter Lottery'
                  )}
                </button>
              </div>

              {/* Pick Winner Section (Owner Only) */}
              {isOwner && (
                <div className="pt-4 sm:pt-6 border-t border-purple-200">
                  <button
                    onClick={pickWinner}
                    disabled={pickWinnerLoading || lotteryData.players.length === 0}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-red-500/25 disabled:opacity-50 active:scale-95"
                  >
                    {pickWinnerLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                        Processing...
                      </div>
                    ) : (
                      'Pick Winner'
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 sm:mt-3 text-center font-medium">
                    Only available to contract owner
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl z-50 max-w-xs sm:max-w-sm transition-all duration-300 backdrop-blur-sm border ${
          notification.type === 'success' ? 'bg-green-500/90 border-green-400' :
          notification.type === 'error' ? 'bg-red-500/90 border-red-400' : 'bg-blue-500/90 border-blue-400'
        } text-white`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-semibold text-sm sm:text-base leading-tight">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-3 sm:ml-4 text-white hover:text-gray-200 text-lg sm:text-xl font-bold transition-colors duration-200 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lottery;