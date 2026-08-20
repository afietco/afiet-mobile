import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/**
 * App Review rejected 1.0 (48) under guideline 5.1.1(ii): a purpose string
 * that named the permission instead of describing what the app does with what
 * it asks for. "Fotoğraf çekebilmen için kamera erişimine izin ver." says only
 * that a camera is needed to take a photo.
 *
 * A purpose string here therefore has to say what is collected, what happens
 * to it, and give a concrete example. These are the sentences a person reads
 * in the system prompt, so they are product copy and belong under test with
 * the rest of it.
 */

interface AppJson {
  expo: {
    ios: { infoPlist: Record<string, string> }
    plugins: (string | [string, Record<string, unknown>])[]
  }
}

const appJson = async (): Promise<AppJson> =>
  JSON.parse(await readFile(new URL('../../apps/mobile/app.json', import.meta.url), 'utf8'))

const pluginProps = (config: AppJson, name: string): Record<string, unknown> => {
  const entry = config.expo.plugins.find((p) => Array.isArray(p) && p[0] === name)
  if (!Array.isArray(entry)) throw new Error(`${name} is not configured`)
  return entry[1]
}

/** Every sentence a person is shown before granting something. */
const PURPOSE_STRINGS = [
  ['expo-image-picker', 'cameraPermission'],
  ['expo-image-picker', 'photosPermission'],
  ['expo-image-picker', 'microphonePermission'],
  ['expo-speech-recognition', 'microphonePermission'],
  ['expo-speech-recognition', 'speechRecognitionPermission'],
] as const

describe('purpose strings', () => {
  it.each(PURPOSE_STRINGS)('%s.%s gives an example of the use', async (plugin, key) => {
    const value = pluginProps(await appJson(), plugin)[key]
    expect(typeof value).toBe('string')
    const text = value as string
    // Long enough to be a description rather than a label for the permission.
    expect(text.length).toBeGreaterThan(120)
    // Apple asks for an example in most cases, and every one of these has one.
    expect(text.toLowerCase()).toContain('örneğin')
    // Naming the resource is what the rejected string did instead of explaining.
    expect(text).not.toMatch(/erişimine izin ver\.?$/)
  })

  it('does not ship the placeholder Apple names in its own examples', async () => {
    const config = await appJson()
    const shipped = JSON.stringify(config.expo)
    expect(shipped).not.toContain('$(PRODUCT_NAME)')
  })

  it('asks for nothing the app never uses', async () => {
    /* expo-secure-store declares a Face ID string by default. Nothing here
       reads a value behind biometrics, so the prompt can never appear and the
       sentence would be a claim about something the app does not do. */
    expect(pluginProps(await appJson(), 'expo-secure-store').faceIDPermission).toBe(false)
    const store = await readFile(
      new URL('../../apps/mobile/src/features/auth/tokenStore.ts', import.meta.url),
      'utf8',
    )
    expect(store).not.toContain('requireAuthentication')
  })

  it('keeps the microphone sentence identical wherever it is declared', async () => {
    const config = await appJson()
    const picker = pluginProps(config, 'expo-image-picker').microphonePermission
    const speech = pluginProps(config, 'expo-speech-recognition').microphonePermission
    // Both plugins write NSMicrophoneUsageDescription; the last one wins, and a
    // disagreement here would decide the shown sentence by plugin order.
    expect(picker).toBe(speech)
    expect(config.expo.ios.infoPlist.NSMicrophoneUsageDescription).toBe(picker)
  })
})
