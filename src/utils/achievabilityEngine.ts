import type { Transaction } from "@/types/transaction";
import type { Goal, GoalProgressContribution } from "@/types/goal";
import type {
  GoalAchievability,
  HealthStatus,
  TrendDirection,
  DiscretionaryCategorySummary,
  WhatIfSimulationParams,
  WhatIfSimulationResult,
} from "@/types/achievability";
import { calculateMonthsRemaining } from "@/utils/recommendationEngine";
import { formatCurrency } from "@/utils/formatCurrency";

/**
 * Analyzes transaction dates to check if user has at least N distinct months of history.
 */
export function hasSufficientTransactionHistory(
  transactions: Transaction[],
  requiredMonths = 1,
): boolean {
  if (!transactions || transactions.length === 0) return false;
  const monthSet = new Set<string>();
  transactions.forEach((tx) => monthSet.add(tx.date.slice(0, 7)));
  return monthSet.size >= requiredMonths;
}

/**
 * Computes monthly net cash flows for the past N months.
 */
export function getMonthlyNetCashFlows(
  transactions: Transaction[],
  monthsCount = 3,
): number[] {
  const now = new Date();
  const flows: number[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const yearMonth = new Date(now.getFullYear(), now.getMonth() - i, 1)
      .toISOString()
      .slice(0, 7);
    const monthTxs = transactions.filter((tx) => tx.date.startsWith(yearMonth));

    const income = monthTxs
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = monthTxs
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    flows.push(income - expense);
  }

  return flows;
}

/**
 * Determines net cash flow trend direction across recent months.
 */
export function evaluateCashFlowTrend(netCashFlows: number[]): {
  trend: TrendDirection;
  capacityScore: number;
} {
  if (netCashFlows.length === 0) {
    return { trend: "stable", capacityScore: 80 };
  }

  const latestFlow = netCashFlows[netCashFlows.length - 1] ?? 0;
  const firstFlow = netCashFlows[0] ?? 0;

  if (latestFlow < 0) {
    return { trend: "severe_negative", capacityScore: 0 };
  }

  const delta = latestFlow - firstFlow;
  const avg = (latestFlow + firstFlow) / 2 || 1;
  const changeRatio = delta / Math.abs(avg);

  if (changeRatio > 0.1) {
    return { trend: "improving", capacityScore: 100 };
  } else if (changeRatio < -0.1) {
    return { trend: "declining", capacityScore: 40 };
  } else {
    return { trend: "stable", capacityScore: 80 };
  }
}

/**
 * Identifies top discretionary spending categories from past 3 months of transaction history.
 */
export function getTopDiscretionaryCategories(
  transactions: Transaction[],
  topN = 3,
): DiscretionaryCategorySummary[] {
  const categoryTotals: Record<string, { name: string; total: number }> = {};
  const monthSet = new Set<string>();

  transactions
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      monthSet.add(tx.date.slice(0, 7));
      if (!categoryTotals[tx.categoryId]) {
        categoryTotals[tx.categoryId] = { name: tx.categoryName, total: 0 };
      }
      categoryTotals[tx.categoryId]!.total += tx.amount;
    });

  const months = Math.max(1, monthSet.size);

  return Object.entries(categoryTotals)
    .map(([id, val]) => ({
      categoryId: id,
      categoryName: val.name,
      avgMonthlyAmount: Math.round((val.total / months) * 100) / 100,
    }))
    .sort((a, b) => b.avgMonthlyAmount - a.avgMonthlyAmount)
    .slice(0, topN);
}

/**
 * Main evaluation engine for Goal Achievability Analysis (PRD-003).
 */
export function evaluateGoalAchievability(
  goal: Goal,
  transactions: Transaction[] = [],
  contributions: GoalProgressContribution[] = [],
): GoalAchievability {
  const monthsRemaining = calculateMonthsRemaining(goal.deadline);

  // 1. Check data sufficiency (at least 1 month of transactions or 1 logged contribution)
  const isSufficientData = hasSufficientTransactionHistory(transactions, 1);
  if (!isSufficientData && contributions.length === 0) {
    return {
      goalId: goal.id,
      healthStatus: "uncertain",
      score: 50,
      contributionScore: 50,
      capacityScore: 80,
      timelineScore: 50,
      projectedTotalSavings: goal.currentSaved,
      projectedMonthsRemaining: monthsRemaining,
      projectedCompletionDate: null,
      cashFlowTrend: "stable",
      insights: [
        "Add at least 1 transaction or log a goal contribution to activate full achievability evaluation.",
      ],
      topDiscretionaryCategories: [],
    };
  }

  // 2. Capacity Score & Trend
  const cashFlows = getMonthlyNetCashFlows(transactions, 3);
  const { trend: cashFlowTrend, capacityScore } =
    evaluateCashFlowTrend(cashFlows);
  const latestNetCashFlow = Math.max(0, cashFlows[cashFlows.length - 1] ?? 0);

  // 3. Contribution Score calculation
  const targetMonthly =
    goal.customMonthlyTarget ||
    Math.max(1, (goal.targetAmount - goal.currentSaved) / monthsRemaining);

  // Calculate average actual monthly contribution from logged progress or discretionary capacity
  let avgActualMonthlySaving = 0;
  if (contributions.length > 0) {
    const totalContrib = contributions.reduce((sum, c) => sum + c.amount, 0);
    const monthsSpan = Math.max(
      1,
      new Set(contributions.map((c) => c.date.slice(0, 7))).size,
    );
    avgActualMonthlySaving = totalContrib / monthsSpan;
  } else {
    avgActualMonthlySaving = Math.min(targetMonthly, latestNetCashFlow * 0.5);
  }

  const contributionScore = Math.min(
    100,
    Math.round((avgActualMonthlySaving / targetMonthly) * 100),
  );

  // 4. Timeline Feasibility & Score
  const projectedTotalSavings = Math.round(
    goal.currentSaved + avgActualMonthlySaving * monthsRemaining,
  );
  const timelineRatio =
    goal.targetAmount > 0 ? projectedTotalSavings / goal.targetAmount : 1;
  const timelineScore = Math.min(100, Math.round(timelineRatio * 100));

  // 5. Projected completion date
  let projectedCompletionDate: string | null = null;
  if (avgActualMonthlySaving > 0) {
    const neededMonths = Math.ceil(
      Math.max(0, goal.targetAmount - goal.currentSaved) /
        avgActualMonthlySaving,
    );
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + neededMonths);
    projectedCompletionDate = targetDate.toISOString().slice(0, 10);
  }

  // 6. Overall Weighted Score (FR3.3: 0.4*contrib + 0.3*capacity + 0.3*timeline)
  const rawScore =
    0.4 * contributionScore + 0.3 * capacityScore + 0.3 * timelineScore;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // 7. Health Status Classification (FR3.2)
  let healthStatus: HealthStatus = "on_track";
  if (
    timelineRatio >= 1.0 &&
    (cashFlowTrend === "stable" || cashFlowTrend === "improving")
  ) {
    healthStatus = "on_track";
  } else if (
    timelineRatio >= 0.8 ||
    (cashFlowTrend === "declining" && timelineRatio > 0.8)
  ) {
    healthStatus = "at_risk";
  } else {
    healthStatus = "off_track";
  }

  // 8. Plain-Language Insights & Category Recommendations (FR3.5, FR3.6)
  const topCategories = getTopDiscretionaryCategories(transactions, 3);
  const insights: string[] = [];

  if (healthStatus === "on_track") {
    if (timelineRatio > 1.1) {
      const monthsSaved = Math.max(
        1,
        Math.floor(
          monthsRemaining -
            (goal.targetAmount - goal.currentSaved) / avgActualMonthlySaving,
        ),
      );
      insights.push(
        `Great job! You're ahead of schedule and could reach your goal ${monthsSaved} month(s) early.`,
      );
    } else {
      insights.push(
        "Your goal is on track based on your current savings rate and cash flow stability.",
      );
    }
  } else if (healthStatus === "at_risk") {
    if (cashFlowTrend === "declining") {
      insights.push(
        `Your net cash flow has shown a declining trend over the last 3 months. Consider pacing your monthly contribution.`,
      );
    } else {
      insights.push(
        `Projected savings reach ${Math.round(timelineRatio * 100)}% of your target amount by the deadline. Slightly increasing monthly contributions can secure your goal.`,
      );
    }
  } else {
    // off_track
    if (topCategories.length > 0) {
      const topCat = topCategories[0];
      insights.push(
        `You've saved roughly ${contributionScore}% of your target monthly commitment. Consider reducing non-essential spending in '${topCat?.categoryName}' (avg ${formatCurrency(topCat?.avgMonthlyAmount || 0)}/mo).`,
      );
    } else {
      insights.push(
        `Projected savings reach only ${Math.round(timelineRatio * 100)}% of target. Extending the deadline or increasing monthly savings is recommended.`,
      );
    }
  }

  return {
    goalId: goal.id,
    healthStatus,
    score,
    contributionScore,
    capacityScore,
    timelineScore,
    projectedTotalSavings,
    projectedMonthsRemaining: monthsRemaining,
    projectedCompletionDate,
    cashFlowTrend,
    insights,
    topDiscretionaryCategories: topCategories,
  };
}

/**
 * Runs a What-If scenario simulation on a goal (FR3.7).
 */
export function runWhatIfSimulation(
  goal: Goal,
  transactions: Transaction[],
  params: WhatIfSimulationParams,
  contributions: GoalProgressContribution[] = [],
): WhatIfSimulationResult {
  const baseline = evaluateGoalAchievability(goal, transactions, contributions);

  // Compute additional monthly savings from category spending reduction
  let additionalCategorySavings = 0;
  if (params.reducedCategoryId && params.categoryReductionPercent) {
    const categorySummary = baseline.topDiscretionaryCategories.find(
      (c) => c.categoryId === params.reducedCategoryId,
    );
    if (categorySummary) {
      additionalCategorySavings =
        categorySummary.avgMonthlyAmount *
        (params.categoryReductionPercent / 100);
    }
  }

  const baselineMonthly =
    goal.customMonthlyTarget ||
    Math.max(
      1,
      (goal.targetAmount - goal.currentSaved) /
        baseline.projectedMonthsRemaining,
    );
  const newMonthlyTarget =
    (params.adjustedMonthlySaving || baselineMonthly) +
    additionalCategorySavings;

  // Create simulated goal parameters
  const simulatedGoal: Goal = {
    ...goal,
    customMonthlyTarget: newMonthlyTarget,
  };

  const simulated = evaluateGoalAchievability(
    simulatedGoal,
    transactions,
    contributions,
  );

  // Calculate months saved
  let monthsSaved = 0;
  if (baseline.projectedCompletionDate && simulated.projectedCompletionDate) {
    const baseDate = new Date(baseline.projectedCompletionDate);
    const simDate = new Date(simulated.projectedCompletionDate);
    const yearDiff = baseDate.getFullYear() - simDate.getFullYear();
    const monthDiff = baseDate.getMonth() - simDate.getMonth();
    monthsSaved = Math.max(0, yearDiff * 12 + monthDiff);
  }

  return {
    goalId: goal.id,
    scenarioName: params.scenarioName || "What-If Simulation",
    baseline,
    simulated,
    additionalMonthlySavings: Math.round(additionalCategorySavings * 100) / 100,
    monthsSaved,
    newProjectedCompletionDate: simulated.projectedCompletionDate,
  };
}
