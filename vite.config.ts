import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Extra hostnames the dev server accepts, as a comma-separated env var. This keeps
// per-session cloud preview hostnames out of the committed config; plain local
// development is always allowed through localhost.
const extraHosts =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.VITE_ALLOWED_HOSTS?.split(',')
    .map((host) => host.trim())
    .filter(Boolean) ?? []

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: extraHosts,
  },
  build: {
    target: 'es2020',
  },
})
