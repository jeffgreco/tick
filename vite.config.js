import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // accessible from other devices on the network
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
