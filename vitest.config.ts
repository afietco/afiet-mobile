import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'node',
    include: ['apps/mobile/**/*.test.ts', 'packages/core/**/*.test.ts', 'tests/**/*.test.ts'],
    restoreMocks: true,
  },
})
