import type {
  BusinessStartUpParams,
  BusinessStartUpResult,
  MonthlyBusinessCashFlow,
} from "@/types/calculator";

/**
 * Calculates Business Start-Up Financial Metrics: Total Capital Required, Monthly Burn Rate,
 * Net Monthly Profit, Break-Even Month, and 36-Month Timeline Projection.
 */
export function calculateBusinessStartUp(
  params: BusinessStartUpParams,
  maxProjectionMonths = 36,
): BusinessStartUpResult {
  // 1. One-time initial setup costs sum
  const totalOneTimeCosts = (params.oneTimeCosts || []).reduce(
    (sum, item) => sum + Math.max(0, Number(item.amount || 0)),
    0,
  );

  // 2. Total monthly fixed costs sum (Rent, salaries, utilities, etc.)
  const totalMonthlyFixedCosts = (params.monthlyFixedCosts || []).reduce(
    (sum, item) => sum + Math.max(0, Number(item.amount || 0)),
    0,
  );

  const monthlyBurnRate = totalMonthlyFixedCosts;

  // 3. Effective monthly revenue
  let effectiveMonthlyRevenue = 0;
  if (params.revenueMode === "unit_based") {
    const price = Math.max(0, Number(params.pricePerUnit || 0));
    const units = Math.max(0, Number(params.unitsSoldPerMonth || 0));
    effectiveMonthlyRevenue = price * units;
  } else {
    effectiveMonthlyRevenue = Math.max(0, Number(params.monthlyRevenue || 0));
  }

  // 4. Monthly variable costs (% of revenue)
  const variableRate = Math.max(0, Number(params.variableCostPercentage || 0)) / 100;
  const monthlyVariableCosts = effectiveMonthlyRevenue * variableRate;

  // 5. Monthly Net Profit once operational
  const monthlyNetProfit =
    effectiveMonthlyRevenue - (totalMonthlyFixedCosts + monthlyVariableCosts);

  // 6. Total Capital Required = One-Time Costs + (Monthly Burn Rate * Ramp-Up Months)
  const rampUpMonths = Math.max(0, Number(params.monthsUntilRevenue || 0));
  const totalCapitalRequired =
    totalOneTimeCosts + monthlyBurnRate * rampUpMonths;

  // 7. Generate monthly cash flow projection timeline & evaluate break-even
  const monthlyTimeline: MonthlyBusinessCashFlow[] = [];
  let cumulativeProfit = -totalCapitalRequired;
  let breakEvenMonth: number | null = null;
  let paybackPeriodMonths: number | null = null;

  for (let month = 1; month <= maxProjectionMonths; month++) {
    const isOperational = month > rampUpMonths;
    const rev = isOperational ? effectiveMonthlyRevenue : 0;
    const fixed = totalMonthlyFixedCosts;
    const variable = isOperational ? monthlyVariableCosts : 0;
    const net = rev - (fixed + variable);

    cumulativeProfit += net;

    monthlyTimeline.push({
      month,
      revenue: Math.round(rev * 100) / 100,
      fixedCosts: Math.round(fixed * 100) / 100,
      variableCosts: Math.round(variable * 100) / 100,
      netProfit: Math.round(net * 100) / 100,
      cumulativeProfit: Math.round(cumulativeProfit * 100) / 100,
    });

    if (breakEvenMonth === null && cumulativeProfit >= 0) {
      breakEvenMonth = month;
      paybackPeriodMonths = month - rampUpMonths;
    }
  }

  return {
    totalOneTimeCosts: Math.round(totalOneTimeCosts * 100) / 100,
    totalMonthlyFixedCosts: Math.round(totalMonthlyFixedCosts * 100) / 100,
    monthlyBurnRate: Math.round(monthlyBurnRate * 100) / 100,
    effectiveMonthlyRevenue: Math.round(effectiveMonthlyRevenue * 100) / 100,
    monthlyVariableCosts: Math.round(monthlyVariableCosts * 100) / 100,
    monthlyNetProfit: Math.round(monthlyNetProfit * 100) / 100,
    totalCapitalRequired: Math.round(totalCapitalRequired * 100) / 100,
    breakEvenMonth,
    paybackPeriodMonths,
    monthlyTimeline,
  };
}
