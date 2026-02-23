import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
    // Note: vite-plugin-imagemin rimosso per vulnerabilità npm
    // Le immagini possono essere ottimizzate manualmente con imagemin-cli se necessario
  ],
  build: {
    // Minificazione e ottimizzazione
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Rimuove console.log in produzione
        drop_debugger: true
      }
    },
    // Code splitting ottimizzato
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa le librerie vendor per caching migliore
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'bootstrap-vendor': ['react-bootstrap', 'bootstrap'],
          'stripe-vendor': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          'utils': ['react-toastify']
        }
      }
    },
    // Ottimizza la dimensione dei chunk
    chunkSizeWarningLimit: 1000,
    // Sourcemaps solo in sviluppo
    sourcemap: false
  },
  // Ottimizzazione delle dipendenze
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-bootstrap']
  }
})
