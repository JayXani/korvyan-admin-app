import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const firebaseShim = fileURLToPath(new URL('./src/compat/firebase.ts', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'firebase': firebaseShim,
      'firebase/app': firebaseShim,
      'firebase/firestore': firebaseShim,
      'firebase/auth': firebaseShim,
      'firebase/storage': firebaseShim,
      'firebase/analytics': firebaseShim,
    },
  },
  server: {
    port: 5174,
  },
})
