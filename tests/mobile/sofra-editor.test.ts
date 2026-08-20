import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Building a sofra stopped being a scroll past everything you own.
 *
 * The editor printed the whole menu inline, under the name and the meal chips,
 * with the save button below all of it on a sheet already 92% of the screen.
 * With five foods that is fine; with fifty the button is somewhere off the
 * bottom and finishing a sofra means scrolling past every food you have ever
 * taught the app.
 */
const read = (rel: string) =>
  readFileSync(new URL(`../../apps/mobile/src/${rel}`, import.meta.url), 'utf8')

const editor = read('features/nutrition/SofraSheet.tsx')
const picker = read('features/nutrition/MenuPickerSheet.tsx')

describe('the sofra editor', () => {
  it('puts save beside the name, once there is a name to save', () => {
    expect(editor).toContain('{name.trim().length > 0 ? (')
    /* Only a save already in flight takes the tick out of service. A sofra
       with nothing on it answers the press instead of swallowing it. */
    expect(editor).toContain('accessibilityState={{ disabled: saving, busy: saving }}')
  })

  it('keeps one save, not two', () => {
    expect(editor.match(/gate\.attempt\(/g) ?? []).toHaveLength(1)
  })

  it('says why it cannot save yet rather than just dimming', () => {
    expect(editor).toContain('önce en az bir besin seçmelisin')
    expect(editor).toContain('Sofrana aşağıdan en az bir besin seç.')
  })

  it('lists what is on the table, never the whole menu', () => {
    expect(editor).toContain('<MenuPickerSheet')
    expect(editor).toContain('Menümden seç')
    // The inline map over every menu food is gone; only `foods` is drawn.
    expect(editor).not.toContain('menu.map(')
  })

  it('still tells somebody with an empty menu where to start', () => {
    expect(editor).toContain('önce menüne birkaç besin eklemen gerekiyor')
  })
})

describe('the menu picker', () => {
  it('searches, because a long list is looked through rather than read', () => {
    expect(picker).toContain('Menünde ara')
    expect(picker).toContain('turkishLower(food.name).includes(q)')
  })

  it('draws a page at a time and grows', () => {
    expect(picker).toContain('const PAGE = 20')
    expect(picker).toContain('matches.slice(0, shown)')
    expect(picker).toContain('besin daha')
  })

  it('restarts the page count on a new query', () => {
    // Keeping the old count would show results nobody scrolled to.
    expect(picker).toContain('setShown(PAGE)')
  })

  it('confirms the whole selection rather than writing each tap', () => {
    expect(picker).toContain('`Ekle (${String(picked.length)})`')
    expect(picker).toContain('onDone(picked)')
  })

  it('says the two empty states apart', () => {
    expect(picker).toContain('Menün henüz boş')
    expect(picker).toContain('için menünde bir şey yok')
  })
})
