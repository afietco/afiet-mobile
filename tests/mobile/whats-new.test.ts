import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  RELEASE_NOTES,
  releaseNoteFor,
  releaseNotesUrl,
  shouldAnnounce,
} from '@/features/changelog/releaseNotes'

const SHEET = new URL(
  '../../apps/mobile/src/features/changelog/WhatsNewSheet.tsx',
  import.meta.url,
)
const TABS = new URL('../../apps/mobile/src/app/(tabs)/_layout.tsx', import.meta.url)
const APP_JSON = new URL('../../apps/mobile/app.json', import.meta.url)

async function appJsonVersion(): Promise<string> {
  const raw = await readFile(APP_JSON, 'utf8')
  return (JSON.parse(raw) as { expo: { version: string } }).expo.version
}

describe('release notes data', () => {
  it('never repeats a version', () => {
    const versions = RELEASE_NOTES.map((note) => note.version)
    expect(new Set(versions).size).toBe(versions.length)
  })

  it('says something about the version people are actually running', async () => {
    /* This list went stale for two whole releases (0.9.0 and 0.10.0 shipped
       with no entry, so the sheet never opened) because nothing checked it
       against the app. The newest entry IS the shipping version. */
    expect(RELEASE_NOTES[0]?.version).toBe(await appJsonVersion())
  })

  it('is ordered newest first', () => {
    // Not by string: "0.9.0" sorts after "0.10.0" and the sheet would go back
    // in time. Compared part by part, the way the store reads versions.
    const parts = RELEASE_NOTES.map((note) => note.version.split('.').map(Number))
    for (let i = 1; i < parts.length; i++) {
      const [a, b] = [parts[i - 1]!, parts[i]!]
      const newer = a.findIndex((n, j) => n !== b[j])
      expect(newer === -1 || a[newer]! > b[newer]!, RELEASE_NOTES[i]!.version).toBe(true)
    }
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

describe('the long version on the web', () => {
  it('points at the page for this exact version', () => {
    expect(releaseNotesUrl('0.10.0')).toBe('https://afiet.co/yenilikler/0.10.0')
  })

  it('is offered from the sheet, under the dismissal', async () => {
    const source = await readFile(SHEET, 'utf8')
    /* The sheet is the short telling; whoever wants the whole list follows
       this. The page is published before the tag is cut (release skill), so
       the link is never ahead of what is live. */
    expect(source).toContain('releaseNotesUrl(note.version)')
    expect(source.indexOf('releaseNotesUrl(note.version)')).toBeGreaterThan(
      source.indexOf('Süper'),
    )
  })
})

describe('opening it from the menu', () => {
  it('never nests one modal inside another', async () => {
    const menu = await readFile(
      new URL('../../apps/mobile/src/features/nav/HamburgerMenu.tsx', import.meta.url),
      'utf8',
    )

    /* The menu is a Modal and the sheet opens in a Modal of its own so it can
       cover the tab bar. Rendering one inside the other left the outer backdrop
       swallowing every touch while the sheet sat behind it: the app looked
       frozen. The menu asks; the prompt outside every modal answers. */
    expect(menu).not.toContain('<WhatsNewSheet')
    expect(menu).toContain('requestWhatsNew()')
    // It closes itself first, or the request would open behind it again.
    expect(menu).toMatch(/onClose\(\)\s*requestWhatsNew\(\)/)
  })

  it('offers the row only when there is something to show', async () => {
    const menu = await readFile(
      new URL('../../apps/mobile/src/features/nav/HamburgerMenu.tsx', import.meta.url),
      'utf8',
    )
    expect(menu).toContain('disabled={!note}')
  })

  it('answers the request from outside every modal', async () => {
    const source = await readFile(SHEET, 'utf8')
    expect(source).toContain('onWhatsNewRequest(open)')
    expect(source).toContain('consumeWhatsNewRequest()')
  })
})
