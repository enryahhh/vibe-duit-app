/**
 * Compounding frequency options.
 */
export type CompoundingFrequency = 'monthly' | 'quarterly' | 'annually';

/**
 * Modes for the investment calculator.
 */
export type InvestmentMode = 'lumpsum' | 'sip' | 'goal_based';

/**
 * Single year row in projection breakdown table.
 */
export interface YearlyProjectionRow {
  year: number;
  investedAmount: number;
  interestEarned: number;
  totalBalance: number;
  inflationAdjustedBalance: number;
}

/**
 * Calculation result for Lump Sum or SIP investment.
 */
export interface InvestmentResult {
  totalInvested: number;
  totalInterest: number;
  maturityValue: number;
  inflationAdjustedValue: number;
  monthlyInvestmentRequired?: number;
  yearlyBreakdown: YearlyProjectionRow[];
}

/**
 * Itemized cost entry for business start-up calculator.
 */
export interface BusinessCostItem {
  id: string;
  name: string;
  amount: number;
}

/**
 * Input parameters for Business Start-Up Calculator.
 */
export interface BusinessStartUpParams {
  scenarioName: string;
  oneTimeCosts: BusinessCostItem[];
  monthlyFixedCosts: BusinessCostItem[];
  variableCostPercentage: number; // e.g. 30% of revenue
  revenueMode: 'direct' | 'unit_based';
  monthlyRevenue: number;
  pricePerUnit: number;
  unitsSoldPerMonth: number;
  monthsUntilRevenue: number; // ramp-up delay
}

/**
 * Monthly cash flow row in business profitability timeline.
 */
export interface MonthlyBusinessCashFlow {
  month: number;
  revenue: number;
  fixedCosts: number;
  variableCosts: number;
  netProfit: number;
  cumulativeProfit: number;
}

/**
 * Financial calculation results for Business Start-Up.
 */
export interface BusinessStartUpResult {
  totalOneTimeCosts: number;
  totalMonthlyFixedCosts: number;
  monthlyBurnRate: number;
  effectiveMonthlyRevenue: number;
  monthlyVariableCosts: number;
  monthlyNetProfit: number;
  totalCapitalRequired: number;
  breakEvenMonth: number | null; // null if net profit <= 0
  paybackPeriodMonths: number | null;
  monthlyTimeline: MonthlyBusinessCashFlow[];
}

/**
 * Saved business scenario document.
 */
export interface SavedBusinessScenario {
  id: string;
  userId: string;
  params: BusinessStartUpParams;
  createdAt: string;
  updatedAt: string;
}

/**
 * Saved investment scenario document.
 */
export interface SavedInvestmentScenario {
  id: string;
  userId: string;
  title: string;
  mode: InvestmentMode;
  params: Record<string, any>;
  result: InvestmentResult;
  createdAt: string;
  updatedAt: string;
}

/**
 * Manual Investment Holding record.
 */
export interface InvestmentHolding {
  id: string;
  name: string; // e.g. "Simas Saham Maksima"
  category: 'mutual_fund' | 'stock' | 'crypto' | 'bond' | 'other';
  units: number;
  purchasePricePerUnit: number;
  currentNavPerUnit: number; // manual NAV / market price
  purchaseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Portfolio summary metrics.
 */
export interface PortfolioSummary {
  totalCost: number;
  currentValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
}
