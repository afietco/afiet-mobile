import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The mascot's motion scale and the sip curves are duplicated across three
 * files on purpose: Reanimated worklets cannot capture cross-module bindings,
 * so importing a shared constant crashes at runtime with
 * "Property 'REF' doesn't exist". These tests are what keeps the copies honest.
 *
 * The scale itself matters: keyframes are written in SVG user units against a
 * 512 viewBox. A stale copy (it was 170 once) makes that layer travel roughly
 * three times too far, which is how the confetti ended up flying out of frame.
 */

const MASKOT = join(__dirname, '../../apps/mobile/src/ui/maskot')

function read(file: string): string {
  return readFileSync(join(MASKOT, file), 'utf8')
}

function scaleOf(file: string): number {
  const match = /^const REF = (\d+)$/m.exec(read(file))
  if (!match) throw new Error(`${file}: REF sabiti bulunamadı`)
  return Number(match[1])
}

/** Reads a keyframe table literal such as `const TILT = { t: [...], r: [...] }`. */
function tableOf(file: string, name: string): string {
  const match = new RegExp(`const ${name} = (\\{[^}]*\\})`, 'm').exec(read(file))
  if (!match) throw new Error(`${file}: ${name} tablosu bulunamadı`)
  // Boşluk ve sondaki virgül biçim tercihidir, değer değil.
  return match[1].replace(/\s+/g, '').replace(/,\}$/, '}')
}

describe('maskot hareket ölçeği', () => {
  const files = ['motion.ts', 'decor.tsx', 'decor-v2.tsx']

  it('üç dosyada da 512 viewBox birimine göre ölçekler', () => {
    for (const file of files) expect(scaleOf(file), file).toBe(512)
  })

  it('kopyalar birbirinden ayrışmaz', () => {
    const scales = new Set(files.map(scaleOf))
    expect(scales.size).toBe(1)
  })
})

describe('yudum eğrileri', () => {
  it('bardak eğimi motion ile decor arasında aynı', () => {
    expect(tableOf('decor.tsx', 'TILT')).toBe(tableOf('motion.ts', 'TILT'))
  })

  it('su seviyesi motion ile decor arasında aynı', () => {
    expect(tableOf('decor.tsx', 'SIP_LEVEL')).toBe(tableOf('motion.ts', 'SIP_LEVEL'))
  })
})

describe('worklet sınırı', () => {
  it('dekor dosyaları motion.ts’ten sabit import etmez', () => {
    // Bir worklet içinde kullanılan import edilmiş sabit çalışma zamanında patlar.
    for (const file of ['decor.tsx', 'decor-v2.tsx']) {
      expect(read(file), file).not.toMatch(/import\s*\{[^}]*\}\s*from\s*'\.\/motion'/)
    }
  })
})
