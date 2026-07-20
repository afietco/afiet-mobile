import { requireApi } from '../data/api/apiHolder'

/**
 * Minimal davranış telemetrisi — docs/feature-list/event-altyapisi.md.
 * Kuyruğa yazar, kısa bir gecikmeyle toplu gönderir; hata/oturumsuzlukta
 * SESSİZCE düşürür (telemetri kayıpsız olmak zorunda değil, kullanıcı
 * deneyimi asla bloklanmaz). Yalnız event sözlüğündeki adlar kullanılır;
 * props'a PII konmaz. Backend ucu (POST /v1/events) Faz B'de açılır —
 * o güne dek gönderimler sessizce düşer, çağrı yerleri şimdiden doğrudur.
 */

export const TELEMETRY_EVENTS = [
  'meal_logged',
  'water_logged',
  'onboarding_completed',
  'measurement_added',
  'balance_viewed',
  'afiyet_day_completed',
  'move_offered',
  'move_done',
  'move_dismissed',
  'week_summary_opened',
  'rhythm_week_completed',
  'nudge_shown',
  'nudge_acted',
  'reaction_sent',
  'pause_started',
  'pause_ended',
  'afi_celebration_shown',
  'afi_assist_used',
  'afi_suggestion_accepted',
  'afi_suggestion_rejected',
  'group_public_on',
  'group_public_off',
  'sofra_visibility_on',
  'sofra_visibility_off',
] as const

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number]

interface QueuedEvent {
  name: TelemetryEventName
  props?: Record<string, unknown>
}

const queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null

export async function flushTelemetry(): Promise<void> {
  if (timer) clearTimeout(timer)
  timer = null
  const batch = queue.splice(0, queue.length)
  if (batch.length === 0) return
  try {
    await requireApi().sendEvents(batch)
  } catch {
    // sessizce düşür — yeniden deneme/persist yok (bilinçli: lossy telemetri)
  }
}

export function track(name: TelemetryEventName, props?: Record<string, unknown>): void {
  queue.push(props ? { name, props } : { name })
  timer ??= setTimeout(() => void flushTelemetry(), 3000)
}
