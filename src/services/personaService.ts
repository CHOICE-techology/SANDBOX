import { UserIdentity, AIPersona } from '../types';

export const PERSONAS: Record<string, AIPersona> = {
  defi_native: {
    name: 'DeFi Native',
    role: 'Financial Strategist',
    description: 'A persona focused on decentralized finance, liquidity, and yield optimization.',
    traits: ['Analytical', 'Risk-Aware', 'Efficient'],
  },
  social_oracle: {
    name: 'Social Oracle',
    role: 'Community Builder',
    description: 'A persona that thrives on social connections, community engagement, and digital presence.',
    traits: ['Communicative', 'Influential', 'Connected'],
  },
  academic_scholar: {
    name: 'Academic Scholar',
    role: 'Knowledge Architect',
    description: 'A persona built on educational achievements, verified skills, and academic rigor.',
    traits: ['Methodical', 'Detail-Oriented', 'Studious'],
  },
  sovereign_identity: {
    name: 'Sovereign Identity',
    role: 'Privacy Guardian',
    description: 'A balanced persona focused on privacy, self-sovereignty, and robust digital identity.',
    traits: ['Secure', 'Independent', 'Principled'],
  },
};

export const getPersonaForIdentity = (identity: UserIdentity): AIPersona => {
  const credentials = identity.credentials;
  const types = credentials.flatMap(vc => Array.isArray(vc.type) ? vc.type : [vc.type]);

  const hasDeFi = types.includes('WalletHistoryCredential');
  const hasSocial = types.includes('SocialCredential');
  const hasEdu = types.includes('EducationCredential');

  if (hasDeFi && hasSocial && hasEdu) return PERSONAS.sovereign_identity;
  if (hasDeFi) return PERSONAS.defi_native;
  if (hasSocial) return PERSONAS.social_oracle;
  if (hasEdu) return PERSONAS.academic_scholar;

  return PERSONAS.sovereign_identity;
};
