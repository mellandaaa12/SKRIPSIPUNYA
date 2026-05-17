import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    rollupOptions: {
      input: './index.html',
      output: {
        // Manual chunk splitting to improve caching and load performance
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'vendor-editor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@codemirror/view',
            '@codemirror/state',
          ],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
    // Warn if a chunk exceeds 600kb (default 500kb, raised slightly for editor bundles)
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    port: 3000,
    host: 'localhost',
    open: false,
    // Proxy is only active in local dev — never shipped to production builds
    proxy: {
      '/functions/v1/backend': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})

