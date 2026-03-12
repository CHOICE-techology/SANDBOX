export interface BlockchainStats {
  txCount: number;
  accountAge: string;
  totalVolume: string;
  assetsHeld: string;
  netValue: string;
  activityData: { name: string; tx: number }[];
  chain?: string;
  activeChains?: string[];
  balance?: string;
}

// Wallet analysis mocked for Phase 2/3 (transitioning to local-first)
export const analyzeWalletHistory = async (address: string): Promise<BlockchainStats> => {
  return {
    txCount: 42,
    accountAge: '2 years',
    totalVolume: '15.5 ETH',
    assetsHeld: '12 tokens',
    netValue: '$45,000',
    activityData: [
      { name: 'Mon', tx: 2 },
      { name: 'Tue', tx: 5 },
      { name: 'Wed', tx: 3 },
      { name: 'Thu', tx: 8 },
      { name: 'Fri', tx: 4 },
    ],
    chain: 'Ethereum',
    activeChains: ['Ethereum', 'Polygon', 'Arbitrum'],
    balance: '1.2 ETH',
  };
};
