import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useAccountStore } from '../useAccountStore';

// Mock useAccounts composable
vi.mock('@/composables/useAccounts', () => {
  const mockAccounts = ref([
    { id: '1', name: 'Checking Bank', type: 'bank', balance: 1000, currency: 'USD', updatedAt: '', createdAt: '' },
    { id: '2', name: 'GoPay E-Wallet', type: 'ewallet', balance: 500, currency: 'USD', updatedAt: '', createdAt: '' },
    { id: '3', name: 'Cash', type: 'cash', balance: 200, currency: 'USD', updatedAt: '', createdAt: '' },
    { id: '4', name: 'Chase Visa', type: 'credit_card', balance: 300, currency: 'USD', updatedAt: '', createdAt: '' },
  ]);

  return {
    useAccounts: () => ({
      accounts: mockAccounts,
      loading: ref(false),
      error: ref(null),
      addAccount: vi.fn(),
      updateAccount: vi.fn(),
      adjustBalance: vi.fn(),
      deleteAccount: vi.fn(),
    }),
  };
});

describe('useAccountStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('calculates total assets correctly (Bank + E-Wallet + Cash)', () => {
    const store = useAccountStore();
    expect(store.totalAssets).toBe(1700); // 1000 + 500 + 200
  });

  it('calculates total liabilities correctly (Credit Card)', () => {
    const store = useAccountStore();
    expect(store.totalLiabilities).toBe(300);
  });

  it('calculates net worth correctly (Assets - Liabilities)', () => {
    const store = useAccountStore();
    expect(store.netWorth).toBe(1400); // 1700 - 300
  });

  it('finds account by ID correctly', () => {
    const store = useAccountStore();
    const acc = store.getAccountById('2');
    expect(acc?.name).toBe('GoPay E-Wallet');
  });
});
