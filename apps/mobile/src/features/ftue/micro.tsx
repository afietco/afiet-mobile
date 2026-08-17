import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { IconX } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { markFtueSeen, useFtueSeen, type FtueKey } from './ftueFlags'

/**
 * The quietest pattern in the vocabulary (docs/ftue.md): one line, once, on
 * the first visit to a screen.
 *
 * It is spent on being seen rather than on being acknowledged. A note that
 * waits for a tap comes back on every visit until it gets one, which is how a
 * one-line hint turns into something to get rid of; this one is marked the
 * moment it is on screen and never returns, and the close button is there for
 * the person who wants it gone now rather than as the price of reading it.
 */
export function AfiWhisper({ flag, text }: { flag: FtueKey; text: string }) {
  const seen = useFtueSeen(flag)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (!seen) markFtueSeen(flag)
  }, [flag, seen])

  if (seen || closed) return null

  return (
    <View className="flex-row items-start gap-2.5 rounded-2xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/40">
      <AfiPose pose="selam" size={30} />
      <AppText className="min-w-0 flex-1 text-sm leading-5 text-emerald-900 dark:text-emerald-100">
        {text}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notu kapat"
        onPress={() => setClosed(true)}
        className="-mr-1 -mt-1 h-8 w-8 items-center justify-center rounded-full active:bg-emerald-100 dark:active:bg-emerald-900"
      >
        <IconX size={15} color="#059669" />
      </Pressable>
    </View>
  )
}
