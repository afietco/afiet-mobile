import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ApiQuest } from '@/data/api/client'
import { SofraSetupSection } from '@/features/ftue/sofra-setup'
import { ChapterDoorIntro } from '@/features/ftue/door-intro'
import { QuestDetailSheet } from '@/features/progress/QuestDetailSheet'
import { claimQuest, questSections, useQuestsResult } from '@/features/progress/quests'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { AfiScene } from '@/ui/maskot/AfiScene'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * "Görevlerim": ömür boyu başarımlar (afiet-gamification/docs/12).
 *
 * İlerleme sunucuda mevcut veriden türetilir, bu yüzden liste geriye dönük
 * doludur: kullanıcı hiç görev "yapmadan" geçmişinden tamamlanmış görevlerle
 * karşılaşabilir. Görünürlük kuralı gereği sürmekte olanlardan her gruptan
 * yalnız en yakın eşik gösterilir; ekran kontrol listesine dönüşmez.
 *
 * Her satır açılır (QuestDetailSheet): liste ne kadar yaklaştığını söyler,
 * detay ne saydığını ve nereye gidip yapılacağını söyler.
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
  onOpen,
  busy,
}: {
  quest: ApiQuest
  onClaim: (quest: ApiQuest) => void
  onOpen: (quest: ApiQuest) => void
  busy: boolean
}) {
  return (
    <View className="mt-3 rounded-2xl bg-emerald-600 p-5">
      {/* The body opens the story, the button collects the reward. They are
          separate targets because they are separate intents, and the button is
          the one that must not be hit by accident while reading. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${quest.title} görevinin ayrıntısı`}
        onPress={() => onOpen(quest)}
        className="flex-row items-center gap-3 active:opacity-80"
      >
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
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${quest.title} görevini tamamla`}
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        /* Tracked at the two buttons rather than inside `onClaim`, which they
           share: the whole question is whether the reward gets collected off
           the list or only after the quest has been read. */
        onPress={() => {
          trackTap('quest_claim', { from: 'list' })
          onClaim(quest)
        }}
        className={`mt-4 items-center rounded-xl bg-white py-3 active:opacity-80 ${
          busy ? 'opacity-60' : ''
        }`}
      >
        <AppText weight="bold" className="text-emerald-700">
          {busy ? 'Tamamlanıyor…' : 'Görevi tamamla'}
        </AppText>
      </Pressable>
    </View>
  )
}

function QuestRow({ quest, onOpen }: { quest: ApiQuest; onOpen: (quest: ApiQuest) => void }) {
  const done = quest.claimed
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${quest.title}. ${quest.detail}`}
      accessibilityHint={
        done ? 'Görevin ayrıntısını açar' : 'Görevin ayrıntısını ve ne yapman gerektiğini açar'
      }
      onPress={() => onOpen(quest)}
      className="flex-row items-center gap-3 py-3 active:opacity-70"
    >
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
    </Pressable>
  )
}

/**
 * Afi kutlaması: görev alındığı an beliren tek seferlik sahne (docs/12).
 * Görev almak bir unvan anıdır, bu yüzden Afi rozet pozunda durur.
 *
 * Kapanışın açık bir düğmesi var. Sahne 0.8.4'te native bir Modal'dı ve
 * kapanınca ekranı dokunulmaz bırakabiliyordu; artık uygulamanın kendi
 * katmanında çiziliyor (ui/overlayHost.tsx) ama çıkışın tek yolunun "karartıya
 * dokun" olması bir kez kapana kısılmış birinin güvenebileceği bir söz değil.
 */
function QuestCelebration({ quest, onClose }: { quest: ApiQuest; onClose: () => void }) {
  return (
    <AfiScene
      pose="rozet"
      size={96}
      title={quest.title}
      body={quest.detail}
      badge={quest.xpReward > 0 ? `+${String(quest.xpReward)} tecrübe` : undefined}
      actionLabel="Harika"
      onClose={onClose}
    />
  )
}

export default function GorevlerimScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { data: quests, loading, error, retry } = useQuestsResult()
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState<ApiQuest | null>(null)
  const [openedKey, setOpenedKey] = useState<string | null>(null)

  if (loading || !quests) return <PageSkeleton error={error} onRetry={retry} />

  const { claimable, active, claimed } = questSections(quests)
  /* Held by key rather than by value: the list refreshes underneath an open
     sheet (logging a meal moves a counter), and a snapshot taken at tap time
     would go on showing the progress the quest had a minute ago. */
  const opened = openedKey === null ? null : (quests.find((q) => q.key === openedKey) ?? null)
  const openQuest = (quest: ApiQuest) => setOpenedKey(quest.key)

  const onClaim = (quest: ApiQuest) => {
    if (claiming) return
    setClaiming(quest.key)
    setClaimError(null)
    void claimQuest(quest.key)
      .then((claimedQuest) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        /* Claimed from inside the detail, the detail is done: leaving it open
           would put a stale "Görevi tamamla" behind the celebration. */
        setOpenedKey(null)
        setCelebrating(claimedQuest)
      })
      .catch(() => {
        /* This used to return in silence: the button went back to saying
           "Görevi al" and nothing else moved, so a dropped request was
           indistinguishable from a tap that never registered. Say it, and
           refresh, because the reward may well have landed server side. */
        setClaimError('Görevi tamamlayamadım. Bağlantını kontrol edip tekrar dener misin?')
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        retry()
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

        <ChapterDoorIntro chapter="trail" />

        {/* The setup guide sits above the quests rather than inside them: one
            is the app introducing itself and ends, the other is a lifetime of
            what you have done. Mixing them would turn the second into a list
            of chores. */}
        <SofraSetupSection />

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
                onOpen={openQuest}
                busy={claiming === quest.key}
              />
            ))}
          </>
        ) : null}

        {claimError ? (
          <AppText
            accessibilityLiveRegion="polite"
            className="mt-3 text-center text-sm text-red-600 dark:text-red-400"
          >
            {claimError}
          </AppText>
        ) : null}

        {active.length > 0 ? (
          <View className="mt-5 rounded-2xl bg-surface px-5 py-2">
            <AppText weight="semibold" className="mb-1 mt-3 text-sm text-soft">
              Sürüyor
            </AppText>
            {active.map((quest, index) => (
              <View key={quest.key} className={index > 0 ? 'border-t border-line/40' : ''}>
                <QuestRow quest={quest} onOpen={openQuest} />
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
                <QuestRow quest={quest} onOpen={openQuest} />
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

      <QuestDetailSheet
        quest={opened}
        onClose={() => setOpenedKey(null)}
        onClaim={onClaim}
        claiming={opened !== null && claiming === opened.key}
      />

      {celebrating ? (
        <QuestCelebration quest={celebrating} onClose={() => setCelebrating(null)} />
      ) : null}
    </View>
  )
}
