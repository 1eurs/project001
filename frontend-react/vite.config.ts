import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks only to the Vite origin; /api and /files are proxied to the
// Spring backend on :8080. This sidesteps CORS entirely and streams SSE fine.
const base = process.env.VITE_BASE_PATH || '/';
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  base,
  // Shown in the print-station settings so support can confirm a device runs the
  // latest deploy without devtools (stale-cache diagnosis on Android tablets).
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ') + 'Z'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/files': { target: apiTarget, changeOrigin: true },
    },
  },
});
