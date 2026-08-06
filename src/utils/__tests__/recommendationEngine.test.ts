import { describe, it, expect } from "vitest";
import {
  calculateMonthsRemaining,
  analyzeHistoricalCashFlow,
  calculateGoalRecommendation,
} from "../recommendationEngine";
import type { Transaction } from "@/types/transaction";

describe("recommendationEngine Utility", () => {
  describe("calculateMonthsRemaining", () => {
    it("returns default months when deadline is omitted", () => {
      expect(calculateMonthsRemaining(undefined, 12)).toBe(12);
    });

    it("returns at least 1 month for past or immediate deadline dates", () => {
      expect(calculateMonthsRemaining("2020-01-01")).toBe(1);
    });
  });

  describe("analyzeHistoricalCashFlow", () => {
    it("returns zeroes when transactions list is empty", () => {
      const res = analyzeHistoricalCashFlow([]);
      expect(res.avgMonthlyIncome).toBe(0);
      expect(res.avgMonthlyExpense).toBe(0);
      expect(res.avgMonthlyNetCashFlow).toBe(0);
      expect(res.discretionaryIncome).toBe(0);
    });

    it("calculates average monthly income, expense and discretionary income correctly", () => {
      const mockTxs: Transaction[] = [
        {
          id: "tx-1",
          type: "income",
          amount: 3000,
          date: "2026-07-15",
          fromAccountId: "acc-1",
          categoryId: "cat-inc",
          categoryName: "Salary",
          createdAt: "2026-07-15",
          updatedAt: "2026-07-15",
        },
        {
          id: "tx-2",
          type: "expense",
          amount: 1000,
          date: "2026-07-20",
          fromAccountId: "acc-1",
          categoryId: "cat-exp",
          categoryName: "Rent",
          createdAt: "2026-07-20",
          updatedAt: "2026-07-20",
        },
      ];

      const res = analyzeHistoricalCashFlow(mockTxs, 6);
      expect(res.avgMonthlyIncome).toBe(3000);
      expect(res.avgMonthlyExpense).toBe(1000);
      expect(res.avgMonthlyNetCashFlow).toBe(2000);
      expect(res.discretionaryIncome).toBe(2000);
    });
  });

  describe("calculateGoalRecommendation", () => {
    it("computes base required monthly amount correctly without transaction history", () => {
      const rec = calculateGoalRecommendation(12000, 0, undefined, []);
      expect(rec.monthsRemaining).toBe(12);
      expect(rec.baseRequiredMonthly).toBe(1000);
      expect(rec.recommendedMonthly).toBe(1000);
    });

    it("caps recommendation at 80% discretionary income", () => {
      const mockTxs: Transaction[] = [
        {
          id: "tx-1",
          type: "income",
          amount: 2000,
          date: "2026-07-01",
          fromAccountId: "acc-1",
          categoryId: "cat-inc",
          categoryName: "Salary",
          createdAt: "2026-07-01",
          updatedAt: "2026-07-01",
        },
        {
          id: "tx-2",
          type: "expense",
          amount: 1000,
          date: "2026-07-05",
          fromAccountId: "acc-1",
          categoryId: "cat-exp",
          categoryName: "Bills",
          createdAt: "2026-07-05",
          updatedAt: "2026-07-05",
        },
      ];

      // Discretionary Income = 1000. Capped limit = 800 (1000 * 0.8)
      // Goal target requires 1200 / month
      const rec = calculateGoalRecommendation(14400, 0, undefined, mockTxs);
      expect(rec.baseRequiredMonthly).toBe(1200);
      expect(rec.discretionaryIncome).toBe(1000);
      expect(rec.recommendedMonthly).toBe(800);
      expect(rec.isUnrealistic).toBe(true);
    });
  });
});
