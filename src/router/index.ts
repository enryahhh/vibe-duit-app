import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "@/views/DashboardView.vue";
import { useAuth } from "@/composables/useAuth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/accounts",
      name: "accounts",
      component: () => import("@/views/AccountsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/transactions",
      name: "transactions",
      component: () => import("@/views/TransactionsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/goals",
      name: "goals",
      component: () => import("@/views/GoalsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/calculators",
      name: "calculators",
      component: () => import("@/views/CalculatorsView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const { initAuth, isAuthenticated } = useAuth();

  // Ensure Firebase Auth state is initialized before checking route guards
  await initAuth();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated.value) {
    next({ name: "login", query: { redirect: to.fullPath } });
  } else if (to.name === "login" && isAuthenticated.value) {
    next({ name: "dashboard" });
  } else {
    next();
  }
});

export default router;
