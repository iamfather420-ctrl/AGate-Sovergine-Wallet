import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Shield, KeyRound, ArrowRight } from 'lucide-react';

export function LoginScreen() {
  const { createWallet, login } = useWallet();
  const [pk, setPk] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    try {
      setError('');
      login(pk);
    } catch (e) {
      setError('Invalid Private Key (must be base58 encoded)');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)] bg-[#050B14]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-emerald-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-mono text-emerald-400">Agate Sovereign</CardTitle>
          <CardDescription className="font-mono text-slate-400">
            Systemic Reclamation Engine v2.0
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <Button className="w-full font-monoh-12" variant="cyber" size="lg" onClick={createWallet}>
              GENERATE NEW SOVEREIGN IDENTITY
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#050B14] px-2 text-slate-500 font-mono">Or recover existing</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  placeholder="Base58 Private Key"
                  className="w-full bg-slate-900 border border-slate-800 rounded-md py-3 pl-10 pr-4 text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                  value={pk}
                  onChange={(e) => setPk(e.target.value)}
                />
              </div>
              {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
              <Button 
                className="w-full font-mono group" 
                variant="outline"
                onClick={handleImport}
                disabled={!pk}
              >
                IMPORT KEY <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <p className="text-[10px] text-slate-600 font-mono text-center pt-4">
              Local verification only. Keys never leave your browser.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
