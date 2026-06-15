import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',           // index.html is at project root
  publicDir: 'public', // static assets folder
  resolve: {
    alias: {
      '@':            resolve(__dirname, './src'),
      '@components':  resolve(__dirname, './src/components'),
      '@pages':       resolve(__dirname, './src/pages'),
      '@features':    resolve(__dirname, './src/features'),
      '@hooks':       resolve(__dirname, './src/hooks'),
      '@context':     resolve(__dirname, './src/context'),
      '@redux':       resolve(__dirname, './src/redux'),
      '@services':    resolve(__dirname, './src/services'),
      '@utils':       resolve(__dirname, './src/utils'),
      '@assets':      resolve(__dirname, './src/assets'),
      '@layout':      resolve(__dirname, './src/layout'),
    },
  },
  server: {
    port: 3000,
    open: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
