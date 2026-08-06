<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { InvestmentMode, CompoundingFrequency, InvestmentResult } from "@/types/calculator";
import {
  calculateLumpSum,
  calculateSip,
  calculateGoalInvestment,
} from "@/utils/investmentMath";
import { useGoalStore } from "@/stores/useGoalStore";
import { useCalculators } from "@/composables/useCalculators";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  TrendingUp,
  LineChart as LineChartIcon,
  Percent,
  Calendar,
  Layers,
  Zap,
  Bookmark,
  CheckCircle,
  ShieldCheck,
  Target,
} from "lucide-vue-next";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
);

const props = defineProps<{
  initialGoalId?: string;
}>();

const goalStore = useGoalStore();
const { saveInvestmentScenario } = useCalculators();

const mode = ref<InvestmentMode>("sip");
const investmentAmount = ref<number>(1000000); // 1,000,000 IDR / $1000 default
const annualReturnPercent = ref<number>(12);
const durationYears = ref<number>(5);
const compoundingFreq = ref<CompoundingFrequency>("monthly");
const isStepUpEnabled = ref<boolean>(false);
const stepUpPercent = ref<number>(10);

// Inflation adjustment toggle
const isInflationAdjusted = ref<boolean>(false);
const inflationPercent = ref<number>(5);

// Goal-based selection
const selectedGoalId = ref<string>(props.initialGoalId || "");
const scenarioTitle = ref<string>("");
const isSavedSuccess = ref<boolean>(false);

watch(
  () => props.initialGoalId,
  (newGoalId) => {
    if (newGoalId) {
      selectedGoalId.value = newGoalId;
      mode.value = "goal_based";
    }
  },
  { immediate: true },
);

// Pre-fill goal details when goal changes
const selectedGoal = computed(() => {
  if (!selectedGoalId.value) return null;
  return goalStore.getGoalById(selectedGoalId.value);
});

// Perform instant client-side calculation
const calculationResult = computed<InvestmentResult>(() => {
  const inflationRate = isInflationAdjusted.value ? inflationPercent.value : 0;

  if (mode.value === "lumpsum") {
    return calculateLumpSum(
      investmentAmount.value,
      annualReturnPercent.value,
      durationYears.value,
      compoundingFreq.value,
      inflationRate,
    );
  } else if (mode.value === "sip") {
    const stepUp = isStepUpEnabled.value ? stepUpPercent.value : 0;
    return calculateSip(
      investmentAmount.value,
      annualReturnPercent.value,
      durationYears.value,
      compoundingFreq.value,
      stepUp,
      inflationRate,
    );
  } else {
    // Goal-based
    const target = selectedGoal.value ? selectedGoal.value.targetAmount : 100000000;
    const saved = selectedGoal.value ? selectedGoal.value.currentSaved : 0;
    let years = 5;

    if (selectedGoal.value?.deadline) {
      const now = new Date();
      const targetDate = new Date(selectedGoal.value.deadline);
      const diffTime = targetDate.getTime() - now.getTime();
      years = Math.max(0.2, Math.round((diffTime / (1000 * 60 * 60 * 24 * 365)) * 10) / 10);
    } else {
      years = durationYears.value;
    }

    return calculateGoalInvestment(
      target,
      saved,
      years,
      annualReturnPercent.value,
      inflationRate,
    );
  }
});

// Vue Chart.js configuration
const chartData = computed(() => {
  const breakdown = calculationResult.value.yearlyBreakdown;
  const labels = breakdown.map((row) => `Year ${row.year}`);
  const investedData = breakdown.map((row) => row.investedAmount);
  const balanceData = breakdown.map((row) =>
    isInflationAdjusted.value ? row.inflationAdjustedBalance : row.totalBalance,
  );

  return {
    labels,
    datasets: [
      {
        label: "Total Invested",
        data: investedData,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: isInflationAdjusted.value
          ? "Inflation-Adjusted Value"
          : "Projected Maturity Value",
        data: balanceData,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };
});

const chartOptions = computed(() => {
  const isLight = typeof document !== "undefined" && document.documentElement.classList.contains("light");
  const textColor = isLight ? "#475569" : "#94a3b8";

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: textColor, font: { weight: 600 } },
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            ` ${context.dataset.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: textColor }, grid: { display: false } },
      y: {
        ticks: {
          color: textColor,
          callback: (val: any) => formatCurrency(Number(val)),
        },
        grid: { color: isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.08)" },
      },
    },
  };
});

const handleSaveScenario = async () => {
  const title =
    scenarioTitle.value.trim() ||
    `${mode.value.toUpperCase()} Scenario - ${formatCurrency(calculationResult.value.maturityValue)}`;
  try {
    await saveInvestmentScenario(
      title,
      mode.value,
      {
        investmentAmount: investmentAmount.value,
        annualReturnPercent: annualReturnPercent.value,
        durationYears: durationYears.value,
        compoundingFreq: compoundingFreq.value,
        isStepUpEnabled: isStepUpEnabled.value,
        stepUpPercent: stepUpPercent.value,
        isInflationAdjusted: isInflationAdjusted.value,
        inflationPercent: inflationPercent.value,
      },
      calculationResult.value,
    );
    isSavedSuccess.value = true;
    setTimeout(() => {
      isSavedSuccess.value = false;
    }, 3000);
  } catch (err: any) {
    alert(err.message || "Failed to save scenario");
  }
};
</script>

<template>
  <div class="investment-calculator">
    <!-- Mode Selector Tabs -->
    <div class="mode-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: mode === 'sip' }"
        @click="mode = 'sip'"
      >
        <TrendingUp :size="16" /> SIP Calculator
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: mode === 'lumpsum' }"
        @click="mode = 'lumpsum'"
      >
        <Layers :size="16" /> Lump Sum
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: mode === 'goal_based' }"
        @click="mode = 'goal_based'"
      >
        <Target :size="16" /> Goal-Based Investment
      </button>
    </div>

    <div class="calc-layout-grid">
      <!-- Left Controls Panel -->
      <div class="calc-controls glass-panel">
        <h3 class="panel-title">Calculator Parameters</h3>

        <!-- Goal Selection (Goal-Based Mode) -->
        <div v-if="mode === 'goal_based'" class="form-group">
          <label for="goal-select">Select Active Goal</label>
          <select id="goal-select" v-model="selectedGoalId" class="form-select">
            <option value="">Custom Target Amount</option>
            <option
              v-for="g in goalStore.activeGoals"
              :key="g.id"
              :value="g.id"
            >
              {{ g.name }} (Target: {{ formatCurrency(g.targetAmount) }})
            </option>
          </select>
        </div>

        <!-- Investment Amount (SIP / Lump Sum) -->
        <div v-if="mode !== 'goal_based'" class="form-group">
          <label for="inv-amount">
            {{ mode === 'sip' ? 'Monthly SIP Amount' : 'One-Time Lump Sum' }}
          </label>
          <input
            id="inv-amount"
            v-model.number="investmentAmount"
            type="number"
            min="1000"
            step="100000"
            class="form-input"
          />
        </div>

        <!-- Expected Return Rate -->
        <div class="form-group">
          <div class="label-row">
            <label for="return-rate">Expected Return Rate (%)</label>
            <span class="val-badge">{{ annualReturnPercent }}%</span>
          </div>
          <input
            id="return-rate"
            v-model.number="annualReturnPercent"
            type="range"
            min="1"
            max="30"
            step="0.5"
            class="range-slider"
          />
        </div>

        <!-- Duration Years -->
        <div class="form-group">
          <div class="label-row">
            <label for="duration">Investment Period (Years)</label>
            <span class="val-badge">{{ durationYears }} Years</span>
          </div>
          <input
            id="duration"
            v-model.number="durationYears"
            type="range"
            min="1"
            max="40"
            step="1"
            class="range-slider"
          />
        </div>

        <!-- Compounding Frequency -->
        <div class="form-group">
          <label for="compound-freq">Compounding Frequency</label>
          <select id="compound-freq" v-model="compoundingFreq" class="form-select">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>

        <!-- Step-up Toggle (SIP Mode only) -->
        <div v-if="mode === 'sip'" class="toggle-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="isStepUpEnabled" />
            <span>Annual Step-up Contribution (%)</span>
          </label>
          <div v-if="isStepUpEnabled" class="stepup-input">
            <input
              v-model.number="stepUpPercent"
              type="number"
              min="1"
              max="50"
              class="form-input mini-input"
            />
            <span class="unit">% per year</span>
          </div>
        </div>

        <!-- Inflation Adjustment Toggle -->
        <div class="toggle-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="isInflationAdjusted" />
            <span>Discount for Inflation</span>
          </label>
          <div v-if="isInflationAdjusted" class="stepup-input">
            <input
              v-model.number="inflationPercent"
              type="number"
              min="1"
              max="20"
              class="form-input mini-input"
            />
            <span class="unit">% annual inflation</span>
          </div>
        </div>

        <!-- Save Scenario Controls -->
        <div class="save-scenario-box">
          <input
            v-model="scenarioTitle"
            type="text"
            placeholder="Scenario title (e.g. Mutual Fund 12%)"
            class="form-input"
          />
          <button
            type="button"
            class="btn btn-primary btn-save"
            @click="handleSaveScenario"
          >
            <Bookmark :size="16" /> Save Scenario
          </button>
          <span v-if="isSavedSuccess" class="saved-msg">
            <CheckCircle :size="14" /> Saved!
          </span>
        </div>
      </div>

      <!-- Right Results Output & Charts -->
      <div class="calc-results">
        <!-- Goal-Based Special Required Banner -->
        <div v-if="mode === 'goal_based'" class="goal-req-card glass-panel">
          <div class="req-title">Required Monthly Investment</div>
          <div class="req-val text-success">
            {{ formatCurrency(calculationResult.monthlyInvestmentRequired || 0) }} / month
          </div>
          <p class="req-sub">
            To reach target maturity of {{ formatCurrency(calculationResult.maturityValue) }} in
            {{ durationYears }} years at {{ annualReturnPercent }}% return.
          </p>
        </div>

        <!-- Summary KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card glass-panel">
            <span class="kpi-label">Total Investment</span>
            <span class="kpi-val">{{ formatCurrency(calculationResult.totalInvested) }}</span>
          </div>
          <div class="kpi-card glass-panel">
            <span class="kpi-label">Total Interest Earned</span>
            <span class="kpi-val text-success">+{{ formatCurrency(calculationResult.totalInterest) }}</span>
          </div>
          <div class="kpi-card glass-panel highlight">
            <span class="kpi-label">Projected Future Value</span>
            <span class="kpi-val">{{ formatCurrency(calculationResult.maturityValue) }}</span>
          </div>
          <div v-if="isInflationAdjusted" class="kpi-card glass-panel real-val">
            <span class="kpi-label">Real Value (Inflation Adjusted)</span>
            <span class="kpi-val">{{ formatCurrency(calculationResult.inflationAdjustedValue) }}</span>
          </div>
        </div>

        <!-- Growth Line Chart -->
        <div class="chart-box glass-panel">
          <h4 class="chart-title">Wealth Growth Projection</h4>
          <div class="chart-container">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Year-by-Year Breakdown Table -->
        <div class="table-box glass-panel">
          <h4 class="table-title">Year-by-Year Schedule</h4>
          <div class="table-wrapper">
            <table class="projection-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Invested</th>
                  <th>Interest</th>
                  <th>Total Balance</th>
                  <th v-if="isInflationAdjusted">Real Power (5%)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in calculationResult.yearlyBreakdown" :key="row.year">
                  <td>Year {{ row.year }}</td>
                  <td>{{ formatCurrency(row.investedAmount) }}</td>
                  <td class="text-success">+{{ formatCurrency(row.interestEarned) }}</td>
                  <td class="font-bold">{{ formatCurrency(row.totalBalance) }}</td>
                  <td v-if="isInflationAdjusted" class="text-muted">
                    {{ formatCurrency(row.inflationAdjustedBalance) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.investment-calculator {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mode-tabs {
  display: flex;
  gap: 10px;
  background: var(--bg-card);
  padding: 6px;
  border-radius: var(--radius-lg);
  border: var(--glass-border);
}

.tab-btn {
  flex: 1;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.calc-layout-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .calc-layout-grid {
    grid-template-columns: 1fr;
  }
}

.calc-controls {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.val-badge {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--accent-primary);
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.88rem;
}

.range-slider {
  accent-color: var(--accent-primary);
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: var(--glass-border);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
}

.stepup-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-input {
  width: 80px;
}

.unit {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.save-scenario-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding-top: 14px;
  border-top: var(--glass-border);
}

.btn-save {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.saved-msg {
  font-size: 0.75rem;
  color: var(--accent-success);
  display: flex;
  align-items: center;
  gap: 4px;
}

.calc-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.goal-req-card {
  padding: 20px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12));
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.req-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

.req-val {
  font-size: 1.8rem;
  font-weight: 900;
  margin: 4px 0;
}

.req-sub {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.kpi-card {
  padding: 16px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-card.highlight {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.08);
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.kpi-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}

.text-success {
  color: var(--accent-success);
}

.chart-box,
.table-box {
  padding: 20px;
  border-radius: var(--radius-lg);
}

.chart-title,
.table-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.chart-container {
  height: 280px;
}

.table-wrapper {
  overflow-x: auto;
}

.projection-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  text-align: left;
}

.projection-table th {
  padding: 10px 12px;
  color: var(--text-muted);
  border-bottom: var(--glass-border);
  font-weight: 700;
}

.projection-table td {
  padding: 10px 12px;
  border-bottom: var(--glass-border);
  color: var(--text-primary);
}

.font-bold {
  font-weight: 700;
}
</style>
