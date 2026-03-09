import { useChoiceStore } from '@/store/useChoiceStore';

export const claimBounty = (amount: number) => {
  useChoiceStore.getState().incrementBalance(amount);
};
