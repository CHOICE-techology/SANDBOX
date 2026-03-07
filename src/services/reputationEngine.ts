import { VerifiableCredential } from '../types';

// Max points per category
const MAX_SOCIAL = 40;
const MAX_EDUCATION = 30;
const MAX_REAL_WORLD = 20;
const MAX_FINANCE = 10;
// Total possible = 100

// 11 social platforms, each gives equal share
const SOCIAL_PLATFORMS_COUNT = 11;
const POINTS_PER_SOCIAL = MAX_SOCIAL / SOCIAL_PLATFORMS_COUNT; // ~3.636

// 4 document slots, each 5 points
const POINTS_PER_DOCUMENT = 5;
const MAX_DOCUMENTS = 4;

export interface ReputationBreakdown {
  baseScore: number;
  weightedScore: number;
  timeDecayAdjustment: number;
  totalScore: number;
  categories: {
    social: number;
    education: number;
    physical: number;
    finance: number;
  };
}

export interface ReputationResult {
  score: number;
  breakdown: ReputationBreakdown;
  sybilRisk: 'low' | 'medium' | 'high';
}

export const calculateReputation = (credentials: VerifiableCredential[]): ReputationResult => {
  let socialRaw = 0;
  let educationRaw = 0;
  let physicalRaw = 0;
  let financeRaw = 0;

  let socialCount = 0;
  let docCount = 0;

  credentials.forEach((vc) => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];

    if (types.includes('SocialCredential')) {
      socialCount++;
      socialRaw = Math.min(MAX_SOCIAL, socialCount * POINTS_PER_SOCIAL);
    } else if (types.includes('EducationCredential')) {
      // Each education credential carries its own points from the course data
      const coursePoints = (vc.credentialSubject as any)?.points;
      if (typeof coursePoints === 'number') {
        educationRaw += coursePoints;
      } else {
        // fallback: generic education credential
        educationRaw += 3;
      }
      educationRaw = Math.min(MAX_EDUCATION, educationRaw);
    } else if (types.includes('PhysicalCredential')) {
      docCount++;
      physicalRaw = Math.min(MAX_REAL_WORLD, docCount * POINTS_PER_DOCUMENT);
    } else if (types.includes('WalletHistoryCredential')) {
      // Wallet analysis gives up to 10 points based on activity
      const stats = vc.credentialSubject as any;
      const txCount = stats?.totalTransactions || 0;
      const chains = stats?.activeChains || 0;
      // Score: up to 5 pts for transactions (100+ = max), up to 5 pts for multi-chain (3+ = max)
      const txScore = Math.min(5, (txCount / 100) * 5);
      const chainScore = Math.min(5, (chains / 3) * 5);
      financeRaw = Math.min(MAX_FINANCE, Math.round(txScore + chainScore));
    }
  });

  const social = Math.round(Math.min(MAX_SOCIAL, socialRaw) * 100) / 100;
  const education = Math.min(MAX_EDUCATION, educationRaw);
  const physical = Math.min(MAX_REAL_WORLD, physicalRaw);
  const finance = Math.min(MAX_FINANCE, financeRaw);

  const totalScore = Math.min(100, Math.round(social + education + physical + finance));

  const nonSelfAttestedCount = credentials.filter(vc => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    return !types.includes('self_attested');
  }).length;

  let sybilRisk: 'low' | 'medium' | 'high' = 'high';
  if (nonSelfAttestedCount >= 3) sybilRisk = 'low';
  else if (nonSelfAttestedCount >= 1) sybilRisk = 'medium';

  return {
    score: totalScore,
    breakdown: {
      baseScore: 0,
      weightedScore: totalScore,
      timeDecayAdjustment: 0,
      totalScore,
      categories: {
        social: Math.round(social),
        education,
        physical,
        finance,
      }
    },
    sybilRisk,
  };
};
