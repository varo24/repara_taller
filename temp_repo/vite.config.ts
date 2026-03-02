import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: debe coincidir con el nombre del repositorio en GitHub Pages
  base: '/reparaciones-taller/',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    host: true,
  },
  envPrefix: 'VITE_',
});
