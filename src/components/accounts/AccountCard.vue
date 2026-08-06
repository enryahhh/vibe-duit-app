<script setup lang="ts">
import { computed } from 'vue';
import type { Account } from '@/types/account';
import { Landmark, Smartphone, Banknote, CreditCard, TrendingUp, RefreshCw, Edit, Trash2 } from 'lucide-vue-next';
import { formatCurrency } from '@/utils/formatCurrency';

const props = defineProps<{
  account: Account;
}>();

const emit = defineEmits<{
  (e: 'edit', account: Account): void;
  (e: 'adjust', account: Account): void;
  (e: 'delete', accountId: string): void;
}>();

const iconComponent = computed(() => {
  switch (props.account.type) {
    case 'bank':
      return Landmark;
    case 'ewallet':
      return Smartphone;
    case 'cash':
      return Banknote;
    case 'credit_card':
      return CreditCard;
    case 'investment':
      return TrendingUp;
    default:
      return Landmark;
  }
});

const typeLabel = computed(() => {
  switch (props.account.type) {
    case 'bank':
      return 'Bank Account';
    case 'ewallet':
      return 'E-Wallet';
    case 'cash':
      return 'Offline Cash';
    case 'credit_card':
      return 'Credit Card (Liability)';
    case 'investment':
      return 'Investment';
    default:
      return 'Account';
  }
});

const formattedDate = computed(() => {
  if (!props.account.updatedAt) return '';
  const date = new Date(props.account.updatedAt);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
});
</script>

<template>
  <div class="account-card glass-panel" :style="{ borderTop: `4px solid ${account.color || '#3b82f6'}` }">
    <div class="card-header">
      <div class="icon-badge" :style="{ backgroundColor: `${account.color || '#3b82f6'}20`, color: account.color || '#3b82f6' }">
        <component :is="iconComponent" :size="22" />
      </div>
      <div class="header-text">
        <h3 class="account-title">{{ account.name }}</h3>
        <p class="account-subtitle">
          {{ typeLabel }} <span v-if="account.accountNumberMask">• {{ account.accountNumberMask }}</span>
        </p>
      </div>
      <div class="actions">
        <button class="icon-action-btn" title="Edit Account" @click="$emit('edit', account)">
          <Edit :size="16" />
        </button>
        <button class="icon-action-btn danger" title="Delete Account" @click="$emit('delete', account.id)">
          <Trash2 :size="16" />
        </button>
      </div>
    </div>

    <div class="card-body">
      <div class="balance-display">
        <span class="balance-label">Current Balance</span>
        <div class="balance-value" :class="{ liability: account.type === 'credit_card' }">
          {{ formatCurrency(account.balance, account.currency) }}
        </div>
      </div>
    </div>

    <div class="card-footer">
      <span class="last-updated">Updated: {{ formattedDate }}</span>
      <button class="btn btn-secondary adjust-btn" @click="$emit('adjust', account)">
        <RefreshCw :size="14" /> Balance Update
      </button>
    </div>
  </div>
</template>

<style scoped>
.account-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-badge {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  overflow: hidden;
}

.account-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: 6px;
}

.icon-action-btn {
  background: transparent;
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-sm);
}

.icon-action-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.icon-action-btn.danger:hover {
  color: var(--accent-danger);
  background: rgba(239, 68, 68, 0.15);
}

.card-body {
  margin: 18px 0;
}

.balance-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
}

.balance-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-top: 4px;
}

.balance-value.liability {
  color: var(--accent-danger);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: var(--glass-border);
  margin-top: auto;
}

.last-updated {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.adjust-btn {
  padding: 6px 12px;
  font-size: 0.8rem;
}
</style>
