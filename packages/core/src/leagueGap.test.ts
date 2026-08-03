import { describe, expect, it } from 'vitest'
import { promotionGap } from './league'

const rows = [
  { rank: 1, score: 400 },
  { rank: 2, score: 350 },
  { rank: 3, score: 300 },
  { rank: 4, score: 120 },
  { rank: 5, score: 80 },
]

describe('yükselmeye kalan puan', () => {
  it('son yükselen sıranın puanına göre ölçer', () => {
    // İlk 3 yükseliyorsa 4. sıradaki kişi 3. sıranın puanına bakar.
    expect(promotionGap(rows, 3, 4, 120)).toBe(180)
  })

  it('bölgedekine mesafe göstermez', () => {
    expect(promotionGap(rows, 3, 2, 350)).toBeNull()
    expect(promotionGap(rows, 3, 3, 300)).toBeNull()
  })

  it('yükselme yoksa soruyu sormaz', () => {
    // Zirvedeki sofrada yukarısı yok.
    expect(promotionGap(rows, 0, 4, 120)).toBeNull()
  })

  it('puanı zaten yetiyorsa mesafe yazmaz', () => {
    // Beraberlikte sıra başka şeyle çözülür; "0 puan kaldı" demek yanıltıcı olurdu.
    expect(promotionGap(rows, 3, 4, 300)).toBeNull()
    expect(promotionGap(rows, 3, 4, 320)).toBeNull()
  })

  it('eksik tabloda sessiz kalır', () => {
    expect(promotionGap([], 3, 4, 120)).toBeNull()
  })
})
