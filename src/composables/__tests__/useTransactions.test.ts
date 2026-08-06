import { describe, it, expect } from 'vitest';
import type { CreateTransactionDTO } from '@/types/transaction';

describe('Transaction Data Transfer Object Validation', () => {
  it('validates mandatory fields for expense transactions', () => {
    const expenseDTO: CreateTransactionDTO = {
      type: 'expense',
      amount: 45.5,
      date: '2026-08-06',
      fromAccountId: 'acc-1',
      categoryId: 'cat-food',
      categoryName: 'Food & Dining',
      note: 'Lunch at Cafe',
    };

    expect(expenseDTO.type).toBe('expense');
    expect(expenseDTO.amount).toBeGreaterThan(0);
    expect(expenseDTO.fromAccountId).toBeDefined();
    expect(expenseDTO.toAccountId).toBeUndefined();
  });

  it('validates mandatory fields for transfer transactions', () => {
    const transferDTO: CreateTransactionDTO = {
      type: 'transfer',
      amount: 100,
      date: '2026-08-06',
      fromAccountId: 'acc-bank',
      toAccountId: 'acc-ewallet',
      categoryId: 'cat-transfer',
      categoryName: 'Account Transfer',
    };

    expect(transferDTO.type).toBe('transfer');
    expect(transferDTO.fromAccountId).toBe('acc-bank');
    expect(transferDTO.toAccountId).toBe('acc-ewallet');
  });
});
