// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  routeRules: {
    "/api/opencode/**": { proxy: "https://opencode.ai/zen/**" },
  },
  build: {
    transpile: ["@prisma/client"],
  },
  nitro: {
    storage: {
      projects: {
        driver: "fs",
        base: "./.data/projects",
      },
    },
  },
  runtimeConfig: {
    opencodeApiKey: process.env.OPENCODE_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    public: {
      // public vars if needed
    },
  },
});
