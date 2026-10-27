
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuración de React y Tailwind CSS
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/auth': {
        target: 'https://gph6pj52-3003.use2.devtunnels.ms',
        changeOrigin: true,
      },
    },
  },
})
