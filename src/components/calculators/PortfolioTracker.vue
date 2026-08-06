<script setup lang="ts">
import { ref } from "vue";
import type { InvestmentHolding } from "@/types/calculator";
import { usePortfolio } from "@/composables/usePortfolio";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Wallet,
  TrendingUp,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  PieChart,
  RefreshCw,
} from "lucide-vue-next";

const { holdings, portfolioSummary, addHolding, updateHoldingNav, deleteHolding } =
  usePortfolio();

const isAddModalOpen = ref(false);
const isEditNavModalOpen = ref(false);
const selectedHolding = ref<InvestmentHolding | null>(null);

// Form state
const name = ref("");
const category = ref<InvestmentHolding["category"]>("mutual_fund");
const units = ref<number | "">("");
const purchasePricePerUnit = ref<number | "">("");
const currentNavPerUnit = ref<number | "">("");
const purchaseDate = ref(new Date().toISOString().slice(0, 10));
const notes = ref("");

// NAV edit state
const newNavPrice = ref<number | "">("");

const resetForm = () => {
  name.value = "";
  category.value = "mutual_fund";
  units.value = "";
  purchasePricePerUnit.value = "";
  currentNavPerUnit.value = "";
  purchaseDate.value = new Date().toISOString().slice(0, 10);
  notes.value = "";
};

const handleAddSubmit = async () => {
  if (!name.value || !units.value || !purchasePricePerUnit.value) {
    alert("Please fill in required holding fields");
    return;
  }
  try {
    await addHolding({
      name: name.value.trim(),
      category: category.value,
      units: Number(units.value),
      purchasePricePerUnit: Number(purchasePricePerUnit.value),
      currentNavPerUnit: currentNavPerUnit.value
        ? Number(currentNavPerUnit.value)
        : Number(purchasePricePerUnit.value),
      purchaseDate: purchaseDate.value,
      notes: notes.value.trim() || undefined,
    });
    isAddModalOpen.value = false;
    resetForm();
  } catch (err: any) {
    alert(err.message || "Failed to add holding");
  }
};

const openEditNav = (holding: InvestmentHolding) => {
  selectedHolding.value = holding;
  newNavPrice.value = holding.currentNavPerUnit;
  isEditNavModalOpen.value = true;
};

const handleUpdateNavSubmit = async () => {
  if (!selectedHolding.value || newNavPrice.value === "") return;
  try {
    await updateHoldingNav(selectedHolding.value.id, Number(newNavPrice.value));
    isEditNavModalOpen.value = false;
  } catch (err: any) {
    alert(err.message || "Failed to update NAV price");
  }
};

const handleDeleteHolding = async (id: string) => {
  if (confirm("Are you sure you want to remove this investment holding?")) {
    try {
      await deleteHolding(id);
    } catch (err: any) {
      alert(err.message || "Failed to delete holding");
    }
  }
};
</script>

<template>
  <div class="portfolio-tracker">
    <!-- Header Banner & Action Button -->
    <div class="portfolio-header">
      <div>
        <h3 class="title">Mutual Fund & Investment Portfolio</h3>
        <p class="subtitle">
          Record-keeping tracker for mutual funds, stocks, and crypto assets.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-primary"
        @click="
          resetForm();
          isAddModalOpen = true;
        "
      >
        <PlusCircle :size="16" /> Log Investment Holding
      </button>
    </div>

    <!-- Portfolio Summary KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card glass-panel">
        <span class="kpi-label">Total Invested Cost</span>
        <span class="kpi-val">{{ formatCurrency(portfolioSummary.totalCost) }}</span>
      </div>

      <div class="kpi-card glass-panel">
        <span class="kpi-label">Current Market Value</span>
        <span class="kpi-val">{{ formatCurrency(portfolioSummary.currentValue) }}</span>
      </div>

      <div
        class="kpi-card glass-panel"
        :class="
          portfolioSummary.unrealizedGainLoss >= 0 ? 'gain-bg' : 'loss-bg'
        "
      >
        <span class="kpi-label">Unrealized Gain / Loss</span>
        <span
          class="kpi-val"
          :class="
            portfolioSummary.unrealizedGainLoss >= 0
              ? 'text-success'
              : 'text-danger'
          "
        >
          {{ portfolioSummary.unrealizedGainLoss >= 0 ? '+' : ''
          }}{{ formatCurrency(portfolioSummary.unrealizedGainLoss) }}
          <span class="pct-sub"
            >({{ portfolioSummary.unrealizedGainLossPercentage }}%)</span
          >
        </span>
      </div>
    </div>

    <!-- Holdings List Table -->
    <div class="holdings-box glass-panel">
      <h4 class="box-title">Logged Investment Holdings</h4>

      <div v-if="holdings.length > 0" class="table-wrapper">
        <table class="holdings-table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Units</th>
              <th>Purchase Price</th>
              <th>Current NAV / Price</th>
              <th>Cost Basis</th>
              <th>Current Value</th>
              <th>Gain / Loss</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in holdings" :key="h.id">
              <td class="font-bold">{{ h.name }}</td>
              <td>
                <span class="category-badge">{{ h.category.replace('_', ' ') }}</span>
              </td>
              <td>{{ h.units.toLocaleString() }}</td>
              <td>{{ formatCurrency(h.purchasePricePerUnit) }}</td>
              <td class="nav-cell">
                <span>{{ formatCurrency(h.currentNavPerUnit) }}</span>
                <button
                  type="button"
                  class="btn-edit-nav"
                  title="Update Current NAV"
                  @click="openEditNav(h)"
                >
                  <RefreshCw :size="12" />
                </button>
              </td>
              <td>{{ formatCurrency(h.units * h.purchasePricePerUnit) }}</td>
              <td class="font-bold">{{ formatCurrency(h.units * h.currentNavPerUnit) }}</td>
              <td>
                <span
                  :class="
                    h.units * h.currentNavPerUnit >= h.units * h.purchasePricePerUnit
                      ? 'text-success'
                      : 'text-danger'
                  "
                >
                  {{
                    h.units * h.currentNavPerUnit >= h.units * h.purchasePricePerUnit
                      ? '+'
                      : ''
                  }}
                  {{
                    formatCurrency(
                      h.units * h.currentNavPerUnit - h.units * h.purchasePricePerUnit,
                    )
                  }}
                </span>
              </td>
              <td class="text-right">
                <button
                  type="button"
                  class="btn-action-del"
                  title="Delete Holding"
                  @click="handleDeleteHolding(h.id)"
                >
                  <Trash2 :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-holdings">
        <p>No investment holdings logged yet. Click <strong>"Log Investment Holding"</strong> to add mutual funds, stocks, or assets.</p>
      </div>
    </div>

    <!-- Add Holding Modal -->
    <div v-if="isAddModalOpen" class="modal-overlay" @click.self="isAddModalOpen = false">
      <div class="modal-card glass-panel">
        <div class="modal-header">
          <h2>Log Investment Holding</h2>
          <button type="button" class="btn-close" @click="isAddModalOpen = false">
            <X :size="20" />
          </button>
        </div>

        <form @submit.prevent="handleAddSubmit" class="modal-body">
          <div class="form-group">
            <label for="asset-name">Asset / Mutual Fund Name *</label>
            <input
              id="asset-name"
              v-model="name"
              type="text"
              class="form-input"
              placeholder="e.g. Simas Saham Maksima"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="asset-cat">Category *</label>
              <select id="asset-cat" v-model="category" class="form-select">
                <option value="mutual_fund">Mutual Fund</option>
                <option value="stock">Stock</option>
                <option value="crypto">Crypto</option>
                <option value="bond">Bond / Sukuk</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label for="asset-date">Purchase Date *</label>
              <input
                id="asset-date"
                v-model="purchaseDate"
                type="date"
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="asset-units">Units Owned *</label>
              <input
                id="asset-units"
                v-model.number="units"
                type="number"
                step="any"
                min="0.0001"
                class="form-input"
                placeholder="100"
                required
              />
            </div>
            <div class="form-group flex-1">
              <label for="asset-price">Purchase Price / Unit *</label>
              <input
                id="asset-price"
                v-model.number="purchasePricePerUnit"
                type="number"
                step="any"
                min="0.01"
                class="form-input"
                placeholder="1500"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="asset-nav">Current NAV / Unit (Optional)</label>
            <input
              id="asset-nav"
              v-model.number="currentNavPerUnit"
              type="number"
              step="any"
              min="0.01"
              class="form-input"
              placeholder="Defaults to purchase price if blank"
            />
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="isAddModalOpen = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Save Holding
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit NAV Modal -->
    <div
      v-if="isEditNavModalOpen && selectedHolding"
      class="modal-overlay"
      @click.self="isEditNavModalOpen = false"
    >
      <div class="modal-card mini-modal glass-panel">
        <div class="modal-header">
          <h2>Update Current NAV / Price</h2>
          <button type="button" class="btn-close" @click="isEditNavModalOpen = false">
            <X :size="20" />
          </button>
        </div>

        <form @submit.prevent="handleUpdateNavSubmit" class="modal-body">
          <p class="asset-subname">{{ selectedHolding.name }}</p>
          <div class="form-group">
            <label for="nav-input">New Current NAV / Price per Unit *</label>
            <input
              id="nav-input"
              v-model.number="newNavPrice"
              type="number"
              step="any"
              min="0.01"
              class="form-input"
              required
            />
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="isEditNavModalOpen = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Update NAV
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portfolio-tracker {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.portfolio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.subtitle {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.kpi-card {
  padding: 16px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.kpi-val {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--text-primary);
}

.pct-sub {
  font-size: 0.85rem;
  font-weight: 700;
  margin-left: 4px;
}

.gain-bg {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
}

.loss-bg {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
}

.text-success {
  color: var(--accent-success);
}

.text-danger {
  color: var(--accent-danger);
}

.holdings-box {
  padding: 20px;
  border-radius: var(--radius-lg);
}

.box-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.table-wrapper {
  overflow-x: auto;
}

.holdings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  text-align: left;
}

.holdings-table th {
  padding: 10px 12px;
  color: var(--text-muted);
  border-bottom: var(--glass-border);
  font-weight: 700;
}

.holdings-table td {
  padding: 12px;
  border-bottom: var(--glass-border);
  color: var(--text-primary);
}

.category-badge {
  text-transform: capitalize;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent-primary);
  font-weight: 700;
}

.nav-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-edit-nav {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.btn-edit-nav:hover {
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.15);
}

.btn-action-del {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.btn-action-del:hover {
  color: #f87171;
}

.text-right {
  text-align: right;
}

.font-bold {
  font-weight: 700;
}

.empty-holdings {
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.88rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  border-radius: var(--radius-xl);
  background: var(--bg-secondary);
  border: var(--glass-border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.mini-modal {
  max-width: 380px;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.asset-subname {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--accent-primary);
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
  background: var(--bg-card);
  border: var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.88rem;
}

.form-row {
  display: flex;
  gap: 10px;
}

.flex-1 {
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>
