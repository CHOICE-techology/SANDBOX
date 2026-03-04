import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, Shield, Check, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { addCredential } from '@/services/storageService';
import { mockConnectSocial, mockUploadToIPFS } from '@/services/cryptoService';
import { VerifiableCredential } from '@/types';
import { lovable } from '@/integrations/lovable/index';
import { cn } from '@/lib/utils';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectingState = string | null;
type SuccessState = Set<string>;

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/social-auth`;

/* ─── Brand SVG Icons ─── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
);

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
);

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#26A5E4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.862 8.153l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.13.832.94z"/></svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
);

// Wallet icons
const MetaMaskIcon = () => (
  <svg width="28" height="28" viewBox="0 0 35 33" fill="none"><path d="M32.958 1l-13.134 9.718 2.442-5.727z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.066 1l13.003 9.809-2.312-5.818zM28.146 23.898l-3.487 5.34 7.463 2.053 2.143-7.283zM.889 24.008l2.13 7.283 7.463-2.053-3.487-5.34z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.115 14.558l-2.077 3.14 7.405.337-.247-7.969zM24.91 14.558l-5.16-4.583-.169 8.06 7.405-.337zM10.482 29.238l4.465-2.173-3.86-3.006zM20.078 27.065l4.446 2.173-.587-5.18z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/><path d="M24.524 29.238l-4.446-2.173.364 2.954-.039 1.247zM10.482 29.238l4.12 2.028-.026-1.247.35-2.954z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.68 21.462l-3.717-1.092 2.626-1.205zM20.344 21.462l1.091-2.297 2.639 1.205z" fill="#233447" stroke="#233447" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.482 29.238l.611-5.34-4.098.11zM23.932 23.898l.592 5.34 3.506-5.23zM26.987 17.698l-7.405.337.688 3.427 1.091-2.297 2.639 1.205zM10.963 20.37l2.626-1.205 1.091 2.297.688-3.427-7.405-.337z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.963 17.698l3.14 6.12-.104-3.048zM24 20.77l-.117 3.048 3.14-6.12zM15.368 18.035l-.688 3.427.871 4.492.195-5.918zM19.582 18.035l-.364 1.988.169 5.931.884-4.492z" fill="#E27525" stroke="#E27525" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const TrustWalletIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#0500FF"/><path d="M12 15.5c0-1.4.6-2.7 1.6-3.7a5.4 5.4 0 0 1 3.9-1.5c1.5 0 2.8.5 3.8 1.5a5.2 5.2 0 0 1 1.7 3.7v1h1v-1a6.2 6.2 0 0 0-2-4.4A6.4 6.4 0 0 0 17.5 9a6.4 6.4 0 0 0-4.5 1.8A6.2 6.2 0 0 0 11 15.2v1h1z" fill="none"/><path d="M20 11.5a8 8 0 0 1 6 2.7v13.6c-1.6 1.3-3.7 2.2-6 2.2s-4.4-.9-6-2.2V14.2a8 8 0 0 1 6-2.7z" stroke="white" strokeWidth="1.5" fill="none"/></svg>
);

const RainbowIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40"><defs><linearGradient id="rg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF4000"/><stop offset="25%" stopColor="#FF9901"/><stop offset="50%" stopColor="#01DA40"/><stop offset="75%" stopColor="#00AAFF"/><stop offset="100%" stopColor="#A259FF"/></linearGradient></defs><rect rx="10" width="40" height="40" fill="url(#rg1)"/><path d="M8 28v-4a12 12 0 0 1 24 0v4" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M12 28v-4a8 8 0 0 1 16 0v4" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M16 28v-4a4 4 0 0 1 8 0v4" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>
);

const CoinbaseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40"><rect rx="10" width="40" height="40" fill="#0052FF"/><rect x="12" y="12" width="16" height="16" rx="8" fill="white"/><rect x="16" y="16" width="8" height="8" rx="2" fill="#0052FF"/></svg>
);

const WalletConnectIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40"><rect rx="10" width="40" height="40" fill="#3B99FC"/><path d="M12.5 16.5c4.1-4 10.9-4 15 0l.5.5-1.7 1.7-.5-.5c-3.2-3.1-8.4-3.1-11.6 0l-.5.5L12 17l.5-.5zm18.5 3.4l1.5 1.5-7.1 7-1.5-1.5 5.6-5.5zm-24.5 1.5L8 19.9l5.6 5.5L12 27z" fill="white"/></svg>
);

const PhantomIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#534BB1"/><stop offset="100%" stopColor="#551BF9"/></linearGradient></defs><rect rx="10" width="40" height="40" fill="url(#pg)"/><circle cx="16" cy="19" r="2.5" fill="white"/><circle cx="24" cy="19" r="2.5" fill="white"/></svg>
);

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

    const timer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(timer);
        setConnecting(prev => prev === platformId ? null : prev);
      }
    }, 500);
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setConnecting(provider);
    setLocalError(null);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setLocalError(result.error.message || `${provider} sign-in failed`);
        setConnecting(null);
      }
      // Auth state change listener in WalletContext handles the rest
    } catch (err: any) {
      setLocalError(err.message || `${provider} connection failed`);
      setConnecting(null);
    }
  };

  const handleSocialConnect = (providerId: string) => {
    if (providerId === 'google' || providerId === 'apple') {
      handleOAuth(providerId);
    } else {
      openSocialPopup(providerId);
    }
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
    { id: 'google', name: 'Google', icon: <GoogleIcon /> },
    { id: 'x', name: 'X (Twitter)', icon: <XIcon /> },
    { id: 'apple', name: 'Apple', icon: <AppleIcon /> },
    { id: 'discord', name: 'Discord', icon: <DiscordIcon /> },
    { id: 'telegram', name: 'Telegram', icon: <TelegramIcon /> },
    { id: 'github', name: 'GitHub', icon: <GitHubIcon /> },
  ];

  const wallets = [
    { id: 'metamask', name: 'MetaMask', icon: <MetaMaskIcon /> },
    { id: 'trust', name: 'Trust Wallet', icon: <TrustWalletIcon /> },
    { id: 'rainbow', name: 'Rainbow', icon: <RainbowIcon /> },
    { id: 'coinbase', name: 'Coinbase', icon: <CoinbaseIcon /> },
    { id: 'walletconnect', name: 'WalletConnect', icon: <WalletConnectIcon /> },
    { id: 'phantom', name: 'Phantom', icon: <PhantomIcon /> },
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
                  onClick={() => handleSocialConnect(provider.id)}
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
                    provider.icon
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
                    wallet.icon
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
