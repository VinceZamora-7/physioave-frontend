import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from "@tailwindcss/vite";

const enableVueDevTools = process.env.NODE_ENV !== 'production'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ...(enableVueDevTools ? [vueDevTools()] : []),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const normalizedId = id.replace(/\\/g, '/')
            if (id.includes('primeicons')) {
              return 'primeicons'
            }
            if (
              normalizedId.includes('/node_modules/primevue/')
              || normalizedId.includes('/node_modules/@primevue/')
              || normalizedId.includes('/node_modules/@primeuix/')
            ) {
              return 'primevue'
            }
            if (id.includes('@tanstack')) {
              return 'tanstack'
            }
            if (id.includes('vue-router') || id.includes('/vue/') || id.includes('pinia') || id.includes('@vueuse')) {
              return 'vue-core'
            }
            if (id.includes('axios') || id.includes('luxon') || id.includes('zod') || id.includes('idb-keyval')) {
              return 'vendor-utils'
            }
          }
          return undefined
        }
      }
    }
  }
})
