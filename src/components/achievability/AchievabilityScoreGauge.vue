<script setup lang="ts">
import { computed } from "vue";
import { ShieldCheck, Info } from "lucide-vue-next";

const props = defineProps<{
  score: number;
  contributionScore?: number;
  capacityScore?: number;
  timelineScore?: number;
  showBreakdown?: boolean;
}>();

const scoreColorClass = computed(() => {
  if (props.score >= 80) return "score-green";
  if (props.score >= 50) return "score-yellow";
  return "score-red";
});
</script>

<template>
  <div class="score-gauge-wrap" :class="scoreColorClass">
    <div class="gauge-circle" :title="`Achievability Score: ${score}/100`">
      <span class="score-num">{{ score }}</span>
      <span class="score-max">/100</span>
    </div>

    <div v-if="showBreakdown" class="breakdown-box">
      <div class="breakdown-header">
        <ShieldCheck :size="14" />
        <span>Achievability Score Factors</span>
      </div>
      <div class="factors-grid">
        <div class="factor-item">
          <span class="factor-name">Saving Consistency (40%)</span>
          <span class="factor-val">{{ contributionScore ?? score }}%</span>
        </div>
        <div class="factor-item">
          <span class="factor-name">Cash Flow Capacity (30%)</span>
          <span class="factor-val">{{ capacityScore ?? score }}%</span>
        </div>
        <div class="factor-item">
          <span class="factor-name">Timeline Feasibility (30%)</span>
          <span class="factor-val">{{ timelineScore ?? score }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.score-gauge-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gauge-circle {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid currentColor;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.score-num {
  font-size: 1rem;
  font-weight: 900;
  line-height: 1;
}

.score-max {
  font-size: 0.55rem;
  opacity: 0.8;
  font-weight: 700;
}

.score-green {
  color: #34d399;
}

.score-yellow {
  color: #fbbf24;
}

.score-red {
  color: #f87171;
}

.breakdown-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-secondary);
  border: var(--glass-border);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.breakdown-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  color: var(--text-primary);
}

.factors-grid {
  display: flex;
  gap: 12px;
  color: var(--text-muted);
}

.factor-item {
  display: flex;
  gap: 4px;
}

.factor-val {
  font-weight: 700;
  color: var(--text-secondary);
}
</style>
