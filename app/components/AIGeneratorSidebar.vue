<template>
  <div class="generator-sidebar" :class="{ 'is-open': isOpen }">
    <div class="sidebar-header">
      <h2>✨ AI Generator</h2>
      <button class="close-btn" @click="$emit('close')">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Settings Panel (Collapsible) -->
    <div class="settings-panel" :class="{ 'is-expanded': settingsOpen }">
      <div class="settings-header" @click="settingsOpen = !settingsOpen">
        <span class="settings-title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
            ></path>
          </svg>
          API Settings
        </span>
        <svg
          class="chevron"
          :class="{ rotate: settingsOpen }"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </div>

      <div class="settings-body" v-show="settingsOpen">
        <div class="form-group">
          <label>AI Provider</label>
          <select v-model="provider">
            <option value="opencode">OpenCode Zen</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>
        <div class="form-group">
          <label>Model</label>
          <select v-model="model" :disabled="isLoading">
            <option v-for="m in filteredModels" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Generator Results / Status -->
    <div class="generator-status">
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
        <span>Generando sitemap...</span>
      </div>
      <div v-else-if="statusText.startsWith('error:')" class="error-indicator">
        ❌ {{ statusText.replace("error:", "") }}
      </div>
      <div v-else-if="!statusText" class="empty-state">
        <div class="rocket-icon">🚀</div>
        <p>Describe tu sitio y verás el sitemap aparecer en el lienzo.</p>
      </div>

      <div v-if="!isLoading && statusText === 'ok'" class="success-indicator">
        ✔️ Sitemap actualizado
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-input-container">
      <textarea
        v-model="prompt"
        placeholder="E.g. Create a sitemap for a modern SaaS startup..."
        @keydown.enter.exact.prevent="generateSitemap"
        rows="3"
        :disabled="isLoading"
      ></textarea>
      <button
        class="btn-primary generate-btn"
        @click="generateSitemap"
        :disabled="isLoading || !prompt.trim()"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
        </svg>
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useSitemap } from "../composables/useSitemap";

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(["close"]);

const { rootNode, setTree } = useSitemap();

// ─── Settings ─────────────────────────────────────────────────────────────────

const settingsOpen = ref(true);
const provider = ref("opencode");
const model = ref("big-pickle");
const prompt = ref("");
const isLoading = ref(false);
const statusText = ref(""); // empty | error message | "ok"

const availableModels = ref<{ id: string; name: string; provider: string }[]>([
  // ── Free models ───────────────────────────────────────────────────────────
  { id: "big-pickle", name: "🥒 Big Pickle (Free)", provider: "opencode" },
  {
    id: "minimax-m2.5-free",
    name: "MiniMax M2.5 (Free)",
    provider: "opencode",
  },
  {
    id: "trinity-large-preview-free",
    name: "Trinity Large Preview (Free)",
    provider: "opencode",
  },
  // ── Claude ────────────────────────────────────────────────────────────────
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "opencode" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", provider: "opencode" },
  { id: "claude-opus-4-1", name: "Claude Opus 4.1", provider: "opencode" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "opencode" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "opencode" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "opencode" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "opencode" },
  { id: "claude-3-5-haiku", name: "Claude Haiku 3.5", provider: "opencode" },
  // ── Gemini via Zen ────────────────────────────────────────────────────────
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "opencode" },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", provider: "opencode" },
  { id: "gemini-3-flash", name: "Gemini 3 Flash", provider: "opencode" },
  // ── GPT ───────────────────────────────────────────────────────────────────
  { id: "gpt-5.3-codex", name: "GPT 5.3 Codex", provider: "opencode" },
  { id: "gpt-5.2", name: "GPT 5.2", provider: "opencode" },
  { id: "gpt-5.2-codex", name: "GPT 5.2 Codex", provider: "opencode" },
  { id: "gpt-5.1", name: "GPT 5.1", provider: "opencode" },
  { id: "gpt-5.1-codex-max", name: "GPT 5.1 Codex Max", provider: "opencode" },
  { id: "gpt-5.1-codex", name: "GPT 5.1 Codex", provider: "opencode" },
  {
    id: "gpt-5.1-codex-mini",
    name: "GPT 5.1 Codex Mini",
    provider: "opencode",
  },
  { id: "gpt-5", name: "GPT 5", provider: "opencode" },
  { id: "gpt-5-codex", name: "GPT 5 Codex", provider: "opencode" },
  { id: "gpt-5-nano", name: "GPT 5 Nano", provider: "opencode" },
  // ── GLM ───────────────────────────────────────────────────────────────────
  { id: "glm-5", name: "GLM 5", provider: "opencode" },
  { id: "glm-4.7", name: "GLM 4.7", provider: "opencode" },
  { id: "glm-4.6", name: "GLM 4.6", provider: "opencode" },
  // ── MiniMax ───────────────────────────────────────────────────────────────
  { id: "minimax-m2.5", name: "MiniMax M2.5", provider: "opencode" },
  { id: "minimax-m2.1", name: "MiniMax M2.1", provider: "opencode" },
  // ── Kimi ──────────────────────────────────────────────────────────────────
  { id: "kimi-k2.5", name: "Kimi K2.5", provider: "opencode" },
  { id: "kimi-k2", name: "Kimi K2", provider: "opencode" },
  { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", provider: "opencode" },
  // ── Gemini Direct ─────────────────────────────────────────────────────────
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro Preview",
    provider: "gemini",
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "gemini",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    provider: "gemini",
  },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini" },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    provider: "gemini",
  },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "gemini" },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash-Lite",
    provider: "gemini",
  },
]);

const filteredModels = computed(() =>
  availableModels.value.filter((m) => m.provider === provider.value),
);

watch(provider, () => {
  const first = filteredModels.value[0];
  if (first) model.value = first.id;
});

onMounted(() => {
  if (import.meta.client) {
    const p = localStorage.getItem("ai_provider");
    if (p) provider.value = p;
    const m = localStorage.getItem("ai_model");
    if (m) model.value = m;
  }
});

watch([model, provider], () => {
  if (import.meta.client) {
    localStorage.setItem("ai_provider", provider.value);
    localStorage.setItem("ai_model", model.value);
  }
});

// ─── Generate ─────────────────────────────────────────────────────────────────

async function generateSitemap() {
  if (!prompt.value.trim() || isLoading.value) return;

  const userPrompt = prompt.value.trim();
  prompt.value = "";
  statusText.value = "";
  isLoading.value = true;

  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: provider.value,
        model: model.value,
        prompt: userPrompt,
        currentSitemap: rootNode.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message ?? data.statusMessage ?? res.statusText);
    }

    if (!data.tree) {
      throw new Error("La IA devolvió una respuesta vacía. Intenta de nuevo.");
    }

    setTree(data.tree);
    statusText.value = "ok";
  } catch (err: any) {
    statusText.value = "error:" + (err.message ?? "Error desconocido");
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.generator-sidebar {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: var(--surface-color);
  border-left: 1px solid var(--border-color);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1000;
}

.generator-sidebar.is-open {
  right: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.settings-panel {
  border-bottom: 1px solid var(--border-color);
  background: var(--surface-secondary);
}

.settings-header {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
}

.settings-header:hover {
  background: var(--surface-hover);
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chevron {
  transition: transform 0.2s;
}

.chevron.rotate {
  transform: rotate(180deg);
}

.settings-body {
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  background: var(--input-bg);
  color: var(--text-color);
}

.form-group input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.generator-status {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--surface-secondary);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-indicator {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

.success-indicator {
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #166534;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  text-align: center;
}

.rocket-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--surface-hover);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #3b82f6;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #3b82f6;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chat-input-container {
  padding: 16px 20px;
  background: var(--surface-color);
  border-top: 1px solid var(--border-color);
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  font-size: 0.95rem;
  margin-bottom: 12px;
  outline: none;
  box-sizing: border-box;
  background: var(--input-bg);
  color: var(--text-color);
}

textarea:focus,
select:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  background: var(--input-bg);
  color: var(--text-color);
}

.generate-btn {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.generate-btn:hover:not(:disabled) {
  background: #2563eb;
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save {
  margin-top: 12px;
  padding: 10px;
  background: var(--surface-hover);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: var(--surface-secondary);
  color: var(--text-color);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
