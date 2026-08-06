<script setup lang="ts">
import { ref } from 'vue';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategories } from '@/composables/useCategories';
import TransactionListItem from '@/components/transactions/TransactionListItem.vue';
import TransactionFormModal from '@/components/transactions/TransactionFormModal.vue';
import type { CreateTransactionDTO } from '@/types/transaction';
import { Search, Plus, Filter, RotateCcw } from 'lucide-vue-next';
import { formatCurrency } from '@/utils/formatCurrency';

const transactionStore = useTransactionStore();
const accountStore = useAccountStore();
const { categories } = useCategories();

const isModalOpen = ref(false);

const handleSaveTransaction = async (dto: CreateTransactionDTO) => {
  try {
    await transactionStore.addTransaction(dto);
  } catch (err: any) {
    alert(err.message || 'Failed to record transaction');
  }
};

const handleDeleteTransaction = async (tx: any) => {
  if (confirm(`Are you sure you want to delete this transaction of ${formatCurrency(tx.amount, 'IDR')}?`)) {
    try {
      await transactionStore.deleteTransaction(tx);
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    }
  }
};
</script>

<template>
  <div class="transactions-view">
    <div class="header-banner">
      <div>
        <h1 class="page-title">Transaction History</h1>
        <p class="page-subtitle">Filter, search, and review all your income, expense, and transfer records.</p>
      </div>
      <button class="btn btn-primary" @click="isModalOpen = true">
        <Plus :size="18" /> Log Transaction
      </button>
    </div>

    <!-- Filter Bar (FR1.10) -->
    <div class="filter-bar glass-panel">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input
          type="text"
          placeholder="Search by category or note..."
          v-model="transactionStore.filter.searchQuery"
        />
      </div>

      <div class="filter-inputs">
        <select v-model="transactionStore.filter.type">
          <option :value="undefined">All Types</option>
          <option value="expense">Expense Only</option>
          <option value="income">Income Only</option>
          <option value="transfer">Transfer Only</option>
        </select>

        <select v-model="transactionStore.filter.accountId">
          <option :value="undefined">All Accounts</option>
          <option v-for="acc in accountStore.accounts" :key="acc.id" :value="acc.id">
            {{ acc.name }}
          </option>
        </select>

        <select v-model="transactionStore.filter.categoryId">
          <option :value="undefined">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>

        <input
          type="date"
          v-model="transactionStore.filter.startDate"
          placeholder="Start Date"
          title="Start Date"
        />
        <input
          type="date"
          v-model="transactionStore.filter.endDate"
          placeholder="End Date"
          title="End Date"
        />

        <button class="btn btn-secondary reset-btn" title="Reset Filters" @click="transactionStore.resetFilter">
          <RotateCcw :size="16" />
        </button>
      </div>
    </div>

    <!-- Transactions List -->
    <div class="history-container">
      <div class="list-summary">
        Showing <strong>{{ transactionStore.filteredTransactions.length }}</strong> transactions
      </div>

      <div v-if="transactionStore.filteredTransactions.length > 0" class="tx-list">
        <TransactionListItem
          v-for="tx in transactionStore.filteredTransactions"
          :key="tx.id"
          :transaction="tx"
          @delete="handleDeleteTransaction"
        />
      </div>
      <div v-else class="empty-state glass-panel">
        <p>No transactions match your query criteria.</p>
        <button class="btn btn-secondary margin-top" @click="transactionStore.resetFilter">
          Clear Filters
        </button>
      </div>
    </div>

    <TransactionFormModal
      :is-open="isModalOpen"
      @close="isModalOpen = false"
      @submit="handleSaveTransaction"
    />
  </div>
</template>

<style scoped>
.transactions-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.filter-bar {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-box input {
  width: 100%;
  padding-left: 42px;
  background: rgba(15, 23, 42, 0.8);
}

.filter-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-inputs select,
.filter-inputs input {
  flex: 1;
  min-width: 150px;
}

.reset-btn {
  padding: 10px 14px;
}

.list-summary {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
