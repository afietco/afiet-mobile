import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { RELEASE_NOTES, releaseNoteFor, shouldAnnounce } from '@/features/changelog/releaseNotes'

const SHEET = new URL(
  '../../apps/mobile/src/features/changelog/WhatsNewSheet.tsx',
  import.meta.url,
)
const TABS = new URL('../../apps/mobile/src/app/(tabs)/_layout.tsx', import.meta.url)

describe('release notes data', () => {
  it('lists the newest version first and never repeats one', () => {
    const versions = RELEASE_NOTES.map((note) => note.version)
    expect(new Set(versions).size).toBe(versions.length)
    expect(versions[0]).toBe('0.8.1')
  })

  it('says something for every version it lists', () => {
    for (const note of RELEASE_NOTES) {
      expect(note.highlights.length, note.version).toBeGreaterThan(0)
      expect(note.date, note.version).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      for (const highlight of note.highlights) {
        expect(highlight.text.length, note.version).toBeGreaterThan(10)
        expect(highlight.emoji, note.version).not.toBe('')
      }
    }
  })

  it('keeps the copy in the user\'s language, not the maintainer\'s', () => {
    const all = RELEASE_NOTES.flatMap((note) => note.highlights.map((h) => h.text)).join(' ')
    expect(all).not.toMatch(/refactor|prop|hook|commit|API|null|undefined/i)
  })
})

describe('when the sheet opens by itself', () => {
  const version = '0.8.1'

  it('stays shut for a fresh install', () => {
    /* There is no "new" for someone who has never used the old one. */
    expect(shouldAnnounce({ version, lastSeen: null, hasProfile: false })).toBe(false)
  })

  it('opens once for someone coming from an older version', () => {
    expect(shouldAnnounce({ version, lastSeen: '0.8.0', hasProfile: true })).toBe(true)
  })

  it('stays shut once this version has been seen', () => {
    expect(shouldAnnounce({ version, lastSeen: version, hasProfile: true })).toBe(false)
  })

  it('stays shut for a version nobody wrote notes for', () => {
    // An empty sheet is worse than no sheet.
    expect(releaseNoteFor('9.9.9')).toBeUndefined()
    expect(shouldAnnounce({ version: '9.9.9', lastSeen: '0.8.0', hasProfile: true })).toBe(false)
  })

  it('survives a version it cannot read', () => {
    expect(shouldAnnounce({ version: null, lastSeen: null, hasProfile: true })).toBe(false)
  })
})

describe('how it is wired', () => {
  it('marks the version as seen on dismissal, not on opening', async () => {
    const source = await readFile(SHEET, 'utf8')
    /* Marking on open would spend the one chance on a sheet that was never
       read, for instance if the app was killed while it stood there. */
    const onClose = source.slice(source.indexOf('onClose={() => {'))
    expect(onClose).toContain('AsyncStorage.setItem(LAST_SEEN_KEY, version)')
    expect(source).not.toMatch(/setOpen\(true\)[\s\S]{0,120}setItem\(LAST_SEEN_KEY/)
  })

  it('records the version silently on a fresh install', async () => {
    const source = await readFile(SHEET, 'utf8')
    // So the first real update is the first thing they ever see here.
    expect(source).toMatch(/profileId === null[\s\S]{0,300}setItem\(LAST_SEEN_KEY, version\)/)
  })

  it('mounts past the profile gate', async () => {
    const layout = await readFile(TABS, 'utf8')
    expect(layout).toContain('<WhatsNewAutoPrompt />')
    // The gate returns before the tabs render, so anything here is past it.
    expect(layout.indexOf('<WhatsNewAutoPrompt />')).toBeGreaterThan(
      layout.indexOf("if (id === null) return <Redirect href=\"/onboarding\" />"),
    )
  })
})
