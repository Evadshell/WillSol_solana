"use client";
import React, { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useProgram } from "./setup";
import { PublicKey } from "@solana/web3.js";
import { ProgramAccount } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
const HomePage = () => {
  const { program, provider } = useProgram();
  const { publicKey } = useWallet();
  const createToken = async () => {
    try {
      await program?.methods
        .createToken(
          "test",
          "tst",
          "https://evadshell.github.io/json_data/metadata.json"
        )
        .accounts({
          payer: publicKey!,
        })
        .rpc();
      console.log("hogaya lol");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div>
      <WalletMultiButton />
      <button onClick={createToken}>Crate Token</button>
    </div>
  );
};

export default HomePage;
