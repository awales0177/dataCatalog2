import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Some dependencies still reference Node's `global`; map it for the browser bundle.
  define: {
    global: 'globalThis',
  },
  resolve: {
    // One React instance for the whole app (avoids "Invalid hook call" / null dispatcher in dev).
    dedupe: ['react', 'react-dom'],
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
  },
  preview: {
    port: 3000,
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
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
