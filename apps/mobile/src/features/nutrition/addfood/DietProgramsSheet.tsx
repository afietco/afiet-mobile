import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'

/**
 * What the "Diyet programları" card answers when it is tapped.
 *
 * The feature does not exist yet, and the card says so on its face. This is
 * the rest of that sentence: a card that admits it is not ready and then does
 * nothing when touched reads as broken rather than honest.
 *
 * Deliberately short of promises. No date, no feature list, nothing that has
 * to be walked back later; when the real thing lands, this file is the one
 * that goes away.
 */
export function DietProgramsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      name="diet_programs_soon"
      open={open}
      onClose={onClose}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          Diyet programları
        </AppText>
      }
    >
      <View className="items-center pb-1">
        <AfiPose pose="dusunuyor" size={84} accessibilityLabel="Afi, program üzerinde çalışıyor" />
      </View>

      <AppText className="mt-2 text-base leading-relaxed text-ink">
        Sana göre hazırlanmış günlük akışlar üzerinde çalışıyoruz.
      </AppText>
      <AppText className="mt-2 text-sm leading-relaxed text-soft">
        Hazır olduğunda burada, tam da bu kartın yerinde olacak. O güne kadar kaydını her zamanki
        gibi tutmaya devam edebilirsin.
      </AppText>

      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        className="mt-6 min-h-11 items-center rounded-xl bg-emerald-600 py-3.5"
      >
        <AppText weight="semibold" className="text-white">
          Anladım
        </AppText>
      </Pressable>
    </Sheet>
  )
}
