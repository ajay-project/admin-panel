import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        /**
         * Vite 8 uses rolldown which requires manualChunks as a function.
         * Object syntax is only valid in rollup (Vite < 6).
         *
         * Chunks:
         *  - "vendor-react"   : React + ReactDOM + React-Router (unchanged between deploys)
         *  - "vendor-supabase": Supabase JS client (large, rarely changes)
         *  - Page chunks are automatically created by React.lazy() in App.jsx
         */
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/react-router-dom/")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }
        },
      },
    },
    // Individual vendor chunks are expected to be ~150-200KB each.
    // Raise warning limit so only genuinely oversized user code is flagged.
    chunkSizeWarningLimit: 600,
  },

  preview: {
    host: "0.0.0.0",
    port: process.env.PORT || 4173,
    allowedHosts: ["admin-panel-6tlx.onrender.com"],
  },
});