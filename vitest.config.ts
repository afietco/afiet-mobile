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
    /*
     * Several suites are deliberate exhaustive sweeps: every Afi moment across
     * the whole state matrix, and every alias of all 2007 catalogue foods. They
     * pass in well under a second on their own, but the default 5s is measured
     * per test while the whole suite runs in parallel, so they started timing
     * out as the catalogue and the moment set grew. The work is wanted; the
     * ceiling just has to sit above the contention, while staying low enough to
     * still catch a genuine hang.
     */
    testTimeout: 30_000,
  },
})
