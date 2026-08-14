import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearNotifications,
  markAllRead,
  markRead,
  refreshNotifications,
  unreadCount,
  useNotifications,
} from './notifications'

const mocks = vi.hoisted(() => ({
  api: { notifications: vi.fn(), readNotification: vi.fn(), ackNotifications: vi.fn() },
}))

vi.mock('@/data/api/apiHolder', () => ({ requireApi: () => mocks.api }))
vi.mock('react', () => ({
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}))

const item = (over: Record<string, unknown>) => ({
  id: 'id-1',
  kind: 'greeting',
  fromName: 'Deniz',
  date: '2026-08-13',
  createdAt: '2026-08-13T09:00:00Z',
  read: false,
  ...over,
})

beforeEach(() => {
  mocks.api.notifications.mockReset()
  mocks.api.readNotification.mockReset()
  mocks.api.readNotification.mockResolvedValue(undefined)
  mocks.api.ackNotifications.mockReset()
  mocks.api.ackNotifications.mockResolvedValue(undefined)
  clearNotifications()
})

describe('bell items', () => {
  it('shows a celebration with the words the server wrote', async () => {
    mocks.api.notifications.mockResolvedValue({
      items: [
        item({
          id: 'kutlama',
          kind: 'quest_reward',
          fromName: '',
          title: 'Kalfa oldun',
          body: 'Kesene bir hafta daha eklendi.',
          target: 'gorevlerim',
        }),
      ],
    })

    await refreshNotifications()

    const [first] = useNotifications().items
    expect(first?.text).toBe('Kalfa oldun')
    expect(first?.detail).toBe('Kesene bir hafta daha eklendi.')
    expect(first?.emoji).toBe('🏅')
    expect(first?.target).toBe('gorevlerim')
  })

  // Putting words in the server's mouth is worse than drawing nothing: a kind
  // this build has never heard of used to fall through to "afiyet olsun dedi".
  it('drops an unknown kind that brought no words', async () => {
    mocks.api.notifications.mockResolvedValue({
      items: [item({ id: 'bilinmeyen', kind: 'yepyeni_tur', fromName: '' })],
    })

    await refreshNotifications()

    expect(useNotifications().items).toHaveLength(0)
  })

  it('still writes the social sentence itself', async () => {
    mocks.api.notifications.mockResolvedValue({ items: [item({})] })

    await refreshNotifications()

    expect(useNotifications().items[0]?.text).toBe('Deniz afiyet olsun dedi')
  })
})

describe('per-item read', () => {
  it('marks one item and leaves the other unread', async () => {
    mocks.api.notifications.mockResolvedValue({
      items: [item({ id: 'a' }), item({ id: 'b' })],
    })
    await refreshNotifications()
    expect(unreadCount(useNotifications())).toBe(2)

    markRead('a')

    expect(unreadCount(useNotifications())).toBe(1)
    expect(useNotifications().items.find((n) => n.id === 'a')?.read).toBe(true)
    expect(mocks.api.readNotification).toHaveBeenCalledWith('a')
  })

  it('does not spend a request on an item that is already read', async () => {
    mocks.api.notifications.mockResolvedValue({ items: [item({ id: 'a', read: true })] })
    await refreshNotifications()

    markRead('a')

    expect(mocks.api.readNotification).not.toHaveBeenCalled()
  })

  /* Sebebi açık olan kalem (alınmamış ödül): işaret yazılır ama kalem
     okunmuş gösterilmez. Yerelde okumak onu "Yeni"den çıkarır, sunucu ise
     okundu saymadığı için bir sonraki tazeleme geri koyardı. */
  it('writes the mark but keeps a pending item unread', async () => {
    mocks.api.notifications.mockResolvedValue({
      items: [item({ id: 'odul', kind: 'quest_reward', title: 'Bir ödül seni bekliyor', pending: true })],
    })
    await refreshNotifications()

    markRead('odul')

    expect(useNotifications().items[0]?.read).toBe(false)
    expect(mocks.api.readNotification).toHaveBeenCalledWith('odul')
  })

  it('leaves a pending item alone when everything is marked read', async () => {
    mocks.api.notifications.mockResolvedValue({
      items: [
        item({ id: 'odul', kind: 'quest_reward', title: 'Bir ödül seni bekliyor', pending: true }),
        item({ id: 'selam' }),
      ],
    })
    await refreshNotifications()

    markAllRead()

    const byId = Object.fromEntries(useNotifications().items.map((n) => [n.id, n]))
    expect(byId.odul?.read).toBe(false)
    expect(byId.selam?.read).toBe(true)
  })

  // A lost mark must cost one more tap, never an error the person sees.
  it('keeps the item read locally when the request fails', async () => {
    mocks.api.notifications.mockResolvedValue({ items: [item({ id: 'a' })] })
    await refreshNotifications()
    mocks.api.readNotification.mockRejectedValue(new Error('Network request failed'))

    markRead('a')

    expect(useNotifications().items[0]?.read).toBe(true)
  })
})
