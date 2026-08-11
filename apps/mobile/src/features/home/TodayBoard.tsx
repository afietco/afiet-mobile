import { WATER_TARGET_GLASSES, formatNumber, tierByKey, type LeagueTierKey, type Profile } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { router, type Href } from 'expo-router'
import { forwardRef, useState, type ReactNode, type Ref } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { measurementRepo, waterRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { useSummary } from '@/data/useSummary'
import { useGroups } from '@/features/groups/useGroups'
import { hasProgressTarget, progressPercent } from '@/features/nutrition/macroProgress'
import { questSections, useQuestsResult } from '@/features/progress/quests'
import { useLeagueResult } from '@/features/progress/useProgress'
import { track, trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { useBreathingScale } from '@/ui/motionGate'
import {
  IconBookmark,
  IconChevronRight,
  IconDrop,
  IconMinus,
  IconPlus,
  IconScale,
  IconSparkles,
  IconUsers,
} from '@/ui/icons'

/**
 * Today's board: one surface, one row per thing.
 *
 * Six free-floating tiles all wore the same costume, so a meter you touch, a
 * status that calls you and a plain door carried the same weight. Rows put them
 * in one place and let the right-hand value do the talking.
 *
 * Two things keep this from reading as a settings list: the water row is the
 * only one you operate, and it looks it; and a finished quest still calls, in
 * its own row, with a filled chip and a pulse instead of a whole green card.
 * There are no chevrons, on purpose.
 */

type Tint = 'sky' | 'emerald' | 'violet' | 'salt'

const TINTS: Record<Tint, { chip: string; ink: [string, string] }> = {
  sky: { chip: 'bg-sky-100 dark:bg-sky-900/50', ink: ['#0284c7', '#38bdf8'] },
  emerald: { chip: 'bg-emerald-100 dark:bg-emerald-900/50', ink: ['#059669', '#34d399'] },
  violet: { chip: 'bg-violet-100 dark:bg-violet-900/50', ink: ['#7c3aed', '#a78bfa'] },
  /* The tier reads through its own spice emoji, so the plate under it stays
     neutral; three emerald chips in one column was one too many. */
  salt: { chip: 'bg-muted', ink: ['#059669', '#34d399'] },
}

/** Rows line up on one grid: chip, then title, wherever the row starts. */
const CHIP = 'h-9 w-9 items-center justify-center rounded-xl'
const ROW = 'flex-row items-center gap-3 px-4 py-3.5'
/**
 * The one row that carries its own colour, inset so it can be round.
 *
 * A full-bleed coloured band inside a rounded card meets that card's corners
 * with square ones of its own, which reads as a seam rather than a shape. Held
 * off the edges it becomes a card in its own right, which is what it is.
 */
const CTA_ROW = 'mx-3 my-2 flex-row items-center gap-3 rounded-2xl px-3.5 py-3.5'
/** Inset so the hairline starts under the title, not under the chip. */
const DIVIDER = 'ml-16 h-px bg-line'

function Chip({
  tint,
  filled,
  plate,
  children,
}: {
  tint: Tint
  filled?: boolean
  /** Overrides the plate colour, for rows that carry their own background. */
  plate?: string
  children: ReactNode
}) {
  return (
    <View className={`${CHIP} ${plate ?? (filled ? 'bg-emerald-600' : TINTS[tint].chip)}`}>
      {children}
    </View>
  )
}

/** Soft breathing halo, used only while something is waiting to be claimed. */
function ReadyPulse({ color }: { color: string }) {
  const style = useBreathingScale(1.35, 1100)
  return (
    <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, style]} />
  )
}

function Row({
  title,
  subtitle,
  value,
  valueColor,
  tint,
  filled,
  highlighted,
  cta,
  icon,
  trailing,
  onPress,
  accessibilityLabel,
  hidden,
  innerRef,
}: {
  title: string
  /** Second line under the title; the cta row uses it instead of a value. */
  subtitle?: string
  value?: string
  valueColor?: string
  tint: Tint
  filled?: boolean
  /** Tints the whole row, not just the chip: reserved for "something is ready". */
  highlighted?: boolean
  /**
   * The one row on the board that asks to be tapped rather than reporting a
   * state. It carries a solid emerald band instead of a tint, so it reads as a
   * button inside a list of readings.
   */
  cta?: boolean
  icon: ReactNode
  trailing?: ReactNode
  onPress: () => void
  accessibilityLabel: string
  hidden?: boolean
  innerRef?: Ref<View>
}) {
  return (
    <Pressable
      ref={innerRef}
      collapsable={false}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      onPress={onPress}
      className={
        cta
          ? `${CTA_ROW} bg-emerald-600 active:bg-emerald-700 dark:bg-emerald-700 dark:active:bg-emerald-600`
          : `${ROW} ${
              highlighted ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''
            } active:bg-muted`
      }
    >
      <Chip tint={tint} filled={filled} plate={cta ? 'bg-white/20' : undefined}>
        {icon}
      </Chip>
      {subtitle ? (
        <View className="min-w-0 flex-1">
          <AppText weight="bold" className={cta ? 'text-white' : 'text-ink'}>
            {title}
          </AppText>
          <AppText
            numberOfLines={1}
            className={`text-xs ${cta ? 'text-emerald-50/90' : 'text-soft'}`}
          >
            {subtitle}
          </AppText>
        </View>
      ) : (
        <AppText weight="bold" className={cta ? 'text-white' : 'text-ink'}>
          {title}
        </AppText>
      )}
      <View className={`flex-row items-center gap-2 pl-3 ${subtitle ? '' : 'ml-auto'}`}>
        {value ? (
          <AppText
            numberOfLines={1}
            weight={valueColor || cta ? 'bold' : 'normal'}
            style={valueColor && !cta ? { color: valueColor } : undefined}
            className={`text-sm ${cta ? 'text-white' : valueColor ? '' : 'text-soft'}`}
          >
            {value}
          </AppText>
        ) : null}
        {trailing}
      </View>
    </Pressable>
  )
}

interface TodayBoardProps {
  profileId: number
  profile?: Profile
  date: string
  waterTarget?: number
  /** The guide dims everything but its own step. */
  guideActive?: boolean
  guideStep?: 'meal' | 'water' | 'body' | null
  /** During the body step the card opens the setup or measurement sheet. */
  onGuideBodyPress?: () => void
  waterRef?: Ref<View>
  bodyRef?: Ref<View>
}

export function TodayBoard({
  profileId,
  profile,
  date,
  waterTarget = WATER_TARGET_GLASSES,
  guideActive = false,
  guideStep = null,
  onGuideBodyPress,
  waterRef,
  bodyRef,
}: TodayBoardProps) {
  const { isDark } = useTheme()
  const tone = isDark ? 1 : 0
  const t = tokens[isDark ? 'dark' : 'light']
  const hides = (step: 'water' | 'body' | 'other') =>
    guideActive && (step === 'other' || guideStep !== step)

  return (
    <View className="overflow-hidden rounded-2xl bg-surface">
      <WaterRow
        profileId={profileId}
        date={date}
        target={waterTarget}
        tone={tone}
        locked={guideStep === 'water'}
        hidden={hides('water')}
        innerRef={waterRef}
      />
      {/* Afi comes second, straight under the row people touch every day: he
          was at the bottom, under two rows that only report a state, which is
          the last place someone looking for a conversation would find him. */}
      <ChatRow hidden={hides('other')} />
      <BodyRow
        profileId={profileId}
        profile={profile}
        tone={tone}
        hidden={hides('body')}
        onGuidePress={guideStep === 'body' ? onGuideBodyPress : undefined}
        innerRef={bodyRef}
      />
      <View className={DIVIDER} />
      <QuestRow tone={tone} hidden={hides('other')} />
      <View className={DIVIDER} />
      <LeagueRow tone={tone} hidden={hides('other')} />
      <View className={DIVIDER} />
      <DoorsRow tone={tone} faint={t.faint} hidden={hides('other')} />
    </View>
  )
}

/** The only row you operate, and the reason this is a board and not a list. */
function WaterRow({
  profileId,
  date,
  target,
  tone,
  locked,
  hidden,
  innerRef,
}: {
  profileId: number
  date: string
  target: number
  tone: 0 | 1
  locked: boolean
  hidden: boolean
  innerRef?: Ref<View>
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const sky = TINTS.sky.ink[tone]
  const log = useLiveValue(['water'], () => waterRepo.forDay(profileId, date), [profileId, date])
  const serverGlasses = log?.glasses ?? 0

  /* Show the intended value immediately while the write completes. The override
     carries the day it belongs to and expires on its own: it stops applying the
     moment the server reports that value, or the profile or date changes. That
     is why it needs no effect to clean up after it, and why it can never leak
     one day's count into another. A failed write drops it and explains the
     visible change. */
  const [optimistic, setOptimistic] = useState<{ key: string; value: number } | null>(null)
  const key = `${String(profileId)}|${date}`
  const pending =
    optimistic && optimistic.key === key && optimistic.value !== serverGlasses
      ? optimistic.value
      : null
  const glasses = pending ?? serverGlasses
  const targetKnown = hasProgressTarget(target)

  const change = (delta: number) => {
    const next = Math.max(0, glasses + delta)
    if (next === glasses) return
    setOptimistic({ key, value: next })
    void Haptics.selectionAsync()
    void waterRepo
      .setGlasses(profileId, date, next)
      .then(() => track('water_logged', { glasses: next }))
      .catch(() => {
        setOptimistic(null)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert(
          'Kaydedemedik',
          'Su kaydını şu an güncelleyemedik. Birazdan tekrar deneyebilirsin.',
        )
      })
  }

  return (
    <View
      ref={innerRef}
      collapsable={false}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      className="px-4 py-3.5"
    >
      <View className="flex-row items-center gap-3">
        <Chip tint="sky">
          <IconDrop size={20} color={sky} />
        </Chip>
        <AppText weight="bold" className="text-ink">
          Su
        </AppText>
        <AppText weight="semibold" className="ml-auto text-sm text-soft">
          {targetKnown ? `${String(glasses)}/${String(target)} bardak` : `${String(glasses)} bardak`}
        </AppText>
      </View>

      <View className="mt-2.5 flex-row items-center gap-3 pl-12">
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <View
            className="h-full rounded-full bg-sky-500"
            style={{ width: `${progressPercent(glasses, target)}%` }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bir bardak azalt"
          onPress={() => change(-1)}
          disabled={glasses === 0 || locked}
          className={`h-8 w-8 items-center justify-center rounded-full bg-muted ${
            glasses === 0 || locked ? 'opacity-30' : ''
          }`}
        >
          <IconMinus size={16} color={t.soft} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bir bardak ekle"
          onPress={() => change(1)}
          className="h-8 w-8 items-center justify-center rounded-full bg-sky-500"
        >
          <IconPlus size={16} color="#ffffff" strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  )
}

/** Keeps its call to attention inside the row: filled chip plus a pulse. */
function QuestRow({ tone, hidden }: { tone: 0 | 1; hidden: boolean }) {
  const emerald = TINTS.emerald.ink[tone]
  const { data: quests, loading } = useQuestsResult()
  const sections = questSections(quests ?? [])
  const ready = sections.claimable.length
  const inProgress = sections.active.length

  const value = ready > 0
    ? `${String(ready)} görev hazır 🎉`
    : loading
      ? '…'
      : inProgress > 0
        ? `${String(inProgress)} görev sürüyor`
        : 'Yolculuğun burada'

  return (
    <Row
      title="Görevlerim"
      value={value}
      valueColor={ready > 0 ? emerald : undefined}
      tint="emerald"
      filled={ready > 0}
      /* A finished task turns the whole row green, the way it used to: the
         chip alone was too quiet for the one thing on this board that is
         waiting to be collected. */
      highlighted={ready > 0}
      icon={<IconSparkles size={20} color={ready > 0 ? '#ffffff' : emerald} />}
      trailing={ready > 0 ? <ReadyPulse color={emerald} /> : undefined}
      onPress={() => router.push('/gorevlerim')}
      accessibilityLabel={
        ready > 0 ? `Görevlerim, ${String(ready)} görev seni bekliyor` : 'Görevlerim'
      }
      hidden={hidden}
    />
  )
}

function BodyRow({
  profileId,
  profile,
  tone,
  hidden,
  onGuidePress,
  innerRef,
}: {
  profileId: number
  profile?: Profile
  tone: 0 | 1
  hidden: boolean
  onGuidePress?: () => void
  innerRef?: Ref<View>
}) {
  const violet = TINTS.violet.ink[tone]
  const latest = useLiveValue(
    ['measurements'],
    () => measurementRepo.latest(profileId),
    [profileId],
  )
  const summary = useSummary(new Date().toISOString().slice(0, 10))
  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  const bmi = summary?.body?.bmi ?? null

  const value =
    hasAttrs && latest
      ? bmi != null
        ? `${formatNumber(latest.weightKg)} kg · BMI ${formatNumber(bmi)}`
        : `${formatNumber(latest.weightKg)} kg`
      : 'Bilgilerini ekle 🌱'

  return (
    <Row
      title="Vücudum"
      value={value}
      tint="violet"
      icon={<IconScale size={20} color={violet} />}
      onPress={onGuidePress ?? (() => router.push('/vucudum'))}
      accessibilityLabel={`Vücudum, ${value}`}
      hidden={hidden}
      innerRef={innerRef}
    />
  )
}

function LeagueRow({ tone, hidden }: { tone: 0 | 1; hidden: boolean }) {
  const { data: league, loading } = useLeagueResult()
  const tier = tierByKey((league?.tier ?? 'tuz') as LeagueTierKey)

  // Sitting out (a fresh account, or the league not open yet) is a normal
  // state, not an error: the row still invites without promising a rank.
  const value = loading
    ? '…'
    : league?.seated
      ? `${tier.label} · ${String(league.myRank)}. sıra`
      : 'Yakında sofran kurulur'

  return (
    <Row
      title="Ligim"
      value={value}
      tint="salt"
      icon={<Text style={{ fontSize: 18, lineHeight: 24 }}>{tier.emoji}</Text>}
      onPress={() => {
        trackTap('lig_open', { from: 'today' })
        router.push('/lig')
      }}
      accessibilityLabel={
        league?.seated
          ? `Ligim: ${tier.label} sofrası, ${String(league.myRank)}. sıradasın`
          : 'Ligim'
      }
      hidden={hidden}
    />
  )
}

/**
 * Afi's doorway into the chat; carries the mascot instead of an icon.
 *
 * The only invitation on a board of readings, so it is the only row that wears
 * a colour of its own. The band needs no hairline above or below it: it draws
 * its own edges, and a divider running into it would only fray them.
 */
function ChatRow({ hidden }: { hidden: boolean }) {
  return (
    <Row
      title="Afi"
      /* A name on its own says nothing about what tapping it does, and this
         row is the widest thing on the board to say it in. */
      subtitle="Sofra arkadaşın, aklındakini sor"
      tint="emerald"
      cta
      icon={<AfiPose pose="selam" size={22} tone="dark" />}
      trailing={<IconChevronRight size={18} color="#ffffff" />}
      onPress={() => {
        trackTap('chat_entry', { from: 'today', assistant: 'afi' })
        router.push('/sohbet' as Href)
      }}
      accessibilityLabel="Afi ile sohbet et"
      hidden={hidden}
    />
  )
}

/**
 * The two plain doors share one row. Neither carries state worth a card, and
 * both already exist elsewhere: Grubum is a tab, Menüm sits on Beslenme too.
 * The group keeps its identity through the chip, which wears its own emoji.
 */
function DoorsRow({ tone, faint, hidden }: { tone: 0 | 1; faint: string; hidden: boolean }) {
  const violet = TINTS.violet.ink[tone]
  const emerald = TINTS.emerald.ink[tone]
  const { state } = useGroups()
  const myGroup = state.status === 'ready' ? (state.groups[0] ?? null) : null

  return (
    <View
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      className="flex-row items-center"
    >
      <Door
        label="Menüm"
        icon={<IconBookmark size={20} color={violet} />}
        chip={TINTS.violet.chip}
        onPress={() => router.push('/menum')}
      />
      <View style={{ backgroundColor: faint, opacity: 0.25 }} className="my-3 w-px self-stretch" />
      <Door
        /* Someone with no group has nothing to call "mine"; the door should
           say what it does instead of naming something they do not have. */
        label={myGroup ? 'Grubum' : 'Gruba katıl'}
        icon={
          myGroup?.emoji ? (
            <Text style={{ fontSize: 18, lineHeight: 24 }}>{myGroup.emoji}</Text>
          ) : (
            <IconUsers size={20} color={emerald} />
          )
        }
        chip={TINTS.emerald.chip}
        onPress={() => router.push('/grubum')}
        accessibilityLabel={myGroup ? `Grubum: ${myGroup.name}` : 'Bir gruba katıl'}
      />
    </View>
  )
}

const Door = forwardRef<View, {
  label: string
  icon: ReactNode
  chip: string
  onPress: () => void
  accessibilityLabel?: string
}>(function Door({ label, icon, chip, onPress, accessibilityLabel }, ref) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-2.5 px-4 py-3.5 active:bg-muted"
    >
      <View className={`${CHIP} ${chip}`}>{icon}</View>
      <AppText weight="bold" className="text-ink">
        {label}
      </AppText>
    </Pressable>
  )
})
