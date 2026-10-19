import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// v1 runs on :3002, the back-end on :9001 — v2 gets its own port.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 3003 },
  preview: { port: 3003 },
});
