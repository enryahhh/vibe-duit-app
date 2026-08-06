<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Goal, CreateGoalDTO, GoalPriority } from "@/types/goal";
import { useAccountStore } from "@/stores/useAccountStore";
import { useGoalStore } from "@/stores/useGoalStore";
import GoalRecommendationCard from "@/components/goals/GoalRecommendationCard.vue";
import {
  X,
  Target,
  Calendar,
  Wallet,
  DollarSign,
  Sparkles,
} from "lucide-vue-next";

const props = defineProps<{
  isOpen: boolean;
  goalToEdit?: Goal | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", dto: CreateGoalDTO): void;
}>();

const accountStore = useAccountStore();
const goalStore = useGoalStore();

const name = ref("");
const targetAmount = ref<number | "">("");
const currentSaved = ref<number | "">(0);
const deadline = ref("");
const priority = ref<GoalPriority>("medium");
const linkedAccountId = ref<string>("");
const customMonthlyTarget = ref<number | "">("");
const isCustomOverride = ref(false);

const accounts = computed(() => accountStore.accounts);

const isEditing = computed(() => !!props.goalToEdit);

const calculatedRecommendation = computed(() => {
  const target = Number(targetAmount.value) || 0;
  const saved = Number(currentSaved.value) || 0;
  return goalStore.getRecommendationForGoal(
    target,
    saved,
    deadline.value || undefined,
  );
});

const resetForm = () => {
  if (props.goalToEdit) {
    name.value = props.goalToEdit.name;
    targetAmount.value = props.goalToEdit.targetAmount;
    currentSaved.value = props.goalToEdit.currentSaved;
    deadline.value = props.goalToEdit.deadline || "";
    priority.value = props.goalToEdit.priority;
    linkedAccountId.value = props.goalToEdit.linkedAccountId || "";
    customMonthlyTarget.value = props.goalToEdit.customMonthlyTarget || "";
    isCustomOverride.value = !!props.goalToEdit.customMonthlyTarget;
  } else {
    name.value = "";
    targetAmount.value = "";
    currentSaved.value = 0;
    deadline.value = "";
    priority.value = "medium";
    linkedAccountId.value = "";
    customMonthlyTarget.value = "";
    isCustomOverride.value = false;
  }
};

watch(
  () => [props.isOpen, props.goalToEdit],
  () => {
    if (props.isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

const handleApplyRecommendation = (amount: number) => {
  customMonthlyTarget.value = amount;
  isCustomOverride.value = false;
};

const handleSubmit = () => {
  if (!name.value.trim()) {
    alert("Please enter a goal name");
    return;
  }
  if (!targetAmount.value || Number(targetAmount.value) <= 0) {
    alert("Please enter a valid target amount greater than zero");
    return;
  }

  const dto: CreateGoalDTO = {
    name: name.value.trim(),
    targetAmount: Number(targetAmount.value),
    currentSaved: Number(currentSaved.value) || 0,
    deadline: deadline.value ? deadline.value : undefined,
    priority: priority.value,
    linkedAccountId: linkedAccountId.value ? linkedAccountId.value : undefined,
    customMonthlyTarget:
      isCustomOverride.value && customMonthlyTarget.value
        ? Number(customMonthlyTarget.value)
        : undefined,
    status: props.goalToEdit ? props.goalToEdit.status : "active",
  };

  emit("submit", dto);
  emit("close");
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card glass-panel">
      <div class="modal-header">
        <div class="header-title">
          <div class="header-icon">
            <Target :size="20" />
          </div>
          <h2>{{ isEditing ? "Edit Goal" : "Create New Goal" }}</h2>
        </div>
        <button type="button" class="btn-close" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- Goal Name -->
        <div class="form-group">
          <label for="goal-name"
            >Goal Name <span class="required">*</span></label
          >
          <input
            id="goal-name"
            v-model="name"
            type="text"
            class="form-input"
            placeholder="e.g. Emergency Fund, Bali Trip"
            required
          />
        </div>

        <!-- Target Amount & Starting Saved Grid -->
        <div class="form-row">
          <div class="form-group">
            <label for="target-amount"
              >Target Amount <span class="required">*</span></label
            >
            <div class="input-with-icon">
              <DollarSign :size="16" class="field-icon" />
              <input
                id="target-amount"
                v-model.number="targetAmount"
                type="number"
                min="1"
                step="any"
                class="form-input icon-indent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="current-saved">Starting Balance (Saved)</label>
            <div class="input-with-icon">
              <DollarSign :size="16" class="field-icon" />
              <input
                id="current-saved"
                v-model.number="currentSaved"
                type="number"
                min="0"
                step="any"
                class="form-input icon-indent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <!-- Deadline & Priority Row -->
        <div class="form-row">
          <div class="form-group">
            <label for="goal-deadline">Target Deadline (Optional)</label>
            <div class="input-with-icon">
              <Calendar :size="16" class="field-icon" />
              <input
                id="goal-deadline"
                v-model="deadline"
                type="date"
                class="form-input icon-indent"
              />
            </div>
            <span class="field-hint"
              >Leave blank for default 12-month plan</span
            >
          </div>

          <div class="form-group">
            <label for="goal-priority"
              >Priority <span class="required">*</span></label
            >
            <select
              id="goal-priority"
              v-model="priority"
              class="form-select"
              required
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        <!-- Linked Account Selector -->
        <div class="form-group">
          <label for="linked-account">Linked Savings Account (Optional)</label>
          <div class="input-with-icon">
            <Wallet :size="16" class="field-icon" />
            <select
              id="linked-account"
              v-model="linkedAccountId"
              class="form-select icon-indent"
            >
              <option value="">No linked account (Manual tracking)</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} ({{ acc.currency }})
              </option>
            </select>
          </div>
        </div>

        <!-- Recommendation Engine Card Preview -->
        <div v-if="Number(targetAmount) > 0" class="recommendation-wrapper">
          <GoalRecommendationCard
            :recommendation="calculatedRecommendation"
            :selected-monthly-target="
              isCustomOverride && customMonthlyTarget
                ? Number(customMonthlyTarget)
                : calculatedRecommendation.recommendedMonthly
            "
            @apply-recommendation="handleApplyRecommendation"
          />
        </div>

        <!-- Custom Target Override Section -->
        <div class="form-group override-group">
          <div class="checkbox-row">
            <input
              id="override-toggle"
              v-model="isCustomOverride"
              type="checkbox"
            />
            <label for="override-toggle"
              >Override recommended monthly contribution</label
            >
          </div>

          <div v-if="isCustomOverride" class="override-input-wrap">
            <label for="custom-monthly">Custom Monthly Target</label>
            <input
              id="custom-monthly"
              v-model.number="customMonthlyTarget"
              type="number"
              min="1"
              step="any"
              class="form-input"
              placeholder="e.g. 500"
            />
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            {{ isEditing ? "Save Changes" : "Create Goal" }}
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
  max-width: 620px;
  max-height: 90vh;
  overflow-y: auto;
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
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  padding: 4px;
}

.btn-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 580px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.required {
  color: #ef4444;
}

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
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

.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.icon-indent {
  padding-left: 36px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.override-group {
  background: rgba(30, 41, 59, 0.4);
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-row label {
  cursor: pointer;
  color: var(--text-primary);
}

.override-input-wrap {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
