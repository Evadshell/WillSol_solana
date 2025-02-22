/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { getProgramId, getProgram } from "../../../src/index";
import { Program, BN, web3 as anchorWeb3 } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useAnchorProvider } from "./AppWalletProvider";
import { useCluster } from "./cluster-data-access-exports";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export function useTokenProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const { publicKey } = useWallet();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = getProgram(provider);

  // Derive token state PDA
  const tokenStatePDA = useMemo(() => {
    if (!publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_state"), publicKey.toBuffer()],
      programId
    );
    return pda;
  }, [publicKey, programId]);

  // Derive mint PDA
  const mintPDA = useMemo(() => {
    if (!tokenStatePDA) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), tokenStatePDA.toBuffer()],
      programId
    );
    return pda;
  }, [tokenStatePDA, programId]);

  // Derive metadata PDA
  const metadataPDA = useMemo(() => {
    if (!mintPDA) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPDA.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    return pda;
  }, [mintPDA]);

  // Fetch token state
  const tokenState = useQuery({
    queryKey: ["tokenState", { cluster, tokenStatePDA }],
    queryFn: async () => {
      if (!tokenStatePDA) return null;
      return program.account.tokenState.fetch(tokenStatePDA);
    },
    enabled: !!tokenStatePDA,
  });

  // Initialize token state
  const initialize = useMutation({
    mutationKey: ["token", "initialize", { cluster }],
    mutationFn: async () => {
      if (!publicKey || !tokenStatePDA) throw new Error("Wallet not connected");
      
      return program.methods
        .initialize()
        .accounts({
          tokenState: tokenStatePDA,
          payer: publicKey,
          systemProgram: PublicKey.default,
        // systemProgram: SystemProgra.programId,    
    })
        .rpc();
    },
    onSuccess: () => {
      toast.success("Token state initialized");
      tokenState.refetch();
    },
    onError: (error: any) => {
      toast.error(`Initialization failed: ${error.message}`);
    },
  });

  // Create token
  const createToken = useMutation({
    mutationKey: ["token", "create", { cluster }],
    mutationFn: async (metadata: {
      name: string;
      symbol: string;
      uri: string;
    }) => {
      if (!publicKey || !tokenStatePDA || !mintPDA || !metadataPDA) {
        throw new Error("Accounts not ready");
      }

      return program.methods
        .createToken(metadata.name, metadata.symbol, metadata.uri)
        .accounts({
          token_state: tokenStatePDA,
          mintAccount: mintPDA,
          metadataAccount: metadataPDA,
          payer: publicKey,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: PublicKey.default,
          rent: anchorWeb3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
    },
    onSuccess: () => {
      toast.success("Token created successfully");
      tokenState.refetch();
    },
    onError: (error: any) => {
      toast.error(`Token creation failed: ${error.message}`);
    },
  });

  // Mint tokens
  const mintToken = useMutation({
    mutationKey: ["token", "mint", { cluster }],
    mutationFn: async (amount: number) => {
      if (!publicKey || !tokenStatePDA || !mintPDA) {
        throw new Error("Accounts not ready");
      }

      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPDA,
        publicKey
      );

      return program.methods
        .mintToken(new BN(amount))
        .accounts({
          tokentate: tokenStatePDA,
          mintAccount: mintPDA,
          associatedTokenAccount,
          payer: publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();
    },
    onSuccess: () => {
      toast.success("Tokens minted successfully");
      tokenState.refetch();
    },
    onError: (error: any) => {
      toast.error(`Minting failed: ${error.message}`);
    },
  });

  return {
    program,
    programId,
    tokenState,
    mintPDA,
    metadataPDA,
    initialize,
    createToken,
    mintToken,
  };
}

export function useTokenBalance() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { mintPDA } = useTokenProgram();

  return useQuery({
    queryKey: ["tokenBalance", { cluster: mintPDA?.toString(), publicKey }],
    queryFn: async () => {
      if (!publicKey || !mintPDA) return null;
      
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPDA,
        publicKey
      );
      
      const balance = await connection.getTokenAccountBalance(
        associatedTokenAccount
      );
      return balance.value.uiAmount;
    },
    enabled: !!publicKey && !!mintPDA,
  });
}