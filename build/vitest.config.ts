import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: { alias: { "server-only": new URL("./node_modules/server-only/empty.js", import.meta.url).pathname } },
  test: { environment: "node", include: ["lib/**/*.test.ts", "mcp/**/*.test.ts"] },
});
