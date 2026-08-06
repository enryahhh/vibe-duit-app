<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAccountStore } from '@/stores/useAccountStore';
import type { Account, AccountType, CreateAccountDTO } from '@/types/account';
import AccountCard from '@/components/accounts/AccountCard.vue';
import AccountFormModal from '@/components/accounts/AccountFormModal.vue';
import BalanceAdjustModal from '@/components/accounts/BalanceAdjustModal.vue';
import { Plus, Wallet, Landmark, Smartphone, Banknote, CreditCard, TrendingUp } from 'lucide-vue-next';
import { formatCurrency } from '@/utils/formatCurrency';

const accountStore = useAccountStore();

const activeTab = ref<AccountType | 'all'>('all');
const isFormModalOpen = ref(false);
const isAdjustModalOpen = ref(false);
const editingAccount = ref<Account | null>(null);
const adjustingAccount = ref<Account | null>(null);

const filteredAccounts = computed(() => {
  if (activeTab.value === 'all') return accountStore.accounts;
  return accountStore.accounts.filter((acc) => acc.type === activeTab.value);
});

const handleOpenCreateModal = () => {
  editingAccount.value = null;
  isFormModalOpen.value = true;
};

const handleOpenEditModal = (acc: Account) => {
  editingAccount.value = acc;
  isFormModalOpen.value = true;
};

const handleOpenAdjustModal = (acc: Account) => {
  adjustingAccount.value = acc;
  isAdjustModalOpen.value = true;
};

const handleSaveAccount = async (dto: CreateAccountDTO) => {
  try {
    if (editingAccount.value) {
      await accountStore.updateAccount(editingAccount.value.id, dto);
    } else {
      await accountStore.addAccount(dto);
    }
  } catch (err: any) {
    alert(err.message || 'Failed to save account');
  }
};

const handleAdjustBalance = async (newBalance: number) => {
  if (!adjustingAccount.value) return;
  try {
    await accountStore.adjustBalance(adjustingAccount.value.id, newBalance);
  } catch (err: any) {
    alert(err.message || 'Failed to adjust balance');
  }
};

const handleDeleteAccount = async (id: string) => {
  if (confirm('Are you sure you want to delete this account? Registered transactions will remain.')) {
    try {
      await accountStore.deleteAccount(id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  }
};
</script>

<template>
  <div class="accounts-view">
    <div class="header-banner">
      <div>
        <h1 class="page-title">Accounts Management</h1>
        <p class="page-subtitle">Consolidate bank accounts, e-wallets, cash, and liabilities in one place.</p>
      </div>
      <button class="btn btn-primary" @click="handleOpenCreateModal">
        <Plus :size="18" /> Add Account
      </button>
    </div>

    <!-- Summary Banner -->
    <div class="summary-cards glass-panel">
      <div class="summary-item">
        <span class="label">Total Asset Balances</span>
        <span class="val positive">{{ formatCurrency(accountStore.totalAssets, 'IDR') }}</span>
      </div>
      <div class="divider"></div>
      <div class="summary-item">
        <span class="label">Credit Card Liabilities</span>
        <span class="val negative">{{ formatCurrency(accountStore.totalLiabilities, 'IDR') }}</span>
      </div>
      <div class="divider"></div>
      <div class="summary-item">
        <span class="label">Calculated Net Worth</span>
        <span class="val highlight">{{ formatCurrency(accountStore.netWorth, 'IDR') }}</span>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button :class="['tab-btn', { active: activeTab === 'all' }]" @click="activeTab = 'all'">
        <Wallet :size="16" /> All Accounts ({{ accountStore.accounts.length }})
      </button>
      <button :class="['tab-btn', { active: activeTab === 'bank' }]" @click="activeTab = 'bank'">
        <Landmark :size="16" /> Bank
      </button>
      <button :class="['tab-btn', { active: activeTab === 'ewallet' }]" @click="activeTab = 'ewallet'">
        <Smartphone :size="16" /> E-Wallet
      </button>
      <button :class="['tab-btn', { active: activeTab === 'cash' }]" @click="activeTab = 'cash'">
        <Banknote :size="16" /> Cash
      </button>
      <button :class="['tab-btn', { active: activeTab === 'credit_card' }]" @click="activeTab = 'credit_card'">
        <CreditCard :size="16" /> Credit Cards
      </button>
      <button :class="['tab-btn', { active: activeTab === 'investment' }]" @click="activeTab = 'investment'">
        <TrendingUp :size="16" /> Investment
      </button>
    </div>

    <!-- Accounts Grid -->
    <div v-if="filteredAccounts.length > 0" class="accounts-grid">
      <AccountCard
        v-for="acc in filteredAccounts"
        :key="acc.id"
        :account="acc"
        @edit="handleOpenEditModal"
        @adjust="handleOpenAdjustModal"
        @delete="handleDeleteAccount"
      />
    </div>
    <div v-else class="empty-state glass-panel">
      <p>No accounts match the selected category.</p>
      <button class="btn btn-primary margin-top" @click="handleOpenCreateModal">
        <Plus :size="16" /> Add Account
      </button>
    </div>

    <!-- Modals -->
    <AccountFormModal
      :is-open="isFormModalOpen"
      :edit-account="editingAccount"
      @close="isFormModalOpen = false"
      @submit="handleSaveAccount"
    />

    <BalanceAdjustModal
      :is-open="isAdjustModalOpen"
      :account="adjustingAccount"
      @close="isAdjustModalOpen = false"
      @submit="handleAdjustBalance"
    />
  </div>
</template>

<style scoped>
.accounts-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 4px;
}

.summary-cards {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20px 24px;
}

@media (max-width: 640px) {
  .summary-cards {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .divider {
    display: none;
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.summary-item .label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.summary-item .val {
  font-size: 1.4rem;
  font-weight: 800;
}

.summary-item .val.positive {
  color: var(--accent-success);
}

.summary-item .val.negative {
  color: var(--accent-danger);
}

.summary-item .val.highlight {
  color: var(--accent-primary);
}

.divider {
  width: 1px;
  height: 40px;
  background: var(--glass-border);
}

.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  border: var(--glass-border);
  white-space: nowrap;
}

:global(html.light) .tab-btn {
  background: rgba(15, 23, 42, 0.04);
}

.tab-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
  border-color: transparent;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

@media (max-width: 640px) {
  .accounts-grid {
    grid-template-columns: 1fr;
  }
}

.empty-state {
  padding: 48px;
  text-align: center;
  color: var(--text-muted);
}

.margin-top {
  margin-top: 14px;
}
</style>
