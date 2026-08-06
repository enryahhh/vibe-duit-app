<script setup lang="ts">
import { computed } from 'vue';
import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-vue-next';
import { formatCurrency } from '@/utils/formatCurrency';

const props = defineProps<{
  title: string;
  amount: number;
  type: 'networth' | 'income' | 'expense' | 'liability';
  subtitle?: string;
}>();

const iconComponent = computed(() => {
  switch (props.type) {
    case 'networth':
      return Wallet;
    case 'income':
      return TrendingUp;
    case 'expense':
      return TrendingDown;
    case 'liability':
      return CreditCard;
  }
});

const formattedAmount = computed(() => {
  return formatCurrency(props.amount, 'IDR');
});
</script>

<template>
  <div class="stat-card glass-panel" :class="type">
    <div class="stat-header">
      <div class="icon-box">
        <component :is="iconComponent" :size="24" />
      </div>
      <span class="stat-title">{{ title }}</span>
    </div>

    <div class="stat-body">
      <h2 class="stat-value">{{ formattedAmount }}</h2>
      <p v-if="subtitle" class="stat-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.networth .icon-box {
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
}

.stat-card.income .icon-box {
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent-success);
}

.stat-card.expense .icon-box {
  background: rgba(239, 68, 68, 0.15);
  color: var(--accent-danger);
}

.stat-card.liability .icon-box {
  background: rgba(245, 158, 11, 0.15);
  color: var(--accent-warning);
}

.stat-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
}

.stat-card.income .stat-value {
  color: var(--accent-success);
}

.stat-card.expense .stat-value {
  color: var(--accent-danger);
}

.stat-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
