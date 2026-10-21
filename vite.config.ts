import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  base: "./",
  plugins: [crx({ manifest })],
  build: {
    outDir: "dist",
    rollupOptions: {
      // Pages that aren't referenced from the manifest directly
      input: {
        viewer: "src/viewer/viewer.html",
      },
    },
  },
});
