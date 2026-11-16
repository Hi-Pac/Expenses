import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './', // Allows running properly on GitHub Pages (https://hi-pac.github.io/Expenses/)
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
})
