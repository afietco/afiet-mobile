import { describe, expect, it } from 'vitest'
import { XP_CAPS, XP_REWARDS } from '@afiet/core'
import { xpGuideLines } from './xpGuide'

describe('puan sözlüğü', () => {
  it('sayıları çekirdek tablodan alır, kopyalamaz', () => {
    const lines = xpGuideLines()
    for (const line of lines) {
      expect(line.amount).toBe(XP_REWARDS[line.source])
    }
  })

  it('her satırda tavanı söyler', () => {
    // Tavanı yazmayan satır yanlış vaat verir: 50 öğün kaydeden biri 100 puan
    // beklerdi, 6 alır.
    for (const line of xpGuideLines()) {
      expect(line.limit).not.toBe('')
      if (XP_CAPS[line.source] > 1) {
        expect(line.limit).toContain(String(XP_CAPS[line.source]))
      }
    }
  })

  it('görev ödülünü listelemez', () => {
    // Görevlerin kendi ekranı var; burada anmak beşinci bir kaynak gibi okunur.
    expect(xpGuideLines().some((line) => line.source === 'milestone')).toBe(false)
  })
})
