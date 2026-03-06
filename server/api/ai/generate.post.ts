// ─── Types ────────────────────────────────────────────────────────────────────

interface SitemapSection {
  id: string;
  title: string;
  description: string;
}

interface SitemapNode {
  id: string;
  title: string;
  path: string;
  sections: SitemapSection[];
  children: SitemapNode[];
}

// ─── ID Generator ─────────────────────────────────────────────────────────────

function generateId(length = 7): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

// ─── DSL Parser ───────────────────────────────────────────────────────────────
// Expected DSL format:
//
// [Home] /
// - Navbar
// - Hero: Introduce the brand with a strong value proposition.
// - Features: Showcase 3 key services.
// - Footer
//
//   [About] /about
//   - Navbar
//   - Header: Welcome to the About page.
//   - Footer

function parseSitemapDSL(text: string): SitemapNode | null {
  const lines = text.split("\n");

  interface PageBlock {
    depth: number;
    title: string;
    path: string;
    rawSections: string[];
  }

  const blocks: PageBlock[] = [];
  let currentBlock: PageBlock | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Detect page header: [Title] /path
    const pageMatch = line.match(/^(\s*)\[(.+?)\]\s+(\S+)/);
    if (pageMatch) {
      if (currentBlock) blocks.push(currentBlock);
      const indentLen = pageMatch[1].length;
      currentBlock = {
        depth: Math.floor(indentLen / 2),
        title: pageMatch[2].trim(),
        path: pageMatch[3].trim(),
        rawSections: [],
      };
      continue;
    }

    // Detect section line: - Title or - Title: Description
    const sectionMatch = line.match(/^\s*-\s+(.+)$/);
    if (sectionMatch && currentBlock) {
      currentBlock.rawSections.push(sectionMatch[1].trim());
    }
  }

  if (currentBlock) blocks.push(currentBlock);
  if (blocks.length === 0) return null;

  // Build SitemapNode from a block
  function blockToNode(block: PageBlock, pageIndex: number): SitemapNode {
    const nodeId = pageIndex === 0 ? "root" : generateId();

    const sections: SitemapSection[] = block.rawSections.map((raw, i) => {
      const colonIdx = raw.indexOf(":");
      const title =
        colonIdx > -1 ? raw.substring(0, colonIdx).trim() : raw.trim();
      const description =
        colonIdx > -1 ? raw.substring(colonIdx + 1).trim() : "";

      // Build a short abbreviation for the section ID
      const abbrev =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "")
          .substring(0, 6) || `s${i}`;

      return {
        id: `s${pageIndex + 1}_${abbrev}`,
        title,
        description,
      };
    });

    return {
      id: nodeId,
      title: block.title,
      path: block.path,
      sections,
      children: [],
    };
  }

  // Build tree using a depth stack
  const roots: SitemapNode[] = [];
  const stack: { depth: number; node: SitemapNode }[] = [];

  blocks.forEach((block, i) => {
    const node = blockToNode(block, i);

    // Pop stack until parent found
    while (stack.length > 0 && stack[stack.length - 1].depth >= block.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ depth: block.depth, node });
  });

  return roots[0] ?? null;
}

// ─── System Prompt ─────────────────────────────────────────────────────────────

const DSL_SYSTEM_PROMPT = `You are an expert web architect and UX strategist. Your task is to generate or update a website sitemap.

You MUST respond using ONLY this exact DSL format — no JSON, no markdown, no explanations:

[Page Title] /path
- Navbar
- Section Title: Brief, specific description of content and purpose.
- Section Title: Another description.
- Footer

  [Child Page Title] /child-path
  - Navbar
  - Section Title: Description.
  - Footer

STRICT RULES:
1. Every page MUST begin with "- Navbar" (no description) and end with "- Footer" (no description).
2. Between Navbar and Footer, add 2 to 6 content sections with meaningful descriptions.
3. Section descriptions must be specific and informative — not generic.
4. Child pages are indented with 2 spaces per nesting level relative to their parent.
5. Paths use lowercase kebab-case slugs (e.g. /about, /services/web-design).
6. Output ONLY the DSL. No extra text, no headers, no explanations.

EXAMPLE OUTPUT:
[Home] /
- Navbar
- Hero: Introduce the agency with a bold headline and a CTA to explore our portfolio.
- Clients: Display logos of notable clients to build social proof.
- Services: Summarize our three core offerings — Web Design, Development, and Strategy.
- Testimonials: Show 3 client quotes with star ratings and project outcomes.
- CTA: Invite visitors to schedule a free strategy call.
- Footer

  [About] /about
  - Navbar
  - Header: Set the scene with a tagline reflecting the studio's creative vision.
  - Story: Narrate the founding story, mission, and guiding values.
  - Team: Grid of portraits with names, roles, and one-line bios.
  - Footer

  [Services] /services
  - Navbar
  - Header: Introduce the range of digital services with a compelling subtitle.
  - Services List: Detail each service — scope, deliverables, and outcomes.
  - Process: Walk through our 4-step methodology: Discover, Design, Develop, Launch.
  - Footer`;

// ─── Helpers: call each AI provider without streaming ─────────────────────────

async function callOpenCode(
  apiKey: string,
  model: string,
  messages: any[],
): Promise<string> {
  const res = await fetch("https://opencode.ai/zen/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429)
      throw new Error(
        "Quota Exceeded (429): Rate-limited. Please wait or change model.",
      );
    throw new Error(`OpenCode API Error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(
  apiKey: string,
  model: string,
  messages: any[],
): Promise<string> {
  const systemMsg = messages.find((m: any) => m.role === "system");
  const userMessages = messages.filter((m: any) => m.role !== "system");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: userMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    system_instruction: systemMsg
      ? { parts: [{ text: systemMsg.content }] }
      : undefined,
    generationConfig: { temperature: 0.3 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Gemini API Error ${res.status}`;
    try {
      const err = JSON.parse(text);
      if (res.status === 429)
        message =
          "Quota Exceeded (429): Gemini free tier limit reached. Try OpenCode Zen.";
      else if (err.error?.message) message = err.error.message;
    } catch {}
    throw new Error(message);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Event Handler ─────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const provider: string = body.provider ?? "opencode";
  const model: string = body.model ?? "minimax-m2.5-free";

  // Inject our DSL system prompt, appending the current sitemap state
  const currentSitemapJson = body.currentSitemap
    ? JSON.stringify(body.currentSitemap, null, 2)
    : "{}";

  const systemContent =
    DSL_SYSTEM_PROMPT +
    `\n\nCURRENT SITEMAP STATE (for modifications — ignore if creating new):\n${currentSitemapJson}`;

  const messages = [
    { role: "system", content: systemContent },
    { role: "user", content: body.prompt ?? "" },
  ];

  let rawText = "";

  try {
    if (provider === "gemini") {
      const apiKey = config.geminiApiKey;
      if (!apiKey)
        throw createError({
          statusCode: 401,
          message: "Missing GEMINI_API_KEY in .env",
        });
      rawText = await callGemini(apiKey, model, messages);
    } else {
      const apiKey = config.opencodeApiKey;
      if (!apiKey)
        throw createError({
          statusCode: 401,
          message: "Missing OPENCODE_API_KEY in .env",
        });
      rawText = await callOpenCode(apiKey, model, messages);
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode ?? 500,
      message: err.message ?? "AI provider error",
    });
  }

  // Parse DSL → sitemap tree
  const tree = parseSitemapDSL(rawText);

  if (!tree) {
    console.error("[AI Generate] Could not parse DSL. Raw output:\n", rawText);
    throw createError({
      statusCode: 422,
      message:
        "The AI returned an unrecognised format. Please try again or rephrase your prompt.",
      data: { rawText: rawText.slice(0, 500) },
    });
  }

  return { tree };
});
