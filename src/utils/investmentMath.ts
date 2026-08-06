import type {
  CompoundingFrequency,
  InvestmentResult,
  YearlyProjectionRow,
} from "@/types/calculator";

function getFrequencyCount(freq: CompoundingFrequency): number {
  switch (freq) {
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "annually":
      return 1;
    default:
      return 12;
  }
}

/**
 * Calculates Lump Sum Investment Future Value and yearly breakdown.
 * Formula: FV = Principal * (1 + r/n)^(n*t)
 */
export function calculateLumpSum(
  principal: number,
  annualReturnPercent: number,
  durationYears: number,
  compoundingFreq: CompoundingFrequency = "monthly",
  inflationPercent: number = 0,
): InvestmentResult {
  const p = Math.max(0, principal);
  const r = Math.max(0, annualReturnPercent) / 100;
  const n = getFrequencyCount(compoundingFreq);
  const totalYears = Math.max(1, durationYears);
  const inflation = Math.max(0, inflationPercent) / 100;

  const yearlyBreakdown: YearlyProjectionRow[] = [];

  for (let year = 1; year <= totalYears; year++) {
    const fv = p * Math.pow(1 + r / n, n * year);
    const inflationAdjusted = fv / Math.pow(1 + inflation, year);
    const invested = p;
    const interest = Math.max(0, fv - invested);

    yearlyBreakdown.push({
      year,
      investedAmount: Math.round(invested * 100) / 100,
      interestEarned: Math.round(interest * 100) / 100,
      totalBalance: Math.round(fv * 100) / 100,
      inflationAdjustedBalance: Math.round(inflationAdjusted * 100) / 100,
    });
  }

  const finalRow = yearlyBreakdown[yearlyBreakdown.length - 1];
  const maturityValue = finalRow?.totalBalance || p;
  const totalInvested = p;
  const totalInterest = Math.max(0, maturityValue - totalInvested);
  const inflationAdjustedValue = finalRow?.inflationAdjustedBalance || p;

  return {
    totalInvested,
    totalInterest,
    maturityValue,
    inflationAdjustedValue,
    yearlyBreakdown,
  };
}

/**
 * Calculates Systematic Investment Plan (SIP) Future Value with optional annual step-up.
 * Formula (without step-up): FV = P * [((1 + i)^n - 1) / i] * (1 + i)
 */
export function calculateSip(
  monthlyInvestment: number,
  annualReturnPercent: number,
  durationYears: number,
  compoundingFreq: CompoundingFrequency = "monthly",
  stepUpPercent: number = 0,
  inflationPercent: number = 0,
): InvestmentResult {
  const baseMonthly = Math.max(0, monthlyInvestment);
  const annualRate = Math.max(0, annualReturnPercent) / 100;
  const totalYears = Math.max(1, durationYears);
  const stepUp = Math.max(0, stepUpPercent) / 100;
  const inflation = Math.max(0, inflationPercent) / 100;

  const monthlyRate = annualRate / 12;
  const yearlyBreakdown: YearlyProjectionRow[] = [];

  let currentBalance = 0;
  let cumulativeInvested = 0;
  let currentMonthlyContrib = baseMonthly;

  for (let year = 1; year <= totalYears; year++) {
    for (let month = 1; month <= 12; month++) {
      cumulativeInvested += currentMonthlyContrib;
      // Add monthly investment at start of period and compound
      currentBalance = (currentBalance + currentMonthlyContrib) * (1 + monthlyRate);
    }

    const inflationAdjusted = currentBalance / Math.pow(1 + inflation, year);

    yearlyBreakdown.push({
      year,
      investedAmount: Math.round(cumulativeInvested * 100) / 100,
      interestEarned: Math.round(Math.max(0, currentBalance - cumulativeInvested) * 100) / 100,
      totalBalance: Math.round(currentBalance * 100) / 100,
      inflationAdjustedBalance: Math.round(inflationAdjusted * 100) / 100,
    });

    // Apply annual step-up contribution increase if enabled
    if (stepUp > 0) {
      currentMonthlyContrib = currentMonthlyContrib * (1 + stepUp);
    }
  }

  const finalRow = yearlyBreakdown[yearlyBreakdown.length - 1];
  const maturityValue = finalRow?.totalBalance || 0;
  const totalInvested = Math.round(cumulativeInvested * 100) / 100;
  const totalInterest = Math.round(Math.max(0, maturityValue - totalInvested) * 100) / 100;
  const inflationAdjustedValue = finalRow?.inflationAdjustedBalance || 0;

  return {
    totalInvested,
    totalInterest,
    maturityValue,
    inflationAdjustedValue,
    yearlyBreakdown,
  };
}

/**
 * Calculates required monthly SIP to achieve a goal target amount given expected return and timeline.
 */
export function calculateGoalInvestment(
  targetAmount: number,
  currentSaved: number,
  durationYears: number,
  annualReturnPercent: number,
  inflationPercent: number = 0,
): InvestmentResult {
  const target = Math.max(0, targetAmount);
  const saved = Math.max(0, currentSaved);
  const years = Math.max(0.1, durationYears);
  const annualRate = Math.max(0, annualReturnPercent) / 100;
  const inflation = Math.max(0, inflationPercent) / 100;

  // Inflation-adjusted target if inflation discount is applied
  const adjustedTarget = target * Math.pow(1 + inflation, years);

  // Future value of existing saved balance
  const monthlyRate = annualRate / 12;
  const totalMonths = Math.ceil(years * 12);
  const futureSavedValue = saved * Math.pow(1 + monthlyRate, totalMonths);

  const remainingTargetToFund = Math.max(0, adjustedTarget - futureSavedValue);

  // Formula for required monthly SIP:
  // PMT = RemainingTarget / [ (((1 + i)^n - 1) / i) * (1 + i) ]
  let requiredMonthlySip = 0;
  if (remainingTargetToFund > 0) {
    if (monthlyRate > 0) {
      const factor =
        ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
        (1 + monthlyRate);
      requiredMonthlySip = remainingTargetToFund / factor;
    } else {
      requiredMonthlySip = remainingTargetToFund / totalMonths;
    }
  }

  const sipResult = calculateSip(
    requiredMonthlySip,
    annualReturnPercent,
    years,
    "monthly",
    0,
    inflationPercent,
  );

  return {
    ...sipResult,
    totalInvested: Math.round((saved + sipResult.totalInvested) * 100) / 100,
    monthlyInvestmentRequired: Math.round(requiredMonthlySip * 100) / 100,
  };
}
