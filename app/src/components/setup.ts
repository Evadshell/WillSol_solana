

import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, setProvider } from "@coral-xyz/anchor";
import idl from "../../../target/idl/will_sol.json"
import type {WillSol} from "../../../target/types/will_sol"

const { connection } = useConnection();
const wallet = useAnchorWallet();

const provider = new AnchorProvider(connection, wallet, {});
setProvider(provider);

const program = new Program(idl as WillSol);

// we can also explicitly mention the provider
// const program = new Program(idl as WillSol, provider);