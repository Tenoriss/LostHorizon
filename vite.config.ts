import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // the cloud preview proxy reaches the dev server through this hostname
    allowedHosts: ['pv-06e29ea1a61d-6fe8a475-039b-48eb-8507-5b125b6db2dd.style.dev'],
  },
  build: {
    target: 'es2020',
  },
})
