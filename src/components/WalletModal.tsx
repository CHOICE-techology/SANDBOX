import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, Shield, Check, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { addCredential } from '@/services/storageService';
import { mockConnectSocial, mockUploadToIPFS } from '@/services/cryptoService';
import { VerifiableCredential } from '@/types';
import { cn } from '@/lib/utils';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectingState = string | null;
type SuccessState = Set<string>;

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/social-auth`;

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connect, authError, userIdentity, updateIdentity } = useWallet();
  const [email, setEmail] = useState('');
  const [connecting, setConnecting] = useState<ConnectingState>(null);
  const [successSet, setSuccessSet] = useState<SuccessState>(new Set());
  const [emailSent, setEmailSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Listen for AUTH_SUCCESS from popup windows
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (event.data?.type !== 'AUTH_SUCCESS') return;

    const { platform, handle, displayName } = event.data;
    if (!platform || !userIdentity) return;

    try {
      // Simulate social analysis (followers, engagement, etc.)
      const result = await mockConnectSocial(displayName || platform, handle || `${platform}_user`);

      const socialVC: VerifiableCredential = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'SocialCredential'],
        issuer: `did:web:${platform.toLowerCase()}.com`,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: userIdentity.did,
          ...result,
        },
      };

      await mockUploadToIPFS(socialVC);
      const newIdentity = addCredential(userIdentity, socialVC);
      updateIdentity(newIdentity);

      setSuccessSet(prev => new Set(prev).add(platform.toLowerCase()));
      setConnecting(null);
    } catch (err) {
      console.error('Social credential creation failed:', err);
      setLocalError(`Failed to create credential for ${platform}`);
      setConnecting(null);
    }
  }, [userIdentity, updateIdentity]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  if (!isOpen) return null;

  const openSocialPopup = (platformId: string) => {
    setConnecting(platformId);
    setLocalError(null);

    const url = `${EDGE_FN_URL}?platform=${encodeURIComponent(platformId)}&origin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(url, 'choiceid_auth', 'width=500,height=650,left=200,top=100');

    // Watch for popup close without auth
    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        setConnecting(prev => prev === platformId ? null : prev);
      }
    }, 500);
  };

  const handleMetaMask = async () => {
    setConnecting('metamask');
    setLocalError(null);
    await connect('metamask');
    setSuccessSet(prev => new Set(prev).add('metamask'));
    setConnecting(null);
    setTimeout(() => onClose(), 800);
  };

  const handleWallet = async (walletId: string) => {
    if (walletId === 'metamask') return handleMetaMask();
    setLocalError(`${walletId} connection coming soon. Use MetaMask or a social login.`);
  };

  const handleEmailLogin = async () => {
    if (!email) return;
    setConnecting('email');
    setLocalError(null);
    await connect('email', { email });
    setEmailSent(true);
    setConnecting(null);
  };

  const hasMetaMask = typeof window !== 'undefined' && !!(window as any).ethereum;
  const isSuccess = (id: string) => successSet.has(id.toLowerCase());

  const socialProviders = [
    { id: 'google', name: 'Google', icon: '🔵' },
    { id: 'x', name: 'X (Twitter)', icon: '𝕏' },
    { id: 'apple', name: 'Apple', icon: '🍎' },
    { id: 'discord', name: 'Discord', icon: '🎮' },
    { id: 'telegram', name: 'Telegram', icon: '✈️' },
  ];

  const wallets = [
    { id: 'metamask', name: 'MetaMask', emoji: '🦊' },
    { id: 'trust', name: 'Trust Wallet', emoji: '🔵' },
    { id: 'rainbow', name: 'Rainbow', emoji: '🌈' },
    { id: 'coinbase', name: 'Coinbase', emoji: '💎' },
    { id: 'walletconnect', name: 'WalletConnect', emoji: '🔗' },
    { id: 'phantom', name: 'Phantom', emoji: '👻' },
  ];

  const error = localError || authError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield size={18} className="text-primary" />
              </div>
              <span className="text-lg font-black tracking-tight">
                CHOICE<span className="text-primary">iD</span>
              </span>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {/* Detected Browser Wallet */}
          {hasMetaMask && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">
                  Detected in your browser
                </span>
              </div>
              <button
                onClick={handleMetaMask}
                disabled={connecting === 'metamask'}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all disabled:opacity-60"
              >
                <span className="font-bold text-sm text-foreground">MetaMask</span>
                {connecting === 'metamask' ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : isSuccess('metamask') ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <span className="text-xs font-black text-primary uppercase tracking-wider">Connect</span>
                )}
              </button>
            </div>
          )}

          {/* Social Sign In */}
          <div className="mb-6">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              Sign in with
            </span>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => openSocialPopup(provider.id)}
                  disabled={!!connecting || isSuccess(provider.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-sm font-bold text-foreground disabled:opacity-60",
                    connecting === provider.id && "border-primary/30 bg-muted/50",
                    isSuccess(provider.id) && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
                  )}
                >
                  {connecting === provider.id ? (
                    <Loader2 size={16} className="animate-spin text-primary" />
                  ) : isSuccess(provider.id) ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <span className="text-base">{provider.icon}</span>
                  )}
                  {provider.name}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="mb-6">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              Or continue with email
            </span>
            {emailSent ? (
              <div className="mt-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
                <Check size={24} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-bold text-foreground">Check your email</p>
                <p className="text-xs text-muted-foreground mt-1">We sent a magic link to <strong>{email}</strong></p>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-muted/30">
                  <Mail size={16} className="text-muted-foreground shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                  />
                </div>
                <button
                  onClick={handleEmailLogin}
                  disabled={!email || !!connecting}
                  className="px-5 py-3 rounded-xl bg-foreground text-background text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
                >
                  {connecting === 'email' ? <Loader2 size={14} className="animate-spin" /> : 'Continue'}
                </button>
              </div>
            )}
          </div>

          {/* Connect a Wallet */}
          <div className="mb-6">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
              Connect a wallet
            </span>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWallet(wallet.id)}
                  disabled={!!connecting}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all disabled:opacity-60",
                    connecting === wallet.id && "border-primary/30 bg-muted/50",
                    isSuccess(wallet.id) && "border-emerald-300 bg-emerald-50/50"
                  )}
                >
                  {connecting === wallet.id ? (
                    <Loader2 size={24} className="animate-spin text-primary" />
                  ) : isSuccess(wallet.id) ? (
                    <Check size={24} className="text-emerald-500" />
                  ) : (
                    <span className="text-2xl">{wallet.emoji}</span>
                  )}
                  <span className="text-[10px] font-bold text-foreground leading-tight text-center">
                    {wallet.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] font-medium text-muted-foreground text-center leading-relaxed">
            By connecting, you agree to the{' '}
            <span className="text-foreground font-bold">Terms of Service</span> and{' '}
            <span className="text-foreground font-bold">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
