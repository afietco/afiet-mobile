import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The purse is gone from the app, and what afiet+ sells is a door.
 *
 * The kese was a weekly message allowance shown in four places, and premium
 * sold a bigger one. That made every screen carry arithmetic: a chip counting
 * down, a sheet explaining the count, an empty state, and a paywall quoting the
 * number so the promise could be checked. What is sold now is access to Sini
 * and Demi, and a door needs none of it.
 */
const read = (rel: string) =>
  readFileSync(new URL(`../../apps/mobile/src/${rel}`, import.meta.url), 'utf8')

const gate = read('features/chat/AssistantGate.tsx')
const chat = read('features/chat/ChatScreen.tsx')
const premium = read('app/premium.tsx')
const header = read('features/nav/AppHeader.tsx')
const progress = read('features/progress/ProgressCard.tsx')

describe('the kese is gone from the app', () => {
  it('leaves no counter, sheet or empty state behind', () => {
    for (const [name, source] of [
      ['chat', chat],
      ['header', header],
      ['progress card', progress],
      ['premium', premium],
    ] as const) {
      expect(source, name).not.toMatch(/KeseChip|KeseSheet|EmptyKese|useKese/)
    }
  })

  it('stops the paywall quoting an allowance nothing displays', () => {
    expect(premium).not.toContain('KESE_PREMIUM_BONUS')
    expect(premium).not.toMatch(/mesaj daha/)
  })

  it('never blocks the composer on a purse that no longer exists', () => {
    expect(chat).not.toContain('keseEmpty')
    expect(chat).not.toContain('sendBlocked')
  })
})

describe('the assistant gate', () => {
  it('stands in front of the two paid assistants and nowhere else', () => {
    expect(chat).toContain("if (assistant !== 'afi' && !isPremium)")
    expect(chat).toContain('<AssistantGate assistant={assistant} />')
  })

  it('comes before the consent screen, which is for a room you can enter', () => {
    expect(chat.indexOf('<AssistantGate')).toBeLessThan(chat.indexOf('<DestekIntro'))
  })

  it('introduces the character before it asks for money', () => {
    /* A lock and a price teaches nobody who Sini is. The mascot is full size,
       the character says what it is for, and the button is last. */
    expect(gate).toContain('size={128}')
    expect(gate.indexOf('PITCH')).toBeLessThan(gate.indexOf('afiet+ ile aç'))
    expect(gate).not.toContain('IconLock')
  })

  it('says what is still free, on the screen that asks for money', () => {
    expect(gate).toContain('Afi her zaman ücretsiz')
  })
})
