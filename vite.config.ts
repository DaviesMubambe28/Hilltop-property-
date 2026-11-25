import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const propertyRoutes = {
  name: 'property-routes',
  configureServer(server: { middlewares: { use: (handler: (request: { url?: string }, response: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((request, _response, next) => { if (request.url?.startsWith('/property/')) request.url = '/property.html'; next(); });
  },
  configurePreviewServer(server: { middlewares: { use: (handler: (request: { url?: string }, response: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((request, _response, next) => { if (request.url?.startsWith('/property/')) request.url = '/property.html'; next(); });
  },
};

export default defineConfig({
  plugins: [propertyRoutes],
  server: { port: 4173 },
  preview: { port: 4173 },
  build: { target: 'es2022', sourcemap: true, rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), properties: resolve(import.meta.dirname, 'properties.html'), sell: resolve(import.meta.dirname, 'sell.html'), about: resolve(import.meta.dirname, 'about.html'), contact: resolve(import.meta.dirname, 'contact.html'), admin: resolve(import.meta.dirname, 'admin.html'), account: resolve(import.meta.dirname, 'account.html'), property: resolve(import.meta.dirname, 'property.html'), compare: resolve(import.meta.dirname, 'compare.html') } } },
});
