import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    target: "es2020",
    outDir: resolve(__dirname, "../public/widget"),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/widget.ts"),
      name: "Guestbook",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "[name][extname]",
      },
    },
    minify: "esbuild",
  },
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "../src/shared"),
    },
  },
});
