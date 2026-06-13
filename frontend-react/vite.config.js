import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The browser talks only to the Vite origin; /api and /files are proxied to the
// Spring backend on :8080. This sidesteps CORS entirely and streams SSE fine.
var base = process.env.VITE_BASE_PATH || '/';
var apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8080';
export default defineConfig({
    plugins: [react()],
    base: base,
    server: {
        port: 5173,
        proxy: {
            '/api': { target: apiTarget, changeOrigin: true },
            '/files': { target: apiTarget, changeOrigin: true },
        },
    },
});
