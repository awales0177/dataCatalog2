import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Some dependencies still reference Node's `global`; map it for the browser bundle.
  define: {
    global: 'globalThis',
  },
  plugins: [
    react({
      include: '**/*.{jsx,js}',
    }),
  ],
  server: {
    // 0.0.0.0: same dev server for localhost, 127.0.0.1, and LAN (avoids odd Cursor vs Chrome mismatches).
    host: true,
    port: 3000,
    strictPort: true,
    // UI on :3000, FastAPI on :8000 — same-origin `/api` from the browser (see api.js).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
});
