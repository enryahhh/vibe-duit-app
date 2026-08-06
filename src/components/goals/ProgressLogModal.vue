<script setup lang="ts">
import { ref, watch } from "vue";
import type { Goal } from "@/types/goal";
import { formatCurrency } from "@/utils/formatCurrency";
import { X, PlusCircle, Calendar, DollarSign, FileText } from "lucide-vue-next";

const props = defineProps<{
  isOpen: boolean;
  goal: Goal | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "submit",
    payload: { goalId: string; amount: number; note?: string; date?: string },
  ): void;
}>();

const amount = ref<number | "">("");
const note = ref("");
const date = ref(new Date().toISOString().slice(0, 10));

const resetForm = () => {
  amount.value = "";
  note.value = "";
  date.value = new Date().toISOString().slice(0, 10);
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) resetForm();
  },
);

const handleSubmit = () => {
  if (!props.goal) return;
  if (!amount.value || Number(amount.value) <= 0) {
    alert("Please enter a contribution amount greater than zero");
    return;
  }

  emit("submit", {
    goalId: props.goal.id,
    amount: Number(amount.value),
    note: note.value.trim() || undefined,
    date: date.value,
  });

  emit("close");
};
</script>

<template>
  <div v-if="isOpen && goal" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card glass-panel">
      <div class="modal-header">
        <div class="header-title">
          <div class="header-icon">
            <PlusCircle :size="20" />
          </div>
          <div>
            <h2>Log Goal Contribution</h2>
            <p class="goal-subname">{{ goal.name }}</p>
          </div>
        </div>
        <button type="button" class="btn-close" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="goal-status-box">
          <div class="box-stat">
            <span class="stat-label">Target Amount</span>
            <span class="stat-value">{{
              formatCurrency(goal.targetAmount)
            }}</span>
          </div>
          <div class="box-stat">
            <span class="stat-label">Currently Saved</span>
            <span class="stat-value saved">{{
              formatCurrency(goal.currentSaved)
            }}</span>
          </div>
          <div class="box-stat">
            <span class="stat-label">Remaining</span>
            <span class="stat-value">
              {{
                formatCurrency(
                  Math.max(0, goal.targetAmount - goal.currentSaved),
                )
              }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="contrib-amount"
            >Contribution Amount <span class="required">*</span></label
          >
          <div class="input-with-icon">
            <DollarSign :size="16" class="field-icon" />
            <input
              id="contrib-amount"
              v-model.number="amount"
              type="number"
              min="0.01"
              step="any"
              class="form-input icon-indent"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="contrib-date">Date <span class="required">*</span></label>
          <div class="input-with-icon">
            <Calendar :size="16" class="field-icon" />
            <input
              id="contrib-date"
              v-model="date"
              type="date"
              class="form-input icon-indent"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="contrib-note">Note / Memory (Optional)</label>
          <div class="input-with-icon">
            <FileText :size="16" class="field-icon" />
            <input
              id="contrib-note"
              v-model="note"
              type="text"
              class="form-input icon-indent"
              placeholder="e.g. Monthly salary savings transfer"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            Add Contribution
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  border-radius: var(--radius-xl);
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-header h2 {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.goal-subname {
  font-size: 0.78rem;
  color: var(--accent-primary);
  margin: 2px 0 0 0;
  font-weight: 600;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.goal-status-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px;
  border-radius: var(--radius-md);
}

.box-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
}

.stat-value.saved {
  color: var(--accent-success);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.required {
  color: #ef4444;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.icon-indent {
  padding-left: 36px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
</style>
