<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";
import { Sun, Moon } from "lucide-vue-next";

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    class="theme-toggle-btn"
    :title="theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    :aria-label="theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    @click="toggleTheme"
  >
    <transition name="icon-fade" mode="out-in">
      <Sun v-if="theme === 'dark'" key="sun" :size="18" class="icon sun-icon" />
      <Moon v-else key="moon" :size="18" class="icon moon-icon" />
    </transition>
  </button>
</template>

<style scoped>
.theme-toggle-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-secondary);
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

:global(html.light) .theme-toggle-btn {
  background: rgba(15, 23, 42, 0.05);
  border-color: rgba(15, 23, 42, 0.12);
  color: #475569;
}

.theme-toggle-btn:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.4);
  color: var(--accent-primary);
  transform: translateY(-1px);
}

:global(html.light) .theme-toggle-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.4);
  color: #4f46e5;
}

.sun-icon {
  color: #f59e0b;
}

.moon-icon {
  color: #6366f1;
}

/* Transition Animations */
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.icon-fade-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.7);
}

.icon-fade-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.7);
}
</style>
