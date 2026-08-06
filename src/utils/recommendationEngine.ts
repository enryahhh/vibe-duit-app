import type { Transaction } from "@/types/transaction";
import type { GoalRecommendation } from "@/types/goal";

/**
 * Calculates the number of months remaining from current date to target deadline.
 * Returns default (e.g. 12) if no deadline is specified.
 */
export function calculateMonthsRemaining(
  deadline?: string,
  defaultMonths = 12,
): number {
  if (!deadline) return defaultMonths;

  const now = new Date();
  const target = new Date(deadline);

  // If deadline is invalid date or in the past, return at least 1 month
  if (isNaN(target.getTime())) return defaultMonths;

  const yearDiff = target.getFullYear() - now.getFullYear();
  const monthDiff = target.getMonth() - now.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;

  return Math.max(1, totalMonths);
}

/**
 * Analyzes past 3-6 months of transactions to estimate average monthly cash flow metrics.
 */
export function analyzeHistoricalCashFlow(
  transactions: Transaction[],
  monthsCount = 6,
): {
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  avgMonthlyNetCashFlow: number;
  discretionaryIncome: number;
} {
  if (!transactions || transactions.length === 0) {
    return {
      avgMonthlyIncome: 0,
      avgMonthlyExpense: 0,
      avgMonthlyNetCashFlow: 0,
      discretionaryIncome: 0,
    };
  }

  const now = new Date();
  const cutoffDate = new Date(
    now.getFullYear(),
    now.getMonth() - monthsCount,
    1,
  );
  const cutoffISO = cutoffDate.toISOString().slice(0, 10);

  // Filter transactions within past N months
  const recentTxs = transactions.filter((tx) => tx.date >= cutoffISO);

  // Group by YYYY-MM
  const monthSet = new Set<string>();
  let totalIncome = 0;
  let totalExpense = 0;

  recentTxs.forEach((tx) => {
    const monthKey = tx.date.slice(0, 7);
    monthSet.add(monthKey);

    if (tx.type === "income") {
      totalIncome += tx.amount;
    } else if (tx.type === "expense") {
      totalExpense += tx.amount;
    }
  });

  // Effective months for divisor (minimum 1)
  const effectiveMonths = Math.max(1, monthSet.size || 1);

  const avgMonthlyIncome =
    Math.round((totalIncome / effectiveMonths) * 100) / 100;
  const avgMonthlyExpense =
    Math.round((totalExpense / effectiveMonths) * 100) / 100;
  const avgMonthlyNetCashFlow =
    Math.round((avgMonthlyIncome - avgMonthlyExpense) * 100) / 100;

  // Discretionary income is net cash flow after mandatory expenses (fallback to net cash flow if non-negative)
  const discretionaryIncome = Math.max(0, avgMonthlyNetCashFlow);

  return {
    avgMonthlyIncome,
    avgMonthlyExpense,
    avgMonthlyNetCashFlow,
    discretionaryIncome,
  };
}

/**
 * Generates goal recommendation based on goal targets and user transaction history.
 */
export function calculateGoalRecommendation(
  targetAmount: number,
  currentSaved: number,
  deadline?: string,
  transactions: Transaction[] = [],
): GoalRecommendation {
  const monthsRemaining = calculateMonthsRemaining(deadline);
  const remainingToSave = Math.max(0, targetAmount - currentSaved);
  const baseRequiredMonthly =
    Math.round((remainingToSave / monthsRemaining) * 100) / 100;

  const {
    avgMonthlyIncome,
    avgMonthlyExpense,
    avgMonthlyNetCashFlow,
    discretionaryIncome,
  } = analyzeHistoricalCashFlow(transactions);

  let recommendedMonthly = baseRequiredMonthly;

  if (discretionaryIncome > 0) {
    // FR2.4: max(Base Required, Discretionary Income * 0.5), capped at Discretionary Income * 0.8
    const baseSuggestion = Math.max(
      baseRequiredMonthly,
      discretionaryIncome * 0.5,
    );
    const cappedLimit = discretionaryIncome * 0.8;
    recommendedMonthly = Math.min(baseSuggestion, cappedLimit);
  }

  recommendedMonthly = Math.round(recommendedMonthly * 100) / 100;

  // FR2.5: Flag unrealistic if discretionary income is less than base required monthly contribution
  const isUnrealistic = discretionaryIncome < baseRequiredMonthly;

  return {
    baseRequiredMonthly,
    avgMonthlyIncome,
    avgMonthlyExpense,
    avgMonthlyNetCashFlow,
    discretionaryIncome,
    recommendedMonthly,
    isUnrealistic,
    monthsRemaining,
  };
}
