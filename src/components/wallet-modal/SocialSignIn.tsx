import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import googleLogo from '@/assets/logos/google.png';
import appleLogo from '@/assets/logos/apple.png';
import githubLogo from '@/assets/logos/github.png';
import telegramLogo from '@/assets/logos/telegram.png';
import discordLogo from '@/assets/logos/discord.png';
import xLogo from '@/assets/logos/x-twitter.png';

const socialProviders = [
  { id: 'google', name: 'Google', logo: googleLogo, tint: '221 83% 53%' },
  { id: 'x', name: 'X (Twitter)', logo: xLogo, tint: '222 47% 11%' },
  { id: 'apple', name: 'Apple', logo: appleLogo, tint: '222 47% 11%' },
  { id: 'discord', name: 'Discord', logo: discordLogo, tint: '235 86% 65%' },
  { id: 'telegram', name: 'Telegram', logo: telegramLogo, tint: '199 89% 48%' },
  { id: 'github', name: 'GitHub', logo: githubLogo, tint: '215 28% 17%' },
];

interface SocialSignInProps {
  connecting: string | null;
  successSet: Set<string>;
  onConnect: (providerId: string) => void;
}

export const SocialSignIn: React.FC<SocialSignInProps> = ({ connecting, successSet, onConnect }) => (
  <div className="mb-5">
    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
      Sign in with social
    </span>
    <p className="text-[9px] text-muted-foreground/70 mt-0.5 mb-2.5">
      A secure provider window opens for approval.
    </p>

    <div className="grid grid-cols-2 gap-2">
      {socialProviders.map((provider) => {
        const isLoading = connecting === provider.id;
        const isDone = successSet.has(provider.id);

        return (
          <button
            key={provider.id}
            onClick={() => onConnect(provider.id)}
            disabled={!!connecting || isDone}
            className={cn(
              'flex items-center justify-center gap-2.5 p-3 rounded-xl border transition-all text-sm font-bold disabled:opacity-60',
              isLoading && 'scale-[0.98]',
              isDone && 'border-emerald-300 bg-emerald-50/50 text-emerald-700'
            )}
            style={
              !isDone
                ? {
                    borderColor: `hsl(${provider.tint} / 0.35)`,
                    backgroundColor: isLoading ? `hsl(${provider.tint} / 0.18)` : `hsl(${provider.tint} / 0.10)`,
                    color: `hsl(${provider.tint})`,
                  }
                : undefined
            }
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : isDone ? (
              <Check size={16} className="text-emerald-500" />
            ) : (
              <img src={provider.logo} alt={provider.name} className="w-5 h-5 object-contain shrink-0" />
            )}
            <span className="leading-none">{provider.name}</span>
          </button>
        );
      })}
    </div>
  </div>
);
