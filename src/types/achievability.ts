/**
 * Health status classification for financial goals.
 */
export type HealthStatus = "on_track" | "at_risk" | "off_track" | "uncertain";

/**
 * Net cash flow financial capacity trend over past 3 months.
 */
export type TrendDirection =
  "improving" | "stable" | "declining" | "severe_negative";

/**
 * Discretionary expense category spending summary.
 */
export interface DiscretionaryCategorySummary {
  categoryId: string;
  categoryName: string;
  avgMonthlyAmount: number;
}

/**
 * Goal Achievability evaluation result.
 */
export interface GoalAchievability {
  goalId: string;
  healthStatus: HealthStatus;
  score: number; // Overall score 0 - 100
  contributionScore: number; // 0 - 100
  capacityScore: number; // 0 - 100
  timelineScore: number; // 0 - 100
  projectedTotalSavings: number; // Estimated savings at target deadline
  projectedMonthsRemaining: number;
  projectedCompletionDate: string | null;
  cashFlowTrend: TrendDirection;
  insights: string[];
  topDiscretionaryCategories: DiscretionaryCategorySummary[];
}

/**
 * Inputs for running a What-If scenario simulation.
 */
export interface WhatIfSimulationParams {
  goalId: string;
  adjustedMonthlySaving?: number; // Custom monthly contribution target
  reducedCategoryId?: string; // Category to cut spending on
  categoryReductionPercent?: number; // 0 - 100 % reduction slider
  scenarioName?: string; // e.g. "Aggressive Savings Plan"
}

/**
 * Output comparison result of a What-If scenario simulation.
 */
export interface WhatIfSimulationResult {
  goalId: string;
  scenarioName: string;
  baseline: GoalAchievability;
  simulated: GoalAchievability;
  additionalMonthlySavings: number;
  monthsSaved: number; // Difference in projected completion time
  newProjectedCompletionDate: string | null;
}
