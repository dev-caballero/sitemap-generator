<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>My Projects</h1>
      <div class="header-actions">
        <button @click="toggleTheme" class="theme-toggle-btn" :title="isDark ? 'Light mode' : 'Dark mode'">
          <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </button>
        <button
          class="new-project-btn"
          @click="createProject"
          :disabled="isCreating"
        >
          <span v-if="!isCreating">+ New Project</span>
          <span v-else>Creating...</span>
        </button>
      </div>
    </header>

    <main class="projects-grid">
      <div v-if="pending" class="loading-state">Loading projects...</div>

      <div v-else-if="projects?.length === 0" class="empty-state">
        <p>No projects yet. Create one to get started!</p>
      </div>

      <div
        v-else
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        @click="openProject(project.id)"
      >
        <div class="project-preview">
          <!-- Placeholder for future visual preview -->
          <div class="preview-placeholder"></div>
        </div>
        <div class="project-info">
          <h3>{{ project.title }}</h3>
          <p class="updated-at">Edited {{ formatDate(project.updatedAt) }}</p>
        </div>
        <button
          class="delete-btn"
          @click.stop="deleteProject(project.id)"
          title="Delete project"
        >
          ✕
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "../composables/useTheme";

const { isDark, toggle: toggleTheme } = useTheme();

const router = useRouter();
const isCreating = ref(false);

// Fetch all projects from API
const { data: projects, pending, refresh } = await useFetch("/api/projects");

// Format date relative or static
function formatDate(dateStr: string) {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function openProject(id: string) {
  router.push(`/project/${id}`);
}

async function createProject() {
  if (isCreating.value) return;
  isCreating.value = true;

  try {
    const newProject = await $fetch("/api/projects", {
      method: "POST",
      body: { title: "Untitled Project" },
    });

    if (newProject && newProject.id) {
      router.push(`/project/${newProject.id}`);
    }
  } catch (error) {
    console.error("Failed to create project:", error);
    alert("Failed to create a new project.");
  } finally {
    isCreating.value = false;
  }
}

async function deleteProject(id: string) {
  if (!confirm("Are you sure you want to delete this project?")) return;

  try {
    await $fetch(`/api/projects/${id}`, { method: "DELETE" });
    await refresh(); // Reload the list
  } catch (error) {
    console.error("Failed to delete project:", error);
    alert("Failed to delete the project.");
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: var(--font-family);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.dashboard-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle-btn:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.new-project-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.new-project-btn:hover:not(:disabled) {
  background-color: #2563eb;
}

.new-project-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.projects-grid {
  padding: 48px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.project-card {
  position: relative;
  background: var(--surface-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--node-shadow);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.05);
}

.project-card:hover .delete-btn {
  opacity: 1;
}

.project-preview {
  height: 160px;
  background-color: var(--surface-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  width: 60px;
  height: 40px;
  border: 2px dashed var(--border-color);
  border-radius: 4px;
}

.project-info {
  padding: 16px;
}

.project-info h3 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.updated-at {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--danger-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s,
    background-color 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.delete-btn:hover {
  background-color: var(--surface-hover);
  border-color: var(--danger-color);
}

.loading-state,
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px;
  color: var(--text-muted);
  font-size: 1.1rem;
}
</style>
