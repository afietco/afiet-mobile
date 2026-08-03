import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const src = (rel: string) =>
  readFile(new URL(`../../apps/mobile/src/${rel}`, import.meta.url), 'utf8')

describe('destek conversation safety shell', () => {
  it('gates the first open behind the intro and remembers acceptance per account', async () => {
    const screen = await src('features/chat/ChatScreen.tsx')
    expect(screen).toContain("useFtueSeen('chatDestekConsent2026_08')")
    expect(screen).toContain("markFtueSeen('chatDestekConsent2026_08')")
    const flags = await src('features/ftue/ftueFlags.ts')
    expect(flags).toContain("'chatDestekConsent2026_08'")
  })

  // Consent to storing special-category data has to be provable, and a flag on
  // the device is not proof: it disappears with a reinstall. The screen may
  // only be dismissed once the server has accepted the consent, so the flag is
  // set inside the success path and nowhere else.
  it('records consent on the server before it stops asking', async () => {
    const screen = await src('features/chat/ChatScreen.tsx')
    expect(screen).toContain('acceptChatConsent')
    const accept = screen.slice(screen.indexOf('acceptChatConsent'))
    const markAt = accept.indexOf("markFtueSeen('chatDestekConsent2026_08')")
    const catchAt = accept.indexOf('.catch(')
    expect(markAt, 'onay bayrağı sunucu çağrısından sonra set edilmeli').toBeGreaterThan(-1)
    expect(markAt, 'bayrak hata yolundan önce, yani .then içinde olmalı').toBeLessThan(catchAt)
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
    // An assistant holds many conversations now, so a conversation is deleted
    // by name from the list of them rather than by clearing whatever is on
    // screen. The confirmation is unchanged.
    const drawer = await src('features/chat/ChatSessionsDrawer.tsx')
    // No longer "from this device": the conversation lives on the server too,
    // and the confirmation has to describe what actually happens.
    expect(drawer).toContain('Bu sohbetin geçmişi silinsin mi? Sunucudan da gider.')
    const chat = await src('features/chat/useChat.ts')
    expect(chat, 'silme sunucuya da gitmeli').toContain('deleteChatSession')
    expect(drawer).toContain('accessibilityLabel="Sohbeti sil"')
  })

  it('keeps every conversation of an account apart from every other', async () => {
    const store = await src('features/chat/chatStore.ts')
    // One key per conversation, all of them under the account-scoped prefix.
    expect(store).toContain(':s:${sessionId}')
    expect(store).toContain(':index')
    // The single pre-sessions history becomes the first conversation rather
    // than being stranded under a key nothing reads.
    expect(store).toContain('adoptLegacyHistory')
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
    // unpublished; the assistants are titled by what they are to the reader.
    expect(spec).not.toMatch(/Diyetisyen Afi|Psikolog Afi/)
    expect(spec).toContain("title: 'Kişisel beslenme uzmanım'")
    expect(spec).toContain("title: 'Kişisel destek uzmanım'")
  })
})
