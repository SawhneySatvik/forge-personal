import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Resolve "@/..." the same way tsconfig does, but ONLY the "@/" prefix so it
// never collides with scoped packages like "@supabase/ssr".
const root = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: `${root}/$1` }],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
