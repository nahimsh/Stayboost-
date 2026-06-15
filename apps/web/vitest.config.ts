import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
  },
});
