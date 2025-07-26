import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from 'vite-jsconfig-paths'
import eslint from 'vite-plugin-eslint';
import svgr from 'vite-plugin-svgr'
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    jsconfigPaths(),
    svgr(),
    eslint(),
    tailwindcss(),
  ],
  build: {
    // Enable source maps for production builds
    sourcemap: true,
  },
  // Enable source maps for development (this is usually on by default)
  css: {
    devSourcemap: true
  }
})