import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  const handleEnterApp = () => {
    navigate('/lottery');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-purple-100 to-purple-200 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-4xl mx-auto w-full">
        {/* Centered Logo - Made Even Bigger */}
        <div className="mb-8 sm:mb-12">
          <img 
            src="/logo.png" 
            alt="Chance On Chain Logo" 
            className="mx-auto h-40 w-auto sm:h-48 md:h-56 lg:h-64 xl:h-72 drop-shadow-lg"
          />
        </div>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight">
          Welcome to ChanceOnChain
        </h1>
        
        {/* Subheading */}
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 mb-12 sm:mb-16 font-light max-w-3xl mx-auto">
          Decentralized Lottery powered by Blockchain Technology!

        </p>
        
        <button
          onClick={handleEnterApp}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-8 sm:py-5 sm:px-12 rounded-2xl text-lg sm:text-xl md:text-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 shadow-xl active:scale-95 w-full sm:w-auto max-w-xs mx-auto"
        >
          Enter the App
        </button>
      </div>
    </div>
  );
};

export default Welcome;