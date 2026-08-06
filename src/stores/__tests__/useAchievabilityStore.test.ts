import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { ref } from "vue";
import { useAchievabilityStore } from "../useAchievabilityStore";
import type { Goal } from "@/types/goal";

// Mock useGoalStore and useTransactionStore
vi.mock("@/stores/useGoalStore", () => {
  const mockGoals = ref<Goal[]>([
    {
      id: "g-on-track",
      name: "Vacation Fund",
      targetAmount: 2000,
      currentSaved: 1500,
      priority: "medium",
      status: "active",
      createdAt: "",
      updatedAt: "",
    },
  ]);

  return {
    useGoalStore: () => ({
      goals: mockGoals,
      activeGoals: mockGoals,
      getGoalById: (id: string) => mockGoals.value.find((g) => g.id === id),
    }),
  };
});

vi.mock("@/stores/useTransactionStore", () => ({
  useTransactionStore: () => ({
    transactions: [],
  }),
}));

describe("useAchievabilityStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("retrieves goal achievability map correctly", () => {
    const store = useAchievabilityStore();
    const assessment = store.getGoalAchievability("g-on-track");
    expect(assessment).toBeDefined();
    expect(assessment?.goalId).toBe("g-on-track");
  });

  it("executes What-If scenario simulation correctly", () => {
    const store = useAchievabilityStore();
    const simResult = store.simulateScenario({
      goalId: "g-on-track",
      adjustedMonthlySaving: 500,
      scenarioName: "Test Scenario",
    });

    expect(simResult).toBeDefined();
    expect(simResult?.scenarioName).toBe("Test Scenario");
    expect(simResult?.simulated).toBeDefined();
  });
});
