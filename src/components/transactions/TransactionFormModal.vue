<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategories } from '@/composables/useCategories';
import type { CreateTransactionDTO, TransactionType, RecurrenceFrequency } from '@/types/transaction';
import { PlusCircle, X } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', dto: CreateTransactionDTO): void;
}>();

const accountStore = useAccountStore();
const { categories } = useCategories();

const type = ref<TransactionType>('expense');
const amount = ref<number | null>(null);
const date = ref<string>(new Date().toISOString().slice(0, 10));
const fromAccountId = ref<string>('');
const toAccountId = ref<string>('');
const categoryId = ref<string>('');
const note = ref<string>('');

// Recurring options
const isRecurring = ref<boolean>(false);
const frequency = ref<RecurrenceFrequency>('monthly');
const endDate = ref<string>('');

const formError = ref<string | null>(null);

// Reset / initialize defaults when accounts or type change
watch(
  () => accountStore.accounts,
  (accs) => {
    if (accs.length > 0 && !fromAccountId.value) {
      fromAccountId.value = accs[0]!.id;
    }
  },
  { immediate: true }
);

// Auto-select category when type changes or defaults are loaded
watch(type, (newType) => {
  if (newType === 'transfer') {
    const transferCat = categories.value.find((c) => c.type === 'transfer');
    if (transferCat) categoryId.value = transferCat.id;
  } else {
    const defaultCat = categories.value.find((c) => c.type === newType);
    if (defaultCat) categoryId.value = defaultCat.id;
  }
});

const availableCategories = computed(() => {
  return categories.value.filter((cat) => cat.type === type.value);
});

const availableToAccounts = computed(() => {
  return accountStore.accounts.filter((acc) => acc.id !== fromAccountId.value);
});

const handleSubmit = () => {
  formError.value = null;

  if (!amount.value || amount.value <= 0) {
    formError.value = 'Please enter a valid positive amount.';
    return;
  }
  if (!fromAccountId.value) {
    formError.value = 'Please select a source account.';
    return;
  }
  if (type.value === 'transfer' && !toAccountId.value) {
    formError.value = 'Please select a destination account for transfer.';
    return;
  }
  if (!categoryId.value) {
    formError.value = 'Please select a category.';
    return;
  }

  const selectedCategory = categories.value.find((c) => c.id === categoryId.value);
  const categoryName = selectedCategory ? selectedCategory.name : 'Uncategorized';

  const dto: CreateTransactionDTO = {
    type: type.value,
    amount: amount.value,
    date: date.value,
    fromAccountId: fromAccountId.value,
    toAccountId: type.value === 'expense' ? undefined : toAccountId.value || undefined,
    categoryId: categoryId.value,
    categoryName,
    note: note.value.trim() || undefined,
    recurrence: isRecurring.value
      ? {
          isRecurring: true,
          frequency: frequency.value,
          endDate: endDate.value || undefined,
        }
      : undefined,
  };

  emit('submit', dto);
  resetForm();
  emit('close');
};

const resetForm = () => {
  amount.value = null;
  note.value = '';
  isRecurring.value = false;
  formError.value = null;
  date.value = new Date().toISOString().slice(0, 10);
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content glass-panel">
      <div class="modal-header">
        <h2>Record Transaction</h2>
        <button class="close-btn" @click="$emit('close')">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="transaction-form">
        <!-- Error Banner -->
        <div v-if="formError" class="error-banner">
          {{ formError }}
        </div>

        <!-- 1. Transaction Type Radios -->
        <div class="form-group">
          <label>Transaction Type</label>
          <div class="type-selector">
            <label :class="['type-btn', { active: type === 'expense' }]">
              <input type="radio" v-model="type" value="expense" class="hidden-radio" />
              Expense
            </label>
            <label :class="['type-btn', { active: type === 'income' }]">
              <input type="radio" v-model="type" value="income" class="hidden-radio" />
              Income
            </label>
            <label :class="['type-btn', { active: type === 'transfer' }]">
              <input type="radio" v-model="type" value="transfer" class="hidden-radio" />
              Transfer
            </label>
          </div>
        </div>

        <!-- 2. Amount & Date -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Amount</label>
            <div class="amount-input-wrapper">
              <span class="currency-symbol">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                v-model.number="amount"
                required
              />
            </div>
          </div>
          <div class="form-group flex-1">
            <label>Date</label>
            <input type="date" v-model="date" required />
          </div>
        </div>

        <!-- 3. Account (From) & Account (To) -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label>{{ type === 'income' ? 'Deposit To Account' : 'From Account' }}</label>
            <select v-model="fromAccountId" required>
              <option disabled value="">Select Account</option>
              <option v-for="acc in accountStore.accounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} ({{ acc.currency }} {{ acc.balance.toFixed(2) }})
              </option>
            </select>
          </div>

          <div v-if="type === 'transfer' || type === 'income'" class="form-group flex-1">
            <label>{{ type === 'transfer' ? 'To Account' : 'Optional Source Account' }}</label>
            <select v-model="toAccountId" :required="type === 'transfer'">
              <option value="">{{ type === 'transfer' ? 'Select Target Account' : 'None' }}</option>
              <option v-for="acc in availableToAccounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} ({{ acc.currency }} {{ acc.balance.toFixed(2) }})
              </option>
            </select>
          </div>
        </div>

        <!-- 4. Category Dropdown -->
        <div class="form-group">
          <label>Category</label>
          <select v-model="categoryId" required>
            <option disabled value="">Select Category</option>
            <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- 5. Note / Memo -->
        <div class="form-group">
          <label>Note / Description (Optional)</label>
          <input type="text" placeholder="e.g., Grocery shopping at Walmart" v-model="note" />
        </div>

        <!-- 6. Recurring Toggle -->
        <div class="recurring-section">
          <div class="toggle-row">
            <label class="toggle-label">
              <input type="checkbox" v-model="isRecurring" />
              <span>Make this a recurring transaction</span>
            </label>
          </div>

          <div v-if="isRecurring" class="form-row recurring-fields">
            <div class="form-group flex-1">
              <label>Frequency</label>
              <select v-model="frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>End Date (Optional)</label>
              <input type="date" v-model="endDate" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <PlusCircle :size="18" /> Save Transaction
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
  padding-bottom: 12px;
  border-bottom: var(--glass-border);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  color: var(--text-secondary);
  padding: 4px;
}

.close-btn:hover {
  color: var(--text-primary);
}

.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

.type-selector {
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  border: var(--glass-border);
  border-radius: var(--radius-md);
  padding: 4px;
  gap: 4px;
}

.type-btn {
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.type-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
}

.hidden-radio {
  display: none;
}

.amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  font-weight: 600;
}

.amount-input-wrapper input {
  width: 100%;
  padding-left: 30px;
}

.recurring-section {
  background: rgba(255, 255, 255, 0.03);
  border: var(--glass-border);
  border-radius: var(--radius-md);
  padding: 12px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.recurring-fields {
  margin-top: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
</style>
