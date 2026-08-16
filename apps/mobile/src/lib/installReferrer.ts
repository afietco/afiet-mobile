/**
 * Pure parser for the Play Install Referrer string. It has no React Native
 * dependency so vitest can exercise it directly; reading and reporting live in
 * `acquisition.ts`.
 */

const MAX_LEN = 120

export type ClickKind = 'gclid' | 'gbraid' | 'wbraid'

export interface InstallReferrerProps extends Record<string, unknown> {
  /** utm_source; 'none' when the referrer is empty, 'google-play' for Play organic. */
  source: string
  medium: string | null
  campaign: string | null
  content: string | null
  term: string | null
  /** Kind of ad click id present; the id itself is never sent. */
  click: ClickKind | null
  /** No referrer at all (direct APK, sideload, old Play). */
  empty: boolean
}

function decode(v: string): string {
  try {
    return decodeURIComponent(v.replace(/\+/g, ' '))
  } catch {
    return v
  }
}

/** Turns an `a=b&c=d` referrer string into event props. */
export function parseInstallReferrer(raw: string | null | undefined): InstallReferrerProps {
  const out: InstallReferrerProps = {
    source: 'none',
    medium: null,
    campaign: null,
    content: null,
    term: null,
    click: null,
    empty: true,
  }
  const text = (raw ?? '').trim()
  if (!text) return out
  out.empty = false
  const params = new Map<string, string>()
  for (const part of text.split('&')) {
    if (!part) continue
    const eq = part.indexOf('=')
    const key = decode(eq === -1 ? part : part.slice(0, eq)).trim().toLowerCase()
    const value = decode(eq === -1 ? '' : part.slice(eq + 1)).trim()
    if (key && !params.has(key)) params.set(key, value)
  }
  const pick = (k: string): string | null => {
    const v = params.get(k)
    return v ? v.slice(0, MAX_LEN) : null
  }
  out.source = pick('utm_source') ?? 'unknown'
  out.medium = pick('utm_medium')
  out.campaign = pick('utm_campaign')
  out.content = pick('utm_content')
  out.term = pick('utm_term')
  for (const kind of ['gclid', 'gbraid', 'wbraid'] as const) {
    if (params.get(kind)) {
      out.click = kind
      break
    }
  }
  // A Google Ads click may carry no UTMs in the referrer; a click id kind alone
  // identifies the source, so the panel does not show it as "unknown".
  if (out.source === 'unknown' && out.click) out.source = 'google-ads'
  return out
}
