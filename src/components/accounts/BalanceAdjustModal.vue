<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Account } from '@/types/account';
import { X, RefreshCw } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  account: Account | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', newBalance: number): void;
}>();

const newBalance = ref<number | null>(0);

watch(
  () => props.account,
  (acc) => {
    if (acc) {
      newBalance.value = acc.balance;
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  if (newBalance.value === null || isNaN(newBalance.value)) return;
  emit('submit', newBalance.value);
  emit('close');
};
</script>

<template>
  <div v-if="isOpen && account" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content glass-panel">
      <div class="modal-header">
        <h2>Adjust Account Balance</h2>
        <button class="close-btn" @click="$emit('close')">
          <X :size="20" />
        </button>
      </div>

      <div class="account-info">
        <p class="account-name">{{ account.name }}</p>
        <p class="current-bal">Current Recorded Balance: <strong>{{ account.currency }} {{ account.balance.toFixed(2) }}</strong></p>
      </div>

      <form @submit.prevent="handleSubmit" class="adjust-form">
        <div class="form-group">
          <label>Updated Actual Balance</label>
          <input type="number" step="0.01" v-model.number="newBalance" required autofocus />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <RefreshCw :size="18" /> Update Balance
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--glass-border);
}

.account-info {
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}

.account-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.current-bal {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.adjust-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
</style>
