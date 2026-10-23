import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // MUI components render slowly in jsdom; keep slow machines from failing on the 5s default.
    testTimeout: 15000,
  },
})
