// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import IDL from "../target/idl/will_sol.json";
import type { WillSol } from "../target/types/will_sol";

export { WillSol, IDL };
export const PROGRAM_ID = new PublicKey(IDL.address);

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as WillSol, provider);
}
export function getProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
      return new PublicKey("EcGhLkbDw9rWoJXgwfQiJEy32THQftmVY3mQwKxY6xk1");
    case "testnet":
    case "mainnet-beta":
    default:
      return PROGRAM_ID;
  }
}
