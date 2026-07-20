const APP_BASE_URL = 'https://afiet.co'
const INVITE_CODE_LENGTH = 8
const INVITE_LABEL_LENGTH = 60

type RouteParam = string | string[] | undefined

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

export interface GroupInviteRouteParams {
  inviteCode?: RouteParam
  groupName?: RouteParam
  inviterName?: RouteParam
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

function firstRouteParam(value: RouteParam): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

function inviteQuery(context: GroupInviteContext): string {
  return [
    ['groupName', normalizeInviteLabel(context.groupName)],
    ['inviterName', normalizeInviteLabel(context.inviterName)],
  ]
    .filter((entry): entry is [string, string] => entry[1] != null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
}

export function createGroupInvitePath(code: string, context: GroupInviteContext = {}): string {
  const normalizedCode = normalizeInviteCode(code)
  const query = inviteQuery(context)
  return `/katil/${normalizedCode}${query ? `?${query}` : ''}`
}

export function createGroupInviteLink(code: string, context: GroupInviteContext = {}): string {
  return `${APP_BASE_URL}${createGroupInvitePath(code, context)}`
}

export function groupInviteFromRouteParams(
  params: GroupInviteRouteParams,
): PendingGroupInvite | null {
  const code = normalizeInviteCode(firstRouteParam(params.inviteCode))
  if (code.length !== INVITE_CODE_LENGTH) return null

  return {
    code,
    groupName: normalizeInviteLabel(firstRouteParam(params.groupName)),
    inviterName: normalizeInviteLabel(firstRouteParam(params.inviterName)),
  }
}

export function groupInviteAuthParams(invite: PendingGroupInvite): Record<string, string> {
  const params: Record<string, string> = { inviteCode: invite.code }
  if (invite.groupName) params.groupName = invite.groupName
  if (invite.inviterName) params.inviterName = invite.inviterName

  return params
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
