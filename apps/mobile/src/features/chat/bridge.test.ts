import { describe, expect, it } from 'vitest'
import { detectBridge } from './bridge'

describe('detectBridge', () => {
  it('turns a verbal referral into a doorway to the named conversation', () => {
    const hit = detectBridge('afi', 'Bunun için Beslenme Sohbeti tam yeri, orada haftana bakarız.')
    expect(hit).toEqual({ target: 'beslenme', label: 'Beslenme sohbetine geç' })
  })

  it('offers the destek doorway with Turkish-aware casing', () => {
    const hit = detectBridge('beslenme', 'İstersen DESTEK SOHBETİ sana eşlik edebilir.')
    expect(hit?.target).toBe('destek')
  })

  it('never bridges a conversation to itself', () => {
    expect(detectBridge('destek', 'destek sohbeti zaten burası')).toBeNull()
  })

  it('stays quiet when no conversation is named', () => {
    expect(detectBridge('afi', 'Bugün sofran dengeli görünüyor.')).toBeNull()
  })
})
