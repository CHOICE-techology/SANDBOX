import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getVault } from '@/lib/vault/localVault';
import { useChoiceStore } from '@/store/useChoiceStore';

export const useSovereignSync = () => {
  const { user, authenticated } = usePrivy();
  
  // Assuming setIdentityScore will be added to useChoiceStore later
  // const { setIdentityScore } = useChoiceStore();

  useEffect(() => {
    const syncIdentity = async () => {
      if (!authenticated || !user) return;

      const db = await getVault();
      
      // Upsert the main identity into the vault
      await db.query(
        `INSERT INTO identity_vault (provider, identifier) 
         VALUES ($1, $2) 
         ON CONFLICT DO NOTHING`,
        ['privy', user.id]
      );

      console.log("Vault Synchronized: Identity secured locally.");
    };

    syncIdentity();
  }, [authenticated, user]);
};
