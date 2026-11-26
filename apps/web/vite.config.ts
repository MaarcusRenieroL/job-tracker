import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/auth": process.env.AUTH_URL ?? "http://127.0.0.1:3001",
      "/applications": process.env.TRACKER_URL ?? "http://127.0.0.1:3002",
      "/profile": process.env.TRACKER_URL ?? "http://127.0.0.1:3002",
      "/docs": process.env.TRACKER_URL ?? "http://127.0.0.1:3002",
      "/guide": process.env.TRACKER_URL ?? "http://127.0.0.1:3002",
      "/openapi.json": process.env.TRACKER_URL ?? "http://127.0.0.1:3002",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "prosemirror",
              test: /node_modules[\\/]prosemirror/,
            },
            {
              name: "tiptap",
              test: /node_modules[\\/](@tiptap|@editorcn)/,
            },
            {
              name: "aria-ui",
              test: /node_modules[\\/](react-aria|@react-aria|@react-stately|@internationalized|@base-ui)/,
            },
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|scheduler)/,
            },
          ],
        },
      },
    },
  },
});
