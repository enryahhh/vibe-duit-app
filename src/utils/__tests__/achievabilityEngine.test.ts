import { describe, it, expect } from "vitest";
import {
  hasSufficientTransactionHistory,
  evaluateCashFlowTrend,
  evaluateGoalAchievability,
  runWhatIfSimulation,
} from "../achievabilityEngine";
import type { Goal } from "@/types/goal";
import type { Transaction } from "@/types/transaction";

describe("achievabilityEngine Utility", () => {
  describe("hasSufficientTransactionHistory", () => {
    it("returns false for empty transaction array", () => {
      expect(hasSufficientTransactionHistory([])).toBe(false);
    });

    it("returns true when transactions span 3 or more distinct months", () => {
      const mockTxs: Transaction[] = [
        {
          id: "tx-1",
          type: "income",
          amount: 1000,
          date: "2026-05-10",
          fromAccountId: "acc-1",
          categoryId: "cat-1",
          categoryName: "Salary",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "tx-2",
          type: "income",
          amount: 1000,
          date: "2026-06-10",
          fromAccountId: "acc-1",
          categoryId: "cat-1",
          categoryName: "Salary",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "tx-3",
          type: "income",
          amount: 1000,
          date: "2026-07-10",
          fromAccountId: "acc-1",
          categoryId: "cat-1",
          categoryName: "Salary",
          createdAt: "",
          updatedAt: "",
        },
      ];
      expect(hasSufficientTransactionHistory(mockTxs, 3)).toBe(true);
    });
  });

  describe("evaluateCashFlowTrend", () => {
    it("returns severe_negative when latest net cash flow is negative", () => {
      const res = evaluateCashFlowTrend([500, 200, -100]);
      expect(res.trend).toBe("severe_negative");
      expect(res.capacityScore).toBe(0);
    });

    it("returns improving when cash flow increases month-over-month", () => {
      const res = evaluateCashFlowTrend([1000, 1500, 2000]);
      expect(res.trend).toBe("improving");
      expect(res.capacityScore).toBe(100);
    });

    it("returns declining when cash flow drops significantly", () => {
      const res = evaluateCashFlowTrend([2000, 1500, 1000]);
      expect(res.trend).toBe("declining");
      expect(res.capacityScore).toBe(40);
    });
  });

  describe("evaluateGoalAchievability", () => {
    const sampleGoal: Goal = {
      id: "g-test",
      name: "Car Fund",
      targetAmount: 10000,
      currentSaved: 5000,
      priority: "high",
      status: "active",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    it("classifies health as uncertain when transaction history is insufficient", () => {
      const evalRes = evaluateGoalAchievability(sampleGoal, []);
      expect(evalRes.healthStatus).toBe("uncertain");
      expect(evalRes.insights.length).toBeGreaterThan(0);
    });

    it("classifies health as on_track with score when project targets are met", () => {
      const mockTxs: Transaction[] = [
        {
          id: "1",
          type: "income",
          amount: 4000,
          date: "2026-05-01",
          fromAccountId: "a",
          categoryId: "c",
          categoryName: "Job",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "2",
          type: "expense",
          amount: 1000,
          date: "2026-05-15",
          fromAccountId: "a",
          categoryId: "c2",
          categoryName: "Dining Out",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "3",
          type: "income",
          amount: 4000,
          date: "2026-06-01",
          fromAccountId: "a",
          categoryId: "c",
          categoryName: "Job",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "4",
          type: "income",
          amount: 4000,
          date: "2026-07-01",
          fromAccountId: "a",
          categoryId: "c",
          categoryName: "Job",
          createdAt: "",
          updatedAt: "",
        },
      ];

      const evalRes = evaluateGoalAchievability(sampleGoal, mockTxs);
      expect(evalRes.healthStatus).toBe("on_track");
      expect(evalRes.score).toBeGreaterThanOrEqual(80);
      expect(evalRes.topDiscretionaryCategories.length).toBeGreaterThan(0);
    });
  });

  describe("runWhatIfSimulation", () => {
    it("accelerates goal completion when spending category reduction is applied", () => {
      const sampleGoal: Goal = {
        id: "g-sim",
        name: "Vacation",
        targetAmount: 5000,
        currentSaved: 1000,
        priority: "medium",
        status: "active",
        createdAt: "",
        updatedAt: "",
      };

      const mockTxs: Transaction[] = [
        {
          id: "1",
          type: "income",
          amount: 3000,
          date: "2026-05-01",
          fromAccountId: "a",
          categoryId: "cat-din",
          categoryName: "Dining Out",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "2",
          type: "expense",
          amount: 500,
          date: "2026-05-10",
          fromAccountId: "a",
          categoryId: "cat-din",
          categoryName: "Dining Out",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "3",
          type: "income",
          amount: 3000,
          date: "2026-06-01",
          fromAccountId: "a",
          categoryId: "cat-din",
          categoryName: "Dining Out",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "4",
          type: "income",
          amount: 3000,
          date: "2026-07-01",
          fromAccountId: "a",
          categoryId: "cat-din",
          categoryName: "Dining Out",
          createdAt: "",
          updatedAt: "",
        },
      ];

      const result = runWhatIfSimulation(sampleGoal, mockTxs, {
        goalId: "g-sim",
        reducedCategoryId: "cat-din",
        categoryReductionPercent: 20, // 20% cut of $500/mo = $100/mo extra
        scenarioName: "Cut Dining Out by 20%",
      });

      expect(result.additionalMonthlySavings).toBeGreaterThan(0);
      expect(result.simulated.score).toBeGreaterThanOrEqual(
        result.baseline.score,
      );
    });
  });
});
