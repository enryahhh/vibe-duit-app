<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useGoalStore } from "@/stores/useGoalStore";
import { useAchievabilityStore } from "@/stores/useAchievabilityStore";
import GoalHealthBadge from "@/components/achievability/GoalHealthBadge.vue";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Target,
  ArrowRight,
  CheckCircle,
  ShieldAlert,
  Plus,
} from "lucide-vue-next";

const router = useRouter();
const goalStore = useGoalStore();
const achievabilityStore = useAchievabilityStore();

const activeGoals = computed(() => goalStore.activeGoals);
const totalSaved = computed(() => goalStore.totalCurrentSaved);
const totalTarget = computed(() => goalStore.totalTargetAmount);
const overallPct = computed(() => goalStore.overallProgressPercentage);
const loading = computed(() => goalStore.loading);

const topActiveGoals = computed(() => activeGoals.value.slice(0, 3));

const getHealthStatus = (goalId: string) => {
  return achievabilityStore.getGoalAchievability(goalId)?.healthStatus;
};

const navigateToGoals = () => {
  router.push("/goals");
};
</script>

<template>
  <div class="goals-summary-widget glass-panel">
    <div class="widget-header">
      <div class="header-title">
        <div class="icon-bg">
          <Target :size="20" />
        </div>
        <div>
          <h3 class="title">Financial Goals</h3>
          <p class="subtitle">Savings progress & recommendation status</p>
        </div>
      </div>
      <button type="button" class="btn-link" @click="navigateToGoals">
        Manage Goals <ArrowRight :size="16" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="widget-loading">
      <div class="spinner"></div>
      <span>Loading financial goals...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="
        activeGoals.length === 0 && goalStore.completedGoals.length === 0
      "
      class="widget-empty"
    >
      <p>No financial goals created yet.</p>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="navigateToGoals"
      >
        <Plus :size="16" /> Create Your First Goal
      </button>
    </div>

    <!-- Summary Content -->
    <div v-else class="widget-content">
      <div class="summary-banner">
        <div class="banner-stat">
          <span class="stat-label">Total Target</span>
          <span class="stat-val">{{ formatCurrency(totalTarget) }}</span>
        </div>
        <div class="banner-stat">
          <span class="stat-label">Total Saved</span>
          <span class="stat-val text-success">{{
            formatCurrency(totalSaved)
          }}</span>
        </div>
        <div class="banner-stat">
          <span class="stat-label">Active Goals</span>
          <span class="stat-val">{{ activeGoals.length }}</span>
        </div>
        <div class="banner-progress">
          <div class="pct-badge">{{ overallPct }}%</div>
          <div class="mini-bar-bg">
            <div
              class="mini-bar-fill"
              :style="{ width: `${overallPct}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Top 3 Goals List -->
      <div class="goals-list">
        <div
          v-for="goal in topActiveGoals"
          :key="goal.id"
          class="goal-item-row"
          @click="navigateToGoals"
        >
          <div class="item-info">
            <div class="item-name-row">
              <span class="item-name">{{ goal.name }}</span>
              <GoalHealthBadge
                v-if="getHealthStatus(goal.id)"
                :status="getHealthStatus(goal.id)!"
                :show-icon="false"
              />
            </div>
            <span class="item-amounts">
              {{ formatCurrency(goal.currentSaved) }} /
              {{ formatCurrency(goal.targetAmount) }}
            </span>
          </div>
          <div class="item-bar-container">
            <div
              class="item-bar-fill"
              :style="{
                width: `${Math.min(100, (goal.currentSaved / goal.targetAmount) * 100)}%`,
              }"
            ></div>
          </div>
          <div class="item-pct">
            {{
              Math.min(
                100,
                Math.round((goal.currentSaved / goal.targetAmount) * 100),
              )
            }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.goals-summary-widget {
  padding: 20px;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-bg {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.btn-link {
  background: transparent;
  border: none;
  color: var(--accent-primary);
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-link:hover {
  color: #a5b4fc;
}

.widget-loading,
.widget-empty {
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.spinner {
  width: 24px;
  height: 24px;
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

.widget-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary-banner {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

:global(html.light) .summary-banner {
  background: rgba(241, 245, 249, 0.7);
  border-color: rgba(15, 23, 42, 0.08);
}

@media (max-width: 640px) {
  .summary-banner {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .banner-progress {
    grid-column: span 2;
  }
}

.banner-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.stat-val {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.text-success {
  color: var(--accent-success);
}

.banner-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 130px;
}

.pct-badge {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--accent-primary);
}

.mini-bar-bg {
  flex: 1;
  height: 8px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 9999px;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
  border-radius: 9999px;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-item-row {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 1.5fr 2fr 50px;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

:global(html.light) .goal-item-row {
  background: rgba(241, 245, 249, 0.6);
  border-color: rgba(15, 23, 42, 0.06);
}

.goal-item-row:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(99, 102, 241, 0.3);
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.item-amounts {
  font-size: 0.73rem;
  color: var(--text-muted);
}

.item-bar-container {
  height: 6px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 9999px;
  overflow: hidden;
}

:global(html.light) .item-bar-container {
  background: rgba(203, 213, 225, 0.6);
}

.item-bar-fill {
  height: 100%;
  background: #6366f1;
  border-radius: 9999px;
}

.item-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-align: right;
}

@media (max-width: 640px) {
  .goals-summary-widget {
    padding: 14px;
  }

  .title {
    font-size: 0.98rem;
  }

  .subtitle {
    font-size: 0.72rem;
  }

  .goal-item-row {
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 10px;
  }

  .item-bar-container {
    grid-column: span 2;
    order: 3;
    width: 100%;
    margin-top: 2px;
  }

  .item-pct {
    font-size: 0.75rem;
  }
}
</style>
