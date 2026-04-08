import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://158.160.19.182:8000',
        changeOrigin: true,
      },
    },
  },
  // @ts-expect-error
  test: { globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: false, exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'] },
})
