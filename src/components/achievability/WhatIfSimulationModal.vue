<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Goal } from "@/types/goal";
import type { WhatIfSimulationResult } from "@/types/achievability";
import { useGoalStore } from "@/stores/useGoalStore";
import { useAchievabilityStore } from "@/stores/useAchievabilityStore";
import { formatCurrency } from "@/utils/formatCurrency";
import GoalHealthBadge from "./GoalHealthBadge.vue";
import {
  X,
  Sliders,
  Sparkles,
  Calendar,
  TrendingUp,
  Scissors,
  CheckCircle2,
  ArrowRight,
  DollarSign,
} from "lucide-vue-next";

const props = defineProps<{
  isOpen: boolean;
  initialGoalId?: string;
  initialCategoryId?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "applyScenario",
    payload: { goalId: string; newMonthlyTarget: number },
  ): void;
}>();

const goalStore = useGoalStore();
const achievabilityStore = useAchievabilityStore();

const selectedGoalId = ref<string>("");
const selectedCategoryId = ref<string>("");
const categoryReductionPercent = ref<number>(20);
const customMonthlySaving = ref<number | "">("");
const scenarioName = ref<string>("Aggressive Plan");

const activeGoals = computed(() => goalStore.activeGoals);

const selectedGoal = computed(() => {
  return goalStore.getGoalById(selectedGoalId.value);
});

const baselineAchievability = computed(() => {
  if (!selectedGoalId.value) return null;
  return achievabilityStore.getGoalAchievability(selectedGoalId.value);
});

const availableCategories = computed(() => {
  return baselineAchievability.value?.topDiscretionaryCategories || [];
});

const simulationResult = computed<WhatIfSimulationResult | null>(() => {
  if (!selectedGoalId.value) return null;

  return achievabilityStore.simulateScenario({
    goalId: selectedGoalId.value,
    adjustedMonthlySaving: customMonthlySaving.value
      ? Number(customMonthlySaving.value)
      : undefined,
    reducedCategoryId: selectedCategoryId.value || undefined,
    categoryReductionPercent: Number(categoryReductionPercent.value),
    scenarioName: scenarioName.value || "What-If Simulation",
  });
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      selectedGoalId.value =
        props.initialGoalId || activeGoals.value[0]?.id || "";
      selectedCategoryId.value = props.initialCategoryId || "";
      categoryReductionPercent.value = 20;
      customMonthlySaving.value = "";
      scenarioName.value = "Optimized Savings Plan";
    }
  },
  { immediate: true },
);

watch(
  () => selectedGoalId.value,
  () => {
    if (baselineAchievability.value?.topDiscretionaryCategories.length) {
      if (!selectedCategoryId.value) {
        selectedCategoryId.value =
          baselineAchievability.value.topDiscretionaryCategories[0]
            ?.categoryId || "";
      }
    }
  },
);

const handleApply = () => {
  if (!simulationResult.value || !selectedGoal.value) return;
  const newTarget =
    simulationResult.value.simulated.contributionScore *
    0.01 *
    selectedGoal.value.targetAmount;

  emit("applyScenario", {
    goalId: selectedGoal.value.id,
    newMonthlyTarget:
      simulationResult.value.simulated.projectedTotalSavings / 12,
  });
  emit("close");
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card glass-panel">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-title">
          <div class="header-icon">
            <Sliders :size="20" />
          </div>
          <div>
            <h2>"What-If" Scenario Simulator</h2>
            <p class="subtitle">
              Test spending cuts & see real-time finish date acceleration
            </p>
          </div>
        </div>
        <button type="button" class="btn-close" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Input Form Section -->
        <div class="form-section">
          <!-- Select Goal -->
          <div class="form-group">
            <label for="sim-goal">Select Financial Goal</label>
            <select id="sim-goal" v-model="selectedGoalId" class="form-select">
              <option
                v-for="goal in activeGoals"
                :key="goal.id"
                :value="goal.id"
              >
                {{ goal.name }} (Target:
                {{ formatCurrency(goal.targetAmount) }})
              </option>
            </select>
          </div>

          <!-- Category Spending Reduction Slider -->
          <div class="form-group slider-group">
            <label for="sim-category">Reduce Category Spending</label>
            <select
              id="sim-category"
              v-model="selectedCategoryId"
              class="form-select"
            >
              <option value="">No category cut</option>
              <option
                v-for="cat in availableCategories"
                :key="cat.categoryId"
                :value="cat.categoryId"
              >
                {{ cat.categoryName }} (Avg
                {{ formatCurrency(cat.avgMonthlyAmount) }}/mo)
              </option>
            </select>

            <div v-if="selectedCategoryId" class="slider-control">
              <div class="slider-header">
                <span>Cut by {{ categoryReductionPercent }}%</span>
                <span v-if="simulationResult" class="savings-boost">
                  +{{
                    formatCurrency(simulationResult.additionalMonthlySavings)
                  }}/mo
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                v-model.number="categoryReductionPercent"
                class="range-slider"
              />
            </div>
          </div>

          <!-- Scenario Name -->
          <div class="form-group">
            <label for="scenario-name">Scenario Title</label>
            <input
              id="scenario-name"
              v-model="scenarioName"
              type="text"
              class="form-input"
              placeholder="e.g. Cut Dining Out by 20%"
            />
          </div>
        </div>

        <!-- Simulation Comparison Output -->
        <div v-if="simulationResult" class="output-section">
          <div class="comparison-header">
            <Sparkles :size="18" class="sparkle-icon" />
            <span>Simulated Outcome vs Baseline</span>
          </div>

          <div class="comparison-grid">
            <!-- Baseline Card -->
            <div class="comp-card baseline-card">
              <span class="comp-label">Current Baseline</span>
              <div class="badge-wrap">
                <GoalHealthBadge
                  :status="simulationResult.baseline.healthStatus"
                />
              </div>
              <div class="comp-metric">
                <span class="m-val">{{ simulationResult.baseline.score }}</span>
                <span class="m-sub">Score / 100</span>
              </div>
              <div class="comp-detail">
                <Calendar :size="14" />
                <span>{{
                  simulationResult.baseline.projectedCompletionDate ||
                  "No completion date"
                }}</span>
              </div>
            </div>

            <!-- Arrow Divider -->
            <div class="comp-arrow">
              <ArrowRight :size="24" />
            </div>

            <!-- Simulated Card -->
            <div class="comp-card simulated-card">
              <span class="comp-label">Simulated Scenario</span>
              <div class="badge-wrap">
                <GoalHealthBadge
                  :status="simulationResult.simulated.healthStatus"
                />
              </div>
              <div class="comp-metric highlight">
                <span class="m-val">{{
                  simulationResult.simulated.score
                }}</span>
                <span class="m-sub">New Score / 100</span>
              </div>
              <div class="comp-detail highlight-date">
                <Calendar :size="14" />
                <span>{{
                  simulationResult.simulated.projectedCompletionDate ||
                  "Earlier completion"
                }}</span>
              </div>
              <div
                v-if="simulationResult.monthsSaved > 0"
                class="time-saved-badge"
              >
                🎉 Finish {{ simulationResult.monthsSaved }} month(s) faster!
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          Close
        </button>
        <button type="button" class="btn btn-primary" @click="handleApply">
          <CheckCircle2 :size="16" /> Close & Review Plan
        </button>
      </div>
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
  max-width: 640px;
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
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-header h2 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
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
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.slider-group {
  background: rgba(30, 41, 59, 0.4);
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.slider-control {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.savings-boost {
  color: #34d399;
}

.range-slider {
  width: 100%;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.output-section {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comparison-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--accent-primary);
}

.sparkle-icon {
  color: #a855f7;
}

.comparison-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.comp-card {
  flex: 1;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.simulated-card {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.15),
    rgba(168, 85, 247, 0.15)
  );
  border-color: rgba(99, 102, 241, 0.4);
}

.comp-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
}

.comp-metric {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.m-val {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--text-primary);
}

.highlight .m-val {
  color: #818cf8;
}

.m-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.comp-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.highlight-date {
  color: #34d399;
  font-weight: 700;
}

.comp-arrow {
  color: var(--text-muted);
}

.time-saved-badge {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 9999px;
  margin-top: 4px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
