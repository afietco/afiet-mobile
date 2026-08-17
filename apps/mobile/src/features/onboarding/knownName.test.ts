import { describe, expect, it } from 'vitest'
import { firstNameOf } from './knownName'

describe('the name a provider already gave us', () => {
  it('keeps the first name only, trimmed', () => {
    expect(firstNameOf('  Berk Karataş ')).toBe('Berk')
    expect(firstNameOf('Ayşe')).toBe('Ayşe')
    expect(firstNameOf('')).toBe('')
  })

  it('never exceeds the identity field', () => {
    expect(firstNameOf('A'.repeat(40) + ' B')).toHaveLength(20)
  })
})
