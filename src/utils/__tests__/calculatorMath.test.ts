import { describe, it, expect } from "vitest";
import {
  calculateLumpSum,
  calculateSip,
  calculateGoalInvestment,
} from "@/utils/investmentMath";
import { calculateBusinessStartUp } from "@/utils/businessMath";
import type { BusinessStartUpParams } from "@/types/calculator";

describe("Investment Math Engine", () => {
  it("should correctly compute Lump Sum future value", () => {
    // $10,000 at 10% annual return for 5 years compounding monthly
    const result = calculateLumpSum(10000, 10, 5, "monthly", 0);
    expect(result.totalInvested).toBe(10000);
    expect(result.maturityValue).toBeGreaterThan(16000);
    expect(result.maturityValue).toBeLessThan(16500);
    expect(result.yearlyBreakdown.length).toBe(5);
  });

  it("should correctly compute SIP future value with step-up", () => {
    // $1,000/mo at 12% annual return for 3 years
    const resultNoStepUp = calculateSip(1000, 12, 3, "monthly", 0, 0);
    expect(resultNoStepUp.totalInvested).toBe(36000);
    expect(resultNoStepUp.maturityValue).toBeGreaterThan(43000);

    // With 10% annual step-up
    const resultWithStepUp = calculateSip(1000, 12, 3, "monthly", 10, 0);
    expect(resultWithStepUp.totalInvested).toBeGreaterThan(36000);
    expect(resultWithStepUp.maturityValue).toBeGreaterThan(resultNoStepUp.maturityValue);
  });

  it("should compute Goal-Based investment monthly requirement", () => {
    // Target $100,000 in 5 years at 10% return
    const result = calculateGoalInvestment(100000, 0, 5, 10, 0);
    expect(result.monthlyInvestmentRequired).toBeGreaterThan(1200);
    expect(result.monthlyInvestmentRequired).toBeLessThan(1450);
  });
});

describe("Business Start-Up Math Engine", () => {
  it("should compute initial capital required, burn rate, and break-even month", () => {
    const params: BusinessStartUpParams = {
      scenarioName: "Coffee Shop Base Case",
      oneTimeCosts: [
        { id: "1", name: "Equipment", amount: 30000 },
        { id: "2", name: "Licenses", amount: 5000 },
      ],
      monthlyFixedCosts: [
        { id: "3", name: "Rent", amount: 3000 },
        { id: "4", name: "Salaries", amount: 5000 },
      ],
      variableCostPercentage: 20, // 20% of revenue
      revenueMode: "direct",
      monthlyRevenue: 15000,
      pricePerUnit: 0,
      unitsSoldPerMonth: 0,
      monthsUntilRevenue: 2, // 2 months burn rate delay
    };

    const result = calculateBusinessStartUp(params);

    expect(result.totalOneTimeCosts).toBe(35000);
    expect(result.totalMonthlyFixedCosts).toBe(8000);
    expect(result.monthlyBurnRate).toBe(8000);
    // Total capital = 35000 + (8000 * 2) = 51000
    expect(result.totalCapitalRequired).toBe(51000);

    // Monthly revenue 15000, variable 20% = 3000, fixed = 8000 => Net profit = 4000/mo
    expect(result.monthlyNetProfit).toBe(4000);

    // Break even occurs when cumulative profit covers 51000 => ~13 months operational + 2 ramp up = 15 months
    expect(result.breakEvenMonth).toBeGreaterThan(12);
  });
});
