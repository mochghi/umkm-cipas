import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default defineConfig({
  // Base path for production build
  base: '/',
  
  // Development server options
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  
  // Build options
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['aos', 'leaflet', 'leaflet-routing-machine', 'nprogress']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  },
  
  // Plugins
  plugins: [
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'UMKM CIPAS — Segar dari Kebun',
          description: 'UMKM CIPAS - Menyediakan sayuran segar langsung dari petani. Pesan online, antar lokal.'
        }
      }
    })
  ],
  
  // CSS optimization
  css: {
    postcss: {
      plugins: [
        autoprefixer,
        cssnano({
          preset: ['default', {
            discardComments: { removeAll: true }
          }]
        })
      ]
    }
  }
});