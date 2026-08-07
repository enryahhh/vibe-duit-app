<script setup lang="ts">
import { ref, computed } from "vue";
import type { Goal } from "@/types/goal";
import { useAccountStore } from "@/stores/useAccountStore";
import { useGoalStore } from "@/stores/useGoalStore";
import { useAchievabilityStore } from "@/stores/useAchievabilityStore";
import GoalHealthBadge from "@/components/achievability/GoalHealthBadge.vue";
import AchievabilityScoreGauge from "@/components/achievability/AchievabilityScoreGauge.vue";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Target,
  Calendar,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  Edit2,
  Trash2,
  Plus,
  Flame,
  Sliders,
  History,
  TrendingUp,
} from "lucide-vue-next";

const props = defineProps<{
  goal: Goal;
}>();

const emit = defineEmits<{
  (e: "logProgress", goal: Goal): void;
  (e: "edit", goal: Goal): void;
  (e: "togglePause", id: string): void;
  (e: "delete", id: string): void;
  (e: "openSimulation", goalId: string): void;
}>();

const accountStore = useAccountStore();
const goalStore = useGoalStore();
const achievabilityStore = useAchievabilityStore();

const showHistory = ref(false);

const contributions = computed(() => {
  return goalStore.getContributionsForGoal(props.goal.id);
});

const handleDeleteContrib = async (contribId: string, amount: number) => {
  if (confirm("Are you sure you want to delete this contribution record?")) {
    try {
      await goalStore.deleteContribution(props.goal.id, contribId, amount);
    } catch (err: any) {
      alert(err.message || "Failed to delete contribution");
    }
  }
};

const achievability = computed(() => {
  return achievabilityStore.getGoalAchievability(props.goal.id);
});

const linkedAccount = computed(() => {
  if (!props.goal.linkedAccountId) return null;
  return accountStore.getAccountById(props.goal.linkedAccountId);
});

const progressPct = computed(() => {
  if (props.goal.targetAmount <= 0) return 0;
  const pct = (props.goal.currentSaved / props.goal.targetAmount) * 100;
  return Math.min(100, Math.round(pct * 10) / 10);
});

const recommendation = computed(() => {
  return goalStore.getRecommendationForGoal(
    props.goal.targetAmount,
    props.goal.currentSaved,
    props.goal.deadline,
  );
});

const daysRemaining = computed<number | null>(() => {
  if (!props.goal.deadline) return null;
  const now = new Date();
  const target = new Date(props.goal.deadline);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

const priorityClass = computed(() => {
  switch (props.goal.priority) {
    case "high":
      return "priority-high";
    case "medium":
      return "priority-medium";
    case "low":
      return "priority-low";
    default:
      return "priority-medium";
  }
});
</script>

<template>
  <div
    class="goal-card glass-panel"
    :class="{
      'is-completed': goal.status === 'completed',
      'is-paused': goal.status === 'paused',
    }"
  >
    <!-- Top Card Header -->
    <div class="card-header">
      <div class="header-main">
        <div class="goal-icon-bg" :class="priorityClass">
          <Target :size="20" />
        </div>
        <div>
          <h3 class="goal-name">{{ goal.name }}</h3>
          <div class="goal-badges">
            <span class="badge priority-badge" :class="priorityClass">
              <Flame v-if="goal.priority === 'high'" :size="12" />
              {{ goal.priority.toUpperCase() }} PRIORITY
            </span>
            <span
              v-if="goal.status === 'paused'"
              class="badge status-badge paused"
            >
              <Pause :size="12" /> PAUSED
            </span>
            <span
              v-if="goal.status === 'completed'"
              class="badge status-badge completed"
            >
              <CheckCircle :size="12" /> COMPLETED
            </span>
            <GoalHealthBadge
              v-if="achievability && goal.status === 'active'"
              :status="achievability.healthStatus"
            />
          </div>
        </div>
      </div>

      <div class="header-actions">
        <AchievabilityScoreGauge
          v-if="achievability && goal.status === 'active'"
          :score="achievability.score"
          :contribution-score="achievability.contributionScore"
          :capacity-score="achievability.capacityScore"
          :timeline-score="achievability.timelineScore"
        />
        <button
          type="button"
          class="icon-btn"
          :title="goal.status === 'paused' ? 'Resume Goal' : 'Pause Goal'"
          @click="emit('togglePause', goal.id)"
        >
          <Play v-if="goal.status === 'paused'" :size="16" />
          <Pause v-else :size="16" />
        </button>
        <button
          type="button"
          class="icon-btn"
          title="Edit Goal"
          @click="emit('edit', goal)"
        >
          <Edit2 :size="16" />
        </button>
        <button
          type="button"
          class="icon-btn danger"
          title="Delete Goal"
          @click="emit('delete', goal.id)"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </div>

    <!-- Recommendation Unrealistic Warning Banner -->
    <div
      v-if="recommendation.isUnrealistic && goal.status === 'active'"
      class="warning-alert"
    >
      <AlertTriangle :size="14" class="alert-icon" />
      <span>Target exceeds discretionary income capacity</span>
    </div>

    <!-- Amount Progress Display -->
    <div class="progress-section">
      <div class="amount-row">
        <div class="saved-info">
          <span class="label">Saved</span>
          <span class="amount current-amount">{{
            formatCurrency(goal.currentSaved)
          }}</span>
        </div>
        <div class="target-info">
          <span class="label">Target</span>
          <span class="amount target-amount">{{
            formatCurrency(goal.targetAmount)
          }}</span>
        </div>
      </div>

      <!-- Animated Progress Bar -->
      <div class="progress-bar-container">
        <div
          class="progress-bar-fill"
          :style="{ width: `${progressPct}%` }"
          :class="{ completed: progressPct >= 100 }"
        ></div>
      </div>

      <div class="progress-footer">
        <span class="pct-text">{{ progressPct }}% Achieved</span>
        <span class="remaining-text">
          {{
            formatCurrency(Math.max(0, goal.targetAmount - goal.currentSaved))
          }}
          left
        </span>
      </div>
    </div>

    <!-- Meta Details Row -->
    <div class="meta-row">
      <div
        class="meta-item"
        :title="goal.deadline || 'No deadline (Open-ended)'"
      >
        <Calendar :size="14" />
        <span v-if="daysRemaining !== null">
          {{
            daysRemaining > 0
              ? `${daysRemaining} days left`
              : "Deadline reached"
          }}
        </span>
        <span v-else>Open-ended</span>
      </div>

      <div
        v-if="linkedAccount"
        class="meta-item linked-acc"
        :title="`Linked: ${linkedAccount.name}`"
      >
        <Wallet :size="14" />
        <span>{{ linkedAccount.name }}</span>
      </div>

      <div
        class="meta-item rec-target"
        title="Target Monthly Savings Contribution"
      >
        <span>
          Month Plan:
          {{
            formatCurrency(
              goal.customMonthlyTarget || recommendation.recommendedMonthly,
            )
          }}/mo
        </span>
      </div>
    </div>

    <!-- Log Contribution & What-If Action Buttons -->
    <div
      v-if="goal.status !== 'completed'"
      class="card-footer card-actions-grid"
    >
      <button
        type="button"
        class="btn btn-primary btn-log"
        :disabled="goal.status === 'paused'"
        @click="emit('logProgress', goal)"
      >
        <Plus :size="16" /> Log Progress
      </button>
      <button
        type="button"
        class="btn btn-secondary btn-sim"
        :disabled="goal.status === 'paused'"
        @click="emit('openSimulation', goal.id)"
      >
        <Sliders :size="16" /> What-If Simulator
      </button>
      <router-link
        :to="{ path: '/calculators', query: { goalId: goal.id } }"
        class="btn btn-secondary btn-calc"
      >
        <TrendingUp :size="16" /> Invest Plan
      </router-link>
    </div>

    <!-- Toggle History Button -->
    <div class="history-toggle-row">
      <button
        type="button"
        class="btn-toggle-history"
        @click="showHistory = !showHistory"
      >
        <History :size="14" />
        <span>{{
          showHistory
            ? "Hide Contribution History"
            : `History (${contributions.length})`
        }}</span>
      </button>
    </div>

    <!-- Expandable Contribution History Section -->
    <div v-if="showHistory" class="contrib-history-section">
      <h4 class="history-title">Logged Contributions</h4>
      <div v-if="contributions.length > 0" class="contrib-list">
        <div v-for="c in contributions" :key="c.id" class="contrib-item">
          <div class="contrib-details">
            <span class="contrib-amount">+ {{ formatCurrency(c.amount) }}</span>
            <span class="contrib-date">{{ c.date }}</span>
            <span v-if="c.note" class="contrib-note">• {{ c.note }}</span>
          </div>
          <button
            type="button"
            class="btn-delete-contrib"
            title="Delete contribution record"
            @click="handleDeleteContrib(c.id, c.amount)"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
      <div v-else class="contrib-empty">
        <span>No contribution records logged yet.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.goal-card {
  padding: 20px;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s ease,
    border-color 0.25s ease;
  position: relative;
  overflow: hidden;
}

.goal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.35);
}

:global(html.light) .goal-card {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(15, 23, 42, 0.08);
}

:global(html.light) .goal-card:hover {
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.4);
}

.is-completed {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(6, 78, 59, 0.15);
}

.is-paused {
  opacity: 0.75;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.goal-icon-bg {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.priority-high {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.priority-medium {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.priority-low {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.goal-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.goal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.05em;
}

.status-badge.paused {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.warning-alert {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fde047;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-icon {
  flex-shrink: 0;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
}

.saved-info,
.target-info {
  display: flex;
  flex-direction: column;
}

.target-info {
  align-items: flex-end;
}

.label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.amount {
  font-size: 1.1rem;
  font-weight: 800;
}

.current-amount {
  color: var(--accent-success);
}

.target-amount {
  color: var(--text-primary);
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 9999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:global(html.light) .progress-bar-container {
  background: rgba(226, 232, 240, 0.8);
  border-color: rgba(15, 23, 42, 0.08);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #10b981 100%);
  border-radius: 9999px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-bar-fill.completed {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.progress-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 700;
}

.pct-text {
  color: var(--accent-primary);
}

.remaining-text {
  color: var(--text-muted);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

:global(html.light) .meta-row {
  border-top-color: rgba(15, 23, 42, 0.08);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.linked-acc {
  color: #38bdf8;
}

.rec-target {
  margin-left: auto;
  font-weight: 600;
  color: var(--text-muted);
}

.card-footer {
  margin-top: 4px;
}

.card-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}

.btn-log,
.btn-sim {
  padding: 8px 10px;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-sim {
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #c084fc;
}

.btn-sim:hover {
  background: rgba(168, 85, 247, 0.25);
  color: #ffffff;
}

/* Contribution History Styles */
.history-toggle-row {
  margin-top: 4px;
  display: flex;
}

.btn-toggle-history {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s ease;
}

.btn-toggle-history:hover {
  color: var(--accent-primary);
}

.contrib-history-section {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:global(html.light) .contrib-history-section {
  background: rgba(241, 245, 249, 0.7);
  border-color: rgba(15, 23, 42, 0.08);
}

.history-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.contrib-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}

.contrib-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
}

:global(html.light) .contrib-item {
  background: #ffffff;
}

.contrib-details {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.contrib-amount {
  font-weight: 800;
  color: var(--accent-success);
}

.contrib-date {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.contrib-note {
  color: var(--text-secondary);
  font-style: italic;
  font-size: 0.72rem;
}

.btn-delete-contrib {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete-contrib:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.15);
}

.contrib-empty {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

@media (max-width: 480px) {
  .rec-target {
    margin-left: 0;
    width: 100%;
  }

  .card-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
