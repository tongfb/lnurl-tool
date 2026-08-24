import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "static",
  base: "./",
  plugins: [react()],
  publicDir: "../public",
  build: { outDir: "../cloudflare-dist/lntool", emptyOutDir: true },
});
