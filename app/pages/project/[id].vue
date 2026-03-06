<template>
  <div class="project-view">
    <header class="project-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack" title="Back to Dashboard">
          ←
        </button>
        <div class="title-container">
          <input
            v-if="isEditingTitle"
            v-model="editedTitle"
            @blur="saveTitle"
            @keyup.enter="saveTitle"
            ref="titleInput"
            class="title-input"
          />
          <h2
            v-else
            @click="startEditingTitle"
            class="project-title"
            title="Click to edit"
          >
            {{ projectTitle }}
          </h2>
        </div>
      </div>

      <div class="header-right">
        <span
          class="save-status"
          :class="{
            saved: saveState === 'saved',
            saving: saveState === 'saving',
            error: saveState === 'error',
          }"
        >
          {{ statusText }}
        </span>
      </div>
    </header>

    <main class="canvas-container">
      <SitemapBoard
        v-if="projectLoaded"
        :initial-data="projectData"
        @change="onBoardChange"
      />
      <div v-else class="loading-state">Loading canvas...</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const projectId = route.params.id as string;

const projectLoaded = ref(false);
const projectData = ref<any>(null);
const projectTitle = ref("Untitled Project");
const editedTitle = ref("");
const isEditingTitle = ref(false);
const titleInput = ref<HTMLInputElement | null>(null);

type SaveState = "idle" | "saving" | "saved" | "error";
const saveState = ref<SaveState>("idle");
const lastSaved = ref<Date | null>(null);

let saveTimeout: any = null;
const SAVE_DELAY_MS = 1500;

const statusText = computed(() => {
  switch (saveState.value) {
    case "saving":
      return "Saving...";
    case "saved":
      return "All changes saved";
    case "error":
      return "Error saving";
    default:
      return "";
  }
});

onMounted(async () => {
  try {
    const data = await $fetch(`/api/projects/${projectId}`);
    projectTitle.value = data.title || "Untitled Project";

    // Make sure we have the structure SitemapBoard expects
    if (data.tree && data.tree.id) {
      projectData.value = data.tree;
    } else {
      // Initialize default sitemap tree
      projectData.value = {
        id: "root",
        title: "Home",
        path: "/",
        sections: [],
        children: [],
      };
    }

    projectLoaded.value = true;
  } catch (error) {
    console.error("Failed to load project:", error);
    alert("Project not found or failed to load");
    router.push("/");
  }
});

function goBack() {
  router.push("/");
}

function startEditingTitle() {
  editedTitle.value = projectTitle.value;
  isEditingTitle.value = true;
  nextTick(() => {
    titleInput.value?.focus();
  });
}

function saveTitle() {
  if (!isEditingTitle.value) return;
  isEditingTitle.value = false;

  const newTitle = editedTitle.value.trim();
  if (newTitle && newTitle !== projectTitle.value) {
    projectTitle.value = newTitle;
    triggerSave();
  }
}

// Emitted by SitemapBoard when nodes/edges change
function onBoardChange(newData: any) {
  projectData.value = newData;
  triggerSave();
}

// Debounced auto-save
function triggerSave() {
  saveState.value = "saving";

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      await $fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        body: {
          title: projectTitle.value,
          tree: projectData.value,
        },
      });

      saveState.value = "saved";
      lastSaved.value = new Date();

      // hide "saved" text after a few seconds
      setTimeout(() => {
        if (saveState.value === "saved") saveState.value = "idle";
      }, 3000);
    } catch (error) {
      console.error("Failed to save project:", error);
      saveState.value = "error";
    }
  }, SAVE_DELAY_MS);
}
</script>

<style scoped>
.project-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: var(--font-family);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  height: 60px;
  box-sizing: border-box;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1.1rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.title-container {
  display: flex;
  align-items: center;
}

.project-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.project-title:hover {
  background-color: var(--surface-hover);
}

.title-input {
  font-size: 1.1rem;
  font-weight: 500;
  padding: 4px 8px;
  border: 1px solid var(--border-focus);
  border-radius: 4px;
  outline: none;
  width: 200px;
  background: var(--input-bg);
  color: var(--text-color);
}

.save-status {
  font-size: 0.85rem;
  font-weight: 500;
}

.save-status.saving {
  color: #f59e0b;
}
.save-status.saved {
  color: #10b981;
  transition: opacity 2s;
}
.save-status.error {
  color: #ef4444;
}

.canvas-container {
  flex: 1;
  position: relative;
  background-color: var(--bg-color);
}

.loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-muted);
}

/* Ensure SitemapBoard fills the relative parent */
:deep(.sitemap-board) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
