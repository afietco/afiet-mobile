import { View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Sheet } from '@/ui/Sheet'
import { KESE_ONE_LINER, KESE_OUTSIDE_NOTE, keseRefreshLabel, keseSourceLines } from './keseCopy'
import { useKese } from './useKese'

/**
 * Where the weekly kese comes from, itemised.
 *
 * The whole point of the design is that the ladder finally buys something, so
 * this is the surface that has to teach it: the tier line and the title line
 * are the league and the levels, written as the messages they are worth.
 */
export function KeseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const kese = useKese()
  const lines = keseSourceLines(kese)
  const filled = kese.allowance.total > 0 ? kese.remaining / kese.allowance.total : 0

  return (
    <Sheet
      name="kese"
      open={open}
      onClose={onClose}
      title={
        <>
          <AppText className="text-xl">🧺</AppText>
          <AppText weight="bold" className="text-lg text-ink">
            İkram kesen
          </AppText>
        </>
      }
    >
      <AppText weight="extrabold" className="text-2xl text-ink">
        {kese.empty ? 'Bu hafta doldu' : `Bu hafta ${String(kese.remaining)} mesaj`}
      </AppText>
      <AppText className="mt-1 text-sm text-soft">
        {kese.allowance.total} mesajın {kese.spent} tanesini kullandın
      </AppText>

      <View
        className="mt-3 h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: t.muted }}
      >
        <View
          className="h-2 rounded-full bg-emerald-500"
          style={{ width: `${Math.round(filled * 100)}%` }}
        />
      </View>

      <View className="mt-5 rounded-2xl bg-canvas p-4">
        {lines.map((line, index) => (
          <View
            key={line.key}
            className={`flex-row items-center justify-between ${index > 0 ? 'mt-3' : ''}`}
          >
            <AppText className="min-w-0 flex-1 text-sm text-soft">{line.label}</AppText>
            <AppText weight="bold" className="text-sm text-ink">
              {index === 0 ? line.amount : `+${String(line.amount)}`}
            </AppText>
          </View>
        ))}
        <View className="my-3 h-px" style={{ backgroundColor: t.line }} />
        <View className="flex-row items-center justify-between">
          <AppText weight="bold" className="text-sm text-ink">
            Haftalık kesen
          </AppText>
          <AppText weight="extrabold" className="text-sm text-ink">
            {kese.allowance.total}
          </AppText>
        </View>
      </View>

      <AppText className="mt-4 text-sm leading-6 text-soft">{KESE_ONE_LINER}</AppText>
      <AppText className="mt-2 text-xs leading-5 text-faint">{KESE_OUTSIDE_NOTE}</AppText>
      <AppText className="mt-3 text-xs text-faint">
        {keseRefreshLabel(kese.refreshesAt)}
      </AppText>
    </Sheet>
  )
}
