import { Platform, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'

/**
 * How to put the rhythm widget on the home screen, told once, from the chapter
 * that suggests it. Neither platform lets an app add its own widget, so the
 * most the app can do is describe the four taps honestly, in the order the
 * system asks for them.
 */

const IOS_STEPS = [
  'Ana ekranda boş bir yere basılı tut.',
  'Sol üstteki artıya (+) dokun.',
  '"afiet" yaz ve Ritim widget’ını seç.',
  'Boyunu seç, Ekle’ye dokun.',
]

const ANDROID_STEPS = [
  'Ana ekranda boş bir yere basılı tut.',
  'Widget’lar’a dokun.',
  'Listeden afiet’i bul.',
  'Ritim widget’ını ana ekrana sürükle.',
]

interface WidgetHintSheetProps {
  open: boolean
  onClose: () => void
}

export function WidgetHintSheet({ open, onClose }: WidgetHintSheetProps) {
  const steps = Platform.OS === 'android' ? ANDROID_STEPS : IOS_STEPS

  return (
    <Sheet
      name="widget_hint"
      open={open}
      onClose={onClose}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          Ritim widget’ı
        </AppText>
      }
    >
      <View className="px-5 pb-6">
        <View className="flex-row items-start gap-3">
          <AfiPose pose="ritim" size={56} />
          <AppText className="min-w-0 flex-1 text-sm leading-6 text-soft">
            Haftanın ritmi ana ekranında dursun; öğün vakti tek dokunuşla buraya gelirsin,
            uygulamayı aramadan.
          </AppText>
        </View>
        <View className="mt-5 gap-3">
          {steps.map((step, index) => (
            <View key={step} className="flex-row items-start gap-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <AppText weight="bold" className="text-xs text-emerald-700 dark:text-emerald-300">
                  {String(index + 1)}
                </AppText>
              </View>
              <AppText className="min-w-0 flex-1 pt-1 text-base leading-6 text-ink">{step}</AppText>
            </View>
          ))}
        </View>
      </View>
    </Sheet>
  )
}
