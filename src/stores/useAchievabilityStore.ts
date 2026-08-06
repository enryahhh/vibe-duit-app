import { defineStore } from "pinia";
import { computed } from "vue";
import { useAchievability } from "@/composables/useAchievability";
import type {
  WhatIfSimulationParams,
  WhatIfSimulationResult,
} from "@/types/achievability";

/**
 * Pinia store holding global goal achievability health assessments and simulation state.
 */
export const useAchievabilityStore = defineStore("achievabilityStore", () => {
  const {
    achievabilityMap,
    goalsRequiringAttention,
    getGoalAchievability,
    simulateScenario,
  } = useAchievability();

  /**
   * Number of active goals that are marked 'at_risk' or 'off_track'.
   */
  const atRiskCount = computed<number>(() => {
    return goalsRequiringAttention.value.length;
  });

  return {
    achievabilityMap,
    goalsRequiringAttention,
    atRiskCount,
    getGoalAchievability,
    simulateScenario,
  };
});
