import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const firebaseShim = fileURLToPath(new URL('./src/compat/firebase.ts', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: /^firebase(\/.*)?$/, replacement: firebaseShim },
    ],
  },
  server: {
    port: 5174,
  },
})
