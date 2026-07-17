import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconPurse } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/**
 * Sofra kesesi — harcama ekonomisi (ikram kesesi) göstergesi. Şimdilik MOCK:
 * yalnız görüntü + kısa bilgi sheet'i; gerçek bakiye premium altyapısıyla gelir
 * (docs/feature-list/ekonomi-modeli.md). Kritik: kazanç ekonomisiyle (afiyet
 * günü / sofra bezi) ARASINDA köprü YOK — ayrı kese, dönüşmez.
 */
const MOCK_BALANCE = 3

export function SofraKeseButton() {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)
  const amber = isDark ? '#fbbf24' : '#d97706'

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sofra kesen: ${MOCK_BALANCE} ikram`}
        onPress={() => setOpen(true)}
        hitSlop={6}
        className="h-10 flex-row items-center gap-1 rounded-full bg-amber-50 px-2.5 active:opacity-80 dark:bg-amber-950/40"
      >
        <IconPurse size={18} color={amber} />
        <AppText weight="extrabold" className="text-sm text-amber-700 dark:text-amber-300">
          {MOCK_BALANCE}
        </AppText>
      </Pressable>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={
          <>
            <IconPurse size={22} color={amber} />
            <AppText weight="bold" className="text-lg text-ink">
              Sofra kesen
            </AppText>
          </>
        }
      >
        <View className="gap-3">
          <View className="items-center rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/40">
            <View className="flex-row items-baseline gap-1.5">
              <AppText weight="extrabold" className="text-4xl text-amber-700 dark:text-amber-300">
                {MOCK_BALANCE}
              </AppText>
              <AppText weight="bold" className="text-lg text-amber-600 dark:text-amber-400">
                ikram
              </AppText>
            </View>
            <AppText className="mt-1 text-sm text-soft">bu ay kesende</AppText>
          </View>
          <AppText className="text-sm text-soft">
            İkram kesen sofranın süsü için: desenler, Afi sahneleri ve aileye özel
            sıcak jestler. Kayıtla kazanılmaz; premium ile her ay tazelenir.
          </AppText>
          <View className="rounded-xl bg-muted/60 px-3.5 py-2.5">
            <AppText className="text-xs text-faint">
              Afiyet günlerin ve ritmin bambaşka bir şey; onlar hep senin, harcanmaz.
              İkram yalnız süs, ikisi birbirine dönüşmez. Yakında ✨
            </AppText>
          </View>
        </View>
      </Sheet>
    </>
  )
}
