import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('UI copy punctuation', () => {
  it('keeps em dash characters out of mobile and core source', () => {
    const result = spawnSync(
      'grep',
      [
        '-R',
        '-n',
        '-F',
        '—',
        'packages/core/src',
        'apps/mobile/src',
        'apps/mobile/targets',
        '--include=*.ts',
        '--include=*.tsx',
        '--include=*.swift',
      ],
      { encoding: 'utf8' },
    )

    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
  })
})
