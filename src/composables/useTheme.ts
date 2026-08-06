import { ref } from "vue";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "duit-theme";

// Shared reactive theme state across application
const theme = ref<ThemeMode>("dark");

function applyTheme(mode: ThemeMode) {
  theme.value = mode;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
    }
  }
}

function initTheme() {
  if (typeof window === "undefined") return;

  const savedTheme = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme);
  } else {
    // Respect OS preference if no saved setting
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}

// Auto-initialize theme on module load
initTheme();

export function useTheme() {
  const toggleTheme = () => {
    const nextMode: ThemeMode = theme.value === "dark" ? "light" : "dark";
    applyTheme(nextMode);
    localStorage.setItem(STORAGE_KEY, nextMode);
  };

  const setTheme = (mode: ThemeMode) => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}
