import { ref } from "vue";

export interface SitemapNodeData {
  id: string;
  title: string;
  path: string;
  sections?: { id: string; title: string; description: string }[];
  children: SitemapNodeData[];
}

// Global state to share between components within the same project context
const globalRootNode = ref<SitemapNodeData>({
  id: "root",
  title: "Home",
  path: "/",
  sections: [],
  children: [],
});

export const useSitemap = () => {
  const generateId = () => Math.random().toString(36).substring(2, 9);

  const rootNode = globalRootNode;

  const setTree = (newTree: SitemapNodeData) => {
    globalRootNode.value = JSON.parse(JSON.stringify(newTree)); // Deep copy to avoid reference issues
  };

  const exportToJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(rootNode.value, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "sitemap.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importFromJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === "string") {
          const parsed = JSON.parse(result);
          if (
            parsed &&
            typeof parsed === "object" &&
            "id" in parsed &&
            "children" in parsed
          ) {
            rootNode.value = parsed as SitemapNodeData;
          } else {
            alert("El archivo no tiene el formato de sitemap válido.");
          }
        }
      } catch (err) {
        alert("Error al parsear el archivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const findNode = (
    id: string,
    node: SitemapNodeData = rootNode.value,
  ): SitemapNodeData | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(id, child);
      if (found) return found;
    }
    return null;
  };

  const findParent = (
    id: string,
    node: SitemapNodeData = rootNode.value,
    parent: SitemapNodeData | null = null,
  ): { parent: SitemapNodeData | null; index: number } | null => {
    if (node.id === id)
      return {
        parent,
        index: parent ? parent.children.findIndex((c) => c.id === id) : -1,
      };
    for (const child of node.children) {
      const found = findParent(id, child, node);
      if (found) return found;
    }
    return null;
  };

  const addChild = (parentId: string) => {
    const parent = findNode(parentId);
    if (parent) {
      parent.children.push({
        id: generateId(),
        title: "New Page",
        path: "/new-page",
        sections: [],
        children: [],
      });
    }
  };

  const updateNode = (id: string, title: string, path: string) => {
    const node = findNode(id);
    if (node) {
      node.title = title;
      node.path = path;
    }
  };

  const deleteNode = (id: string) => {
    if (id === "root") return;
    const result = findParent(id);
    if (result && result.parent !== null && result.index !== -1) {
      result.parent.children.splice(result.index, 1);
    }
  };

  return {
    rootNode,
    addChild,
    updateNode,
    deleteNode,
    exportToJson,
    importFromJson,
    setTree,
    generateId,
  };
};
