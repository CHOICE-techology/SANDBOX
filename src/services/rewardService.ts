

export interface ChoiceTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  reason: string;
  created_at: string;
}

export interface RewardResult {
  success: boolean;
  amount?: number;
  duplicate?: boolean;
  error?: string;
}

const REWARD_CONFIG = {
  identity_reward: { amount: 100, reason: 'wallet_connect' },
  google_connect: { amount: 100, reason: 'google_connect' },
  social_connect: { amount: 100, reason: 'social_connect' },
  wallet_analysis_reward: { amount: 30, reason: 'wallet_analysis' },
  education_reward: { amount: 40, reason: 'course_complete' },
  referral_reward: { amount: 25, reason: 'referral' },
} as const;

/**
 * Grant a CHOICE coin reward. Prevents duplicates via unique constraint.
 */
// MOCKED reward system for Phase 2/3 (transitioning to local-first)
export const grantReward = async (
  userId: string,
  type: string,
  reason: string,
  amount: number
): Promise<RewardResult> => {
  console.log(`[Mock Reward] ${amount} CHOICE to ${userId} for ${type}:${reason}`);
  return { success: true, amount };
};

/**
 * Convenience methods for specific reward types
 */
export const grantWalletConnectReward = (userId: string) =>
  grantReward(userId, 'identity_reward', 'wallet_connect', 100);

export const grantGoogleConnectReward = (userId: string) =>
  grantReward(userId, 'identity_reward', 'google_connect', 100);

export const grantSocialConnectReward = (userId: string, platform: string) =>
  grantReward(userId, 'social_connect_reward', `social_${platform.toLowerCase()}`, 100);

export const grantWalletAnalysisReward = (userId: string, walletAddress: string) =>
  grantReward(userId, 'wallet_analysis_reward', `analysis_${walletAddress.toLowerCase().slice(0, 20)}`, 30);

export const grantEducationReward = (userId: string, courseId: string) =>
  grantReward(userId, 'education_reward', `course_${courseId}`, 40);

export const grantReferralReward = (userId: string, referredUserId: string) =>
  grantReward(userId, 'referral_reward', `referral_${referredUserId}`, 25);

/**
 * Fetch user's CHOICE coin balance
 */
export const getChoiceBalance = async (userId: string): Promise<number> => {
  return 0; // Will be replaced by PGLite in Phase 5
};

/**
 * Fetch user's transaction history
 */
export const getTransactionHistory = async (userId: string): Promise<ChoiceTransaction[]> => {
  return []; // Will be replaced by PGLite in Phase 5
};

/**
 * Get human-readable label for a reward type
 */
export const getRewardLabel = (type: string): string => {
  const labels: Record<string, string> = {
    identity_reward: 'Identity Connection',
    social_connect_reward: 'Social Profile',
    wallet_analysis_reward: 'Wallet Analysis',
    education_reward: 'Course Completion',
    referral_reward: 'Friend Referral',
    bounty_reward: 'Bounty Task',
  };
  return labels[type] || type;
};

/**
 * Get icon category for a reward type
 */
export const getRewardCategory = (type: string): 'identity' | 'education' | 'community' | 'finance' => {
  if (type.includes('identity') || type.includes('social')) return 'identity';
  if (type.includes('education')) return 'education';
  if (type.includes('referral') || type.includes('bounty')) return 'community';
  return 'finance';
};
