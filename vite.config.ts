import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from "@tailwindcss/vite";

const enableVueDevTools = process.env.NODE_ENV !== 'production'
const heavyPrimeVueChunks = new Set([
  'datatable',
  'datepicker',
  'dialog',
  'fileupload',
  'inputnumber',
  'menu',
  'multiselect',
  'select',
  'toast'
])

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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('primeicons')) {
              return 'primeicons'
            }
            if (id.includes('@primeuix')) {
              return 'primeuix-theme'
            }
            if (id.includes('primevue')) {
              const normalizedId = id.replace(/\\/g, '/')
              const match = normalizedId.match(/\/node_modules\/primevue\/([^/]+)/)
              const chunkName = match?.[1]
              if (chunkName && heavyPrimeVueChunks.has(chunkName)) {
                return `primevue-${chunkName}`
              }
              return 'primevue-core'
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

          if (id.includes('/src/features/appointments/')) return 'appointments'
          if (id.includes('/src/features/billing/')) return 'billing'
          if (id.includes('/src/features/patients/')) return 'patients'
          if (id.includes('/src/features/promos-offers/')) return 'promos-offers'
          if (id.includes('/src/features/reports/')) return 'reports'
          if (id.includes('/src/features/dashboard/')) return 'dashboard'

          return undefined
        }
      }
    }
  }
})
