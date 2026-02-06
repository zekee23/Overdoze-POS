import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Ensure fast refresh works properly
      fastRefresh: true,
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['antd'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['axios', 'lucide-react'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 300,
    sourcemap: false,
    target: 'esnext',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      // Remove hardcoded port to prevent conflicts
      overlay: true,
    },
    headers: {
      // Only block JS chunks in development, allow other caching
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    },
    // Enable filesystem-based caching for faster restarts
    fs: {
      strict: false
    }
  },

  optimizeDeps: {
    // Pre-bundle commonly used dependencies for faster development
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'antd', 
      '@ant-design/icons',
      'axios'
    ],
    // Only force rebuild when dependencies change
    force: false
  },
})
