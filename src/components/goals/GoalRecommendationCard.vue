<script setup lang="ts">
import { computed } from "vue";
import type { GoalRecommendation } from "@/types/goal";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
} from "lucide-vue-next";

const props = defineProps<{
  recommendation: GoalRecommendation;
  selectedMonthlyTarget?: number;
}>();

const emit = defineEmits<{
  (e: "applyRecommendation", amount: number): void;
}>();

const isUsingRecommended = computed(() => {
  if (!props.selectedMonthlyTarget) return true;
  return (
    Math.abs(
      props.selectedMonthlyTarget - props.recommendation.recommendedMonthly,
    ) < 1
  );
});

const handleApply = () => {
  emit("applyRecommendation", props.recommendation.recommendedMonthly);
};
</script>

<template>
  <div
    class="recommendation-card glass-panel"
    :class="{ 'warning-border': recommendation.isUnrealistic }"
  >
    <div class="card-header">
      <div class="header-title">
        <div class="icon-wrapper">
          <Sparkles :size="20" class="sparkle-icon" />
        </div>
        <div>
          <h4 class="title">Savings Recommendation Engine</h4>
          <p class="subtitle">Calculated based on your historical cash flow</p>
        </div>
      </div>
    </div>

    <!-- Unrealistic Alert Banner -->
    <div v-if="recommendation.isUnrealistic" class="unrealistic-banner">
      <AlertTriangle :size="18" class="banner-icon" />
      <div class="banner-text">
        <strong>Potentially Unrealistic Goal</strong>
        <p>
          Your required monthly contribution ({{
            formatCurrency(recommendation.baseRequiredMonthly)
          }}) exceeds your estimated discretionary income ({{
            formatCurrency(recommendation.discretionaryIncome)
          }}). Consider extending the deadline or reducing target amount.
        </p>
      </div>
    </div>

    <!-- Metrics Breakdown Grid -->
    <div class="metrics-grid">
      <div class="metric-item">
        <span class="metric-label">Required Base / Mo</span>
        <span class="metric-value">{{
          formatCurrency(recommendation.baseRequiredMonthly)
        }}</span>
        <span class="metric-sub"
          >{{ recommendation.monthsRemaining }} months remaining</span
        >
      </div>

      <div class="metric-item">
        <span class="metric-label">Discretionary Cash Flow</span>
        <span
          class="metric-value"
          :class="{ negative: recommendation.discretionaryIncome <= 0 }"
        >
          {{ formatCurrency(recommendation.discretionaryIncome) }}
        </span>
        <span class="metric-sub"
          >Avg Net:
          {{ formatCurrency(recommendation.avgMonthlyNetCashFlow) }}</span
        >
      </div>

      <div class="metric-item highlight-metric">
        <span class="metric-label">Smart Recommendation</span>
        <span class="metric-value highlight-value">
          {{ formatCurrency(recommendation.recommendedMonthly) }}
        </span>
        <button
          type="button"
          class="btn-apply-rec"
          :class="{ active: isUsingRecommended }"
          @click="handleApply"
        >
          <CheckCircle2 v-if="isUsingRecommended" :size="14" />
          {{ isUsingRecommended ? "Applied" : "Use Suggested" }}
        </button>
      </div>
    </div>

    <div class="engine-footer">
      <Info :size="14" class="info-icon" />
      <span
        >Recommendations are dynamically capped at 80% of your discretionary
        income to protect your cash reserves.</span
      >
    </div>
  </div>
</template>

<style scoped>
.recommendation-card {
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: var(--glass-border);
  margin-bottom: 20px;
}

:global(html.light) .recommendation-card {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(99, 102, 241, 0.3);
}

.warning-border {
  border-color: rgba(245, 158, 11, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.2),
    rgba(168, 85, 247, 0.2)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
}

.sparkle-icon {
  animation: pulse-sparkle 2s infinite ease-in-out;
}

@keyframes pulse-sparkle {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.unrealistic-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 16px;
  color: #fef08a;
}

.banner-icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.banner-text strong {
  display: block;
  font-size: 0.85rem;
  color: #fbbf24;
  margin-bottom: 2px;
}

.banner-text p {
  font-size: 0.78rem;
  margin: 0;
  line-height: 1.4;
  color: #fef3c7;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.highlight-metric {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.15),
    rgba(79, 70, 229, 0.2)
  );
  border-color: rgba(99, 102, 241, 0.4);
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.negative {
  color: #f87171;
}

.highlight-value {
  color: #818cf8;
}

.metric-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.btn-apply-rec {
  margin-top: 8px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-apply-rec:hover {
  background: var(--accent-primary);
  color: #ffffff;
}

.btn-apply-rec.active {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #34d399;
}

.engine-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.73rem;
  color: var(--text-muted);
}

.info-icon {
  flex-shrink: 0;
}
</style>
