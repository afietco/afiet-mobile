import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ApiQuest } from '@/data/api/client'
import { claimQuest, questSections, useQuestsResult } from '@/features/progress/quests'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Confetti } from '@/ui/Confetti'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * "Görevlerim": ömür boyu başarımlar (afiet-gamification/docs/12).
 *
 * İlerleme sunucuda mevcut veriden türetilir, bu yüzden liste geriye dönük
 * doludur: kullanıcı hiç görev "yapmadan" geçmişinden tamamlanmış görevlerle
 * karşılaşabilir. Görünürlük kuralı gereği sürmekte olanlardan her gruptan
 * yalnız en yakın eşik gösterilir; ekran kontrol listesine dönüşmez.
 */

function ProgressBar({ current, target }: { current: number; target: number }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return (
    <View className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: t.muted }}>
      <View className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
    </View>
  )
}

function ClaimableCard({
  quest,
  onClaim,
  busy,
}: {
  quest: ApiQuest
  onClaim: (quest: ApiQuest) => void
  busy: boolean
}) {
  return (
    <View className="mt-3 rounded-2xl bg-emerald-600 p-5">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <AppText className="text-2xl">{quest.emoji}</AppText>
        </View>
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" numberOfLines={1} className="text-lg text-white">
            {quest.title}
          </AppText>
          <AppText numberOfLines={1} className="text-sm text-emerald-50">
            {quest.detail}
          </AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${quest.title} görevini al`}
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={() => onClaim(quest)}
        className={`mt-4 items-center rounded-xl bg-white py-3 active:opacity-80 ${
          busy ? 'opacity-60' : ''
        }`}
      >
        <AppText weight="bold" className="text-emerald-700">
          {busy ? 'Alınıyor…' : 'Görevi al'}
        </AppText>
      </Pressable>
    </View>
  )
}

function QuestRow({ quest }: { quest: ApiQuest }) {
  const done = quest.claimed
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View
        className={`h-11 w-11 items-center justify-center rounded-2xl ${
          done ? 'bg-muted' : 'bg-emerald-100 dark:bg-emerald-900/50'
        }`}
      >
        <AppText className={`text-xl ${done ? 'opacity-50' : ''}`}>{quest.emoji}</AppText>
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <AppText weight="bold" numberOfLines={1} className="flex-1 text-ink">
            {quest.title}
          </AppText>
          {done ? <AppText className="text-sm">✓</AppText> : null}
        </View>
        <AppText numberOfLines={1} className="text-xs text-soft">
          {quest.detail}
        </AppText>
        {done ? null : (
          <>
            <ProgressBar current={quest.progress} target={quest.target} />
            <AppText className="mt-1 text-[11px] text-faint">
              {quest.progress} / {quest.target}
            </AppText>
          </>
        )}
      </View>
    </View>
  )
}

/** Afi kutlaması: görev alındığı an beliren tek seferlik sahne (docs/12). */
function QuestCelebration({ quest, onClose }: { quest: ApiQuest; onClose: () => void }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kutlamayı kapat"
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/40 px-8"
      >
        <View className="w-full items-center rounded-3xl bg-surface px-6 py-8">
          <Confetti />
          <AfiPose pose="kutlama" size={96} />
          <AppText weight="extrabold" className="mt-3 text-center text-2xl text-ink">
            {quest.title}
          </AppText>
          <AppText className="mt-1 text-center text-sm leading-6 text-soft">
            {quest.detail}
          </AppText>
          {quest.xpReward > 0 ? (
            <View className="mt-4 rounded-full bg-emerald-50 px-4 py-1.5 dark:bg-emerald-950/50">
              <AppText weight="bold" className="text-sm text-emerald-800 dark:text-emerald-200">
                +{quest.xpReward} tecrübe
              </AppText>
            </View>
          ) : null}
          <AppText className="mt-5 text-xs text-faint">Kapatmak için dokun</AppText>
        </View>
      </Pressable>
    </Modal>
  )
}

export default function GorevlerimScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { data: quests, loading, error, retry } = useQuestsResult()
  const [claiming, setClaiming] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState<ApiQuest | null>(null)

  if (loading || !quests) return <PageSkeleton error={error} onRetry={retry} />

  const { claimable, active, claimed } = questSections(quests)

  const onClaim = (quest: ApiQuest) => {
    if (claiming) return
    setClaiming(quest.key)
    void claimQuest(quest.key)
      .then((claimedQuest) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setCelebrating(claimedQuest)
      })
      .catch(() => {
        // Yarışta başkası almış ya da ağ kopmuş olabilir; liste zaten
        // tazelenecek, sessizce geri dönülür.
      })
      .finally(() => setClaiming(null))
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader title="Görevlerim" subtitle="Yolculuğunun izi" />

        {claimable.length > 0 ? (
          <>
            <AppText weight="semibold" className="text-sm text-soft">
              Seni bekliyor
            </AppText>
            {claimable.map((quest) => (
              <ClaimableCard
                key={quest.key}
                quest={quest}
                onClaim={onClaim}
                busy={claiming === quest.key}
              />
            ))}
          </>
        ) : null}

        {active.length > 0 ? (
          <View className="mt-5 rounded-2xl bg-surface px-5 py-2">
            <AppText weight="semibold" className="mb-1 mt-3 text-sm text-soft">
              Sürüyor
            </AppText>
            {active.map((quest, index) => (
              <View key={quest.key} className={index > 0 ? 'border-t border-line/40' : ''}>
                <QuestRow quest={quest} />
              </View>
            ))}
          </View>
        ) : null}

        {claimed.length > 0 ? (
          <View className="mt-4 rounded-2xl bg-surface px-5 py-2">
            <AppText weight="semibold" className="mb-1 mt-3 text-sm text-soft">
              Tamamladıkların
            </AppText>
            {claimed.map((quest, index) => (
              <View key={quest.key} className={index > 0 ? 'border-t border-line/40' : ''}>
                <QuestRow quest={quest} />
              </View>
            ))}
          </View>
        ) : null}

        {quests.length === 0 ? (
          <View className="mt-5 flex-row items-center gap-3 rounded-2xl bg-surface p-5">
            <AfiPose pose="merak" size={52} />
            <AppText className="flex-1 text-sm text-faint">
              Görevler yolda. Kayıt tutmaya devam ettikçe burası senin sofra hikâyenle dolacak 🌱
            </AppText>
          </View>
        ) : null}

        <View className="mt-4 h-px" style={{ backgroundColor: t.line }} />
      </ScrollView>

      {celebrating ? (
        <QuestCelebration quest={celebrating} onClose={() => setCelebrating(null)} />
      ) : null}
    </View>
  )
}
