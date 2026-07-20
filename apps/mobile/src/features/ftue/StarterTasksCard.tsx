import { todayISO } from '@afiet/core'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { mealRepo, measurementRepo, waterRepo } from '../../data/repositories'
import { useLiveValue } from '../../data/useLive'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { CardHeader } from '@/ui/CardHeader'
import { IconCheck, IconChevronRight, IconTrophy } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { ftueSeen, markFtueSeen, useFtueSeen } from './ftueFlags'

/**
 * Başlangıç görevleri — web StarterTasksCard.tsx portu: veriden türeyen
 * 3 küçük hedef; hepsi tamamlanınca bir kez kutlanır ve kart kaybolur.
 * Verisi zaten dolu kurulumlarda hiç görünmeden sessizce kapanır.
 */
interface StarterTasksCardProps {
  profileId: number
  onAddFood: () => void
}

export function StarterTasksCard(props: StarterTasksCardProps) {
  const done = useFtueSeen('starterDone')
  if (done) return null
  return <StarterTasksContent {...props} />
}

function StarterTasksContent({ profileId, onAddFood }: StarterTasksCardProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const shown = useFtueSeen('starterShown')

  const logFirstWater = () => {
    void waterRepo
      .setGlasses(profileId, todayISO(), 1)
      .then(() => track('water_logged', { glasses: 1 }))
  }

  // Kart bilgilendirme amaçlı: sorgu başarısız olursa görev "yapılmadı"
  // sayılır (catch → güvenli varsayılan), toast/unhandled rejection üretilmez;
  // ilgili tabloda ilk mutasyonda notify ile kendini toparlar.
  const loggedDates = useLiveValue(
    ['meals'],
    () => mealRepo.loggedDates(profileId).catch(() => []),
    [profileId],
  )
  const waterLogs = useLiveValue(
    ['water'],
    // "Tüm zamanlar" için 1970 başlangıcı yeter; 0000-01-01 Postgres date'te
    // geçersiz (yıl 0 yok) ve backend'i 500'lüyordu.
    () => waterRepo.forRange(profileId, '1970-01-01', '9999-12-31').catch(() => []),
    [profileId],
  )
  // Ölçüm yokluğu ile "sorgu henüz dönmedi"yi ayırmak için null'a çevrilir
  const latestMeasurement = useLiveValue(
    ['measurements'],
    () =>
      measurementRepo
        .latest(profileId)
        .then((m) => m ?? null)
        .catch(() => null),
    [profileId],
  )

  const loading =
    loggedDates === undefined || waterLogs === undefined || latestMeasurement === undefined

  const mealDone = (loggedDates?.length ?? 0) > 0
  const waterDone = (waterLogs ?? []).some((w) => w.glasses > 0)
  const measureDone = latestMeasurement != null
  const allDone = mealDone && waterDone && measureDone
  const doneCount = [mealDone, waterDone, measureDone].filter(Boolean).length

  // Kart eksik haliyle bir kez görüldüyse işaretle; görevler daha ilk
  // bakışta zaten tamamsa (eski kullanıcı) kutlamayı sessizce atla
  useEffect(() => {
    if (loading) return
    if (!allDone) markFtueSeen('starterShown')
    else if (!ftueSeen('starterShown')) markFtueSeen('starterDone')
  }, [loading, allDone])

  if (loading) return null

  if (allDone) {
    if (!shown) return null
    return (
      <View className="relative overflow-hidden rounded-2xl p-5">
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="starter" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#fbbf24" />
              <Stop offset="0.55" stopColor="#fb923c" />
              <Stop offset="1" stopColor="#fb7185" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#starter)" />
        </Svg>
        <View pointerEvents="none" className="absolute -bottom-6 -right-3 opacity-20">
          <IconTrophy size={112} color="#ffffff" strokeWidth={1.2} />
        </View>
        {/* Amber zemin: koyu ton. pop tek seferlik, kart dururken sakin kalır. */}
        <AfiPose pose="kutlama" motion="pop" size={64} tone="dark" />
        <AppText weight="extrabold" className="mt-1 text-lg text-white">
          Başlangıç görevleri tamam! 🏆
        </AppText>
        <AppText className="mt-1 text-sm text-white/90">
          Öğün, su ve ölçüm — üçü de kayıtta. Artık uygulama tamamen senin ritminde.
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => markFtueSeen('starterDone')}
          className="mt-3 self-start rounded-xl border border-white/30 bg-white/20 px-5 py-2.5"
        >
          <AppText weight="semibold" className="text-white">
            Süper 🎉
          </AppText>
        </Pressable>
      </View>
    )
  }

  const tasks = [
    { label: 'İlk öğününü ekle', done: mealDone, action: onAddFood },
    {
      label: 'İlk bardak suyunu işaretle',
      done: waterDone,
      action: logFirstWater,
    },
    { label: 'İlk ölçümünü kaydet', done: measureDone, action: () => router.push('/vucudum') },
  ]

  return (
    <View className="rounded-2xl bg-surface p-4">
      <CardHeader
        icon={<IconTrophy size={22} color={isDark ? '#fcd34d' : '#d97706'} />}
        iconBg="bg-amber-100 dark:bg-amber-900/50"
        title="Başlangıç Görevleri"
        meta={
          <View className="rounded-full bg-amber-100 px-2.5 py-0.5 dark:bg-amber-900/50">
            <AppText weight="bold" className="text-xs text-amber-700 dark:text-amber-300">
              {doneCount}/{tasks.length}
            </AppText>
          </View>
        }
      />
      <View className="-mx-1">
        {tasks.map((task) => (
          <Pressable
            key={task.label}
            accessibilityRole="button"
            onPress={task.done ? undefined : task.action}
            disabled={task.done}
            className="w-full flex-row items-center gap-3 rounded-xl px-2 py-2.5 active:bg-muted"
          >
            <View
              className={`h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                task.done ? 'bg-emerald-500' : 'border-2 border-dashed border-line'
              }`}
            >
              {task.done && <IconCheck size={14} color="#ffffff" strokeWidth={3} />}
            </View>
            <AppText
              weight="semibold"
              className={`flex-1 text-sm ${task.done ? 'text-faint line-through' : 'text-ink'}`}
            >
              {task.label}
            </AppText>
            {!task.done && <IconChevronRight size={16} color={t.faint} />}
          </Pressable>
        ))}
      </View>
    </View>
  )
}
