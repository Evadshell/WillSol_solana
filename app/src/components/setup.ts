
// src/setup.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { useMemo } from 'react';
import idl from './will_sol.json';
import { useWallet } from '@solana/wallet-adapter-react';

const programID = new PublicKey(idl.address);
const network = 'https://api.devnet.solana.com';
const connection = new Connection(network, 'processed');

export function useProgram() {
    const wallet = useWallet();
    const provider = useMemo(() => {
        if (!wallet || !wallet.publicKey || !wallet.signTransaction) {
            return null;
        }
        return new AnchorProvider(connection, wallet as any, {});
    }, [wallet]);
    const program = useMemo(() => {
        if (!provider) return null;
        return new Program(idl as Idl, provider);
    }, [provider]);
    return { program, provider };
}


// import idl from "./will_sol.json";
// // import { AnchorProvider, Program, web3 } from "@project-serum/anchor";
// import { Connection, PublicKey } from "@solana/web3.js";
// import { AnchorProvider, Program } from "@coral-xyz/anchor";
// import type { WillSol } from "./will_sol";
// import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

// const PROGRAM_ID = new PublicKey(idl.address);
// const connection = new Connection("https://api.devnet.solana.com");
// // Retrieve the wallet instance from the wallet adapter
// const wallet = useAnchorWallet();

// // Create an Anchor provider
// const provider = new AnchorProvider(connection, wallet, {});
// setProvider(provider);

// // const connection = new Connection(network, "processed");

// // export const getProvider = (wallet: any) => {
// //   if (!wallet) return null;
// //   return new AnchorProvider(connection, wallet, {
// //     preflightCommitment: "processed",
// //   });
// // };

// // export const getProgram = (wallet: any) => {
// //   const provider = getProvider(wallet);
// //   if (!provider) return null;
// //   return new Program(idl as WillSol, provider);
// // };
