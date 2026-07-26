import { useEffect } from 'react'
import { track } from '@/lib/track'
import { AfiScene } from '@/ui/maskot/AfiScene'
import type { LevelUpEvent } from './useLevelUp'

/**
 * Level-up scene. Only the rise is told: nothing here can be lost, nothing is
 * framed against another person (docs/09). A new title is the bigger moment,
 * so it gets its own headline and the badge pose instead of the level burst.
 */
export function LevelUpCelebration({
  event,
  onClose,
}: {
  event: LevelUpEvent
  onClose: () => void
}) {
  useEffect(() => {
    track('afi_celebration_shown', { moment: event.titleChanged ? 'title_up' : 'level_up' })
  }, [event.titleChanged])

  const level = String(event.level)

  return event.titleChanged ? (
    <AfiScene
      pose="rozet"
      title={`Yeni unvanın: ${event.title}`}
      body={`${level}. seviyeye çıktın ve yolculuğun yeni bir ad kazandı. Bu unvan artık senin, hep kalır.`}
      badge={`${event.title} · Seviye ${level}`}
      actionLabel="Yolculuk sürsün ✨"
      onClose={onClose}
    />
  ) : (
    <AfiScene
      pose="seviye"
      title="Seviye atladın 🎉"
      body={`Biriken tecrübenle ${level}. seviyeye çıktın. Unvanın ${event.title} olarak sürüyor.`}
      badge={`Seviye ${level}`}
      actionLabel="Afiyetle devam ✨"
      onClose={onClose}
    />
  )
}
