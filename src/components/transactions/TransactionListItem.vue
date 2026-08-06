<script setup lang="ts">
import { computed } from "vue";
import type { Transaction } from "@/types/transaction";
import { useAccountStore } from "@/stores/useAccountStore";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Trash2,
} from "lucide-vue-next";
import { formatCurrency } from "@/utils/formatCurrency";

const props = defineProps<{
  transaction: Transaction;
}>();

const emit = defineEmits<{
  (e: "delete", tx: Transaction): void;
}>();

const accountStore = useAccountStore();

const fromAccountName = computed(() => {
  const acc = accountStore.getAccountById(props.transaction.fromAccountId);
  return acc ? acc.name : "Unknown Account";
});

const toAccountName = computed(() => {
  if (!props.transaction.toAccountId) return "";
  const acc = accountStore.getAccountById(props.transaction.toAccountId);
  return acc ? acc.name : "Unknown Account";
});

const typeIcon = computed(() => {
  switch (props.transaction.type) {
    case "income":
      return ArrowDownLeft;
    case "expense":
      return ArrowUpRight;
    case "transfer":
      return ArrowLeftRight;
  }
});

const typeLabel = computed(() => {
  switch (props.transaction.type) {
    case "income":
      return "IN";
    case "expense":
      return "OUT";
    case "transfer":
      return "TRF";
  }
});

const formattedAmount = computed(() => {
  const formatted = formatCurrency(props.transaction.amount, "IDR");
  if (props.transaction.type === "income") return `+ ${formatted}`;
  if (props.transaction.type === "expense") return `- ${formatted}`;
  return formatted;
});
</script>

<template>
  <div class="transaction-item glass-panel">
    <div class="type-icon-badge" :class="transaction.type">
      <component :is="typeIcon" :size="20" />
    </div>

    <div class="tx-info">
      <div class="tx-primary">
        <span class="type-label-badge" :class="transaction.type">{{
          typeLabel
        }}</span>
        <span class="tx-category">{{ transaction.categoryName }}</span>
        <span class="tx-date">{{ transaction.date }}</span>
      </div>
      <div class="tx-secondary">
        <span class="account-flow">
          {{ fromAccountName }}
          <template v-if="transaction.toAccountId">
            → {{ toAccountName }}
          </template>
        </span>
        <span v-if="transaction.note" class="tx-note">• {{ transaction.note }}</span>
      </div>
    </div>

    <div class="tx-right">
      <span class="tx-amount" :class="transaction.type">
        {{ formattedAmount }}
      </span>
      <button
        class="delete-btn"
        title="Delete record"
        @click="$emit('delete', transaction)"
      >
        <Trash2 :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.transaction-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  transition: background-color 0.2s ease;
}

.transaction-item:hover {
  background: var(--bg-card-hover);
}

.type-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.type-icon-badge.income {
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent-success);
}

.type-icon-badge.expense {
  background: rgba(239, 68, 68, 0.15);
  color: var(--accent-danger);
}

.type-icon-badge.transfer {
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
}

.type-label-badge {
  display: none;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.type-label-badge.income {
  background: rgba(16, 185, 129, 0.2);
  color: var(--accent-success);
}

.type-label-badge.expense {
  background: rgba(239, 68, 68, 0.2);
  color: var(--accent-danger);
}

.type-label-badge.transfer {
  background: rgba(99, 102, 241, 0.2);
  color: var(--accent-primary);
}

.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tx-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tx-category {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-date {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.tx-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.account-flow {
  font-weight: 500;
}

.tx-note {
  color: var(--text-muted);
  font-style: italic;
}

.tx-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.tx-amount {
  font-size: 1.05rem;
  font-weight: 800;
}

.tx-amount.income {
  color: var(--accent-success);
}

.tx-amount.expense {
  color: var(--accent-danger);
}

.tx-amount.transfer {
  color: var(--accent-primary);
}

.delete-btn {
  background: transparent;
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.transaction-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--accent-danger);
  background: rgba(239, 68, 68, 0.15);
}

@media (max-width: 640px) {
  .transaction-item {
    padding: 10px 12px;
    gap: 10px;
  }

  .type-icon-badge {
    display: none;
  }

  .type-label-badge {
    display: inline-block;
  }

  .tx-category {
    font-size: 0.88rem;
  }

  .tx-date {
    font-size: 0.72rem;
  }

  .tx-secondary {
    font-size: 0.74rem;
  }

  .tx-amount {
    font-size: 0.92rem;
  }

  .delete-btn {
    opacity: 1;
    padding: 4px;
  }
}
</style>
