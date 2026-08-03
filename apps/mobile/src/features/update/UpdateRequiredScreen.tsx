/**
 * The wall a build that is too old runs into.
 *
 * Rendered INSTEAD of the navigator, not over it: an overlay would still let
 * every screen behind it mount and start talking to an API this build is no
 * longer allowed to talk to, which is the whole reason the wall exists. There
 * is deliberately no way past it and no back gesture off it: the one action
 * on the screen is the one that fixes the situation.
 *
 * The tone stays the app's: nobody did anything wrong by not updating, so the
 * copy invites rather than scolds, and the version line explains itself
 * instead of reading as an error code.
 */
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { openStore } from './storeLink'

export function UpdateRequiredScreen({
  version,
  currentVersion,
  storeUrl,
  message,
}: {
  /** The version waiting in the store. */
  version: string
  /** What is running here, shown so the gap is legible. */
  currentVersion: string | null
  storeUrl: string | null
  /** Optional line from the server explaining why this one is mandatory. */
  message: string | null
}) {
  const insets = useSafeAreaInsets()
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)

  const goToStore = () => {
    if (opening) return
    setOpening(true)
    setFailed(false)
    void openStore(storeUrl).then((opened) => {
      setOpening(false)
      setFailed(!opened)
    })
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 28,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="items-center">
          <AfiPose pose="merak" size={116} />

          <AppText weight="extrabold" className="mt-5 text-center text-2xl text-ink">
            Yeni bir afiet var
          </AppText>

          <AppText className="mt-3 text-center text-base leading-6 text-soft">
            {message ??
              'Bu sürüm artık güncel değil. Mağazadan yenisini al, kaldığın yerden devam edelim.'}
          </AppText>

          <View className="mt-5 flex-row items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 dark:bg-emerald-900/50">
            <AppText weight="bold" className="text-sm text-emerald-800 dark:text-emerald-200">
              {currentVersion ? `v${currentVersion} → v${version}` : `v${version}`}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mağazayı aç ve afiet'i güncelle"
            accessibilityState={{ disabled: opening, busy: opening }}
            disabled={opening}
            onPress={goToStore}
            className="mt-8 w-full max-w-sm items-center rounded-2xl bg-emerald-600 py-4 active:opacity-90"
          >
            {opening ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <AppText weight="bold" className="text-base text-white">
                Mağazaya git
              </AppText>
            )}
          </Pressable>

          {failed ? (
            /* Every address we know failed to open. Saying so is better than a
               button that looks like it worked; the store is still reachable
               by hand from here. */
            <AppText className="mt-4 text-center text-sm leading-5 text-faint">
              Mağaza açılamadı. Uygulama mağazasından afiet'i arayıp
              güncelleyebilirsin.
            </AppText>
          ) : null}

          <AppText className="mt-6 text-center text-xs leading-5 text-faint">
            Kayıtların yerinde duruyor. Güncelledikten sonra her şey seni bekliyor
            olacak.
          </AppText>
        </View>
      </ScrollView>
    </View>
  )
}
