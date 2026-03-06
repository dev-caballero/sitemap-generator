<template>
  <div
    class="canvas-board"
    ref="boardRef"
    @mousedown="startPan"
    @mousemove="pan"
    @mouseup="endPan"
    @mouseleave="endPan"
  >
    <!-- Tools / Header -->
    <div class="board-header">
      <div class="logo-area">
        <h1 class="logo-text">Canvas</h1>
      </div>
      <div class="actions">
        <!-- Theme toggle -->
        <button @click="toggleTheme" class="btn-secondary theme-toggle" :title="isDark ? 'Light mode' : 'Dark mode'">
          <!-- Sun icon (shown in dark mode) -->
          <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <!-- Moon icon (shown in light mode) -->
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </button>
        <!-- Hidden file input for importing JSON -->
        <input
          type="file"
          ref="fileInputRef"
          accept=".json,application/json"
          style="display: none"
          @change="onFileSelected"
        />
        <button @click="triggerFileInput" class="btn-secondary">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Import JSON
        </button>
        <button @click="isChatOpen = true" class="btn-primary ai-btn">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" />
          </svg>
          AI Generator
        </button>
        <button @click="exportToJson" class="btn-primary">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
            />
          </svg>
          Export JSON
        </button>
        <button
          @click="downloadAsImage"
          class="btn-secondary"
          :disabled="isDownloading"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>{{ isDownloading ? "Generando..." : "Download Image" }}</span>
        </button>
      </div>
    </div>

    <!-- Panning Wrapper -->
    <div
      ref="panWrapperRef"
      class="pan-wrapper"
      :style="{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }"
    >
      <div
        ref="sitemapContentRef"
        style="
          display: inline-block;
          padding: 60px;
          border-radius: 12px;
          background-color: transparent;
        "
      >
        <SitemapNode
          :node="rootNode"
          :is-root="true"
          @add="onAddChild"
          @delete="onDeleteNode"
          @update="onUpdateNode"
        />
      </div>
    </div>

    <!-- AI Generator Sidebar -->
    <AIGeneratorSidebar :is-open="isChatOpen" @close="isChatOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { useSitemap } from "../composables/useSitemap";
import { useTheme } from "../composables/useTheme";
import AIGeneratorSidebar from "./AIGeneratorSidebar.vue";

const { isDark, toggle: toggleTheme } = useTheme();

const props = defineProps<{
  initialData?: any;
}>();

const emit = defineEmits(["change"]);

const isChatOpen = ref(false);

// Flag to suppress the rootNode watcher when WE set the tree from external source
let isExternalUpdate = false;

const {
  rootNode,
  addChild,
  deleteNode,
  updateNode,
  exportToJson,
  importFromJson,
  setTree,
} = useSitemap();

// Wrapped setTree that marks the update as external so the watcher doesn't re-emit
function setTreeExternal(data: any) {
  isExternalUpdate = true;
  setTree(data);
  // Reset the flag after the watcher has had a chance to fire
  nextTick(() => {
    isExternalUpdate = false;
  });
}

onMounted(() => {
  if (props.initialData) {
    setTreeExternal(props.initialData);
  }
});

// Watch for external data changes (e.g. initial load)
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      setTreeExternal(newData);
    }
  },
  { deep: true },
);

// Watch for internal tree changes and emit to trigger save
watch(
  rootNode,
  (newVal) => {
    if (isExternalUpdate) return; // Skip: this change came from the parent prop
    emit("change", newVal);
  },
  { deep: true },
);

const onAddChild = (parentId: string) => {
  addChild(parentId);
};

const onDeleteNode = (id: string) => {
  deleteNode(id);
};

const onUpdateNode = (item: { id: string; title: string; path: string }) => {
  updateNode(item.id, item.title, item.path);
};

const fileInputRef = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0] as File;
    importFromJson(file);
    target.value = "";
  }
};

const isPanning = ref(false);
const startPos = ref({ x: 0, y: 0 });
const panOffset = ref({ x: 0, y: 0 });

const startPan = (e: MouseEvent) => {
  if (
    (e.target as HTMLElement).tagName === "INPUT" ||
    (e.target as HTMLElement).tagName === "TEXTAREA" ||
    (e.target as HTMLElement).closest("button")
  )
    return;

  isPanning.value = true;
  startPos.value = {
    x: e.clientX - panOffset.value.x,
    y: e.clientY - panOffset.value.y,
  };
  document.body.style.cursor = "grabbing";
};

const pan = (e: MouseEvent) => {
  if (!isPanning.value) return;
  panOffset.value = {
    x: e.clientX - startPos.value.x,
    y: e.clientY - startPos.value.y,
  };
};

const endPan = () => {
  isPanning.value = false;
  document.body.style.cursor = "default";
};

// --- Refs para descarga ---
const boardRef = ref<HTMLElement | null>(null);
const panWrapperRef = ref<HTMLElement | null>(null);
const sitemapContentRef = ref<HTMLElement | null>(null);
const isDownloading = ref(false);

const downloadAsImage = async () => {
  if (isDownloading.value) return;
  isDownloading.value = true;

  try {
    // --- Config ---
    const SCALE = 2;
    const PAD = 60;
    const NODE_W = 260;
    const HEADER_H = 56;
    const SIBLING_GAP = 32;
    const LEVEL_GAP = 64;
    const RADIUS = 12;
    const H_PAD = 16;
    const CARD_PAD = 10;
    const SEC_AREA_PAD = 12;
    const SEC_GAP = 8;

    const dark = isDark.value;
    const HEADER_BG = "#111111";
    const SECTIONS_BG = dark ? "#2a2a2a" : "#f4f4f4";
    const CARD_BG = dark ? "#1e1e1e" : "#ffffff";
    const CARD_BORDER = dark ? "#404040" : "#d4d4d4";
    const NODE_BORDER = dark ? "#404040" : "#282828";
    const LINE_COLOR = dark ? "#525252" : "#94a3b8";
    const SEC_TITLE_COLOR = dark ? "#e4e4e7" : "#0f172a";
    const SEC_DESC_COLOR = dark ? "#a1a1aa" : "#64748b";

    const TITLE_FONT = "bold 13px sans-serif";
    const PATH_FONT = "11px monospace";
    const SEC_TITLE_FONT = "500 12px sans-serif";
    const SEC_DESC_FONT = "11px sans-serif";

    // --- Text helpers ---
    const mc = document.createElement("canvas").getContext("2d")!;

    const truncate = (text: string, font: string, maxW: number): string => {
      mc.font = font;
      if (mc.measureText(text).width <= maxW) return text;
      let t = text;
      while (t.length > 0 && mc.measureText(t + "…").width > maxW)
        t = t.slice(0, -1);
      return t + "…";
    };

    const wrapText = (
      text: string,
      font: string,
      maxW: number,
      maxLines: number,
    ): string[] => {
      mc.font = font;
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (mc.measureText(test).width <= maxW) {
          line = test;
        } else {
          if (line) lines.push(line);
          if (lines.length >= maxLines) break;
          line = word;
        }
      }
      if (line && lines.length < maxLines) lines.push(line);
      if (lines.length === maxLines) {
        lines[maxLines - 1] = truncate(lines[maxLines - 1]!, font, maxW);
      }
      return lines.length ? lines : [""];
    };

    // --- Layout types ---
    interface LNode {
      data: any;
      x: number;
      y: number;
      w: number;
      h: number;
      headerH: number;
      subtreeW: number;
      children: LNode[];
    }

    // --- Measure node height ---
    const measureNode = (
      node: any,
    ): { h: number; headerH: number } => {
      const secs = node.sections || [];
      if (!secs.length) return { h: HEADER_H, headerH: HEADER_H };

      const textW = NODE_W - SEC_AREA_PAD * 2 - CARD_PAD * 2;
      let secH = SEC_AREA_PAD;
      secs.forEach((s: any, i: number) => {
        if (i > 0) secH += SEC_GAP;
        let cardH = CARD_PAD + 16;
        if (s.description) {
          cardH += 4 + wrapText(s.description, SEC_DESC_FONT, textW, 3).length * 15;
        }
        secH += cardH + CARD_PAD;
      });
      secH += SEC_AREA_PAD;
      return { h: HEADER_H + secH, headerH: HEADER_H };
    };

    // --- Build layout tree ---
    const buildLayout = (node: any): LNode => {
      const { h, headerH } = measureNode(node);
      const children = (node.children || []).map(buildLayout);
      const childrenW = children.length
        ? children.reduce((s: number, c: LNode) => s + c.subtreeW, 0) +
          (children.length - 1) * SIBLING_GAP
        : 0;
      return {
        data: node,
        x: 0,
        y: 0,
        w: NODE_W,
        h,
        headerH,
        subtreeW: Math.max(NODE_W, childrenW),
        children,
      };
    };

    // --- Position nodes ---
    const positionNode = (n: LNode, x: number, y: number) => {
      n.x = x + (n.subtreeW - n.w) / 2;
      n.y = y;
      if (n.children.length) {
        const totalW =
          n.children.reduce((s: number, c: LNode) => s + c.subtreeW, 0) +
          (n.children.length - 1) * SIBLING_GAP;
        let cx = x + (n.subtreeW - totalW) / 2;
        const cy = y + n.h + LEVEL_GAP;
        for (const c of n.children) {
          positionNode(c, cx, cy);
          cx += c.subtreeW + SIBLING_GAP;
        }
      }
    };

    const tree = buildLayout(rootNode.value);
    positionNode(tree, 0, 0);

    // --- Canvas bounds ---
    let maxX = 0;
    let maxY = 0;
    const findBounds = (n: LNode) => {
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
      n.children.forEach(findBounds);
    };
    findBounds(tree);

    const W = maxX + PAD * 2;
    const H = maxY + PAD * 2;

    // --- Create canvas ---
    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);
    ctx.textBaseline = "top";

    // Transparent background (canvas is transparent by default)

    // --- Rounded rect helper ---
    const rr = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      tl = true,
      tr = true,
      br = true,
      bl = true,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + (tl ? r : 0), y);
      ctx.lineTo(x + w - (tr ? r : 0), y);
      tr
        ? ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        : ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - (br ? r : 0));
      br
        ? ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        : ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + (bl ? r : 0), y + h);
      bl
        ? ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        : ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + (tl ? r : 0));
      tl ? ctx.quadraticCurveTo(x, y, x + r, y) : ctx.lineTo(x, y);
      ctx.closePath();
    };

    // --- Draw connector lines ---
    const drawLines = (n: LNode) => {
      if (!n.children.length) {
        n.children.forEach(drawLines);
        return;
      }
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 2;

      const px = PAD + n.x + n.w / 2;
      const py = PAD + n.y + n.h;
      const mid = py + LEVEL_GAP / 2;

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, mid);
      ctx.stroke();

      if (n.children.length > 1) {
        const l = PAD + n.children[0]!.x + n.w / 2;
        const r =
          PAD + n.children[n.children.length - 1]!.x + n.w / 2;
        ctx.beginPath();
        ctx.moveTo(l, mid);
        ctx.lineTo(r, mid);
        ctx.stroke();
      }

      for (const c of n.children) {
        const cx = PAD + c.x + c.w / 2;
        const cy = PAD + c.y;
        ctx.beginPath();
        ctx.moveTo(cx, mid);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }

      n.children.forEach(drawLines);
    };

    // --- Draw nodes ---
    const drawNode = (n: LNode) => {
      const x = PAD + n.x;
      const y = PAD + n.y;
      const hasSec = n.data.sections?.length > 0;

      // Shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      rr(x, y, n.w, n.h, RADIUS);
      ctx.fillStyle = CARD_BG;
      ctx.fill();
      ctx.restore();

      // Header
      rr(x, y, n.w, n.headerH, RADIUS, true, true, !hasSec, !hasSec);
      ctx.fillStyle = HEADER_BG;
      ctx.fill();

      // Sections background
      if (hasSec) {
        rr(
          x,
          y + n.headerH,
          n.w,
          n.h - n.headerH,
          RADIUS,
          false,
          false,
          true,
          true,
        );
        ctx.fillStyle = SECTIONS_BG;
        ctx.fill();
      }

      // Node border
      rr(x, y, n.w, n.h, RADIUS);
      ctx.strokeStyle = NODE_BORDER;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = TITLE_FONT;
      ctx.fillText(
        truncate(n.data.title || "Untitled", TITLE_FONT, n.w - H_PAD * 2),
        x + H_PAD,
        y + 14,
      );

      // Path
      ctx.fillStyle = "#a3a3a3";
      ctx.font = PATH_FONT;
      ctx.fillText(
        truncate(n.data.path || "/", PATH_FONT, n.w - H_PAD * 2),
        x + H_PAD,
        y + 34,
      );

      // Section cards
      if (hasSec) {
        const textW = n.w - SEC_AREA_PAD * 2 - CARD_PAD * 2;
        let sy = y + n.headerH + SEC_AREA_PAD;

        for (let i = 0; i < n.data.sections.length; i++) {
          if (i > 0) sy += SEC_GAP;
          const sec = n.data.sections[i];

          let cardH = CARD_PAD + 16;
          let descLines: string[] = [];
          if (sec.description) {
            descLines = wrapText(sec.description, SEC_DESC_FONT, textW, 3);
            cardH += 4 + descLines.length * 15;
          }
          cardH += CARD_PAD;

          // Card
          rr(x + SEC_AREA_PAD, sy, n.w - SEC_AREA_PAD * 2, cardH, 6);
          ctx.fillStyle = CARD_BG;
          ctx.fill();
          ctx.strokeStyle = CARD_BORDER;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Section title
          ctx.fillStyle = SEC_TITLE_COLOR;
          ctx.font = SEC_TITLE_FONT;
          ctx.fillText(
            truncate(sec.title || "Section", SEC_TITLE_FONT, textW),
            x + SEC_AREA_PAD + CARD_PAD,
            sy + CARD_PAD,
          );

          // Section description
          if (descLines.length) {
            ctx.fillStyle = SEC_DESC_COLOR;
            ctx.font = SEC_DESC_FONT;
            descLines.forEach((line: string, li: number) => {
              ctx.fillText(
                line,
                x + SEC_AREA_PAD + CARD_PAD,
                sy + CARD_PAD + 16 + 4 + li * 15,
              );
            });
          }

          sy += cardH;
        }
      }

      n.children.forEach(drawNode);
    };

    drawLines(tree);
    drawNode(tree);

    // --- Download via File System Access API (diálogo nativo) ---
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/png",
      );
    });

    if ("showSaveFilePicker" in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `sitemap-${Date.now()}.png`,
        types: [
          {
            description: "PNG Image",
            accept: { "image/png": [".png"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      // Fallback para navegadores sin File System Access API
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sitemap-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 10000);
    }
  } catch (err: any) {
    console.error("Download error:", err);
    alert("Error al generar la imagen: " + err.message);
  } finally {
    isDownloading.value = false;
  }
};
</script>

<style scoped>
.canvas-board {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-color);
  background-image: radial-gradient(var(--dot-color) 1px, transparent 1px);
  background-size: 24px 24px;
}

.board-header {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-color);
  opacity: 0.95;
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--node-shadow);
  z-index: 100;
}

.logo-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0;
}

.actions {
  display: flex;
  gap: 8px;
}

.ai-btn {
  background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
  border: none !important;
  color: white !important;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.btn-secondary {
  background-color: var(--surface-color);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--surface-hover);
  border-color: var(--text-muted);
}

.theme-toggle {
  padding: 8px;
}

.pan-wrapper {
  transition: transform 0.05s linear;
  will-change: transform;
  padding: 200px;
  display: inline-block;
  min-width: 100%;
  transform-origin: 0 0;
}
</style>
