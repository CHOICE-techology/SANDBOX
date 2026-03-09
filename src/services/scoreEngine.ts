import { VerifiableCredential } from '@/types';

export const SCORE_WEIGHTS = {
  SocialCredential: 25,
  PhysicalCredential: 50,
  EducationCredential: 30,
  WalletCreatedCredential: 10,
};

export interface ScoreBreakdown {
  score: number;
  categories: {
    social: number;
    education: number;
    physical: number;
    finance: number;
  };
}

export const calculateReputationBreakdown = (credentials: VerifiableCredential[]): ScoreBreakdown => {
  if (!credentials || credentials.length === 0) {
    return {
      score: 0,
      categories: { social: 0, education: 0, physical: 0, finance: 0 }
    };
  }

  const countedKeys = new Set<string>();
  const categories = { social: 0, education: 0, physical: 0, finance: 0 };

  credentials.forEach(vc => {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    const type = types.find(t => SCORE_WEIGHTS[t as keyof typeof SCORE_WEIGHTS]) as keyof typeof SCORE_WEIGHTS;
    
    if (!type) return;

    let key = type as string;
    const sub = vc.credentialSubject as any;

    if (type === 'SocialCredential' && sub.platform) {
      key = `social:${sub.platform.toLowerCase()}`;
    } else if (type === 'EducationCredential' && sub.courseName) {
      key = `edu:${sub.courseName.toLowerCase()}`;
    } else if (type === 'PhysicalCredential' && sub.documentType) {
      key = `doc:${sub.documentType.toLowerCase()}`;
    } else if (type === 'WalletCreatedCredential' && sub.chain) {
      key = `wallet:${sub.chain.toLowerCase()}`;
    }

    if (!countedKeys.has(key)) {
      const points = SCORE_WEIGHTS[type];
      if (type === 'SocialCredential') categories.social += points;
      else if (type === 'EducationCredential') categories.education += points;
      else if (type === 'PhysicalCredential') categories.physical += points;
      else if (type === 'WalletCreatedCredential') categories.finance += points;
      
      countedKeys.add(key);
    }
  });

  const totalScore = categories.social + categories.education + categories.physical + categories.finance;

  return {
    score: totalScore,
    categories
  };
};

/**
 * Calculates a weighted identity score based on verifiable credentials.
 */
export const calculateIdentityScore = (credentials: VerifiableCredential[]): number => {
  return calculateReputationBreakdown(credentials).score;
};
