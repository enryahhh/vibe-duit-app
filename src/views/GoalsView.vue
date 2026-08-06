<script setup lang="ts">
import { ref, computed } from "vue";
import { useGoalStore } from "@/stores/useGoalStore";
import { useAchievabilityStore } from "@/stores/useAchievabilityStore";
import type { Goal, CreateGoalDTO } from "@/types/goal";
import type { HealthStatus } from "@/types/achievability";
import { formatCurrency } from "@/utils/formatCurrency";
import GoalCard from "@/components/goals/GoalCard.vue";
import GoalFormModal from "@/components/goals/GoalFormModal.vue";
import ProgressLogModal from "@/components/goals/ProgressLogModal.vue";
import WhatIfSimulationModal from "@/components/achievability/WhatIfSimulationModal.vue";
import InsightBanner from "@/components/achievability/InsightBanner.vue";
import {
  Target,
  Plus,
  CheckCircle,
  Clock,
  PauseCircle,
  Layers,
  Sliders,
  AlertTriangle,
} from "lucide-vue-next";

const goalStore = useGoalStore();
const achievabilityStore = useAchievabilityStore();

const activeFilter = ref<
  "all" | "active" | "completed" | "paused" | HealthStatus
>("all");

const isFormModalOpen = ref(false);
const goalToEdit = ref<Goal | null>(null);

const isLogModalOpen = ref(false);
const goalToLog = ref<Goal | null>(null);

const isSimModalOpen = ref(false);
const simGoalId = ref<string>("");
const simCategoryId = ref<string>("");

const goals = computed(() => goalStore.goals);
const loading = computed(() => goalStore.loading);
const error = computed(() => goalStore.error);

const filteredGoals = computed(() => {
  if (activeFilter.value === "all") return goals.value;
  if (["active", "completed", "paused"].includes(activeFilter.value)) {
    return goals.value.filter((g) => g.status === activeFilter.value);
  }
  // Health status filter
  return goals.value.filter((g) => {
    const assessment = achievabilityStore.getGoalAchievability(g.id);
    return assessment && assessment.healthStatus === activeFilter.value;
  });
});

const activeCount = computed(() => goalStore.activeGoals.length);
const completedCount = computed(() => goalStore.completedGoals.length);
const pausedCount = computed(
  () => goals.value.filter((g) => g.status === "paused").length,
);
const atRiskCount = computed(() => achievabilityStore.atRiskCount);
const totalSaved = computed(() => goalStore.totalCurrentSaved);
const totalTarget = computed(() => goalStore.totalTargetAmount);

const topAttentionGoal = computed(() => {
  const atRiskList = achievabilityStore.goalsRequiringAttention;
  if (atRiskList.length === 0) return null;
  const topGoal = atRiskList[0];
  return topGoal ? achievabilityStore.getGoalAchievability(topGoal.id) : null;
});

const handleOpenSimulation = (goalId?: string, categoryId?: string) => {
  simGoalId.value = goalId || "";
  simCategoryId.value = categoryId || "";
  isSimModalOpen.value = true;
};

const handleOpenCreateModal = () => {
  goalToEdit.value = null;
  isFormModalOpen.value = true;
};

const handleOpenEditModal = (goal: Goal) => {
  goalToEdit.value = goal;
  isFormModalOpen.value = true;
};

const handleOpenLogModal = (goal: Goal) => {
  goalToLog.value = goal;
  isLogModalOpen.value = true;
};

const handleFormSubmit = async (dto: CreateGoalDTO) => {
  try {
    if (goalToEdit.value) {
      await goalStore.updateGoal(goalToEdit.value.id, dto);
    } else {
      await goalStore.addGoal(dto);
    }
  } catch (err: any) {
    alert(err.message || "Failed to save goal");
  }
};

const handleTogglePause = async (id: string) => {
  try {
    await goalStore.togglePauseGoal(id);
  } catch (err: any) {
    alert(err.message || "Failed to update goal status");
  }
};

const handleDeleteGoal = async (id: string) => {
  if (
    confirm(
      "Are you sure you want to delete this goal? This action cannot be undone.",
    )
  ) {
    try {
      await goalStore.deleteGoal(id);
    } catch (err: any) {
      alert(err.message || "Failed to delete goal");
    }
  }
};

const handleLogSubmit = async (payload: {
  goalId: string;
  amount: number;
  note?: string;
  date?: string;
}) => {
  try {
    await goalStore.logProgressContribution(
      payload.goalId,
      payload.amount,
      payload.note,
      payload.date,
    );
  } catch (err: any) {
    alert(err.message || "Failed to log contribution");
  }
};
</script>

<template>
  <div class="goals-view">
    <!-- View Header -->
    <div class="view-header">
      <div>
        <h1 class="page-title">Financial Goals</h1>
        <p class="page-subtitle">
          Set concrete goals and optimize monthly contributions with cash flow
          intelligence
        </p>
      </div>

      <div class="header-actions-row">
        <button
          type="button"
          class="btn btn-secondary btn-sim-header"
          @click="handleOpenSimulation()"
        >
          <Sliders :size="18" /> What-If Simulator
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleOpenCreateModal"
        >
          <Plus :size="18" /> Create New Goal
        </button>
      </div>
    </div>

    <!-- Insight Banner for Top Attention / At Risk Goal -->
    <div v-if="topAttentionGoal" class="attention-insight-section">
      <InsightBanner
        :achievability="topAttentionGoal"
        @open-simulation="
          (catId) => handleOpenSimulation(topAttentionGoal?.goalId, catId)
        "
      />
    </div>

    <!-- Stats Banner -->
    <div class="stats-grid">
      <div class="stat-card glass-panel">
        <div class="stat-icon-wrap primary">
          <Target :size="20" />
        </div>
        <div class="stat-details">
          <span class="stat-title">Active Target</span>
          <span class="stat-number">{{ formatCurrency(totalTarget) }}</span>
        </div>
      </div>

      <div class="stat-card glass-panel">
        <div class="stat-icon-wrap success">
          <CheckCircle :size="20" />
        </div>
        <div class="stat-details">
          <span class="stat-title">Total Saved</span>
          <span class="stat-number text-success">{{
            formatCurrency(totalSaved)
          }}</span>
        </div>
      </div>

      <div class="stat-card glass-panel">
        <div class="stat-icon-wrap info">
          <Layers :size="20" />
        </div>
        <div class="stat-details">
          <span class="stat-title">Goal Counts</span>
          <span class="stat-number"
            >{{ activeCount }} Active / {{ completedCount }} Done</span
          >
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <span>{{ error }}</span>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs-row">
      <div class="filter-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          All Goals ({{ goals.length }})
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeFilter === 'active' }"
          @click="activeFilter = 'active'"
        >
          Active ({{ activeCount }})
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeFilter === 'at_risk' }"
          @click="activeFilter = 'at_risk'"
        >
          At Risk ({{ atRiskCount }})
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeFilter === 'completed' }"
          @click="activeFilter = 'completed'"
        >
          Completed ({{ completedCount }})
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeFilter === 'paused' }"
          @click="activeFilter = 'paused'"
        >
          Paused ({{ pausedCount }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your financial goals...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredGoals.length === 0" class="empty-state glass-panel">
      <Target :size="48" class="empty-icon" />
      <h3>No Goals Found</h3>
      <p v-if="activeFilter !== 'all'">
        No goals matching "{{ activeFilter }}" filter.
      </p>
      <p v-else>You haven't added any savings or investment goals yet.</p>
      <button
        type="button"
        class="btn btn-primary"
        @click="handleOpenCreateModal"
      >
        <Plus :size="18" /> Create Your First Goal
      </button>
    </div>

    <!-- Goals Cards Grid -->
    <div v-else class="goals-grid">
      <GoalCard
        v-for="goal in filteredGoals"
        :key="goal.id"
        :goal="goal"
        @log-progress="handleOpenLogModal"
        @edit="handleOpenEditModal"
        @toggle-pause="handleTogglePause"
        @delete="handleDeleteGoal"
        @open-simulation="handleOpenSimulation"
      />
    </div>

    <!-- Modals -->
    <GoalFormModal
      :is-open="isFormModalOpen"
      :goal-to-edit="goalToEdit"
      @close="isFormModalOpen = false"
      @submit="handleFormSubmit"
    />

    <ProgressLogModal
      :is-open="isLogModalOpen"
      :goal="goalToLog"
      @close="isLogModalOpen = false"
      @submit="handleLogSubmit"
    />

    <WhatIfSimulationModal
      :is-open="isSimModalOpen"
      :initial-goal-id="simGoalId"
      :initial-category-id="simCategoryId"
      @close="isSimModalOpen = false"
    />
  </div>
</template>

<style scoped>
.goals-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-sim-header {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #c084fc;
}

.btn-sim-header:hover {
  background: rgba(168, 85, 247, 0.25);
  color: #ffffff;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 4px 0 0 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap.primary {
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
}

.stat-icon-wrap.success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.stat-icon-wrap.info {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-title {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}

.stat-number {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--text-primary);
}

.text-success {
  color: var(--accent-success);
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
}

.filter-tabs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  background: rgba(30, 41, 59, 0.5);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  border-radius: var(--radius-xl);
}

.empty-icon {
  color: var(--text-muted);
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.empty-state p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 0 0 8px 0;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
