import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devProxyTarget = env.DEV_PROXY_TARGET || 'http://localhost:8083'

  return {
    plugins: [react()],
    server: {
      allowedHosts: true,
      proxy: {
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
