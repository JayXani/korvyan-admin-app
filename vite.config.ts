import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const firebaseShim = fileURLToPath(new URL('./src/compat/firebase.ts', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'https://korvy.korvyan.com'

  return {
    base: '/backoffice/',
    plugins: [vue()],
    resolve: {
      alias: [
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        { find: /^firebase(\/.*)?$/, replacement: firebaseShim },
      ],
    },
    server: {
      port: 5174,
      proxy: {
        '/v1': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

