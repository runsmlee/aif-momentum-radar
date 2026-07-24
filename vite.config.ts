/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { prerenderPlugin } from './scripts/prerender';

export default defineConfig(({ mode }) => ({
  plugins: [react(), prerenderPlugin()],
  define: {
    // Use the actual Vite mode so production builds get NODE_ENV=production
    'process.env.NODE_ENV': JSON.stringify(mode === 'test' ? 'test' : mode),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
  },
}));
