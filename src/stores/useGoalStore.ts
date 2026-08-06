import { defineStore } from "pinia";
import { computed } from "vue";
import { useGoals } from "@/composables/useGoals";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { calculateGoalRecommendation } from "@/utils/recommendationEngine";
import type { Goal, GoalRecommendation } from "@/types/goal";

/**
 * Pinia store for holding global financial goals state, computed progress aggregations, and recommendation engine access.
 */
export const useGoalStore = defineStore("goalStore", () => {
  const {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    togglePauseGoal,
    deleteGoal,
    logProgressContribution,
  } = useGoals();

  const transactionStore = useTransactionStore();

  /**
   * Active goals list.
   */
  const activeGoals = computed<Goal[]>(() => {
    return goals.value.filter((g) => g.status === "active");
  });

  /**
   * Completed goals list.
   */
  const completedGoals = computed<Goal[]>(() => {
    return goals.value.filter((g) => g.status === "completed");
  });

  /**
   * Total target amount across all active goals.
   */
  const totalTargetAmount = computed<number>(() => {
    return activeGoals.value.reduce((sum, g) => sum + g.targetAmount, 0);
  });

  /**
   * Total current saved amount across all active goals.
   */
  const totalCurrentSaved = computed<number>(() => {
    return activeGoals.value.reduce((sum, g) => sum + g.currentSaved, 0);
  });

  /**
   * Overall progress percentage across all active goals.
   */
  const overallProgressPercentage = computed<number>(() => {
    if (totalTargetAmount.value === 0) return 0;
    const pct = (totalCurrentSaved.value / totalTargetAmount.value) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  });

  /**
   * Helper to evaluate financial recommendation for a given goal target.
   */
  const getRecommendationForGoal = (
    targetAmount: number,
    currentSaved: number,
    deadline?: string,
  ): GoalRecommendation => {
    return calculateGoalRecommendation(
      targetAmount,
      currentSaved,
      deadline,
      transactionStore.transactions,
    );
  };

  /**
   * Helper to find a goal by ID.
   */
  const getGoalById = (id: string): Goal | undefined => {
    return goals.value.find((g) => g.id === id);
  };

  return {
    goals,
    activeGoals,
    completedGoals,
    loading,
    error,
    totalTargetAmount,
    totalCurrentSaved,
    overallProgressPercentage,
    getRecommendationForGoal,
    getGoalById,
    addGoal,
    updateGoal,
    togglePauseGoal,
    deleteGoal,
    logProgressContribution,
  };
});
