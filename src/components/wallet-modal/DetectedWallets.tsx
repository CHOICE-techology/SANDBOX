import React from 'react';
import { Check, Loader2, Star } from 'lucide-react';
import { WalletEntry } from '@/data/walletRegistry';
import { cn } from '@/lib/utils';

interface DetectedWalletsProps {
  wallets: WalletEntry[];
  connecting: string | null;
  successSet: Set<string>;
  onConnect: (walletId: string) => void;
}

// Popular wallet IDs for priority ranking
const POPULAR_IDS = ['metamask', 'phantom', 'coinbase', 'trust', 'rainbow', 'walletconnect'];

export const DetectedWallets: React.FC<DetectedWalletsProps> = ({
  wallets,
  connecting,
  successSet,
  onConnect,
}) => {
  if (wallets.length === 0) return null;

  // Sort wallets: popular ones first, then alphabetically
  const sortedWallets = [...wallets].sort((a, b) => {
    const aPopular = POPULAR_IDS.indexOf(a.id);
    const bPopular = POPULAR_IDS.indexOf(b.id);
    if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
    if (aPopular !== -1) return -1;
    if (bPopular !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">
          Detected in your browser
        </span>
      </div>
      <div className="space-y-1.5">
        {sortedWallets.map((wallet) => {
          const isPopular = POPULAR_IDS.includes(wallet.id);
          return (
            <button
              key={wallet.id}
              onClick={() => onConnect(wallet.id)}
              disabled={connecting === wallet.id}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl border",
                isPopular
                  ? "border-primary/30 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20"
                  : "border-border bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
                "transition-all disabled:opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <img src={wallet.logo} alt={wallet.name} className="w-7 h-7 object-contain rounded-md" />
                <span className="font-bold text-sm text-foreground">{wallet.name}</span>
                {isPopular && (
                  <Star size={12} className="text-primary fill-primary" />
                )}
              </div>
              {connecting === wallet.id ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : successSet.has(wallet.id) ? (
                <Check size={16} className="text-emerald-500" />
              ) : (
                <span className="text-xs font-black text-primary uppercase tracking-wider">Connect</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
