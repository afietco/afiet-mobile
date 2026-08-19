import { searchSeedFoods } from '@afiet/core/foods'
import * as Haptics from 'expo-haptics'
import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth/AuthContext'
import { markFtueSeen } from '@/features/ftue/ftueFlags'
import { FirstLogCelebration } from '@/features/ftue/FirstLogCelebration'
import {
  createGroupInvitePath,
  groupInviteAuthParams,
  groupInviteFromRouteParams,
} from '@/features/groups/inviteContext'
import { createPendingFirstMeal } from '@/features/onboarding/firstMealDraft'
import {
  readPendingFirstMeal,
  savePendingFirstMeal,
  type PendingFirstMeal,
} from '@/features/onboarding/pendingFirstMeal'
import { AppText } from '@/ui/AppText'
import { FormProblemNote, useFormGate } from '@/ui/formGate'
import { GroupIcon } from '@/ui/appIcons'
import { IconChevronRight } from '@/ui/icons'
import { TextField } from '@/ui/inputs/TextField'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { useTextScale } from '@/ui/textScale'

export default function FirstMealScreen() {
  const params = useLocalSearchParams<{
    inviteCode?: string | string[]
    groupName?: string | string[]
    inviterName?: string | string[]
  }>()
  const insets = useSafeAreaInsets()
  const { hidesDecoration } = useTextScale()
  const { status } = useAuth()
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<PendingFirstMeal | null>(() => readPendingFirstMeal())
  const [celebrating, setCelebrating] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const gate = useFormGate()
  const pendingInvite = groupInviteFromRouteParams(params)
  const authenticatedDestination = pendingInvite
    ? (createGroupInvitePath(pendingInvite.code, pendingInvite) as Href)
    : '/'

  useEffect(() => {
    if (!saved) return
    markFtueSeen('firstValueCaptured')
    markFtueSeen('firstMealCelebrated')
  }, [saved])

  const suggestions = useMemo(
    () => (name.trim() ? searchSeedFoods(name, 5) : []),
    [name],
  )

  if (status === 'loading') return <PageSkeleton />
  if (status === 'authed') return <Redirect href={authenticatedDestination} />

  const saveFood = (foodName: string) => {
    if (!foodName.trim()) return
    setSaveError(null)
    try {
      const entry = createPendingFirstMeal(foodName)
      savePendingFirstMeal(entry)
      setName(entry.foodName)
      setSaved(entry)
      Keyboard.dismiss()
      setCelebrating(true)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      setSaveError('Kaydı cihazına yazamadık. Birazdan tekrar dener misin?')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  const openLogin = (mode: 'signin' | 'signup') => {
    router.push({
      pathname: '/login',
      params: {
        mode,
        ...(pendingInvite ? groupInviteAuthParams(pendingInvite) : {}),
      },
    })
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
      >
        {saved ? (
          /* Centred while it fits, scrollable once it does not. Three buttons
             under a celebration is a tall column already, and at the larger
             text sizes "Hesabımı oluştur" was the part that fell off the
             bottom: the one thing this screen exists to offer. */
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center">
              {hidesDecoration ? null : <AfiPose pose="kutlama" motion="zipla" size={140} />}
              <AppText weight="extrabold" className="mt-5 text-center text-3xl text-ink">
                İlk kaydın hazır
              </AppText>
              <AppText className="mt-3 max-w-sm text-center text-base leading-6 text-soft">
                “{saved.foodName}” bu cihazda güvende. Hesabını oluşturunca ritmine kaldığın
                yerden devam edebilirsin.
              </AppText>

              <Pressable
                accessibilityRole="button"
                onPress={() => openLogin('signup')}
                className="mt-8 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4"
              >
                <AppText weight="bold" className="text-lg text-white">
                  Hesabımı oluştur
                </AppText>
                <IconChevronRight size={19} color="#ffffff" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => openLogin('signin')}
                className="mt-3 w-full items-center py-3"
              >
                <AppText weight="semibold" className="text-soft">
                  Zaten hesabım var
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setName(saved.foodName)
                  setSaved(null)
                }}
                className="mt-1 px-4 py-2"
              >
                <AppText weight="semibold" className="text-sm text-faint">
                  Kaydı değiştir
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1">
              {/* Heading, field and suggestions share one scroll area so that
                  Kaydet, their sibling below, keeps its height and its place.
                  This is the screen where the two pressures meet: the keyboard
                  is up from the first frame because the field autofocuses, and
                  large text needs the room the keyboard just took. */}
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
              {/* 152 points of mascot is the cheapest thing to give back when
                  the text needs the room; the heading says the same thing. */}
              {hidesDecoration ? null : (
                <View className="items-start">
                  <AfiPose
                    pose="kasik"
                    motion="idle"
                    size={152}
                    accessibilityLabel="Afi, ilk kaydını bekliyor"
                  />
                </View>
              )}
              <AppText weight="extrabold" className="-mt-2 text-3xl leading-10 text-ink">
                Bugün ne yedin?
              </AppText>
              <AppText className="mt-2 text-base leading-6 text-soft">
                Tek bir şey yazman yeter. Kalori yok, yargı yok.
              </AppText>

              <View className="mt-7">
                <TextField
                  value={name}
                  onChangeText={(value) => {
                    setName(value)
                    setSaveError(null)
                    gate.clear()
                  }}
                  placeholder="örn. mercimek çorbası"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => saveFood(name)}
                />
              </View>

              <View className="mt-2">
              {suggestions.length > 0 ? (
                <View className="overflow-hidden rounded-2xl border border-line bg-surface">
                  {suggestions.map((food, index) => (
                    <Pressable
                      key={food.name}
                      accessibilityRole="button"
                      accessibilityLabel={`${food.name} seç ve kaydet`}
                      accessibilityHint="Seçtiğinde ilk kaydın otomatik oluşturulur"
                      onPress={() => saveFood(food.name)}
                      className={`flex-row items-center justify-between px-4 py-3 ${
                        index > 0 ? 'border-t border-line/50' : ''
                      }`}
                    >
                      <AppText className="min-w-0 flex-1 text-ink">{food.name}</AppText>
                      <View className="ml-3 flex-row items-center gap-1">
                        {food.groups.map((group) => (
                          <GroupIcon key={group} group={group} size={17} />
                        ))}
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {saveError ? (
                <AppText selectable className="mt-3 text-sm text-rose-500">
                  {saveError}
                </AppText>
              ) : null}
              </View>
              </ScrollView>

              <FormProblemNote problem={gate.problem} className="mt-3 mb-0" />

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  gate.attempt(
                    () =>
                      name.trim() === ''
                        ? { message: 'Ne yediğini yazman yeterli, tek kelime bile olur.' }
                        : null,
                    () => saveFood(name),
                  )
                }
                className="mt-3 w-full items-center rounded-2xl bg-emerald-600 py-4"
              >
                <AppText weight="bold" className="text-lg text-white">
                  Kaydet
                </AppText>
              </Pressable>
          </View>
        )}
      </View>

      {celebrating && saved ? (
        <FirstLogCelebration foodName={saved.foodName} onClose={() => setCelebrating(false)} />
      ) : null}
    </KeyboardAvoidingView>
  )
}
