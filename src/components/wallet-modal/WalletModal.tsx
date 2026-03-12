import React, { useState, useEffect, useMemo } from 'react';
import { X, Shield } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useChoiceStore } from '@/store/useChoiceStore';
import { useWallet } from '@/contexts/WalletContext';
import { walletRegistry, getDetectedWallets } from '@/data/walletRegistry';
import { DetectedWallets } from './DetectedWallets';
import { SocialSignIn } from './SocialSignIn';
import { EmailSignIn } from './EmailSignIn';
import { WalletGrid } from './WalletGrid';
import { WalletSearchBar } from './WalletSearchBar';

export const WalletModal: React.FC = () => {
  const { isWalletModalOpen, setWalletModalOpen } = useChoiceStore();
  const { connect } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [successSet, setSuccessSet] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const detectedIds = useMemo(() => getDetectedWallets(), []);
  const detectedWallets = useMemo(
    () => walletRegistry.filter(w => detectedIds.has(w.id)),
    [detectedIds]
  );

  const filteredWallets = useMemo(() => {
    if (!search.trim()) return walletRegistry;
    const q = search.toLowerCase();
    return walletRegistry.filter(w => w.name.toLowerCase().includes(q));
  }, [search]);

  const handleConnect = async (id: string) => {
    setConnecting(id);
    try {
      const ok = await connect(id);
      if (ok) {
        setSuccessSet(prev => new Set(prev).add(id));
        setTimeout(() => setWalletModalOpen(false), 600);
      }
    } catch { /* handled in context */ }
    finally { setConnecting(null); }
  };

  const handleEmailConnect = async (email: string): Promise<boolean> => {
    setConnecting('email');
    try {
      const ok = await connect('email', { email });
      if (ok) {
        setTimeout(() => setWalletModalOpen(false), 600);
      }
      return ok;
    } catch { return false; }
    finally { setConnecting(null); }
  };

  // Reset state on close
  useEffect(() => {
    if (!isWalletModalOpen) {
      setConnecting(null);
      setSearch('');
    }
  }, [isWalletModalOpen]);

  return (
    <Dialog open={isWalletModalOpen} onOpenChange={setWalletModalOpen}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-border bg-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Shield size={20} className="text-primary" />
            <span className="text-base font-black tracking-tight text-foreground">
              CHOICE<span className="text-primary">iD</span>
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-0">
          <DetectedWallets
            wallets={detectedWallets}
            connecting={connecting}
            successSet={successSet}
            onConnect={handleConnect}
          />

          <SocialSignIn
            connecting={connecting}
            successSet={successSet}
            onConnect={handleConnect}
          />

          <EmailSignIn
            connecting={connecting}
            onConnect={handleEmailConnect}
          />

          <div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              Connect a wallet
            </span>
            <div className="mt-2.5">
              <WalletSearchBar value={search} onChange={setSearch} />
              <WalletGrid
                wallets={filteredWallets}
                connecting={connecting}
                successSet={successSet}
                detectedIds={detectedIds}
                onConnect={handleConnect}
                isSearching={!!search.trim()}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
