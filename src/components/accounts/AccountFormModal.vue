<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Account, AccountType, CreateAccountDTO } from '@/types/account';
import { X, Check } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  editAccount?: Account | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', dto: CreateAccountDTO): void;
}>();

const name = ref('');
const type = ref<AccountType>('bank');
const currency = ref('IDR');
const balance = ref<number | null>(0);
const institutionName = ref('');
const accountNumberMask = ref('');
const color = ref('#3b82f6');

const formError = ref<string | null>(null);

const resetForm = () => {
  name.value = '';
  type.value = 'bank';
  currency.value = 'IDR';
  balance.value = 0;
  institutionName.value = '';
  accountNumberMask.value = '';
  color.value = '#3b82f6';
  formError.value = null;
};

watch(
  () => props.editAccount,
  (acc) => {
    if (acc) {
      name.value = acc.name;
      type.value = acc.type;
      currency.value = acc.currency;
      balance.value = acc.balance;
      institutionName.value = acc.institutionName || '';
      accountNumberMask.value = acc.accountNumberMask || '';
      color.value = acc.color || '#3b82f6';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  if (!name.value.trim()) {
    formError.value = 'Please provide an account name.';
    return;
  }
  if (balance.value === null || isNaN(balance.value)) {
    formError.value = 'Please enter a valid balance.';
    return;
  }

  const dto: CreateAccountDTO = {
    name: name.value.trim(),
    type: type.value,
    currency: currency.value,
    balance: balance.value,
    color: color.value,
    icon: type.value === 'bank' ? 'Landmark' : type.value === 'ewallet' ? 'Smartphone' : type.value === 'cash' ? 'Banknote' : type.value === 'credit_card' ? 'CreditCard' : 'TrendingUp',
  };

  const inst = institutionName.value.trim();
  if (inst) dto.institutionName = inst;

  const mask = accountNumberMask.value.trim();
  if (mask) dto.accountNumberMask = mask;

  emit('submit', dto);
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content glass-panel">
      <div class="modal-header">
        <h2>{{ editAccount ? 'Edit Account' : 'Add New Account' }}</h2>
        <button class="close-btn" @click="$emit('close')">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="account-form">
        <div v-if="formError" class="error-banner">
          {{ formError }}
        </div>

        <div class="form-group">
          <label>Account Name</label>
          <input type="text" placeholder="e.g., Chase Checking, GoPay" v-model="name" required />
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Account Type</label>
            <select v-model="type" required>
              <option value="bank">Bank Account</option>
              <option value="ewallet">E-Wallet</option>
              <option value="cash">Cash Account</option>
              <option value="investment">Investment Account</option>
              <option value="credit_card">Credit Card (Liability)</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label>Currency</label>
            <select v-model="currency" required>
              <option value="IDR">IDR (Rp)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Current Initial Balance</label>
          <input type="number" step="0.01" v-model.number="balance" required />
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Institution Name (Optional)</label>
            <input type="text" placeholder="e.g., JPMorgan Chase" v-model="institutionName" />
          </div>

          <div class="form-group flex-1">
            <label>Masked Account # (Optional)</label>
            <input type="text" placeholder="e.g., **** 4321" v-model="accountNumberMask" />
          </div>
        </div>

        <div class="form-group">
          <label>Theme Color</label>
          <input type="color" v-model="color" class="color-picker" />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <Check :size="18" /> {{ editAccount ? 'Update Account' : 'Create Account' }}
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
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: var(--glass-border);
}

.close-btn {
  background: transparent;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--accent-danger);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

.color-picker {
  height: 42px;
  padding: 4px 6px;
  cursor: pointer;
  width: 100%;
  border-radius: var(--radius-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: var(--glass-border);
}
</style>
