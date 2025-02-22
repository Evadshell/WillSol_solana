"use client";

import React, { useMemo } from "react";
import {
  AnchorWallet,
  ConnectionProvider,
  useConnection,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
// import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import dynamic from "next/dynamic";
import { AnchorProvider } from "@coral-xyz/anchor";
export const WalletButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);
export default function AppWalletProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(
      () => [
        // manually add any legacy wallet adapters here
        // new UnsafeBurnerWalletAdapter(),
      ],
      [],
    );
  
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    );
  }

  export function useAnchorProvider() {
    const { connection } = useConnection();
    const wallet = useWallet();
  
    return new AnchorProvider(connection, wallet as AnchorWallet, {
      commitment: 'confirmed',
    });
  }