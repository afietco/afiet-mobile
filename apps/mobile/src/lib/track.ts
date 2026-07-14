import { requireApi } from '@/data/api/apiHolder'

/**
 * Minimal davranış telemetrisi — docs/feature-list/event-altyapisi.md.
 * Kuyruğa yazar, kısa bir gecikmeyle toplu gönderir; hata/oturumsuzlukta
 * SESSİZCE düşürür (telemetri kayıpsız olmak zorunda değil, kullanıcı
 * deneyimi asla bloklanmaz). Yalnız event sözlüğündeki adlar kullanılır;
 * props'a PII konmaz. Backend ucu (POST /v1/events) Faz B'de açılır —
 * o güne dek gönderimler sessizce düşer, çağrı yerleri şimdiden doğrudur.
 */

interface QueuedEvent {
  name: string
  props?: Record<string, unknown>
}

const queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null

async function flush() {
  timer = null
  const batch = queue.splice(0, queue.length)
  if (batch.length === 0) return
  try {
    await requireApi().sendEvents(batch)
  } catch {
    // sessizce düşür — yeniden deneme/persist yok (bilinçli: lossy telemetri)
  }
}

export function track(name: string, props?: Record<string, unknown>) {
  queue.push(props ? { name, props } : { name })
  timer ??= setTimeout(() => void flush(), 3000)
}
