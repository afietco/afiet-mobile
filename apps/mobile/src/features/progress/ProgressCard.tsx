import { tierByKey, type LeagueTierKey } from '@afiet/core'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { KeseSheet } from '@/features/kese/KeseSheet'
import { SeasonShelf } from './SeasonShelf'
import { useSeasonShelf } from './useSeasonShelf'
import { useKese } from '@/features/kese/useKese'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconSparkles } from '@/ui/icons'
import { Skeleton } from '@/ui/Skeleton'
import { LevelRing } from './LevelRing'
import { useLeagueResult, useProgressResult } from './useProgress'

/**
 * Profile card for the level journey plus the entry point into the league.
 *
 * Deliberately calm: the title leads, the number supports it and nothing here
 * frames the person against anyone else (docs/10 surfaces).
 */
export function ProgressCard({ className = 'mt-4' }: { className?: string }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emerald = isDark ? '#34d399' : '#059669'
  const { data: progress, loading } = useProgressResult()
  const { data: league } = useLeagueResult()
  const tier = tierByKey((league?.tier ?? 'tuz') as LeagueTierKey)
  const kese = useKese()
  const seasons = useSeasonShelf()
  const [keseOpen, setKeseOpen] = useState(false)

  return (
    <View className={`rounded-2xl bg-surface p-5 ${className}`}>
      <View className="flex-row items-center gap-2">
        <IconSparkles size={18} color={emerald} />
        <AppText weight="bold" className="flex-1 text-ink">
          Yolculuğun
        </AppText>
      </View>

      {loading || !progress ? (
        <View className="mt-4 flex-row items-center gap-4">
          <Skeleton width={92} height={92} radius={46} />
          <View className="flex-1 gap-2">
            <Skeleton width={128} height={20} radius={6} />
            <Skeleton width={96} height={12} radius={6} />
            <Skeleton height={8} radius={4} />
          </View>
        </View>
      ) : (
        <View className="mt-4 flex-row items-center gap-4">
          <LevelRing progress={progress} size={92} />
          <View className="min-w-0 flex-1">
            <AppText weight="extrabold" numberOfLines={1} className="text-lg text-ink">
              {progress.title}
            </AppText>
            <AppText className="mt-0.5 text-xs text-soft">
              Sonraki seviyeye {progress.xpToNext}
            </AppText>

            {/* Progress bar duplicates the ring for a quick left-to-right read. */}
            <View
              className="mt-2 h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: t.muted }}
            >
              <View
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${Math.round(progress.ratio * 100)}%` as const }}
              />
            </View>

            <AppText className="mt-2 text-xs text-faint">
              {progress.levelsToNextTitle === 0
                ? 'Zirvedeki unvandasın, yolculuk sürüyor.'
                : `${String(progress.levelsToNextTitle)} seviye sonra yeni unvan.`}
            </AppText>
          </View>
        </View>
      )}

      {/* League entry: tier, my rank and a way into the dedicated screen. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lig ekranını aç"
        onPress={() => {
          trackTap('lig_open', { from: 'progress' })
          router.push('/lig')
        }}
        className="mt-4 flex-row items-center gap-3 rounded-xl bg-canvas p-3.5"
      >
        <AppText className="text-2xl">{tier.emoji}</AppText>
        <View className="min-w-0 flex-1">
          <AppText weight="bold" className="text-ink">
            {tier.label} Sofrası
          </AppText>
          <AppText className="text-xs text-soft">
            {league?.seated
              ? `Bu ay ${String(league.myRank)}. sıradasın`
              : 'Sofran kurulunca burada görünür'}
          </AppText>
        </View>
        <IconChevronRight size={18} color={t.faint} />
      </Pressable>

      {/* Mevsim rafı: ligin ay sonunu aşan tek parçası. Kademe daralabildiği
          için (docs/13) geçmişi tutan bir yer olmadan "birikim azalmaz"ın lig
          tarafında karşılığı kalmıyordu. */}
      <AppText weight="bold" className="mt-4 text-sm text-ink">
        Mevsimlerin
      </AppText>
      <SeasonShelf badges={seasons ?? []} />

      {/* What the tier and the title are worth, right under the ladder that
          earns them: this is the only place the two halves meet. Absent until
          the server answers, and absent entirely while the feature is off. */}
      {kese ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="İkram kesenin dökümünü aç"
            onPress={() => setKeseOpen(true)}
            className="mt-2 flex-row items-center gap-3 rounded-xl bg-canvas p-3.5"
          >
            <AppText className="text-2xl">🧺</AppText>
            <View className="min-w-0 flex-1">
              <AppText weight="bold" className="text-ink">
                İkram kesen
              </AppText>
              <AppText className="text-xs text-soft">
                {kese.empty
                  ? 'Bu hafta doldu, pazartesi tazelenir'
                  : `Bu hafta ${String(kese.remaining)} mesaj kaldı`}
              </AppText>
            </View>
            <IconChevronRight size={18} color={t.faint} />
          </Pressable>

          <KeseSheet open={keseOpen} onClose={() => setKeseOpen(false)} />
        </>
      ) : null}
    </View>
  )
}
