/**
 * Transaction type indicator.
 */
export type TransactionType = 'income' | 'expense' | 'transfer';

/**
 * Frequency configuration for recurring transactions.
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceConfig {
  isRecurring: boolean;
  frequency?: RecurrenceFrequency;
  endDate?: string;
}

/**
 * Transaction document interface.
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  fromAccountId: string;
  toAccountId?: string;
  categoryId: string;
  categoryName: string;
  note?: string;
  recurrence?: RecurrenceConfig;
  createdAt: string;
  updatedAt: string;
}

export type CreateTransactionDTO = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Filter parameters for querying transactions.
 */
export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  searchQuery?: string;
}
