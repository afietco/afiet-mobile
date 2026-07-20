import * as Haptics from 'expo-haptics'
import { useEffect, type RefObject } from 'react'
import { View } from 'react-native'
import { mealRepo, measurementRepo, waterRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { track } from '@/lib/track'
import { GuidedSpotlight } from './guided-spotlight'
import { nextAfiGuideStep, shouldStartAfiGuide, type AfiGuideStep } from './afi-guide-state'
import { markFtueSeen, useAfiGuideCompleted, useFtueSeen } from './ftueFlags'

export interface TodayAfiGuideState {
  active: boolean
  step: AfiGuideStep | null
}

interface TodayAfiGuideProps {
  profileId: number
  profileCreatedAt: string
  targets: Record<'meal' | 'water' | 'body', RefObject<View | null>>
  onStateChange: (state: TodayAfiGuideState) => void
  paused?: boolean
}

export function TodayAfiGuide(props: TodayAfiGuideProps) {
  const completed = useAfiGuideCompleted()
  // Earlier builds could mark afiGuideDone after a timestamp parse failure,
  // without ever showing the guide. Only the explicit completion action writes
  // both flags, so accounts affected by that bug recover automatically here.
  if (completed) return null
  return <ActiveTodayAfiGuide {...props} />
}

function ActiveTodayAfiGuide({
  profileId,
  profileCreatedAt,
  targets,
  onStateChange,
  paused = false,
}: TodayAfiGuideProps) {
  const started = useFtueSeen('afiGuideStarted')
  const introSeen = useFtueSeen('afiGuideIntroSeen')
  const legacyGuideShown = useFtueSeen('starterShown')
  const legacyGuideDone = useFtueSeen('starterDone')

  const loggedDates = useLiveValue(
    ['meals'],
    () => mealRepo.loggedDates(profileId).catch(() => []),
    [profileId],
  )
  const waterLogs = useLiveValue(
    ['water'],
    () => waterRepo.forRange(profileId, '1970-01-01', '9999-12-31').catch(() => []),
    [profileId],
  )
  const latestMeasurement = useLiveValue(
    ['measurements'],
    () => measurementRepo.latest(profileId).then((value) => value ?? null).catch(() => null),
    [profileId],
  )

  const loading =
    loggedDates === undefined || waterLogs === undefined || latestMeasurement === undefined
  const eligible = shouldStartAfiGuide({
    profileCreatedAt,
    legacyGuideShown,
    legacyGuideDone,
  })

  useEffect(() => {
    if (loading) return
    if (legacyGuideDone) {
      markFtueSeen('afiGuideDone')
      return
    }
    // Ineligibility is not completion. Never persist it: profile metadata may
    // arrive in a timestamp format that a client version cannot parse.
    if (!eligible) return
    if (!started) {
      markFtueSeen('afiGuideStarted')
      track('afi_guide_started')
    }
  }, [eligible, legacyGuideDone, loading, started])

  const taskStep = loading
    ? null
    : nextAfiGuideStep({
        mealDone: loggedDates.length > 0,
        waterDone: waterLogs.some((log) => log.glasses > 0),
        measurementDone: latestMeasurement !== null,
      })
  const step: AfiGuideStep | null = !eligible || loading ? null : introSeen ? taskStep : 'welcome'

  useEffect(() => {
    onStateChange({ active: step !== null, step })
  }, [onStateChange, step])

  useEffect(
    () => () => onStateChange({ active: false, step: null }),
    [onStateChange],
  )

  useEffect(() => {
    if (!step) return
    track('afi_guide_step_shown', { step })
  }, [step])

  if (!step || paused) return null

  if (step === 'welcome') {
    return (
      <GuidedSpotlight
        stepKey={step}
        pose="selam"
        title="Bugün’ü birlikte kuralım"
        text="Üç kısa hareket göstereceğim: öğün, su ve ölçüm. Her adımda yalnızca işaret ettiğim yere dokunman yeterli."
        actionLabel="Başlayalım"
        onAction={() => {
          markFtueSeen('afiGuideIntroSeen')
          void Haptics.selectionAsync()
        }}
      />
    )
  }

  if (step === 'complete') {
    return (
      <GuidedSpotlight
        stepKey={step}
        pose="kutlama"
        progress="3/3 tamam"
        title="Başlangıç tamam!"
        text="Öğününü, suyunu ve ölçümünü artık nereden ekleyeceğini biliyorsun. Bundan sonrası senin ritmin."
        actionLabel="Afiyet, hazırım"
        onAction={() => {
          markFtueSeen('afiGuideDone')
          markFtueSeen('starterDone')
          track('afi_guide_completed')
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }}
      />
    )
  }

  const copy = {
    meal: {
      pose: 'kasik' as const,
      progress: '1/3 · Öğün',
      title: 'İlk öğününü ekle',
      text: 'Beslenme kartındaki + düğmesine dokun. Kaydın tamamlanınca sıradaki adıma ben geçeceğim.',
    },
    water: {
      pose: 'su' as const,
      progress: '2/3 · Su',
      title: 'Bir bardak su ekle',
      text: 'Su kartındaki + düğmesine dokun. Günlük su takibin tek dokunuşla burada ilerler.',
    },
    body: {
      pose: 'merak' as const,
      progress: '3/3 · Ölçüm',
      title: 'İlk ölçümünü kaydet',
      text: 'Vücudum kartına dokun. Gerekli bilgileri ve ilk ölçümünü birlikte tamamlayacağız.',
    },
  }[step]

  return <GuidedSpotlight stepKey={step} targetRef={targets[step]} {...copy} />
}
