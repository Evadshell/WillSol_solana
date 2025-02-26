/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { getProgramId, getProgram } from "../../../src/index";
import { Program, BN, web3 as anchorWeb3 } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useAnchorProvider } from "./AppWalletProvider";
import { useCluster } from "./cluster-data-access-exports";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export function useTokenProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const { publicKey } = useWallet();
  const provider = useAnchorProvider();
  
  // Fixed null check and type assertion
  const programId = useMemo(
    () => (cluster?.network ? getProgramId(cluster.network as Cluster) : null),
    [cluster]
  );
  
  // Only create program if provider exists
  const program = useMemo(() => {
    if (!provider) return null;
    return getProgram(provider);
  }, [provider]);

  // Derive token state PDA
  const tokenStatePDA = useMemo(() => {
    if (!publicKey || !programId) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_state"), publicKey.toBuffer()],
      programId
    );
    return pda;
  }, [publicKey, programId]);

  // Derive mint PDA - the original buffer was wrong
  const mintPDA = useMemo(() => {
    if (!publicKey || !programId) return null;
    // This should be a proper seed derivation according to your Anchor program
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      programId
    );
    return pda;
  }, [publicKey, programId]);

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
    queryKey: ["tokenState", { cluster: cluster?.network, tokenStatePDA: tokenStatePDA?.toString() }],
    queryFn: async () => {
      if (!tokenStatePDA || !program) return null;
      try {
        return program.account.tokenState.fetch(tokenStatePDA);
      } catch (error) {
        console.error("Error fetching token state:", error);
        return null;
      }
    },
    enabled: !!tokenStatePDA && !!program,
  });

  // Initialize token state
  const initialize = useMutation({
    mutationKey: ["token", "initialize", { cluster: cluster?.network }],
    mutationFn: async () => {
      if (!publicKey || !tokenStatePDA || !program) throw new Error("Wallet not connected or program not ready");
      
      return program.methods
        .initialize()
        .accounts({
          // tokenState: tokenStatePDA,
          payer: publicKey,
          // systemProgram: SystemProgram.programId,
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
    mutationKey: ["token", "create", { cluster: cluster?.network }],
    mutationFn: async (metadata: {
      name: string;
      symbol: string;
      uri: string;
    }) => {
      if (!publicKey || !tokenStatePDA || !mintPDA || !metadataPDA || !program) {
        throw new Error("Accounts not ready");
      }

      return program.methods
        .createToken(metadata.name, metadata.symbol, metadata.uri)
        .accounts({
          // tokenState: tokenStatePDA,
          mintAccount: mintPDA,
          // metadataAccount: metadataPDA,
          payer: publicKey,
          // tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          // tokenProgram: TOKEN_PROGRAM_ID,
          // systemProgram: SystemProgram.programId,
          // rent: anchorWeb3.SYSVAR_RENT_PUBKEY,
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
    mutationKey: ["token", "mint", { cluster: cluster?.network }],
    mutationFn: async (amount: number) => {
      if (!publicKey || !tokenStatePDA || !mintPDA || !program) {
        throw new Error("Accounts not ready");
      }

      try {
        const associatedTokenAccount = await getAssociatedTokenAddress(
          mintPDA,
          publicKey
        );

        return program.methods
          .mintToken(new BN(amount))
          .accounts({
            // tokenState: tokenStatePDA,
            mintAccount: mintPDA,
            // associatedTokenAccount,
            payer: publicKey,
            // tokenProgram: TOKEN_PROGRAM_ID,
            // associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            // systemProgram: SystemProgram.programId,
          })
          .rpc();
      } catch (error) {
        console.error("Error in mintToken:", error);
        throw error;
      }
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
    tokenStatePDA,
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
    queryKey: ["tokenBalance", { mintPDA: mintPDA?.toString(), publicKey: publicKey?.toString() }],
    queryFn: async () => {
      if (!publicKey || !mintPDA) return null;
      
      try {
        const associatedTokenAccount = await getAssociatedTokenAddress(
          mintPDA,
          publicKey
        );
        
        // Check if the token account exists
        const accountInfo = await connection.getAccountInfo(associatedTokenAccount);
        if (!accountInfo) {
          return 0; // Return 0 if the token account doesn't exist yet
        }
        
        const balance = await connection.getTokenAccountBalance(
          associatedTokenAccount
        );
        return balance.value.uiAmount;
      } catch (error) {
        console.error("Error fetching token balance:", error);
        return 0;
      }
    },
    enabled: !!publicKey && !!mintPDA && !!connection,
  });
}