import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    rollupOptions: {
      input: './index.html',
      output: {
        // Manual chunk splitting — intentionally excludes @tiptap/* and @codemirror/*
        // so that Rollup can deduplicate their shared react/react-dom dependency correctly.
        // Putting editor packages in their own chunk causes a second copy of react-dom
        // to get bundled in, which triggers the __SECRET_INTERNALS runtime crash.
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
          'vendor-motion': ['framer-motion'],
        },
      },
    },
    // Warn if a chunk exceeds 700kb (editor chunks can be large)
    chunkSizeWarningLimit: 700,
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Force a single instance of react and react-dom across all chunks.
    // This is the critical fix: without this, @tiptap/react may bundle its own
    // copy of react-dom, creating two React instances that conflict and throw
    // "Cannot read properties of undefined (__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED)"
    dedupe: ['react', 'react-dom'],
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
