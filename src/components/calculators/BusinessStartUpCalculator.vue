<script setup lang="ts">
import { ref, computed } from "vue";
import type {
  BusinessCostItem,
  BusinessStartUpParams,
  BusinessStartUpResult,
  SavedBusinessScenario,
} from "@/types/calculator";
import { calculateBusinessStartUp } from "@/utils/businessMath";
import { useCalculators } from "@/composables/useCalculators";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Building2,
  Plus,
  Trash2,
  Bookmark,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Scale,
  Sparkles,
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

const { businessScenarios, saveBusinessScenario, deleteBusinessScenario } =
  useCalculators();

const scenarioName = ref<string>("Coffee Shop Base Case");
const oneTimeCosts = ref<BusinessCostItem[]>([
  { id: "1", name: "Equipment & Machines", amount: 25000000 },
  { id: "2", name: "Licenses & Permits", amount: 5000000 },
  { id: "3", name: "Renovation & Furniture", amount: 15000000 },
]);

const monthlyFixedCosts = ref<BusinessCostItem[]>([
  { id: "1", name: "Shop Rent", amount: 4000000 },
  { id: "2", name: "Staff Salaries", amount: 7000000 },
  { id: "3", name: "Utilities & Wifi", amount: 1500000 },
]);

const variableCostPercentage = ref<number>(25); // 25% COGS / raw materials
const revenueMode = ref<"direct" | "unit_based">("direct");
const monthlyRevenue = ref<number>(22000000);
const pricePerUnit = ref<number>(30000);
const unitsSoldPerMonth = ref<number>(750);
const monthsUntilRevenue = ref<number>(1);

const isSavedSuccess = ref<boolean>(false);
const comparingScenario = ref<SavedBusinessScenario | null>(null);

// Itemized cost handlers
const addOneTimeCost = () => {
  oneTimeCosts.value.push({
    id: Date.now().toString(),
    name: "",
    amount: 0,
  });
};

const removeOneTimeCost = (index: number) => {
  oneTimeCosts.value.splice(index, 1);
};

const addFixedCost = () => {
  monthlyFixedCosts.value.push({
    id: Date.now().toString(),
    name: "",
    amount: 0,
  });
};

const removeFixedCost = (index: number) => {
  monthlyFixedCosts.value.splice(index, 1);
};

const currentParams = computed<BusinessStartUpParams>(() => ({
  scenarioName: scenarioName.value,
  oneTimeCosts: oneTimeCosts.value,
  monthlyFixedCosts: monthlyFixedCosts.value,
  variableCostPercentage: variableCostPercentage.value,
  revenueMode: revenueMode.value,
  monthlyRevenue: monthlyRevenue.value,
  pricePerUnit: pricePerUnit.value,
  unitsSoldPerMonth: unitsSoldPerMonth.value,
  monthsUntilRevenue: monthsUntilRevenue.value,
}));

const result = computed<BusinessStartUpResult>(() => {
  return calculateBusinessStartUp(currentParams.value);
});

// Comparison result if comparing scenario is selected
const comparisonResult = computed<BusinessStartUpResult | null>(() => {
  if (!comparingScenario.value) return null;
  return calculateBusinessStartUp(comparingScenario.value.params);
});

// Chart.js data for Cumulative Profitability
const chartData = computed(() => {
  const timeline = result.value.monthlyTimeline;
  const labels = timeline.map((t) => `Month ${t.month}`);
  const netProfitData = timeline.map((t) => t.netProfit);
  const cumulativeProfitData = timeline.map((t) => t.cumulativeProfit);

  const datasets: any[] = [
    {
      label: "Cumulative Net Profit",
      data: cumulativeProfitData,
      borderColor: "#10b981",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      tension: 0.3,
      fill: true,
    },
    {
      label: "Monthly Net Profit",
      data: netProfitData,
      borderColor: "#6366f1",
      borderDash: [5, 5],
      tension: 0.3,
      fill: false,
    },
  ];

  if (comparisonResult.value) {
    const compCumulative = comparisonResult.value.monthlyTimeline.map(
      (t) => t.cumulativeProfit,
    );
    datasets.push({
      label: `Compared: ${comparingScenario.value?.params.scenarioName}`,
      data: compCumulative,
      borderColor: "#f59e0b",
      tension: 0.3,
      fill: false,
    });
  }

  return { labels, datasets };
});

const chartOptions = computed(() => {
  const isLight =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");
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
        grid: {
          color: isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.08)",
        },
      },
    },
  };
});

const handleSaveScenario = async () => {
  if (!scenarioName.value.trim()) {
    alert("Please enter a scenario title");
    return;
  }
  try {
    await saveBusinessScenario(currentParams.value);
    isSavedSuccess.value = true;
    setTimeout(() => {
      isSavedSuccess.value = false;
    }, 3000);
  } catch (err: any) {
    alert(err.message || "Failed to save business scenario");
  }
};

const handleSelectScenarioToLoad = (scen: SavedBusinessScenario) => {
  scenarioName.value = scen.params.scenarioName;
  oneTimeCosts.value = JSON.parse(JSON.stringify(scen.params.oneTimeCosts || []));
  monthlyFixedCosts.value = JSON.parse(
    JSON.stringify(scen.params.monthlyFixedCosts || []),
  );
  variableCostPercentage.value = scen.params.variableCostPercentage;
  revenueMode.value = scen.params.revenueMode;
  monthlyRevenue.value = scen.params.monthlyRevenue;
  pricePerUnit.value = scen.params.pricePerUnit;
  unitsSoldPerMonth.value = scen.params.unitsSoldPerMonth;
  monthsUntilRevenue.value = scen.params.monthsUntilRevenue;
};
</script>

<template>
  <div class="business-calculator">
    <div class="biz-grid">
      <!-- Input Panel -->
      <div class="biz-inputs glass-panel">
        <h3 class="panel-title">Business Start-Up Parameters</h3>

        <!-- Scenario Title -->
        <div class="form-group">
          <label for="biz-title">Scenario Title</label>
          <input
            id="biz-title"
            v-model="scenarioName"
            type="text"
            class="form-input"
            placeholder="e.g. Coffee Shop - Base Case"
          />
        </div>

        <!-- 1. One-Time Initial Setup Costs -->
        <div class="section-box">
          <div class="box-header">
            <h4>One-Time Initial Setup Costs</h4>
            <button type="button" class="btn-add-item" @click="addOneTimeCost">
              <Plus :size="14" /> Add Item
            </button>
          </div>

          <div class="items-list">
            <div
              v-for="(item, idx) in oneTimeCosts"
              :key="item.id || idx"
              class="cost-item-row"
            >
              <input
                v-model="item.name"
                type="text"
                class="form-input item-name"
                placeholder="Item name (e.g. Equipment)"
              />
              <input
                v-model.number="item.amount"
                type="number"
                min="0"
                class="form-input item-val"
                placeholder="0"
              />
              <button
                type="button"
                class="btn-remove"
                @click="removeOneTimeCost(idx)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Monthly Fixed Costs -->
        <div class="section-box">
          <div class="box-header">
            <h4>Monthly Fixed Operating Costs</h4>
            <button type="button" class="btn-add-item" @click="addFixedCost">
              <Plus :size="14" /> Add Item
            </button>
          </div>

          <div class="items-list">
            <div
              v-for="(item, idx) in monthlyFixedCosts"
              :key="item.id || idx"
              class="cost-item-row"
            >
              <input
                v-model="item.name"
                type="text"
                class="form-input item-name"
                placeholder="Fixed cost (e.g. Rent)"
              />
              <input
                v-model.number="item.amount"
                type="number"
                min="0"
                class="form-input item-val"
                placeholder="0"
              />
              <button
                type="button"
                class="btn-remove"
                @click="removeFixedCost(idx)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Variable Costs & Ramp-up -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Variable Costs (% of Revenue)</label>
            <input
              v-model.number="variableCostPercentage"
              type="number"
              min="0"
              max="90"
              class="form-input"
            />
          </div>
          <div class="form-group flex-1">
            <label>Ramp-Up (Months to 1st Revenue)</label>
            <input
              v-model.number="monthsUntilRevenue"
              type="number"
              min="0"
              max="24"
              class="form-input"
            />
          </div>
        </div>

        <!-- 4. Revenue Assumptions -->
        <div class="section-box">
          <h4>Revenue Assumptions</h4>
          <div class="mode-selector">
            <label class="radio-label">
              <input
                type="radio"
                value="direct"
                v-model="revenueMode"
              />
              Direct Monthly Revenue
            </label>
            <label class="radio-label">
              <input
                type="radio"
                value="unit_based"
                v-model="revenueMode"
              />
              Unit Price × Units Sold
            </label>
          </div>

          <div v-if="revenueMode === 'direct'" class="form-group margin-top">
            <label>Expected Average Monthly Revenue</label>
            <input
              v-model.number="monthlyRevenue"
              type="number"
              min="0"
              class="form-input"
            />
          </div>

          <div v-else class="form-row margin-top">
            <div class="form-group flex-1">
              <label>Price per Unit</label>
              <input
                v-model.number="pricePerUnit"
                type="number"
                min="0"
                class="form-input"
              />
            </div>
            <div class="form-group flex-1">
              <label>Units Sold / Month</label>
              <input
                v-model.number="unitsSoldPerMonth"
                type="number"
                min="0"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <!-- Save Scenario Button -->
        <div class="save-box">
          <button
            type="button"
            class="btn btn-primary btn-full"
            @click="handleSaveScenario"
          >
            <Bookmark :size="16" /> Save Business Scenario
          </button>
          <span v-if="isSavedSuccess" class="saved-msg">
            <CheckCircle :size="14" /> Business Scenario Saved!
          </span>
        </div>
      </div>

      <!-- Output & Results Panel -->
      <div class="biz-results">
        <!-- Key Metrics Banner -->
        <div class="metrics-grid">
          <div class="metric-card glass-panel highlight">
            <span class="m-label">Total Capital Required</span>
            <span class="m-val">{{ formatCurrency(result.totalCapitalRequired) }}</span>
            <span class="m-sub">Includes initial setup + ramp-up burn</span>
          </div>

          <div class="metric-card glass-panel">
            <span class="m-label">Monthly Burn Rate</span>
            <span class="m-val text-danger">{{ formatCurrency(result.monthlyBurnRate) }}</span>
            <span class="m-sub">Fixed ongoing monthly costs</span>
          </div>

          <div class="metric-card glass-panel">
            <span class="m-label">Monthly Net Profit</span>
            <span
              class="m-val"
              :class="result.monthlyNetProfit >= 0 ? 'text-success' : 'text-danger'"
            >
              {{ formatCurrency(result.monthlyNetProfit) }}
            </span>
            <span class="m-sub">Revenue minus fixed & variable costs</span>
          </div>

          <div class="metric-card glass-panel breakeven">
            <span class="m-label">Break-Even Point</span>
            <span v-if="result.breakEvenMonth" class="m-val text-success">
              Month {{ result.breakEvenMonth }}
            </span>
            <span v-else class="m-val text-danger">Unprofitable</span>
            <span class="m-sub">
              {{ result.paybackPeriodMonths ? `${result.paybackPeriodMonths} months post launch` : 'Revenue fails to cover costs' }}
            </span>
          </div>
        </div>

        <!-- Profitability Graph -->
        <div class="chart-box glass-panel">
          <div class="chart-header">
            <h4>36-Month Profitability & Break-Even Timeline</h4>
            <!-- Side-by-side comparison dropdown -->
            <div v-if="businessScenarios.length > 0" class="comp-dropdown-box">
              <label>Compare with:</label>
              <select
                :value="comparingScenario?.id || ''"
                @change="
                  comparingScenario =
                    businessScenarios.find(
                      (s) => s.id === ($event.target as HTMLSelectElement).value,
                    ) || null
                "
                class="form-select mini-select"
              >
                <option value="">None (Single view)</option>
                <option
                  v-for="s in businessScenarios"
                  :key="s.id"
                  :value="s.id"
                >
                  {{ s.params.scenarioName }}
                </option>
              </select>
            </div>
          </div>

          <div class="chart-container">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Saved Scenarios Drawer / List -->
        <div v-if="businessScenarios.length > 0" class="saved-scenarios-box glass-panel">
          <h4>Saved Scenarios ({{ businessScenarios.length }})</h4>
          <div class="scenarios-list">
            <div
              v-for="scen in businessScenarios"
              :key="scen.id"
              class="scen-card"
            >
              <div class="scen-info">
                <span class="scen-name">{{ scen.params.scenarioName }}</span>
                <span class="scen-detail">
                  Capital: {{ formatCurrency(calculateBusinessStartUp(scen.params).totalCapitalRequired) }} •
                  Break-Even: {{ calculateBusinessStartUp(scen.params).breakEvenMonth ? `Month ${calculateBusinessStartUp(scen.params).breakEvenMonth}` : 'N/A' }}
                </span>
              </div>
              <div class="scen-actions">
                <button
                  type="button"
                  class="btn-scen-load"
                  @click="handleSelectScenarioToLoad(scen)"
                >
                  Load
                </button>
                <button
                  type="button"
                  class="btn-scen-del"
                  @click="deleteBusinessScenario(scen.id)"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.business-calculator {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.biz-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
}

@media (max-width: 960px) {
  .biz-grid {
    grid-template-columns: 1fr;
  }
}

.biz-inputs {
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

.section-box {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: var(--radius-md);
  border: var(--glass-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-header h4,
.section-box h4 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.btn-add-item {
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: var(--accent-primary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cost-item-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name {
  flex: 1.5;
}

.item-val {
  flex: 1;
}

.btn-remove {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.btn-remove:hover {
  color: #f87171;
}

.form-row {
  display: flex;
  gap: 10px;
}

.flex-1 {
  flex: 1;
}

.mode-selector {
  display: flex;
  gap: 12px;
}

.radio-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.margin-top {
  margin-top: 6px;
}

.save-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-full {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.saved-msg {
  font-size: 0.78rem;
  color: var(--accent-success);
  display: flex;
  align-items: center;
  gap: 4px;
}

.biz-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.metric-card {
  padding: 16px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-card.highlight {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
  border-color: rgba(99, 102, 241, 0.4);
}

.metric-card.breakeven {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(52, 211, 153, 0.12));
  border-color: rgba(16, 185, 129, 0.3);
}

.m-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.m-val {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--text-primary);
}

.m-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.text-danger {
  color: var(--accent-danger);
}

.text-success {
  color: var(--accent-success);
}

.chart-box,
.saved-scenarios-box {
  padding: 20px;
  border-radius: var(--radius-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}

.chart-header h4,
.saved-scenarios-box h4 {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.comp-dropdown-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.mini-select {
  padding: 4px 8px;
}

.chart-container {
  height: 280px;
}

.scenarios-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.scen-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: var(--glass-border);
}

.scen-info {
  display: flex;
  flex-direction: column;
}

.scen-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.scen-detail {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.scen-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-scen-load {
  background: var(--accent-primary);
  color: #ffffff;
  border: none;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn-scen-del {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.btn-scen-del:hover {
  color: #f87171;
}
</style>
