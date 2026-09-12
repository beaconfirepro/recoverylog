import path from "node:path";
import { defineConfig } from "vitest/config";

// Deliberately not vite.config.js: that one loads the Base44 plugin, which wants
// a live backend. The tests run against pure modules and need none of it.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      // The backend functions are Deno modules that import the SDK by URL. The
      // tests stand a small in-memory backend in its place, so a function can
      // be run here rather than only in production.
      "npm:@base44/sdk": path.resolve(process.cwd(), "base44/functions/__tests__/fakeBase44.js")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.js", "base44/functions/**/*.test.js"],
    // Dates are the subject of several of these, so pin the clock rather than
    // let a test pass in one timezone and fail in another.
    env: { TZ: "UTC" }
  }
});
