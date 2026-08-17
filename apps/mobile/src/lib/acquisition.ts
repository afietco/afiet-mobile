import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Application from 'expo-application'
import { Platform } from 'react-native'
import { parseInstallReferrer } from './installReferrer'
import { track } from './track'

/**
 * Acquisition channel: reads the Play Install Referrer once and reports it as
 * an `install_referrer` event. On Android, Play hands the app the `referrer`
 * parameter of the install link for 90 days (the store badge on afiet.co sends
 * `utm_source=afiet.co&utm_medium=web&utm_campaign=<page>&gclid=…`; Google Ads
 * and Play organic installs put their own values there). That is what lets the
 * admin panel answer "which channel's users activated" from our own data and
 * cross-check the ad network's numbers (research/google-ads-k1-brief.md § 5).
 *
 * Privacy: the ad click id ITSELF is never sent, only its kind (gclid / gbraid
 * / wbraid present or not). UTM values are campaign labels, not personal data,
 * and are still cut at 120 characters. iOS has no equivalent (Apple provides no
 * referrer), so nothing happens there.
 *
 * Once: a flag is written after a successful read. If reading fails (no Play
 * Services, old Play Store, permission/timeout) it is retried on at most three
 * launches and then given up; a call that throws on every launch is not wanted.
 */

const DONE_KEY = 'afiet.telemetry.install_referrer.v1'
const ATTEMPTS_KEY = 'afiet.telemetry.install_referrer.attempts'
const MAX_ATTEMPTS = 3

export async function reportInstallReferrerOnce(): Promise<void> {
  if (Platform.OS !== 'android') return
  try {
    if (await AsyncStorage.getItem(DONE_KEY)) return
    const attempts = Number(await AsyncStorage.getItem(ATTEMPTS_KEY)) || 0
    if (attempts >= MAX_ATTEMPTS) return
    await AsyncStorage.setItem(ATTEMPTS_KEY, String(attempts + 1))
  } catch {
    return
  }
  let raw = ''
  try {
    raw = await Application.getInstallReferrerAsync()
  } catch {
    // Retried on the next launch, up to the cap.
    return
  }
  track('install_referrer', parseInstallReferrer(raw))
  await AsyncStorage.setItem(DONE_KEY, '1').catch(() => {
    // If the flag cannot be written the event may go again next launch; server
    // side reads take the first record per user.
  })
}
