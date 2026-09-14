import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'vendor-charts';
            if (id.includes('html5-qrcode')) return 'vendor-scanner';
            return 'vendor-core';
          }
        }
      }
    }
  }
})