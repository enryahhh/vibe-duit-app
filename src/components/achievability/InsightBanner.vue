<script setup lang="ts">
import type { GoalAchievability } from "@/types/achievability";
import GoalHealthBadge from "./GoalHealthBadge.vue";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Scissors,
  ArrowRight,
} from "lucide-vue-next";

const props = defineProps<{
  achievability: GoalAchievability;
}>();

const emit = defineEmits<{
  (e: "openSimulation", categoryId?: string): void;
}>();
</script>

<template>
  <div class="insight-banner glass-panel" :class="achievability.healthStatus">
    <div class="banner-top">
      <div class="title-row">
        <div class="icon-wrap">
          <Lightbulb :size="18" />
        </div>
        <span class="banner-title">Achievability Intelligence</span>
        <GoalHealthBadge :status="achievability.healthStatus" />
      </div>

      <div
        class="trend-indicator"
        :title="`Cash Flow Trend: ${achievability.cashFlowTrend}`"
      >
        <TrendingUp
          v-if="achievability.cashFlowTrend === 'improving'"
          :size="14"
          class="text-success"
        />
        <TrendingDown
          v-else-if="
            achievability.cashFlowTrend === 'declining' ||
            achievability.cashFlowTrend === 'severe_negative'
          "
          :size="14"
          class="text-danger"
        />
        <span class="trend-text">{{
          achievability.cashFlowTrend.replace("_", " ").toUpperCase()
        }}</span>
      </div>
    </div>

    <!-- Main Insights Text -->
    <div class="insights-list">
      <p
        v-for="(insight, idx) in achievability.insights"
        :key="idx"
        class="insight-text"
      >
        {{ insight }}
      </p>
    </div>

    <!-- Spending Cut Actions -->
    <div
      v-if="achievability.topDiscretionaryCategories.length > 0"
      class="category-cuts-row"
    >
      <span class="cut-label">
        <Scissors :size="14" /> Suggested spending cut:
      </span>
      <div class="categories-pills">
        <button
          v-for="cat in achievability.topDiscretionaryCategories"
          :key="cat.categoryId"
          type="button"
          class="cat-pill"
          @click="emit('openSimulation', cat.categoryId)"
        >
          Reduce {{ cat.categoryName }} (avg ${{ cat.avgMonthlyAmount }}/mo)
          <ArrowRight :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.insight-banner {
  padding: 16px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.insight-banner.at_risk {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.06);
}

.insight-banner.off_track {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.06);
}

.banner-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-primary);
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
}

.text-success {
  color: #34d399;
}

.text-danger {
  color: #f87171;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.insight-text {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.45;
}

.category-cuts-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cut-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.categories-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cat-pill {
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.73rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.cat-pill:hover {
  background: var(--accent-primary);
  color: #ffffff;
}
</style>
