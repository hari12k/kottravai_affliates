import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // disable for prod — saves ~40% build size
    rollupOptions: {
      output: {
        // ─── Manual Chunks: isolate heavy admin-only libraries ─────────────────
        // jspdf + html2canvas: ~900 kB, only needed in AdminDashboard
        // recharts: ~160 kB, only needed in AdminDashboard
        // supabase: ~100 kB, shared but stable — cache long-term
        // react-vendor: React core — very stable, cache forever
        manualChunks(id) {
          // Admin-only PDF/Canvas libraries (never downloaded by customers)
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'vendor-pdf'
          }
          // Recharts + D3 chart library (admin only)
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'vendor-charts'
          }
          // Axios
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios'
          }
          // React Helmet — page titles/meta
          if (id.includes('node_modules/react-helmet-async')) {
            return 'vendor-helmet'
          }
          // DOMPurify + Icons
          if (id.includes('dompurify') || id.includes('lucide-react')) {
            return 'vendor-utils'
          }
          // React DOM — most stable, cache forever
          if (id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router'
          }
        },
      },
    },
    // Warn at 600 kB instead of default 500 kB (AdminDashboard will still be large until full lazy-split)
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
