import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic'
  })],
  resolve: { 
    alias: {
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
    }
  },
  optimizeDeps: { 
    dedupe: ['react','react-dom','zustand'] 
  },
})
