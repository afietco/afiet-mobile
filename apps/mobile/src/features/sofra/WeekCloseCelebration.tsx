import { useEffect } from 'react'
import { View } from 'react-native'
import { track } from '@/lib/track'
import { AfiScene } from '@/ui/maskot/AfiScene'
import { RhythmStrip } from './RhythmStrip'

/**
 * Hafta kapanışı kutlaması; YALNIZCA hedefe ulaşan haftada gösterilir
 * (ulaşamayan haftada hiçbir şey yok, pencere sessizce tazelenir:
 * afiyet-ritmi.md kayıp-dili yasağı). Afi + konfeti + haftanın şeridi +
 * toplam afiyet haftası. Bir kez gösterilir; kapatınca ack edilir.
 */

export interface WeekClosure {
  weekStart: string
  /** Pzt→Paz afiyet günleri. */
  days: boolean[]
  done: number
  goal: number
  /** Bu hafta dahil toplam afiyet haftası (kalıcı sayaç, asla azalmaz). */
  totalWeeks: number
}

export function WeekCloseCelebration({
  closure,
  onClose,
}: {
  closure: WeekClosure
  onClose: () => void
}) {
  useEffect(() => {
    track('afi_celebration_shown', { moment: 'week_close' })
  }, [])

  return (
    <AfiScene
      pose="ritim"
      size={104}
      title="Bu hafta afiyetteydin 🎉"
      body={`${String(closure.done)} afiyet günü biriktirdin; bir afiyet haftası kazandın.`}
      badge={`Toplam ${String(closure.totalWeeks)} afiyet haftan 🧡`}
      actionLabel="Yeni haftaya afiyetle ✨"
      onClose={onClose}
    >
      <View className="mt-4 w-full items-center rounded-2xl bg-canvas px-4 py-3">
        <RhythmStrip week={closure.days} todayIndex={-1} plain />
      </View>
    </AfiScene>
  )
}
