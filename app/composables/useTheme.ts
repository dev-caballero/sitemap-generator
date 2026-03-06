import { ref, watchEffect } from "vue";

const isDark = ref(false);

// Initialize from localStorage (only on client)
if (typeof window !== "undefined") {
  isDark.value = localStorage.getItem("theme") === "dark";
}

watchEffect(() => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
});

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value;
  }

  return { isDark, toggle };
}
