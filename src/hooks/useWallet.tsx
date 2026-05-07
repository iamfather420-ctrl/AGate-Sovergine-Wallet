import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { connection } from '../lib/solana';

interface WalletContextType {
  wallet: Keypair | null;
  publicKey: PublicKey | null;
  solBalance: number;
  login: (privateKeyBase58: string) => void;
  createWallet: () => void;
  logout: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Keypair | null>(null);
  const [solBalance, setSolBalance] = useState<number>(0);

  useEffect(() => {
    const storedSecret = localStorage.getItem('sovereign_wallet_secret');
    if (storedSecret) {
      try {
        const keypair = Keypair.fromSecretKey(bs58.decode(storedSecret));
        setWallet(keypair);
      } catch (e) {
        console.error('Failed to load stored wallet', e);
      }
    }
  }, []);

  const refreshBalance = async () => {
    if (wallet) {
      const balance = await connection.getBalance(wallet.publicKey);
      setSolBalance(balance / 1e9); // convert lamports to SOL
    }
  };

  useEffect(() => {
    refreshBalance();
    if (wallet) {
      const id = connection.onAccountChange(wallet.publicKey, (info) => {
        setSolBalance(info.lamports / 1e9);
      });
      return () => {
        connection.removeAccountChangeListener(id);
      };
    }
  }, [wallet]);

  const login = (privateKeyBase58: string) => {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
      setWallet(keypair);
      localStorage.setItem('sovereign_wallet_secret', privateKeyBase58);
    } catch (e) {
      throw new Error('Invalid private key');
    }
  };

  const createWallet = () => {
    const keypair = Keypair.generate();
    setWallet(keypair);
    localStorage.setItem('sovereign_wallet_secret', bs58.encode(keypair.secretKey));
  };

  const logout = () => {
    setWallet(null);
    setSolBalance(0);
    localStorage.removeItem('sovereign_wallet_secret');
  };

  return (
    <WalletContext.Provider value={{ wallet, publicKey: wallet?.publicKey || null, solBalance, login, createWallet, logout, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
