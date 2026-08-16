import { describe, expect, it } from 'vitest'
import { parseInstallReferrer } from './installReferrer'

describe('parseInstallReferrer', () => {
  it('parses the afiet.co store badge referrer: utm fields + click kind, never the id', () => {
    const p = parseInstallReferrer('utm_source=afiet.co&utm_medium=web&utm_campaign=%2Fhesapla&gclid=Cj0KCQjw_abc123-XYZ')
    expect(p).toMatchObject({ source: 'afiet.co', medium: 'web', campaign: '/hesapla', click: 'gclid', empty: false })
    expect(JSON.stringify(p)).not.toContain('Cj0KCQjw')
  })
  it('recognises Play organic installs', () => {
    expect(parseInstallReferrer('utm_source=google-play&utm_medium=organic')).toMatchObject({ source: 'google-play', medium: 'organic', click: null })
  })
  it('treats a click id without UTMs as google-ads', () => {
    expect(parseInstallReferrer('gclid=Cj0KCQjw_abc123-XYZ')).toMatchObject({ source: 'google-ads', click: 'gclid' })
    expect(parseInstallReferrer('gbraid=0AAAAAo123&utm_source=(not%20set)').click).toBe('gbraid')
  })
  it('handles empty and malformed referrers', () => {
    expect(parseInstallReferrer('')).toMatchObject({ source: 'none', empty: true })
    expect(parseInstallReferrer(null)).toMatchObject({ source: 'none', empty: true })
    expect(parseInstallReferrer('%E0%A4%A&&=x')).toMatchObject({ empty: false, source: 'unknown' })
  })
  it('cuts values at 120 characters and keeps the first occurrence of a key', () => {
    const p = parseInstallReferrer(`utm_source=${'a'.repeat(200)}&utm_source=second`)
    expect(p.source).toHaveLength(120)
  })
})
