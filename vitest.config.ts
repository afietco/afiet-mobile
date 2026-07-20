import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/mobile/src', import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    environment: 'node',
    include: ['apps/mobile/**/*.test.ts', 'packages/core/**/*.test.ts', 'tests/**/*.test.ts'],
    restoreMocks: true,
  },
})
