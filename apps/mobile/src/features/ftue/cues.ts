import * as Notifications from 'expo-notifications'
import { getPushPermissionState } from '@/features/push/push-notifications'
import type { ChapterCue } from './chapters'

/**
 * The FTUE's own notifications: local, at most one pending, in Afi's voice.
 *
 * The chapters live on the device, so the server cannot know when one is
 * ready; the app schedules the cue itself for the two moments it can see
 * coming (chapters.ts, nextChapterCue) and cancels it the moment the picture
 * changes. Only ever scheduled for somebody who said yes to being called, and
 * never inside the quiet hours: half past nine in the morning, half past six
 * in the evening.
 */

const CUE_ID = 'ftue-cue'
const EVENING = { hour: 18, minute: 30 }
const MORNING = { hour: 9, minute: 30 }

let lastScheduled: string | null = null

/** When a cue fires, from what it is and when it is asked for. */
export function cueDate(when: ChapterCue['when'], now: Date): Date {
  const date = new Date(now)
  if (when === 'evening') {
    date.setHours(EVENING.hour, EVENING.minute, 0, 0)
  } else {
    date.setDate(date.getDate() + 1)
    date.setHours(MORNING.hour, MORNING.minute, 0, 0)
  }
  return date
}

/**
 * Brings the pending cue in line with the picture on Bugün. Called on every
 * evaluation and cheap when nothing changed; a cue that cannot be scheduled is
 * simply a cue nobody gets, never an error the screen has to show.
 */
export async function syncChapterCue(cue: ChapterCue | null, now: Date = new Date()): Promise<void> {
  const key = cue ? `${cue.when}:${cue.chapter}:${now.toDateString()}` : 'none'
  if (key === lastScheduled) return
  lastScheduled = key
  try {
    await Notifications.cancelScheduledNotificationAsync(CUE_ID)
    if (!cue) return
    if ((await getPushPermissionState()) !== 'granted') return
    const date = cueDate(cue.when, now)
    if (date.getTime() <= now.getTime()) return
    await Notifications.scheduleNotificationAsync({
      identifier: CUE_ID,
      content: {
        title: cue.title,
        body: cue.body,
        data: { kind: 'ftue_cue', chapter: cue.chapter },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: 'hatirlatmalar',
      },
    })
  } catch {
    // Not having a reminder is the ordinary state; the chapters do not depend on it.
  }
}

/** Nothing pending; called when the session ends. */
export async function clearChapterCue(): Promise<void> {
  lastScheduled = null
  try {
    await Notifications.cancelScheduledNotificationAsync(CUE_ID)
  } catch {
    // Best effort.
  }
}
