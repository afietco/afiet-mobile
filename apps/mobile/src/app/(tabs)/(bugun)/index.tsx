import {
  SEED_FOODS,
  formatDecimalTR,
  formatLongTR,
  searchSeedFoods,
  toISODate,
  todayISO,
  turkishLower,
} from '@afiet/core'
import { Link, type Href } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { BrandHeader } from '@/ui/BrandHeader'
import { IconCheck, IconChevronRight, IconX } from '@/ui/icons'

type Check = { label: string; value: string; ok: boolean }

/** Hermes'te @afiet/core'un (özellikle Intl tr-TR) doğru çalıştığını kanıtlar */
function runChecks(): Check[] {
  const imam = searchSeedFoods('İMAM')[0]?.name ?? '—'
  const ispanak = searchSeedFoods('ISPANAK')[0]?.name ?? '—'
  const lower = turkishLower('İSTANBUL IĞDIR')
  const temmuz = formatLongTR(toISODate(new Date(2026, 6, 15)))
  const decimal = formatDecimalTR(72.5)
  return [
    { label: 'SEED_FOODS', value: `${SEED_FOODS.length} besin`, ok: SEED_FOODS.length > 100 },
    { label: "searchSeedFoods('İMAM')", value: imam, ok: imam === 'İmam bayıldı' },
    { label: "searchSeedFoods('ISPANAK')", value: ispanak, ok: ispanak === 'Ispanak yemeği' },
    { label: "turkishLower('İSTANBUL IĞDIR')", value: lower, ok: lower === 'istanbul ığdır' },
    { label: 'Intl tr-TR uzun tarih', value: formatLongTR(todayISO()), ok: temmuz.includes('Temmuz') },
    { label: 'formatDecimalTR(72.5)', value: decimal, ok: decimal === '72,5' },
  ]
}

const LINKS: { href: Href; label: string }[] = [
  { href: '/beslenme', label: 'Beslenme' },
  { href: '/besinler', label: 'Besin Rehberi' },
  { href: '/vucudum', label: 'Vücudum' },
]

/** Geçici sanity ekranı — Faz 5-6'da gerçek Bugün ekranı gelecek */
export default function SanityScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const checks = useMemo(runChecks, [])

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 32,
      }}
    >
      <BrandHeader />

      <View className="mt-6 rounded-2xl bg-surface p-5">
        <AppText weight="bold" className="mb-3 text-ink">
          Çekirdek doğrulama
        </AppText>
        {checks.map((c) => (
          <View key={c.label} className="flex-row items-start gap-3 py-1.5">
            {c.ok ? (
              <IconCheck size={18} color="#059669" />
            ) : (
              <IconX size={18} color="#dc2626" />
            )}
            <View className="flex-1">
              <AppText className="text-xs text-faint">{c.label}</AppText>
              <AppText weight="semibold" className="text-sm text-ink">
                {c.value}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <View className="mt-6 gap-3">
        {LINKS.map((l) => (
          <Link key={l.label} href={l.href} asChild>
            <Pressable className="flex-row items-center justify-between rounded-2xl bg-surface px-5 py-4">
              <AppText weight="semibold" className="text-ink">
                {l.label}
              </AppText>
              <IconChevronRight size={18} color={t.faint} />
            </Pressable>
          </Link>
        ))}
        {__DEV__ && (
          <Link href="/debug" asChild>
            <Pressable className="flex-row items-center justify-between rounded-2xl border border-dashed border-line px-5 py-4">
              <AppText weight="semibold" className="text-soft">
                Veri katmanı testi (dev)
              </AppText>
              <IconChevronRight size={18} color={t.faint} />
            </Pressable>
          </Link>
        )}
      </View>

      <AppText className="mt-6 text-center text-xs text-faint">
        Bu ekran geçici — gerçek Bugün ekranı yolda.
      </AppText>
    </ScrollView>
  )
}
