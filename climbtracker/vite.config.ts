import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() as any,
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase'))                                    return 'vendor-supabase'
          if (id.includes('motion'))                                       return 'vendor-motion'
          if (id.includes('@stripe'))                                      return 'vendor-stripe'
          if (id.includes('react-dom') || id.includes('react-router'))    return 'vendor-react'
        },
      },
    },
  },
})