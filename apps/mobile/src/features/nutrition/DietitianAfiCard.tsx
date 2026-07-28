import { View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'

/**
 * Announcement card for the dietitian-Afi capability, which does not exist yet.
 *
 * It is deliberately NOT a control: no Pressable, no handler, no destination.
 * A "Yakında" pill, a dashed edge and a closing line carry the honesty, while
 * the mascot and the emerald tint keep it reading as a promise rather than a
 * dead button. Screen readers get the same message through one label.
 */
export function DietitianAfiCard({ className = '' }: { className?: string }) {
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel="Diyetisyen Afi, yakında. Afi bu öğüne bakıp sofrana küçük dokunuşlar önerecek. Henüz hazır değil."
      className={`rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 p-3.5 dark:border-emerald-800 dark:bg-emerald-950/40 ${className}`}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/80 dark:bg-emerald-900/50">
          <AfiPose pose="dusunuyor" size={52} />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <AppText weight="bold" className="text-ink">
              Diyetisyen Afi
            </AppText>
            <View className="rounded-full bg-emerald-600/15 px-2 py-0.5 dark:bg-emerald-400/20">
              <AppText
                weight="extrabold"
                className="text-[10px] uppercase text-emerald-700 dark:text-emerald-300"
              >
                Yakında
              </AppText>
            </View>
          </View>
          <AppText className="mt-1 text-xs leading-4 text-soft">
            Afi bu öğüne bakıp sofrana küçük dokunuşlar önerecek 🌿
          </AppText>
        </View>
      </View>

      <AppText className="mt-2.5 text-[11px] text-faint">
        Henüz hazır değil; olduğunda tam burada olacak.
      </AppText>
    </View>
  )
}
