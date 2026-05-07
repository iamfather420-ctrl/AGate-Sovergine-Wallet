import React, { useState } from 'react';
import { WalletProvider, useWallet } from './hooks/useWallet';
import { LoginScreen } from './components/LoginScreen';
import { DashboardTab } from './components/DashboardTab';
import { ScannerTab } from './components/ScannerTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { LayoutDashboard, Zap, LogOut } from 'lucide-react';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';

function MainApp() {
  const { wallet, logout } = useWallet();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!wallet) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row shadow-sm border-b border-slate-800 pb-4 items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono font-bold text-emerald-400 tracking-tight">AGATE SOVEREIGN</h1>
            <p className="text-sm font-mono text-slate-500">Systemic Reclamation Engine</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-slate-400 hover:text-red-400">
            <LogOut className="h-4 w-4 mr-2" /> Disconnect
          </Button>
        </header>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 flex rounded-lg w-full md:w-fit font-mono">
             <TabsTrigger 
               value="dashboard" 
               className={cn(
                 "flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm transition-all flex items-center justify-center",
                 activeTab === 'dashboard' ? "bg-slate-800 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
               )}
             >
               <LayoutDashboard className="h-4 w-4 mr-2" /> Assets
             </TabsTrigger>
             <TabsTrigger 
               value="scanner" 
               className={cn(
                 "flex-1 md:flex-none px-6 py-2.5 rounded-md text-sm transition-all flex items-center justify-center",
                 activeTab === 'scanner' ? "bg-emerald-500/10 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
               )}
             >
               <Zap className="h-4 w-4 mr-2" /> Reclamation Scanner
             </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="focus:outline-none animate-in fade-in-50 duration-500">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="scanner" className="focus:outline-none animate-in fade-in-50 duration-500">
            <ScannerTab />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
}

