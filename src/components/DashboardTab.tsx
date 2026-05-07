import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getSPLTokenAccounts, swapDustToSOL, TokenAccountInfo, connection } from '../lib/solana';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Coins, ArrowRightLeft, RefreshCw, Send, Download, Clock, Zap } from 'lucide-react';
import { TransactionSignature } from '@solana/web3.js';
import { formatDistanceToNow } from 'date-fns';

export function DashboardTab() {
  const { solBalance, publicKey, wallet, refreshBalance } = useWallet();
  const [tokens, setTokens] = useState<TokenAccountInfo[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      loadTokens();
      loadHistory();
    }
  }, [publicKey]);

  const loadTokens = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const allTokens = await getSPLTokenAccounts(publicKey);
      setTokens(allTokens.filter(t => t.amount > 0));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!publicKey) return;
    try {
      const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 5 });
      setHistory(sigs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwapDust = async (token: TokenAccountInfo) => {
    if (!wallet) return;
    setSwapping(token.mint.toBase58());
    try {
      const rawAmount = Math.floor(token.amount * Math.pow(10, token.decimals));
      await swapDustToSOL(wallet, token.mint, rawAmount);
      await loadTokens();
      await loadHistory();
      await refreshBalance();
    } catch (e) {
      console.error('Swap failed', e);
      alert('Swap failed. Note: Jupiter API might reject very small amounts or unknown tokens.');
    } finally {
      setSwapping(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 flex flex-col items-center justify-center space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-slate-400 font-mono">Sovereign Wallet Balance</p>
            <h2 className="text-5xl font-mono text-emerald-400">{solBalance.toFixed(4)} <span className="text-2xl text-slate-500">SOL</span></h2>
            <div className="bg-slate-950 px-4 py-2 mt-4 rounded-full border border-slate-800 text-xs font-mono text-slate-500 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {publicKey?.toBase58()}
            </div>
          </div>
          
          <div className="flex space-x-4 w-full max-w-sm">
            <Button variant="secondary" className="flex-1 font-mono hover:bg-slate-800" onClick={() => alert(`Receive to:\n${publicKey?.toBase58()}`)}>
              <Download className="mr-2 h-4 w-4" /> Receive
            </Button>
            <Button variant="outline" className="flex-1 font-mono" onClick={() => alert('Send feature initialized. Awaiting user input.')}>
              <Send className="mr-2 h-4 w-4" /> Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center">
              <Coins className="mr-2 h-5 w-5 text-emerald-500" /> Digital Assets
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadTokens} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
               <div className="text-center py-8 text-slate-500 font-mono text-sm border border-dashed border-slate-800 rounded-lg">
                 {loading ? 'Discovering assets...' : 'No SPL tokens found.'}
               </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex flex-col">
                       <span className="font-mono text-sm text-slate-300 truncate w-24 md:w-48" title={token.mint.toBase58()}>
                         {token.mint.toBase58().slice(0, 6)}...{token.mint.toBase58().slice(-6)}
                       </span>
                       <span className="text-lg font-mono text-slate-100">{token.amount}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="font-mono text-xs hover:text-emerald-400 hover:border-emerald-400 border-slate-700 bg-slate-900"
                      onClick={() => handleSwapDust(token)}
                      disabled={swapping !== null}
                    >
                      {swapping === token.mint.toBase58() ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Zap className="h-3 w-3 mr-1" /> Reclaim</>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-slate-400" /> History Network
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadHistory}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
               <div className="text-center py-8 text-slate-500 font-mono text-sm border border-dashed border-slate-800 rounded-lg">
                 No recent transactions found on the ledger.
               </div>
            ) : (
               <div className="space-y-3">
                 {history.map((tx, i) => (
                   <div key={i} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex justify-between items-center hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={() => window.open(`https://solscan.io/tx/${tx.signature}`, '_blank')}>
                     <div className="flex flex-col overflow-hidden mr-4">
                       <span className="font-mono text-xs text-emerald-400 truncate w-full">
                         {tx.signature.slice(0, 16)}...
                       </span>
                       <span className="text-xs text-slate-500 flex items-center mt-1">
                          {tx.err ? <span className="text-red-400 mr-2 border border-red-500/30 bg-red-500/10 px-1 rounded">Failed</span> : <span className="text-emerald-400 mr-2 border border-emerald-500/30 bg-emerald-500/10 px-1 rounded">Success</span>}
                          {tx.blockTime ? formatDistanceToNow(new Date(tx.blockTime * 1000), { addSuffix: true }) : 'Pending'}
                       </span>
                     </div>
                     <ArrowRightLeft className="h-4 w-4 text-slate-600 flex-shrink-0" />
                   </div>
                 ))}
                 <Button variant="link" className="w-full text-xs font-mono text-slate-500" onClick={() => window.open(`https://solscan.io/account/${publicKey?.toBase58()}`, '_blank')}>
                   View full ledger on Solscan
                 </Button>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
