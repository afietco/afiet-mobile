import * as WebBrowser from 'expo-web-browser'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { STATUS_PAGE_URL, type ServiceStatus } from './serviceStatus'

/**
 * The two sentences a failed screen owes somebody, and which one is true.
 *
 * Telling a person to check their connection while the fault is ours sends
 * them looking for something to fix on their side, and everything they find is
 * destructive: sign out, try another account, delete the app. So the wording
 * waits for the status page before it commits, and says plainly when the
 * trouble is ours.
 */
export function OutageMessage({ status }: { status: ServiceStatus | null }) {
  const ours = status?.verdict === 'outage'

  return (
    <>
      <AppText weight="extrabold" className="mt-3 text-center text-2xl text-ink">
        {ours ? 'Sorun sende değil' : 'Bağlantı kurulamadı'}
      </AppText>
      <AppText className="mt-2 max-w-sm text-center leading-6 text-soft">
        {ours
          ? `${affectedSentence(status.affected)} Üzerinde çalışıyoruz, kaydettiklerin yerinde duruyor.`
          : 'Bağlantını kontrol edip birazdan yeniden deneyebilirsin.'}
      </AppText>
      {ours ? (
        <View className="mt-3">
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Durum sayfasını aç"
            onPress={() => void WebBrowser.openBrowserAsync(STATUS_PAGE_URL)}
            hitSlop={8}
            className="px-3 py-1.5 active:opacity-70"
          >
            <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-300">
              Durum sayfası
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </>
  )
}

/** Names what is affected when we know it, and stays vague when we do not. */
function affectedSentence(affected: string[]): string {
  if (affected.length === 0) return 'Şu an bizde bir aksaklık var.'
  if (affected.length === 1) return `${affected[0]} tarafında bir aksaklık var.`
  return `${affected.slice(0, -1).join(', ')} ve ${affected.at(-1)} tarafında aksaklık var.`
}
