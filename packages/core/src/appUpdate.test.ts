import { describe, expect, it } from 'vitest'
import {
  compareVersions,
  decideAppUpdate,
  isOlderThan,
  parseVersion,
  UPDATE_REMINDER_INTERVAL_MS,
  type AppVersionGate,
} from './appUpdate'

const NOW = 1_754_000_000_000

function gateFor(ios: AppVersionGate['ios']): AppVersionGate {
  return { ios, android: null }
}

describe('parsing a version', () => {
  it('reads dotted numbers and an optional leading v', () => {
    expect(parseVersion('0.10.0')?.numbers).toEqual([0, 10, 0])
    expect(parseVersion('v1.2.3')?.numbers).toEqual([1, 2, 3])
    expect(parseVersion(' 2.0 ')?.numbers).toEqual([2, 0])
  })

  it('drops build metadata and keeps the pre-release tag', () => {
    expect(parseVersion('1.2.3+4567')?.prerelease).toBeNull()
    expect(parseVersion('1.2.3-beta.1')?.prerelease).toBe('beta.1')
  })

  it('refuses anything that is not a dotted number', () => {
    expect(parseVersion('')).toBeNull()
    expect(parseVersion('sürüm yok')).toBeNull()
    expect(parseVersion('1.x.3')).toBeNull()
    expect(parseVersion(null)).toBeNull()
    expect(parseVersion(undefined)).toBeNull()
  })
})

describe('ordering two versions', () => {
  it('compares segment by segment, not as text', () => {
    // The whole reason this is not a string compare: 9 sorts after 10 as text.
    expect(compareVersions('0.9.0', '0.10.0')).toBeLessThan(0)
    expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0)
  })

  it('treats missing segments as zero', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0)
    expect(compareVersions('1.2', '1.2.1')).toBeLessThan(0)
  })

  it('sorts a pre-release below the release it leads to', () => {
    expect(compareVersions('1.0.0-beta.1', '1.0.0')).toBeLessThan(0)
    expect(compareVersions('1.0.0-beta.1', '1.0.0-beta.2')).toBeLessThan(0)
  })

  it('returns null when either side is unreadable', () => {
    expect(compareVersions('1.0.0', 'bilinmiyor')).toBeNull()
    expect(compareVersions(null, '1.0.0')).toBeNull()
  })

  it('never calls an unreadable version older', () => {
    expect(isOlderThan('bilinmiyor', '9.9.9')).toBe(false)
    expect(isOlderThan('1.0.0', null)).toBe(false)
  })
})

describe('deciding what to show', () => {
  const base = { currentVersion: '0.10.0', platform: 'ios' as const, now: NOW }

  it('says nothing without an answer from the server', () => {
    expect(decideAppUpdate({ ...base, gate: null })).toEqual({ kind: 'none' })
    expect(decideAppUpdate({ ...base, gate: {} })).toEqual({ kind: 'none' })
  })

  it('says nothing when the running version is the newest', () => {
    const gate = gateFor({ latestVersion: '0.10.0', minimumVersion: '0.9.0' })
    expect(decideAppUpdate({ ...base, gate })).toEqual({ kind: 'none' })
  })

  it('says nothing when the running version is ahead of the store', () => {
    // TestFlight and internal builds routinely run ahead; they are not stale.
    const gate = gateFor({ latestVersion: '0.10.0' })
    expect(decideAppUpdate({ ...base, currentVersion: '0.11.0', gate })).toEqual({ kind: 'none' })
  })

  it('suggests the newest version when one exists', () => {
    const gate = gateFor({ latestVersion: '0.11.0', storeUrl: 'https://store', message: 'Sohbet hızlandı' })
    expect(decideAppUpdate({ ...base, gate })).toEqual({
      kind: 'suggested',
      version: '0.11.0',
      storeUrl: 'https://store',
      message: 'Sohbet hızlandı',
    })
  })

  it('requires an update below the minimum, and points at the newest build', () => {
    const gate = gateFor({ latestVersion: '0.12.0', minimumVersion: '0.11.0', storeUrl: 'https://store' })
    expect(decideAppUpdate({ ...base, gate })).toMatchObject({ kind: 'required', version: '0.12.0' })
  })

  it('points at the minimum when nothing newer is named', () => {
    const gate = gateFor({ minimumVersion: '0.11.0' })
    expect(decideAppUpdate({ ...base, gate })).toMatchObject({ kind: 'required', version: '0.11.0' })
  })

  it('prefers the wall over the card when both apply', () => {
    const gate = gateFor({ latestVersion: '0.12.0', minimumVersion: '0.11.0' })
    expect(decideAppUpdate({ ...base, gate }).kind).toBe('required')
  })

  it('reads the gate of the platform it is running on', () => {
    const gate: AppVersionGate = {
      ios: { latestVersion: '0.11.0' },
      android: { latestVersion: '0.10.0' },
    }
    // Apple published; Play has not. Only one half of the fleet hears about it.
    expect(decideAppUpdate({ ...base, gate }).kind).toBe('suggested')
    expect(decideAppUpdate({ ...base, platform: 'android', gate }).kind).toBe('none')
  })

  it('stays quiet about a suggestion that was just declined', () => {
    const gate = gateFor({ latestVersion: '0.11.0' })
    const declined = { remindedVersion: '0.11.0', remindedAt: NOW - 1000 }
    expect(decideAppUpdate({ ...base, gate, ...declined })).toEqual({ kind: 'none' })
  })

  it('asks again once the quiet period is over', () => {
    const gate = gateFor({ latestVersion: '0.11.0' })
    const declined = { remindedVersion: '0.11.0', remindedAt: NOW - UPDATE_REMINDER_INTERVAL_MS - 1 }
    expect(decideAppUpdate({ ...base, gate, ...declined }).kind).toBe('suggested')
  })

  it('asks straight away when a different version arrives', () => {
    const gate = gateFor({ latestVersion: '0.12.0' })
    const declined = { remindedVersion: '0.11.0', remindedAt: NOW - 1000 }
    expect(decideAppUpdate({ ...base, gate, ...declined }).kind).toBe('suggested')
  })

  it('never walls off someone whose own version cannot be read', () => {
    // A config typo must cost a missing nudge, not a fleet-wide lockout.
    const gate = gateFor({ minimumVersion: '9.9.9', latestVersion: '9.9.9' })
    expect(decideAppUpdate({ ...base, currentVersion: 'bilinmiyor', gate })).toEqual({ kind: 'none' })
  })

  it('ignores thresholds the server sent as gibberish', () => {
    const gate = gateFor({ minimumVersion: 'çok yeni', latestVersion: 'çok yeni' })
    expect(decideAppUpdate({ ...base, gate })).toEqual({ kind: 'none' })
  })
})
