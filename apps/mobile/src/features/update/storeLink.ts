/**
 * Where "Mağazaya git" goes.
 *
 * The server names the address, because the two stores are not symmetrical:
 * Play's page is addressable from the package name alone and has been stable
 * since before the app existed, while the App Store needs the numeric id Apple
 * assigns on first submission, which nothing in this repo can know. Both are
 * therefore configured server-side and only fall back to what is knowable here.
 */
import { Linking, Platform } from 'react-native'

const ANDROID_PACKAGE = 'co.afiet.app'

/** Opens the Play app itself rather than a browser tab on top of it. */
const ANDROID_NATIVE_URL = `market://details?id=${ANDROID_PACKAGE}`
const ANDROID_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`

/** Last resort on iOS until the App Store id is configured: the site lists the
 *  download links, so nobody lands on a dead end. */
const FALLBACK_URL = 'https://afiet.co'

/** Address to try first, then the ones to fall back through. */
export function storeUrlCandidates(configured: string | null): string[] {
  const candidates: string[] = []
  if (configured) candidates.push(configured)
  if (Platform.OS === 'android') {
    candidates.push(ANDROID_NATIVE_URL, ANDROID_WEB_URL)
  }
  candidates.push(FALLBACK_URL)
  return candidates
}

/**
 * Sends someone to the store, trying each address until one opens. Returns
 * false only when every one of them failed, which the caller shows as a
 * message rather than as a button that quietly does nothing.
 */
export async function openStore(configured: string | null): Promise<boolean> {
  for (const url of storeUrlCandidates(configured)) {
    try {
      await Linking.openURL(url)
      return true
    } catch {
      // A scheme this device cannot open; try the next one down.
    }
  }
  return false
}
