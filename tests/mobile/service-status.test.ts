import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkServiceStatus,
  resetServiceStatus,
} from '../../apps/mobile/src/features/status/serviceStatus'

const read = (relative: string) =>
  readFile(new URL(`../../apps/mobile/src/${relative}`, import.meta.url), 'utf8')

/**
 * During the July 29th database incident somebody signed out, tried other
 * accounts and finally deleted the app, and none of it could have helped: the
 * service was down and every screen was telling them to check their own
 * connection. The app had no way to know the difference, so it guessed, and it
 * guessed the one way that sends people looking for something to break.
 */
describe('service status', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    resetServiceStatus()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const respond = (body: unknown) =>
    fetchMock.mockResolvedValue({ ok: true, json: async () => body })

  it('names what is down when the status page reports an outage', async () => {
    respond({
      overall: { state: 'down' },
      components: [
        { name: 'Uygulama sunucusu', state: 'up' },
        { name: 'Veritabanı', state: 'down' },
      ],
    })

    await expect(checkServiceStatus()).resolves.toEqual({
      verdict: 'outage',
      affected: ['Veritabanı'],
    })
  })

  it('trusts a component over a healthy looking overall state', async () => {
    respond({
      overall: { state: 'up' },
      components: [{ name: 'Yapay zekâ servisi', state: 'degraded' }],
    })

    await expect(checkServiceStatus()).resolves.toEqual({
      verdict: 'outage',
      affected: ['Yapay zekâ servisi'],
    })
  })

  it('reports healthy when nothing is wrong, so a retry is the honest advice', async () => {
    respond({ overall: { state: 'up' }, components: [{ name: 'Veritabanı', state: 'up' }] })

    await expect(checkServiceStatus()).resolves.toEqual({ verdict: 'healthy' })
  })

  it('says nothing rather than blaming us when it cannot reach the page either', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'))

    /* Unreachable status page plus unreachable API is the shape of a device
       that is simply offline, which is the one case where the old wording was
       right. */
    await expect(checkServiceStatus()).resolves.toEqual({ verdict: 'unknown' })
  })

  it('treats an unreadable answer as unknown, never as healthy', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) })

    await expect(checkServiceStatus()).resolves.toEqual({ verdict: 'unknown' })
  })

  it('answers a burst of failing screens with one request', async () => {
    respond({ overall: { state: 'up' }, components: [] })

    await Promise.all([checkServiceStatus(), checkServiceStatus(), checkServiceStatus()])
    await checkServiceStatus()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('asks again once the cached answer is stale', async () => {
    respond({ overall: { state: 'up' }, components: [] })
    let clock = 0
    const now = () => clock

    await checkServiceStatus(now)
    clock += 60_000
    await checkServiceStatus(now)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reads the status page from a host that is not the one that failed', async () => {
    const source = await read('features/status/serviceStatus.ts')

    /* The API is on Cloud Run and the status page is on Vercel. Asking the
       failing service whether it is failing would answer nothing. */
    expect(source).toContain('https://afiet.co/api/status')
    expect(source).not.toContain('config.apiUrl')
  })
})

describe('failure screens', () => {
  it('stop telling people to check a connection that is fine', async () => {
    const [skeleton, layout, message] = await Promise.all([
      read('ui/PageSkeleton.tsx'),
      read('app/(tabs)/_layout.tsx'),
      read('features/status/OutageMessage.tsx'),
    ])

    // Both failure screens defer their wording to the same place.
    for (const source of [skeleton, layout]) {
      expect(source).toContain('<OutageMessage status={status} />')
      expect(source).not.toContain('Bağlantını kontrol edip')
    }
    expect(message).toContain('Sorun sende değil')
    expect(message).toContain('Durum sayfası')
  })

  it('keeps the sign-out escape while it is a known outage', async () => {
    const layout = await read('app/(tabs)/_layout.tsx')

    /* The escape hatch itself must never be conditional; only how loudly it
       asks for attention. A screen with no way off it is how the reinstalls
       started. */
    expect(layout).toContain('onSignOut')
    expect(layout).toContain("'Yine de çıkış yap'")
  })

  it('retries by itself when the app comes back', async () => {
    const notice = await read('features/status/useOutageNotice.ts')

    /* A screen that failed during an outage used to stay failed until it was
       tapped, long after the service returned. */
    expect(notice).toContain("AppState.addEventListener('change'")
    expect(notice).toContain('resetServiceStatus()')
    expect(notice).toContain('onRetry()')
  })
})
