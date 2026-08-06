<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { formatCurrency } from "@/utils/formatCurrency";

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  categoriesData: Record<string, { name: string; amount: number; color?: string }>;
}>();

const hasData = computed(() => {
  return Object.keys(props.categoriesData).length > 0;
});

const defaultColors = [
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#10b981",
  "#6b7280",
];

const chartData = computed<ChartData<"doughnut">>(() => {
  const entries = Object.values(props.categoriesData);
  const labels = entries.map((e) => e.name);
  const data = entries.map((e) => e.amount);
  const bgColors = entries.map(
    (e, idx) => e.color || defaultColors[idx % defaultColors.length],
  );

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: "rgba(30, 41, 59, 0.8)",
        hoverOffset: 6,
      },
    ],
  };
});

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: typeof window !== "undefined" && window.innerWidth < 640 ? "bottom" : "right",
      labels: {
        color: "#94a3b8",
        font: {
          size: 12,
          family: "Inter, sans-serif",
        },
        padding: 12,
      },
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || "";
          const val = (context.parsed as number) || 0;
          return ` ${label}: ${formatCurrency(val, "IDR")}`;
        },
      },
    },
  },
  cutout: "70%",
}));
</script>

<template>
  <div class="chart-container glass-panel">
    <div class="chart-header">
      <h3 class="chart-title">Spending by Category (This Month)</h3>
    </div>

    <div v-if="hasData" class="chart-wrapper">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="empty-chart">
      <p>No expense data recorded for this month yet.</p>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.chart-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-chart {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .chart-container {
    padding: 16px;
    min-height: 280px;
  }

  .chart-wrapper {
    min-height: 220px;
  }
}
</style>
