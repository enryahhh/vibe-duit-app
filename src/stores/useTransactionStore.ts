import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useTransactions } from '@/composables/useTransactions';
import type { Transaction, TransactionFilter } from '@/types/transaction';

/**
 * Pinia transaction store providing reactive filtering, search, and monthly aggregations.
 */
export const useTransactionStore = defineStore('transactionStore', () => {
  const { transactions, loading, error, addTransaction, deleteTransaction } = useTransactions();

  const filter = ref<TransactionFilter>({
    startDate: undefined,
    endDate: undefined,
    accountId: undefined,
    categoryId: undefined,
    type: undefined,
    searchQuery: '',
  });

  /**
   * Computed list of transactions matching the active filter criteria.
   */
  const filteredTransactions = computed<Transaction[]>(() => {
    return transactions.value.filter((tx) => {
      // Type filter
      if (filter.value.type && tx.type !== filter.value.type) {
        return false;
      }
      // Account filter (matches fromAccountId or toAccountId)
      if (filter.value.accountId) {
        if (tx.fromAccountId !== filter.value.accountId && tx.toAccountId !== filter.value.accountId) {
          return false;
        }
      }
      // Category filter
      if (filter.value.categoryId && tx.categoryId !== filter.value.categoryId) {
        return false;
      }
      // Date range filter
      if (filter.value.startDate && tx.date < filter.value.startDate) {
        return false;
      }
      if (filter.value.endDate && tx.date > filter.value.endDate) {
        return false;
      }
      // Search query (note or category name)
      if (filter.value.searchQuery && filter.value.searchQuery.trim() !== '') {
        const query = filter.value.searchQuery.toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(query);
        const catMatch = tx.categoryName.toLowerCase().includes(query);
        if (!noteMatch && !catMatch) return false;
      }

      return true;
    });
  });

  /**
   * Total income for the current month.
   */
  const currentMonthIncome = computed<number>(() => {
    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7); // YYYY-MM

    return transactions.value
      .filter((tx) => tx.type === 'income' && tx.date.startsWith(currentYearMonth))
      .reduce((sum, tx) => sum + tx.amount, 0);
  });

  /**
   * Total expense for the current month.
   */
  const currentMonthExpense = computed<number>(() => {
    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7); // YYYY-MM

    return transactions.value
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(currentYearMonth))
      .reduce((sum, tx) => sum + tx.amount, 0);
  });

  /**
   * Grouped expenses by category for current month breakdown charts.
   */
  const currentMonthExpensesByCategory = computed<Record<string, { name: string; amount: number; color?: string }>>(() => {
    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7);

    const breakdown: Record<string, { name: string; amount: number; color?: string }> = {};

    transactions.value
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(currentYearMonth))
      .forEach((tx) => {
        if (!breakdown[tx.categoryId]) {
          breakdown[tx.categoryId] = {
            name: tx.categoryName,
            amount: 0,
          };
        }
        breakdown[tx.categoryId]!.amount += tx.amount;
      });

    return breakdown;
  });

  const resetFilter = () => {
    filter.value = {
      startDate: undefined,
      endDate: undefined,
      accountId: undefined,
      categoryId: undefined,
      type: undefined,
      searchQuery: '',
    };
  };

  return {
    transactions,
    filteredTransactions,
    loading,
    error,
    filter,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthExpensesByCategory,
    addTransaction,
    deleteTransaction,
    resetFilter,
  };
});
