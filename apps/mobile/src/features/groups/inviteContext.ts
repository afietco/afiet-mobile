const INVITE_BASE_URL = 'https://afiet.co/katil'
const INVITE_CODE_LENGTH = 8
const INVITE_LABEL_LENGTH = 60

export interface GroupInviteContext {
  groupName?: string | null
  inviterName?: string | null
}

export interface PendingGroupInvite {
  code: string
  groupName: string | null
  inviterName: string | null
}

export interface GroupInviteCopy {
  title: string
  body: string
}

type InviteAuthStatus = 'loading' | 'authed' | 'anon'

export type GroupInviteDestination = '/grubum' | '/intro' | '/first-meal' | '/login' | null

export function normalizeInviteCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH)
}

export function normalizeInviteLabel(raw: string | null | undefined): string | null {
  if (!raw) return null
  const normalized = raw
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized) return null
  return Array.from(normalized).slice(0, INVITE_LABEL_LENGTH).join('')
}

export function createGroupInviteLink(code: string, context: GroupInviteContext = {}): string {
  const normalizedCode = normalizeInviteCode(code)
  const query = [
    ['groupName', normalizeInviteLabel(context.groupName)],
    ['inviterName', normalizeInviteLabel(context.inviterName)],
  ]
    .filter((entry): entry is [string, string] => entry[1] != null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

  return `${INVITE_BASE_URL}/${normalizedCode}${query ? `?${query}` : ''}`
}

export function groupInviteCopy(invite: PendingGroupInvite): GroupInviteCopy {
  if (invite.inviterName) {
    return {
      title: `${invite.inviterName} seni sofrasına çağırdı`,
      body: invite.groupName
        ? `“${invite.groupName}” grubuna katılmak için giriş yap veya hesabını oluştur.`
        : 'Gruba katılmak için giriş yap veya hesabını oluştur.',
    }
  }

  if (invite.groupName) {
    return {
      title: `“${invite.groupName}” sofrasına davetlisin`,
      body: 'Gruba katılmak için giriş yap veya hesabını oluştur.',
    }
  }

  return {
    title: 'Bir yakınından sofra davetin var',
    body: 'Gruba katılmak için giriş yap veya hesabını oluştur.',
  }
}

export function groupInviteDestination(
  status: InviteAuthStatus,
  welcomeIntroSeen: boolean,
  firstValueCaptured: boolean,
): GroupInviteDestination {
  if (status === 'loading') return null
  if (status === 'authed') return '/grubum'
  if (!welcomeIntroSeen) return '/intro'
  if (!firstValueCaptured) return '/first-meal'
  return '/login'
}
