import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Ignore TypeScript errors during production build
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore TypeScript warnings
        if (warning.code === "TS" || warning.message.includes("TypeScript")) {
          return;
        }
        warn(warning);
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
});
