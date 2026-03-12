import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserIdentity } from '../types';
import { loadIdentity, saveIdentity, syncIdentity, loadIdentityWithSync, clearIdentity } from '../services/storageService';
import { generateDID, calculateReputationScore } from '../services/cryptoService';
import { grantWalletConnectReward } from '@/services/rewardService';
import { useChoiceStore } from '../store/useChoiceStore';

// Safely import Privy hooks - they may not be available if no app ID is set
let usePrivyHook: any = () => ({ login: () => {}, logout: async () => {}, user: null, authenticated: false, ready: true });
let useWalletsHook: any = () => ({ wallets: [] });
try {
  const privy = require('@privy-io/react-auth');
  usePrivyHook = privy.usePrivy;
  useWalletsHook = privy.useWallets;
} catch (e) {
  // Privy not available
}
import { UserIdentity } from '../types';
import { loadIdentity, saveIdentity, syncIdentity, loadIdentityWithSync, clearIdentity } from '../services/storageService';
import { generateDID, calculateReputationScore } from '../services/cryptoService';
import { grantWalletConnectReward } from '@/services/rewardService';

import { useChoiceStore } from '../store/useChoiceStore';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  userIdentity: UserIdentity | null;
  connect: (method?: string, payload?: Record<string, string>) => Promise<boolean>;
  disconnect: () => void;
  updateIdentity: (identity: UserIdentity) => Promise<void>;
  authError: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    console.warn('useWallet called outside WalletProvider — returning defaults');
    return {
      address: null,
      isConnected: false,
      isConnecting: false,
      userIdentity: null,
      connect: async () => false,
      disconnect: () => {},
      updateIdentity: async () => {},
      authError: null,
    } as WalletContextType;
  }
  return ctx;
};

const resolveIdentity = async (
  addr: string,
  meta?: { displayName?: string; avatar?: string }
): Promise<UserIdentity> => {
  const existing = await loadIdentityWithSync(addr);
  if (existing) return existing;

  const identity: UserIdentity = {
    address: addr,
    did: generateDID(addr),
    displayName: meta?.displayName,
    avatar: meta?.avatar,
    credentials: [],
    reputationScore: calculateReputationScore([]),
  };
  await syncIdentity(identity);
  return identity;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { login, logout, user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  
  const {
    userIdentity,
    setUserIdentity,
    authError,
    rehydrate,
    setConnectionState
  } = useChoiceStore();

  const wallet = wallets[0];
  const address = wallet?.address || user?.wallet?.address || null;

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    const handleAuth = async () => {
      if (ready && authenticated && address) {
        const identity = await resolveIdentity(address, {
          displayName: user?.email?.address || user?.google?.email || address,
        });
        setUserIdentity(identity);
        
        const savedAddr = localStorage.getItem('choice_wallet_address');
        if (savedAddr !== address) {
          localStorage.setItem('choice_wallet_address', address);
          await grantWalletConnectReward(address);
        }
      } else if (ready && !authenticated) {
        setUserIdentity(null);
        localStorage.removeItem('choice_wallet_address');
      }
    };

    handleAuth();
  }, [ready, authenticated, address, user, setUserIdentity]);

  const connect = async (method?: string): Promise<boolean> => {
    setConnectionState({ authError: null });
    try {
      login();
      return true;
    } catch (err: any) {
      console.error('Connection failed:', err);
      setConnectionState({ authError: err.message || 'Connection failed. Please try again.' });
      return false;
    }
  };

  const disconnect = useCallback(async () => {
    await logout();
    await clearIdentity();
    setUserIdentity(null);
    setConnectionState({ authError: null });
    localStorage.removeItem('choice_wallet_address');
  }, [logout, setUserIdentity, setConnectionState]);

  const updateIdentity = async (newIdentity: UserIdentity) => {
    const score = calculateReputationScore(newIdentity.credentials);
    const updated = { ...newIdentity, reputationScore: score };
    setUserIdentity(updated);
  };

  const value = useMemo(() => ({
    address,
    isConnected: authenticated && !!address,
    isConnecting: !ready,
    userIdentity,
    connect,
    disconnect,
    updateIdentity,
    authError,
  }), [address, authenticated, ready, userIdentity, authError, disconnect]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
