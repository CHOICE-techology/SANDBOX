import { getVault } from '../vault/localVault';
import { useChoiceStore } from '@/store/useChoiceStore';
import { claimBounty } from '@/utils/economy';

interface RewardJournal {
  id: string;
  score_type: string;
  value: number;
  synced: boolean;
}

export const syncRewardsToVault = async () => {
  const db = await getVault();

  // 1. Find verified milestones that haven't been rewarded yet
  const result = await db.query(
    "SELECT * FROM reputation_journal WHERE value > 70 AND synced = false"
  );

  const rows = result.rows as unknown as RewardJournal[];

  for (const reward of rows) {
    // 2. Logic: High-quality reputation (Score > 70) = 100 CHOICE
    const rewardAmount = 100;

    // 3. Update Global State (UI)
    claimBounty(rewardAmount);

    // 4. Mark as rewarded in Local Vault to prevent double-minting
    await db.query(
      "UPDATE reputation_journal SET synced = true WHERE id = $1",
      [reward.id]
    );
    
    console.log(`Treasury: Issued ${rewardAmount} CHOICE for high-rep milestone.`);
  }
};
