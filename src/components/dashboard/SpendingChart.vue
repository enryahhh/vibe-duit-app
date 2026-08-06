<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatCurrency } from '@/utils/formatCurrency';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const props = defineProps<{
  categoriesData: Record<string, { name: string; amount: number; color?: string }>;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const hasData = computed(() => {
  return Object.keys(props.categoriesData).length > 0;
});

const defaultColors = [
  '#f59e0b', '#3b82f6', '#ec4899', '#ef4444',
  '#8b5cf6', '#14b8a6', '#10b981', '#6b7280',
];

const renderChart = () => {
  if (!canvasRef.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const entries = Object.values(props.categoriesData);
  if (entries.length === 0) return;

  const labels = entries.map((e) => e.name);
  const data = entries.map((e) => e.amount);
  const bgColors = entries.map((e, idx) => e.color || defaultColors[idx % defaultColors.length]);

  chartInstance = new Chart(canvasRef.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#1e293b',
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: {
              size: 13,
              family: 'Inter, sans-serif',
            },
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const val = (context.parsed as number) || 0;
              return ` ${label}: ${formatCurrency(val, 'IDR')}`;
            },
          },
        },
      },
      cutout: '70%',
    },
  });
};

onMounted(() => {
  renderChart();
});

watch(
  () => props.categoriesData,
  () => {
    renderChart();
  },
  { deep: true }
);
</script>

<template>
  <div class="chart-container glass-panel">
    <div class="chart-header">
      <h3 class="chart-title">Spending by Category (This Month)</h3>
    </div>

    <div v-if="hasData" class="chart-wrapper">
      <canvas ref="canvasRef"></canvas>
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
}

.empty-chart {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
