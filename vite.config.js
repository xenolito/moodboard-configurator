import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Eliminar console.log y debugger en producción (Oxc Vite 8)
  oxc: {
    transform: {
      drop: ['console', 'debugger'],
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          // Separar GSAP
          if (id.includes('gsap')) return 'vendor-c'
          // Separar UI libraries
          if (id.includes('@radix-ui')) return 'vendor-d'
        },
        // Anonimizar nombres de archivos con hash
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]'
      }
    },
    // Aumentar límite de advertencia de chunk size a 1000kb
    chunkSizeWarningLimit: 1000,
  }
})
