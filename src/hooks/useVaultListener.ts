import { useEffect } from 'react';
import { getVault } from '@/lib/vault/localVault';
import { useChoiceStore } from '@/store/useChoiceStore';

export const useVaultListener = () => {
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const setupListener = async () => {
      const db = await getVault();
      
      // Since PGLite 0.3.x might not have a full 'live' query API yet in all environments,
      // we'll use a simple polling mechanism that's robust for this MVP.
      // However, we can also check if it supports subscribe.
      
      const pollVault = async () => {
        try {
          const localBalanceResult = await db.query("SELECT SUM(value) as total FROM reputation_journal");
          const localTotal = (localBalanceResult.rows[0] as any)?.total || 0;
          
          const currentBalance = useChoiceStore.getState().choiceBalance;
          if (Number(localTotal) !== currentBalance) {
            useChoiceStore.getState().setConnectionState({ choiceBalance: Number(localTotal) });
          }
        } catch (e) {
          console.error("Vault Listener Error:", e);
        }
      };

      const interval = setInterval(pollVault, 1000);
      cleanup = () => clearInterval(interval);
    };

    setupListener();
    return () => cleanup?.();
  }, []);
};
