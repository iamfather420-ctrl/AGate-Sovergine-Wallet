import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, ComputeBudgetProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createCloseAccountInstruction } from '@solana/spl-token';
import bs58 from 'bs58';
import axios from 'axios';

// Public RPC, in production use a dedicated endpoint
export const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

export interface TokenAccountInfo {
  pubkey: PublicKey;
  mint: PublicKey;
  owner: PublicKey;
  amount: number;
  decimals: number;
}

export async function getSPLTokenAccounts(walletPubkey: PublicKey): Promise<TokenAccountInfo[]> {
  const response = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
    programId: TOKEN_PROGRAM_ID,
  });

  return response.value.map((accountInfo) => {
    const parsedInfo = accountInfo.account.data.parsed.info;
    return {
      pubkey: accountInfo.pubkey,
      mint: new PublicKey(parsedInfo.mint),
      owner: new PublicKey(parsedInfo.owner),
      amount: parsedInfo.tokenAmount.uiAmount,
      decimals: parsedInfo.tokenAmount.decimals,
    };
  });
}

export async function findEmptyTokenAccounts(walletPubkey: PublicKey): Promise<TokenAccountInfo[]> {
  const accounts = await getSPLTokenAccounts(walletPubkey);
  // Reclaimable accounts have 0 balance
  return accounts.filter((acc) => acc.amount === 0);
}

export async function reclaimEmptyAccounts(
  walletKeypair: Keypair,
  accountsToClose: TokenAccountInfo[],
  jitoTip: number = 10000 // default 10k lamports tip
) {
  if (accountsToClose.length === 0) return null;

  const transaction = new Transaction();
  
  // Dynamic Compute Budget
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: accountsToClose.length * 30000 + 10000,
    })
  );

  // Add Jito tip simulation via priority fee
  transaction.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: jitoTip,
    })
  );

  accountsToClose.forEach((acc) => {
    transaction.add(
      createCloseAccountInstruction(
        acc.pubkey, // account to close
        walletKeypair.publicKey, // destination for rent
        walletKeypair.publicKey // owner
      )
    );
  });

  const signature = await sendAndConfirmTransaction(connection, transaction, [walletKeypair]);
  return signature;
}

// Dust Aggregator with Jupiter v6
export async function swapDustToSOL(walletKeypair: Keypair, mint: PublicKey, amount: number) {
  try {
    // 1. Get quote
    const quoteResponse = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=${mint.toBase58()}&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippageBps=50`);
    
    // 2. Get swap transaction
    const { swapTransaction } = await axios.post('https://quote-api.jup.ag/v6/swap', {
      quoteResponse: quoteResponse.data,
      userPublicKey: walletKeypair.publicKey.toString(),
      wrapAndUnwrapSol: true,
    }).then(res => res.data);

    // 3. Deserialize and sign
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = Transaction.from(swapTransactionBuf);
    transaction.sign(walletKeypair);

    // 4. Send
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2
    });
    
    await connection.confirmTransaction(txid);
    return txid;
  } catch (error) {
    console.error("Jupiter Swap Failed", error);
    throw error;
  }
}
