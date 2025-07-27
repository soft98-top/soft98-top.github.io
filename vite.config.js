import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/index.html'
      }
    },
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser'
  },
  server: {
    port: 3000,
    open: true
  },
  publicDir: '../public',
  base: './'
});