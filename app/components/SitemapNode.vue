<template>
  <div class="sitemap-node-wrapper" :class="{ 'is-root': isRoot }">
    <!-- The line connecting this node to its parent -->
    <div v-if="!isRoot" class="connector-to-parent"></div>

    <div class="node-column">
      <!-- Container grouping the page and its sections together -->
      <div
        class="unified-node-container"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <!-- The actual node card (Dark Header) -->
        <div class="node-card page-card">
          <div class="node-content">
            <input
              v-model="localTitle"
              @blur="saveChanges"
              placeholder="Page Title"
              class="node-input title-input dark-input"
            />
            <input
              v-model="localPath"
              @blur="saveChanges"
              placeholder="/path"
              class="node-input path-input dark-input-muted"
            />
          </div>

          <!-- Action Buttons -->
          <Transition name="fade">
            <div v-if="isHovered" class="node-actions-header">
              <button
                v-if="!isRoot"
                @click.stop="$emit('delete', node.id)"
                class="action-btn delete-btn"
                title="Delete Node"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                  />
                </svg>
              </button>
              <button
                @click.stop="$emit('add', node.id)"
                class="action-btn add-btn"
                title="Add Child"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </Transition>
        </div>

        <!-- Sections -->
        <div
          class="sections-wrapper"
          v-if="isHovered || (node.sections && node.sections.length > 0)"
        >
          <div
            class="sections-list"
            v-if="node.sections && node.sections.length > 0"
          >
            <div
              v-for="section in node.sections"
              :key="section.id"
              class="section-card"
              @mouseenter="hoveredSection = section.id"
              @mouseleave="hoveredSection = null"
            >
              <div class="node-content section-content-blocks">
                <div class="section-title">
                  {{ section.title || "Section Name" }}
                </div>
                <div v-if="section.description" class="section-desc">
                  {{ section.description }}
                </div>
              </div>
              <Transition name="fade">
                <button
                  v-if="hoveredSection === section.id"
                  @click.stop="removeSection(section.id)"
                  class="action-btn delete-btn section-delete"
                  title="Delete Section"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                    />
                  </svg>
                </button>
              </Transition>
            </div>
          </div>

          <!-- Add Section Button -->
          <button
            class="add-section-btn"
            @click="addSection"
            v-if="isHovered || (node.sections && node.sections.length > 0)"
          >
            + Add Section
          </button>
        </div>
      </div>
    </div>

    <!-- Connector coming out of this node to children -->
    <div
      v-if="node.children && node.children.length > 0"
      class="connector-to-children"
    ></div>

    <!-- Children Container -->
    <div
      v-if="node.children && node.children.length > 0"
      class="children-container"
    >
      <SitemapNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :is-root="false"
        @add="$emit('add', $event)"
        @delete="$emit('delete', $event)"
        @update="$emit('update', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  isRoot: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["add", "delete", "update"]);

const isHovered = ref(false);
const localTitle = ref(props.node.title);
const localPath = ref(props.node.path);

watch(
  () => props.node,
  (newNode) => {
    localTitle.value = newNode.title;
    localPath.value = newNode.path;
  },
  { deep: true },
);

const saveChanges = () => {
  emit("update", {
    id: props.node.id,
    title: localTitle.value,
    path: localPath.value,
    sections: props.node.sections,
  });
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const hoveredSection = ref<string | null>(null);

const addSection = () => {
  if (!props.node.sections) {
    props.node.sections = [];
  }
  props.node.sections.push({
    id: generateId(),
    title: "New Section",
    description: "",
  });
  saveChanges();
};

const removeSection = (id: string) => {
  if (props.node.sections) {
    const index = props.node.sections.findIndex((s: any) => s.id === id);
    if (index !== -1) {
      props.node.sections.splice(index, 1);
      saveChanges();
    }
  }
};
</script>

<style scoped>
.sitemap-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 16px;
}

.node-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.connector-to-parent {
  width: var(--line-width);
  height: 32px;
  background-color: var(--line-color);
}

.sitemap-node-wrapper:not(.is-root)::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  right: 50%;
  border-top: var(--line-width) solid var(--line-color);
  width: 100%;
  transform: translateX(-50%);
  z-index: 1;
}

.children-container > .sitemap-node-wrapper:first-child::before {
  left: 50%;
  width: 50%;
  transform: none;
}
.children-container > .sitemap-node-wrapper:last-child::before {
  right: 50%;
  width: 50%;
  transform: none;
  left: 0;
}
.children-container > .sitemap-node-wrapper:only-child::before {
  display: none;
}

.connector-to-children {
  width: var(--line-width);
  height: 32px;
  background-color: var(--line-color);
}

.children-container {
  display: flex;
  justify-content: center;
  position: relative;
}

.unified-node-container {
  display: flex;
  flex-direction: column;
  width: var(--node-width);
  background: var(--surface-color);
  border-radius: var(--node-radius);
  border: 1.5px solid var(--border-color);
  box-shadow: var(--node-shadow);
  overflow: hidden;
  transition: all 0.2s ease;
  z-index: 2;
  position: relative;
}

.unified-node-container:hover {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.node-card {
  position: relative;
  width: 100%;
}

.page-card {
  background: var(--node-header-bg);
  padding: 12px 16px;
  color: white;
  display: flex;
  flex-direction: column;
}

.sections-wrapper {
  background: var(--node-sections-bg);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sections-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.section-card {
  background: var(--surface-color);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 10px 12px;
  position: relative;
  transition: border-color 0.2s;
}

.section-card:hover {
  border-color: var(--text-muted);
}

.section-content-blocks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-color);
  padding-right: 24px; /* Leave space for absolute delete button */
}

.section-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
}

.section-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  z-index: 5;
}

.add-section-btn {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 6px 12px;
  margin-top: 4px;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
}

.add-section-btn:hover {
  background: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--text-muted);
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-input {
  border: 1px solid transparent;
  background: transparent;
  padding: 4px;
  margin: -4px;
  border-radius: 4px;
}

.node-input:hover {
  background: rgba(128, 128, 128, 0.1);
}
.node-input:focus {
  background: var(--input-bg);
  border-color: var(--border-focus);
}

/* Modifier class for inputs on the dark header */
.dark-input {
  color: white;
}
.dark-input:hover {
  background: rgba(255, 255, 255, 0.1);
}
.dark-input:focus {
  background: #222222;
  color: white;
  border-color: #555555;
}

.dark-input-muted {
  color: #a3a3a3;
}
.dark-input-muted:hover {
  background: rgba(255, 255, 255, 0.1);
}
.dark-input-muted:focus {
  background: #222222;
  color: white;
  border-color: #555555;
}

.title-input {
  font-weight: 500;
  font-size: 0.95rem;
}

.path-input {
  font-size: 0.75rem;
  font-family: monospace;
}

.node-actions-header {
  position: absolute;
  top: 10px;
  right: 12px;
  display: flex;
  gap: 6px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.action-btn:hover {
  transform: scale(1.1);
}

.add-btn {
  color: var(--primary-color);
}
.add-btn:hover {
  background: var(--surface-hover);
}

.delete-btn {
  color: var(--danger-color);
}
.delete-btn:hover {
  background: var(--surface-hover);
  border-color: var(--danger-color);
  color: var(--danger-hover);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
