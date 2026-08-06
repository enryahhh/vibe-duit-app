<script setup lang="ts">
import { computed } from 'vue';
import { useAccountStore } from '@/stores/useAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import StatCard from '@/components/dashboard/StatCard.vue';
import SpendingChart from '@/components/dashboard/SpendingChart.vue';
import TransactionListItem from '@/components/transactions/TransactionListItem.vue';
import AccountCard from '@/components/accounts/AccountCard.vue';
import { ArrowRight, Plus } from 'lucide-vue-next';

const accountStore = useAccountStore();
const transactionStore = useTransactionStore();

const recentTransactions = computed(() => {
  return transactionStore.transactions.slice(0, 5);
});

const handleDeleteTx = async (tx: any) => {
  if (confirm('Are you sure you want to delete this transaction record?')) {
    await transactionStore.deleteTransaction(tx);
  }
};
</script>

<template>
  <div class="dashboard-view">
    <!-- 1. Header Banner -->
    <div class="welcome-banner">
      <div>
        <h1 class="page-title">Financial Dashboard</h1>
        <p class="page-subtitle">Real-time overview of your net worth, accounts, and spending breakdown.</p>
      </div>
    </div>

    <!-- 2. Stat Cards Grid (FR1.9) -->
    <div class="stats-grid">
      <StatCard
        title="Current Net Worth"
        :amount="accountStore.netWorth"
        type="networth"
        subtitle="Assets minus Credit Liabilities"
      />
      <StatCard
        title="Monthly Income"
        :amount="transactionStore.currentMonthIncome"
        type="income"
        subtitle="Total credited this month"
      />
      <StatCard
        title="Monthly Expense"
        :amount="transactionStore.currentMonthExpense"
        type="expense"
        subtitle="Total debited this month"
      />
      <StatCard
        title="Credit Liabilities"
        :amount="accountStore.totalLiabilities"
        type="liability"
        subtitle="Outstanding credit balances"
      />
    </div>

    <!-- 3. Dashboard Main Section (Charts + Recent Activity) -->
    <div class="dashboard-content-grid">
      <div class="chart-section">
        <SpendingChart :categories-data="transactionStore.currentMonthExpensesByCategory" />
      </div>

      <div class="recent-activity-section glass-panel">
        <div class="section-header">
          <h3>Recent Transactions</h3>
          <router-link to="/transactions" class="view-all-link">
            View All <ArrowRight :size="16" />
          </router-link>
        </div>

        <div v-if="recentTransactions.length > 0" class="tx-list">
          <TransactionListItem
            v-for="tx in recentTransactions"
            :key="tx.id"
            :transaction="tx"
            @delete="handleDeleteTx"
          />
        </div>
        <div v-else class="empty-state">
          <p>No transactions recorded yet.</p>
        </div>
      </div>
    </div>

    <!-- 4. Quick Accounts Grid -->
    <div class="accounts-summary-section">
      <div class="section-header">
        <h3>Accounts Overview</h3>
        <router-link to="/accounts" class="view-all-link">
          Manage Accounts <ArrowRight :size="16" />
        </router-link>
      </div>

      <div v-if="accountStore.accounts.length > 0" class="accounts-grid">
        <AccountCard
          v-for="acc in accountStore.accounts.slice(0, 3)"
          :key="acc.id"
          :account="acc"
        />
      </div>
      <div v-else class="empty-state glass-panel">
        <p>No accounts configured yet.</p>
        <router-link to="/accounts" class="btn btn-primary margin-top">
          <Plus :size="16" /> Add Account
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.welcome-banner {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.dashboard-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .dashboard-content-grid {
    grid-template-columns: 1fr;
  }
}

.recent-activity-section {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent-primary);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
}

.view-all-link:hover {
  text-decoration: underline;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accounts-summary-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
}

.margin-top {
  margin-top: 12px;
}
</style>
