import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  define: {
    // Tell the app to install the mock fetch interceptor
    'import.meta.env.VITE_STANDALONE': JSON.stringify('true'),
    // No real Azure AD credentials in standalone mode
    'import.meta.env.VITE_AZURE_CLIENT_ID': JSON.stringify(''),
    'import.meta.env.VITE_AZURE_TENANT_ID': JSON.stringify('demo'),
    'import.meta.env.VITE_AZURE_REDIRECT_URI': JSON.stringify(''),
    'import.meta.env.VITE_D365_SCOPE': JSON.stringify(''),
  },
  base: './',
  build: {
    outDir: 'dist-standalone',
    // Target modern browsers that support top-level await
    target: 'esnext',
    // Inline everything — no chunk splitting
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    // Increase limit to avoid warnings from the single-bundle size
    chunkSizeWarningLimit: 10000,
    // No source maps in standalone build
    sourcemap: false,
    // Minify for a smaller file
    minify: 'esbuild',
  },
})
