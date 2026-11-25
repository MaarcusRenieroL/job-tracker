import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/auth": process.env.AUTH_URL ?? "http://127.0.0.1:3001",
      "/applications": process.env.TRACKER_URL ?? "http://127.0.0.1:3002",
      "/profile": process.env.TRACKER_URL ?? "http://127.0.0.1:3002",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
});
