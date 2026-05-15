import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Eliminar referencias a CSS del index.html generado solo en build para WordPress
    ...(process.env.VITE_WP_BUILD ? [{
      name: 'remove-css-links',
      transformIndexHtml(html) {
        return html.replace(/<link[^>]+\.css[^>]*>/g, '')
      }
    }] : [])
  ],
  // Eliminar console.* y debugger solo en producción (Oxc Vite 8)
  ...(mode === 'production' && {
    oxc: {
      transform: {
        drop: ['console', 'debugger'],
      },
    },
  }),
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
}))
