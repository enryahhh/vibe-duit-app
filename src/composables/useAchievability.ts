import { computed } from "vue";
import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import {
  evaluateGoalAchievability,
  runWhatIfSimulation,
} from "@/utils/achievabilityEngine";
import type {
  GoalAchievability,
  WhatIfSimulationParams,
  WhatIfSimulationResult,
} from "@/types/achievability";

/**
 * Composable providing goal achievability analysis, health assessments, and What-If scenario simulations.
 */
export function useAchievability() {
  const goalStore = useGoalStore();
  const transactionStore = useTransactionStore();

  /**
   * Map of goal ID to its calculated GoalAchievability result.
   */
  const achievabilityMap = computed<Record<string, GoalAchievability>>(() => {
    const map: Record<string, GoalAchievability> = {};
    const txs = transactionStore.transactions;

    const goalsList = goalStore.goals || [];
    goalsList.forEach((goal) => {
      map[goal.id] = evaluateGoalAchievability(goal, txs);
    });

    return map;
  });

  /**
   * List of active goals requiring immediate user attention ('at_risk' or 'off_track').
   */
  const goalsRequiringAttention = computed(() => {
    const activeList = goalStore.activeGoals || [];
    return activeList.filter((goal) => {
      const assessment = achievabilityMap.value[goal.id];
      return (
        assessment &&
        (assessment.healthStatus === "at_risk" ||
          assessment.healthStatus === "off_track")
      );
    });
  });

  /**
   * Helper function to get achievability metrics for a specific goal ID.
   */
  const getGoalAchievability = (
    goalId: string,
  ): GoalAchievability | undefined => {
    return achievabilityMap.value[goalId];
  };

  /**
   * Helper function to run a What-If scenario simulation for a goal.
   */
  const simulateScenario = (
    params: WhatIfSimulationParams,
  ): WhatIfSimulationResult | null => {
    const goal = goalStore.getGoalById(params.goalId);
    if (!goal) return null;
    return runWhatIfSimulation(goal, transactionStore.transactions, params);
  };

  return {
    achievabilityMap,
    goalsRequiringAttention,
    getGoalAchievability,
    simulateScenario,
  };
}
