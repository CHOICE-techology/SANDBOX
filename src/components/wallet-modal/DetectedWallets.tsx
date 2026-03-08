import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { WalletEntry } from '@/data/walletRegistry';
import { WalletLogo } from './WalletLogo';
import { cn } from '@/lib/utils';

interface DetectedWalletsProps {
  wallets: WalletEntry[];
  connecting: string | null;
  successSet: Set<string>;
  onConnect: (walletId: string) => void;
}

const POPULARITY_RANK: Record<string, number> = {
  metamask: 1, phantom: 2, coinbase: 3, trust: 4, rainbow: 5, walletconnect: 6,
  rabby: 7, okx: 8, brave: 9, zerion: 10, exodus: 11, keplr: 12,
};

export const DetectedWallets: React.FC<DetectedWalletsProps> = ({
  wallets, connecting, successSet, onConnect,
}) => {
  if (wallets.length === 0) return null;

  // Pick only the single most popular detected wallet
  const best = [...wallets].sort((a, b) => {
    return (POPULARITY_RANK[a.id] ?? 999) - (POPULARITY_RANK[b.id] ?? 999);
  })[0];

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">
          Detected in your browser
        </span>
      </div>

      <button
        onClick={() => onConnect(best.id)}
        disabled={connecting === best.id}
        className={cn(
          "w-full flex items-center justify-between p-3.5 rounded-xl border",
          "border-primary/30 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20",
          "transition-all disabled:opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          <WalletLogo src={best.logo} name={best.name} size={32} className="rounded-lg" />
          <div className="flex flex-col items-start">
            <span className="font-bold text-sm text-foreground">{best.name}</span>
            <span className="text-[9px] text-muted-foreground font-medium">Ready to connect</span>
          </div>
        </div>
        {connecting === best.id ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : successSet.has(best.id) ? (
          <Check size={16} className="text-emerald-500" />
        ) : (
          <span className="text-xs font-black text-primary uppercase tracking-wider">Connect</span>
        )}
      </button>
    </div>
  );
};
