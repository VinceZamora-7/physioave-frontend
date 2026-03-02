// src/composables/useTheme.ts
import { ref } from "vue";

const isDark = ref(false);

const apply = (value: boolean) => {
  isDark.value = value;
  document.documentElement.classList.toggle("dark", value);
  localStorage.setItem("theme", value ? "dark" : "light");
};

export function useTheme() {
  const initTheme = () => {
    const saved = localStorage.getItem("theme");
    apply(saved === "dark");
  };

  const toggleTheme = () => apply(!isDark.value);

  return { isDark, initTheme, toggleTheme, apply };
}
