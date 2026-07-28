import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'

/**
 * What a tab shows when its screen throws while rendering.
 *
 * Without one of these the subtree simply unmounts: the tab bar keeps working
 * and the content area goes blank, with nothing to tap and nothing to read.
 * That is a dead end for the person and a silent one for us, because a release
 * build has no red box to show them.
 *
 * expo-router picks this up when a route file re-exports it as `ErrorBoundary`.
 */
export function ScreenErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const insets = useSafeAreaInsets()

  return (
    <View
      className="flex-1 items-center justify-center bg-canvas px-8"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <AfiPose pose="oops" size={96} accessibilityLabel="Afi, bu sayfayı açamadı" />
      <AppText weight="extrabold" className="mt-3 text-center text-2xl text-ink">
        Bu sayfayı açamadım
      </AppText>
      <AppText className="mt-2 max-w-sm text-center leading-6 text-soft">
        Bir şey ters gitti, ama kayıtların yerinde duruyor. Tekrar deneyelim mi?
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sayfayı yeniden dene"
        onPress={retry}
        className="mt-7 rounded-2xl bg-emerald-600 px-7 py-3.5 active:opacity-90"
      >
        <AppText weight="bold" className="text-base text-white">
          Tekrar dene
        </AppText>
      </Pressable>

      {router.canGoBack() ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Önceki ekrana dön"
          onPress={() => router.back()}
          className="mt-3 px-6 py-3"
        >
          <AppText weight="semibold" className="text-soft">
            Geri dön
          </AppText>
        </Pressable>
      ) : null}

      {/* The message is for us, not for them, so it stays quiet at the bottom
          rather than putting a stack trace in front of someone eating lunch. */}
      <AppText className="mt-8 text-center text-[11px] leading-4 text-faint">
        {error.message}
      </AppText>
    </View>
  )
}
