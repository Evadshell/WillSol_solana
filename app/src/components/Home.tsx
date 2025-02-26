"use client"
import React, { useState } from 'react'
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTokenProgram, useTokenBalance } from "./data-access-exports";

const HomePage = () => {
  const { publicKey } = useWallet();
  const { 
    initialize, 
    createToken, 
    mintToken, 
    tokenState,
    mintPDA
  } = useTokenProgram();
  const tokenBalance = useTokenBalance();

  // State for form inputs
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenUri, setTokenUri] = useState('');
  const [mintAmount, setMintAmount] = useState(1);

  // Handle token creation
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName || !tokenSymbol || !tokenUri) {
      alert('Please fill out all token details');
      return;
    }
    
    try {
      await createToken.mutateAsync({
        name: tokenName,
        symbol: tokenSymbol,
        uri: tokenUri
      });
    } catch (error) {
      console.error('Error creating token:', error);
    }
  };

  // Handle token minting
  const handleMintToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mintAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    try {
      await mintToken.mutateAsync(mintAmount);
    } catch (error) {
      console.error('Error minting tokens:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white shadow-md p-4 mb-6 rounded-lg flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Solana Token Manager</h1>
          <WalletMultiButton />
        </header>

        {publicKey ? (
          <div className="space-y-6">
            {/* Token State Info */}
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Token Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Connected Wallet</p>
                  <p className="text-gray-800 font-mono text-sm truncate">{publicKey.toString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Token State</p>
                  <p className="text-gray-800">
                    {tokenState.isLoading ? "Loading..." : 
                     tokenState.data ? "Initialized" : "Not Initialized"}
                  </p>
                </div>
                {mintPDA && (
                  <div>
                    <p className="text-sm text-gray-500">Mint Address</p>
                    <p className="text-gray-800 font-mono text-sm truncate">{mintPDA.toString()}</p>
                  </div>
                )}
                {tokenBalance.data !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Token Balance</p>
                    <p className="text-gray-800 font-bold">{tokenBalance.data}</p>
                  </div>
                )}
              </div>

              {/* Initialize Button */}
              {!tokenState.data && (
                <button 
                  onClick={() => initialize.mutate()}
                  disabled={initialize.status === 'pending'}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-blue-300"
                >
                  {initialize.status === 'pending' ? "Initializing..." : "Initialize Token State"}
                </button>
              )}
            </div>

            {/* Create Token Form */}
            {tokenState.data && (
              <div className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Create Token</h2>
                <form onSubmit={handleCreateToken} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Token Name</label>
                    <input
                      type="text"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="My Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Token Symbol</label>
                    <input
                      type="text"
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="MTK"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Token URI</label>
                    <input
                      type="text"
                      value={tokenUri}
                      onChange={(e) => setTokenUri(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://example.com/metadata.json"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={createToken.status==='pending'}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:bg-green-300"
                  >
                    {createToken.status==='pending'  ? "Creating..." : "Create Token"}
                  </button>
                </form>
              </div>
            )}

            {/* Mint Token Form */}
            {mintPDA && (
              <div className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Mint Tokens</h2>
                <form onSubmit={handleMintToken} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Amount to Mint</label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={mintToken.status==='pending'}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:bg-purple-300"
                  >
                    {mintToken.status === 'pending' ? "Minting..." : "Mint Tokens"}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Please connect your Solana wallet to create and mint tokens.</p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;