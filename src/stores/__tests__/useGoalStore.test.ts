import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { ref } from "vue";
import { useGoalStore } from "../useGoalStore";
import type { Goal } from "@/types/goal";

// Mock useGoals composable
vi.mock("@/composables/useGoals", () => {
  const mockGoals = ref<Goal[]>([
    {
      id: "g-1",
      name: "Emergency Fund",
      targetAmount: 5000,
      currentSaved: 2500,
      priority: "high",
      status: "active",
      createdAt: "2026-08-01",
      updatedAt: "2026-08-01",
    },
    {
      id: "g-2",
      name: "Vacation",
      targetAmount: 2000,
      currentSaved: 2000,
      priority: "medium",
      status: "completed",
      createdAt: "2026-07-01",
      updatedAt: "2026-08-01",
    },
  ]);

  return {
    useGoals: () => ({
      goals: mockGoals,
      loading: ref(false),
      error: ref(null),
      addGoal: vi.fn(),
      updateGoal: vi.fn(),
      togglePauseGoal: vi.fn(),
      deleteGoal: vi.fn(),
      logProgressContribution: vi.fn(),
    }),
  };
});

// Mock useTransactionStore composable
vi.mock("@/stores/useTransactionStore", () => ({
  useTransactionStore: () => ({
    transactions: [],
  }),
}));

describe("useGoalStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("filters active and completed goals correctly", () => {
    const store = useGoalStore();
    expect(store.activeGoals.length).toBe(1);
    expect(store.activeGoals[0]?.id).toBe("g-1");
    expect(store.completedGoals.length).toBe(1);
    expect(store.completedGoals[0]?.id).toBe("g-2");
  });

  it("calculates total active target and current saved amounts correctly", () => {
    const store = useGoalStore();
    expect(store.totalTargetAmount).toBe(5000);
    expect(store.totalCurrentSaved).toBe(2500);
    expect(store.overallProgressPercentage).toBe(50);
  });

  it("finds goal by ID correctly", () => {
    const store = useGoalStore();
    const goal = store.getGoalById("g-1");
    expect(goal?.name).toBe("Emergency Fund");
  });
});
