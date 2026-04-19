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
})