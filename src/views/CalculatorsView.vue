<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import InvestmentCalculator from "@/components/calculators/InvestmentCalculator.vue";
import BusinessStartUpCalculator from "@/components/calculators/BusinessStartUpCalculator.vue";
import PortfolioTracker from "@/components/calculators/PortfolioTracker.vue";
import { TrendingUp, Building2, Briefcase } from "lucide-vue-next";

const route = useRoute();
const activeTab = ref<"investment" | "business" | "portfolio">("investment");
const prefilledGoalId = ref<string>("");

watch(
  () => route.query,
  (query) => {
    if (query.goalId) {
      prefilledGoalId.value = query.goalId as string;
      activeTab.value = "investment";
    }
    if (query.tab && ["investment", "business", "portfolio"].includes(query.tab as string)) {
      activeTab.value = query.tab as any;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="calculators-view">
    <!-- Header Banner -->
    <div class="header-banner">
      <div>
        <h1 class="page-title">Financial Calculation & Business Suite</h1>
        <p class="page-subtitle">
          Model investment compounding, plan business start-ups, and track manual mutual fund holdings.
        </p>
      </div>

      <!-- Main Navigation Tabs -->
      <div class="suite-nav-tabs">
        <button
          type="button"
          class="suite-tab"
          :class="{ active: activeTab === 'investment' }"
          @click="activeTab = 'investment'"
        >
          <TrendingUp :size="18" /> Investment Growth
        </button>

        <button
          type="button"
          class="suite-tab"
          :class="{ active: activeTab === 'business' }"
          @click="activeTab = 'business'"
        >
          <Building2 :size="18" /> Business Start-Up
        </button>

        <button
          type="button"
          class="suite-tab"
          :class="{ active: activeTab === 'portfolio' }"
          @click="activeTab = 'portfolio'"
        >
          <Briefcase :size="18" /> Portfolio Tracker
        </button>
      </div>
    </div>

    <!-- Active Tab Component -->
    <div class="tab-content">
      <InvestmentCalculator
        v-if="activeTab === 'investment'"
        :initial-goal-id="prefilledGoalId"
      />
      <BusinessStartUpCalculator v-else-if="activeTab === 'business'" />
      <PortfolioTracker v-else-if="activeTab === 'portfolio'" />
    </div>
  </div>
</template>

<style scoped>
.calculators-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-banner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.suite-nav-tabs {
  display: flex;
  gap: 10px;
  background: var(--bg-card);
  padding: 6px;
  border-radius: var(--radius-lg);
  border: var(--glass-border);
  max-width: 680px;
}

.suite-tab {
  flex: 1;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.92rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suite-tab:hover {
  color: var(--text-primary);
}

.suite-tab.active {
  background: var(--accent-primary);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.4rem;
  }

  .suite-nav-tabs {
    flex-direction: column;
    max-width: 100%;
  }
}
</style>
