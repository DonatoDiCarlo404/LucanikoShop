import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteImagemin from 'vite-plugin-imagemin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Ottimizzazione automatica immagini in build
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false
      },
      optipng: {
        optimizationLevel: 7
      },
      mozjpeg: {
        quality: 80
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox'
          },
          {
            name: 'removeEmptyAttrs',
            active: false
          }
        ]
      }
    })
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
