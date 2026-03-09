import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { addCredential } from '@/services/storageService';
import { mockConnectSocial, mockUploadToIPFS } from '@/services/cryptoService';
import { VerifiableCredential } from '@/types';

import { walletRegistry, getDetectedWallets } from '@/data/walletRegistry';
import { WalletSearchBar } from '@/components/wallet-modal/WalletSearchBar';
import { DetectedWallets } from '@/components/wallet-modal/DetectedWallets';
import { WalletGrid } from '@/components/wallet-modal/WalletGrid';
import { SocialSignIn } from '@/components/wallet-modal/SocialSignIn';
import { EmailSignIn } from '@/components/wallet-modal/EmailSignIn';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { connect, authError, userIdentity, updateIdentity, isConnected } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [successSet, setSuccessSet] = useState<Set<string>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detectedIds, setDetectedIds] = useState<Set<string>>(new Set());
  
  // Track whether we initiated a wallet connect in this session
  const [waitingForWalletConnect, setWaitingForWalletConnect] = useState(false);
  
  // Keep a live ref to userIdentity so callbacks always see the latest value
  const userIdentityRef = useRef(userIdentity);
  useEffect(() => { userIdentityRef.current = userIdentity; }, [userIdentity]);

  // Close modal & navigate only when we explicitly triggered a wallet connection via Privy
  useEffect(() => {
    if (isOpen && isConnected && waitingForWalletConnect) {
      setWaitingForWalletConnect(false);
      onClose();
      navigate('/');
    }
  }, [isOpen, isConnected, waitingForWalletConnect, onClose, navigate]);

  // Detect browser wallets on mount
  useEffect(() => {
    if (isOpen) {
      setDetectedIds(getDetectedWallets());
    }
  }, [isOpen]);

  // Listen for AUTH_SUCCESS from popup windows (Social Reputation link flow)
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (event.data?.type !== 'AUTH_SUCCESS') return;
    const { platform, handle, displayName } = event.data;
    if (!platform) return;

    const currentIdentity = userIdentityRef.current;
    if (!currentIdentity) {
      setLocalError(`Please connect a wallet or sign in first before linking ${platform}.`);
      setConnecting(null);
      return;
    }

    try {
      const result = await mockConnectSocial(displayName || platform, handle || `${platform}_user`);
      const socialVC: VerifiableCredential = {
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'SocialCredential'],
        issuer: `did:web:${platform.toLowerCase()}.com`,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: currentIdentity.did, ...result },
      };
      await mockUploadToIPFS(socialVC);
      const newIdentity = await addCredential(currentIdentity, socialVC);
      updateIdentity(newIdentity);
      setSuccessSet(prev => new Set(prev).add(platform.toLowerCase()));
      setConnecting(null);
    } catch (err) {
      console.error('Social credential creation failed:', err);
      setLocalError(`Failed to create credential for ${platform}`);
      setConnecting(null);
    }
  }, [updateIdentity]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Filtered wallets for search
  const detectedWallets = useMemo(
    () => walletRegistry.filter(w => detectedIds.has(w.id)),
    [detectedIds]
  );

  const filteredWallets = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? walletRegistry.filter(w => w.name.toLowerCase().includes(q))
      : walletRegistry;
    return list;
  }, [search, detectedIds]);

  if (!isOpen) return null;

  const handleAuthTrigger = async (method?: string) => {
    setLocalError(null);
    setWaitingForWalletConnect(true);
    await connect(method);
  };

  const handleWalletConnect = async (walletId: string) => {
    // Privy handles specific wallet selection internally. 
    // We trigger the general login flow.
    handleAuthTrigger();
  };

  const handleSocialConnect = (providerId: string) => {
    // For main identity connection:
    if (!userIdentity) {
      handleAuthTrigger(providerId);
    } else {
      // For linking social reputation to existing identity, 
      // we still use the mock popup flow for now as defined in handleMessage
      setConnecting(providerId);
      setTimeout(() => {
        window.postMessage({
          type: 'AUTH_SUCCESS',
          platform: providerId,
          handle: `${providerId}_sovereign`,
          displayName: `${providerId} User`
        }, window.location.origin);
        setConnecting(null);
      }, 1000);
    }
  };

  const handleEmailConnect = async (email: string) => {
    handleAuthTrigger('email');
    return true;
  };

  const error = localError || authError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        <div className="p-6 pb-0 sm:px-8 sm:pt-8">
          <div className="flex items-center justify-between mb-4">
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

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">
          <DetectedWallets
            wallets={detectedWallets}
            connecting={connecting}
            successSet={successSet}
            onConnect={handleWalletConnect}
          />

          <SocialSignIn
            connecting={connecting}
            successSet={successSet}
            onConnect={handleSocialConnect}
          />

          <EmailSignIn connecting={connecting} onConnect={handleEmailConnect} />

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                Connect CHOICE ID
              </span>
              {!search && (
                <span className="text-[9px] text-muted-foreground">
                  Search for 50+ wallets
                </span>
              )}
            </div>
            <div className="mt-2">
              <WalletSearchBar value={search} onChange={setSearch} />
              <WalletGrid
                wallets={filteredWallets}
                connecting={connecting}
                successSet={successSet}
                detectedIds={detectedIds}
                onConnect={handleWalletConnect}
                isSearching={!!search.trim()}
              />
            </div>
          </div>

          <p className="text-[10px] font-medium text-muted-foreground text-center leading-relaxed pt-2">
            By connecting, you agree to the{' '}
            <span className="text-foreground font-bold">Terms of Service</span> and{' '}
            <span className="text-foreground font-bold">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
