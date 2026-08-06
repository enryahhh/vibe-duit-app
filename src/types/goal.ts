/**
 * Priority levels for financial goals.
 */
export type GoalPriority = "high" | "medium" | "low";

/**
 * Status of a financial goal.
 */
export type GoalStatus = "active" | "paused" | "completed";

/**
 * Interface representing a manual progress contribution logged against a goal.
 */
export interface GoalProgressContribution {
  id: string;
  goalId: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  note?: string;
  createdAt: string;
}

/**
 * Financial Goal document structure matching Firestore schema.
 */
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  deadline?: string; // ISO date string YYYY-MM-DD (optional for open-ended goals)
  priority: GoalPriority;
  linkedAccountId?: string; // Optional linked savings account ID
  customMonthlyTarget?: number; // User custom monthly target override
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new Goal.
 */
export type CreateGoalDTO = Omit<Goal, "id" | "createdAt" | "updatedAt">;

/**
 * DTO for updating an existing Goal.
 */
export type UpdateGoalDTO = Partial<CreateGoalDTO>;

/**
 * Result object produced by the recommendation calculation engine.
 */
export interface GoalRecommendation {
  baseRequiredMonthly: number;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  avgMonthlyNetCashFlow: number;
  discretionaryIncome: number;
  recommendedMonthly: number;
  isUnrealistic: boolean;
  monthsRemaining: number;
}
