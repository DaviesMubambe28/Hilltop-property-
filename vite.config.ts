import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: { port: 4173 },
  preview: { port: 4173 },
  build: { target: 'es2022', sourcemap: true, rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), admin: resolve(import.meta.dirname, 'admin.html'), account: resolve(import.meta.dirname, 'account.html') } } },
});
