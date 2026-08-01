import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const src = (rel: string) =>
  readFile(new URL(`../../apps/mobile/src/${rel}`, import.meta.url), 'utf8')

describe('destek conversation safety shell', () => {
  it('gates the first open behind the intro and remembers acceptance per account', async () => {
    const screen = await src('features/chat/ChatScreen.tsx')
    expect(screen).toContain("useFtueSeen('chatDestekIntroSeen')")
    expect(screen).toContain("markFtueSeen('chatDestekIntroSeen')")
    const flags = await src('features/ftue/ftueFlags.ts')
    expect(flags).toContain("'chatDestekIntroSeen'")
  })

  it('says plainly that this is not therapy and keeps 112 reachable', async () => {
    const intro = await src('features/chat/DestekIntro.tsx')
    expect(intro).toContain('terapi değildir')
    expect(intro).toContain("112'yi ara")
    expect(intro).toContain("Linking.openURL('tel:112')")

    const screen = await src('features/chat/ChatScreen.tsx')
    // The support line stays visible inside the conversation too, not only
    // in the one-time intro.
    expect(screen).toContain("Linking.openURL('tel:112')")
    expect(screen).toContain('Bu sohbet bir terapi değildir')
  })

  it('keeps history on the device only, scoped per account', async () => {
    const store = await src('features/chat/chatStore.ts')
    expect(store).toContain("'fh:chat:account:'")
    expect(store).toContain('encodeURIComponent(accountId)')
    // No network client sneaks into the store: device-only is the phase-1
    // privacy decision, and the destek transcript especially stays local.
    expect(store).not.toContain('data/api')
  })

  it('lets the user delete a conversation after confirming', async () => {
    const screen = await src('features/chat/ChatScreen.tsx')
    expect(screen).toContain("accessibilityLabel=\"Sohbeti sil\"")
    expect(screen).toContain('Bu sohbetin geçmişi bu cihazdan silinsin mi?')
  })
})

describe('real transport wiring', () => {
  it('talks to the backend chat endpoint over the session-bound stream fetch', async () => {
    const transport = await src('features/chat/sseTransport.ts')
    expect(transport).toContain("requireStreamFetch()('/v1/afi/sohbet'")
    // History that never became conversation stays off the wire.
    expect(transport).toContain('if (t.offline || t.notice) continue')
  })

  it('drives the chat hook with the SSE transport, not the mock', async () => {
    const hook = await src('features/chat/useChat.ts')
    expect(hook).toContain('const transport = sseTransport')
    expect(hook).not.toContain('mockTransport')
  })
})

describe('content-free telemetry', () => {
  it('chat events carry the assistant id and timings, never what was typed', async () => {
    for (const rel of ['features/chat/useChat.ts', 'features/chat/ChatScreen.tsx']) {
      const source = await src(rel)
      for (const call of source.match(/track\([^)]*\)/g) ?? []) {
        // Only the props object matters; event NAMES may contain "message".
        const props = call.includes(',') ? call.slice(call.indexOf(',')) : ''
        expect(props).not.toMatch(/\b(text|draft|liveText|full|message|mesaj)\b/)
      }
    }
  })
})

describe('assistant identity rules', () => {
  it('does not publish the unreleased expert names', async () => {
    const spec = await src('features/chat/assistants.ts')
    // Pricing decision: the dietitian/psychologist prefixed names stay
    // unpublished; the assistants are titled by what they do.
    expect(spec).not.toMatch(/Diyetisyen Afi|Psikolog Afi/)
    expect(spec).toContain("title: 'Beslenme sohbeti'")
    expect(spec).toContain("title: 'Destek sohbeti'")
  })
})
