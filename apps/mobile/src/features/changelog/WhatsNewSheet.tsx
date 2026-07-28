import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import { releaseNoteFor, shouldAnnounce, type ReleaseNote } from './releaseNotes'
import { consumeWhatsNewRequest, onWhatsNewRequest } from './whatsNewRequest'

const LAST_SEEN_KEY = 'fh:lastSeenVersion'

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  return dateFmt.format(new Date(y, m - 1, d))
}

export function appVersion(): string | null {
  return Constants.expoConfig?.version ?? null
}

/**
 * "Yenilikler": what arrived in this version, in one sheet.
 *
 * Opens by itself once after an update, and can be opened again from the menu.
 * Afi delivers it, because the app's own voice is the point: this is the one
 * place that gets to be pleased with itself.
 */
export function WhatsNewSheet({
  note,
  open,
  onClose,
}: {
  note: ReleaseNote
  open: boolean
  onClose: () => void
}) {
  const day = formatDate(note.date)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      overTabBar
      title={
        <>
          <AfiPose pose="kutlama" size={26} />
          <AppText weight="bold" className="text-lg text-ink">
            Yenilikler
          </AppText>
        </>
      }
    >
      <View className="mb-4 flex-row items-center gap-2">
        <View className="rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-900/60">
          <AppText weight="bold" className="text-sm text-emerald-800 dark:text-emerald-200">
            v{note.version}
          </AppText>
        </View>
        {day ? <AppText className="text-sm text-faint">{day}</AppText> : null}
      </View>

      <View className="mb-6 gap-3">
        {note.highlights.map((highlight, index) => (
          <Animated.View
            key={highlight.text}
            entering={FadeInDown.delay(index * 60)
              .duration(220)
              .reduceMotion(ReduceMotion.System)}
            className="flex-row items-start gap-3"
          >
            <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60">
              <AppText className="text-lg">{highlight.emoji}</AppText>
            </View>
            <AppText className="flex-1 pt-1.5 text-sm leading-5 text-ink">{highlight.text}</AppText>
          </Animated.View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        className="min-h-11 items-center rounded-xl bg-emerald-600 py-3.5 active:opacity-90"
      >
        <AppText weight="semibold" className="text-white">
          Süper 👍
        </AppText>
      </Pressable>
    </Sheet>
  )
}

/**
 * Shows the notes once after an update.
 *
 * A fresh install is marked as seen without being shown anything: there is no
 * "new" for someone who has never used the old one. The mark is written when
 * the sheet is dismissed rather than when it opens, so a version whose sheet
 * was never actually read comes back next launch instead of being lost.
 */
export function WhatsNewAutoPrompt() {
  const { id: profileId } = useActiveProfile()
  const [open, setOpen] = useState(false)
  const version = appVersion()
  const note = releaseNoteFor(version)

  useEffect(() => {
    let alive = true
    void (async () => {
      const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY)
      if (!alive || !version) return

      if (profileId === null) {
        /* Nothing to announce to a fresh install, but the version is recorded
           so the first real update is the first thing they ever see here. */
        if (lastSeen === null) await AsyncStorage.setItem(LAST_SEEN_KEY, version)
        return
      }

      if (shouldAnnounce({ version, lastSeen, hasProfile: true })) setOpen(true)
    })()
    return () => {
      alive = false
    }
  }, [profileId, version])

  /* The menu cannot host the sheet itself: it is a modal, the sheet opens in a
     modal of its own, and nesting them left the outer backdrop swallowing every
     touch. It asks from there and this answers, from outside every modal. */
  useEffect(() => {
    const open = () => {
      if (consumeWhatsNewRequest()) setOpen(true)
    }
    open()
    return onWhatsNewRequest(open)
  }, [])

  if (!note) return null

  return (
    <WhatsNewSheet
      note={note}
      open={open}
      onClose={() => {
        setOpen(false)
        if (version) void AsyncStorage.setItem(LAST_SEEN_KEY, version)
      }}
    />
  )
}
