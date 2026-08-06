<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAuth } from '@/composables/useAuth';
import type { CreateTransactionDTO } from '@/types/transaction';
import TransactionFormModal from '@/components/transactions/TransactionFormModal.vue';
import { LayoutDashboard, Wallet, ReceiptText, Plus, ShieldCheck, LogOut, User as UserIcon, Sparkles } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const transactionStore = useTransactionStore();
const { user, isAuthenticated, isAnonymous, logout } = useAuth();

const isTxModalOpen = ref(false);
const isLoginRoute = computed(() => route.path === '/login');

const userDisplayName = computed(() => {
  if (!user.value) return 'Guest User';
  if (isAnonymous.value) return 'Guest User';
  return user.value.displayName || user.value.email || 'Member User';
});

const userInitial = computed(() => {
  const name = userDisplayName.value;
  return name.charAt(0).toUpperCase();
});

const handleAddTransaction = async (dto: CreateTransactionDTO) => {
  try {
    await transactionStore.addTransaction(dto);
  } catch (err: any) {
    alert(err.message || 'Failed to save transaction');
  }
};

const handleLogout = async () => {
  try {
    await logout();
    router.push('/login');
  } catch (err: any) {
    console.error('Logout error:', err);
  }
};
</script>

<template>
  <div class="app-layout">
    <!-- Render full layout for main app, or raw view for login page -->
    <template v-if="isLoginRoute">
      <router-view />
    </template>

    <template v-else>
      <header class="app-header glass-panel">
        <div class="header-container">
          <div class="brand">
            <div class="brand-logo">
              <Wallet :size="24" class="logo-icon" />
            </div>
            <div class="brand-text">
              <span class="brand-name">DUIT</span>
              <span class="brand-badge">PRO</span>
            </div>
          </div>

          <nav class="nav-links">
            <router-link to="/" class="nav-item">
              <LayoutDashboard :size="18" /> Dashboard
            </router-link>
            <router-link to="/accounts" class="nav-item">
              <Wallet :size="18" /> Accounts
            </router-link>
            <router-link to="/transactions" class="nav-item">
              <ReceiptText :size="18" /> History
            </router-link>
          </nav>

          <div class="header-actions">
            <button class="btn btn-primary" @click="isTxModalOpen = true">
              <Plus :size="18" /> Log Transaction
            </button>

            <div v-if="isAuthenticated" class="user-menu">
              <div class="user-info" :title="user?.email || 'Logged In'">
                <div class="avatar" :class="{ 'guest-avatar': isAnonymous }">
                  <Sparkles v-if="isAnonymous" :size="14" />
                  <span v-else>{{ userInitial }}</span>
                </div>
                <span class="user-name">{{ userDisplayName }}</span>
              </div>

              <button class="btn-logout" @click="handleLogout" title="Sign Out">
                <LogOut :size="18" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="main-content">
        <router-view />
      </main>

      <footer class="app-footer">
        <div class="footer-content">
          <span>DUIT Financial Tracker &copy; 2026</span>
          <span class="status-indicator">
            <ShieldCheck :size="14" /> Cloud Firestore Sync Active
          </span>
        </div>
      </footer>

      <TransactionFormModal
        :is-open="isTxModalOpen"
        @close="isTxModalOpen = false"
        @submit="handleAddTransaction"
      />
    </template>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 16px;
  z-index: 100;
  margin: 16px 24px 0 24px;
  border-radius: var(--radius-xl);
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.brand-name {
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  background: linear-gradient(90deg, #ffffff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 6px;
  background: rgba(99, 102, 241, 0.2);
  color: var(--accent-primary);
  border-radius: var(--radius-sm);
  margin-left: 4px;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.nav-item.router-link-active {
  color: var(--accent-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.guest-avatar {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
}

.user-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.main-content {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;
}

.app-footer {
  border-top: var(--glass-border);
  padding: 20px 24px;
  margin-top: 40px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-success);
}
</style>
