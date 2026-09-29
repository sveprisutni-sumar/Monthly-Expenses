import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The tax office's receipt verification site blocks cross-origin browser
// requests, so the app reaches it through this local proxy.
const fiscalProxy = {
  '/suf': {
    target: 'https://suf.purs.gov.rs',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/suf/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed port: browser storage (IndexedDB) is tied to the exact address,
  // so the app must always open on the same URL to see the same data.
  server: { port: 5173, strictPort: true, open: true, proxy: fiscalProxy },
  preview: { port: 5173, strictPort: true, open: true, proxy: fiscalProxy },
})
