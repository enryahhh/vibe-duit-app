import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useAccounts } from '@/composables/useAccounts';
import type { Account } from '@/types/account';

/**
 * Pinia store for holding global account state and calculating net worth.
 */
export const useAccountStore = defineStore('accountStore', () => {
  const { accounts, loading, error, addAccount, updateAccount, adjustBalance, deleteAccount } = useAccounts();

  /**
   * Total sum of positive asset account balances (Bank, E-Wallet, Cash, Investment).
   */
  const totalAssets = computed<number>(() => {
    return accounts.value
      .filter((acc) => acc.type !== 'credit_card')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);
  });

  /**
   * Total liabilities (Credit Cards).
   */
  const totalLiabilities = computed<number>(() => {
    return accounts.value
      .filter((acc) => acc.type === 'credit_card')
      .reduce((sum, acc) => sum + Math.abs(acc.balance || 0), 0);
  });

  /**
   * Net worth calculation: Assets minus Liabilities.
   */
  const netWorth = computed<number>(() => {
    return totalAssets.value - totalLiabilities.value;
  });

  /**
   * Helper to find an account by ID.
   */
  const getAccountById = (id: string): Account | undefined => {
    return accounts.value.find((acc) => acc.id === id);
  };

  return {
    accounts,
    loading,
    error,
    totalAssets,
    totalLiabilities,
    netWorth,
    getAccountById,
    addAccount,
    updateAccount,
    adjustBalance,
    deleteAccount,
  };
});
