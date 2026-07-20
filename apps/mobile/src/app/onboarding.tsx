import { Redirect, router } from 'expo-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ApiError } from '@/data/api/client'
import { profileRepo } from '@/data/repositories'
import { useAuth } from '@/features/auth/AuthContext'
import { syncPendingFirstMeal } from '@/features/onboarding/pendingFirstMeal'
import { setActiveProfileId } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { EmojiPicker } from '@/ui/inputs/EmojiPicker'
import { TextField } from '@/ui/inputs/TextField'
import { PageSkeleton } from '@/ui/PageSkeleton'

const STEPS = ['name', 'emoji'] as const
type Step = (typeof STEPS)[number]

const DRAFT_PREFIX = 'afiet:onboarding:identity:v2:'
const DRAFT_SAVE_DELAY_MS = 200

interface IdentityDraft {
  version: 2
  step: Step
  name: string
  emoji: string | null
}

function parseIdentityDraft(raw: string): IdentityDraft | null {
  try {
    const value = JSON.parse(raw) as Partial<IdentityDraft>
    if (
      value.version !== 2 ||
      !STEPS.includes(value.step as Step) ||
      typeof value.name !== 'string' ||
      (value.emoji !== null && typeof value.emoji !== 'string')
    ) {
      return null
    }
    return value as IdentityDraft
  } catch {
    return null
  }
}

function Question({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <View>
      <AppText weight="extrabold" className="text-[28px] leading-10 text-ink">
        {title}
      </AppText>
      <AppText className="mt-2 text-base leading-6 text-soft">{hint}</AppText>
      <View className="mt-7">{children}</View>
    </View>
  )
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress: () => void
  disabled: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`w-full items-center rounded-2xl bg-emerald-600 py-4 ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      <AppText weight="bold" className="text-lg text-white">
        {label}
      </AppText>
    </Pressable>
  )
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const { status, userId } = useAuth()
  const t = tokens[isDark ? 'dark' : 'light']
  const draftKey = userId ? `${DRAFT_PREFIX}${userId}` : null
  const saveLock = useRef(false)
  const draftActive = useRef(true)

  const [step, setStep] = useState<Step>('name')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [loadedDraftKey, setLoadedDraftKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!draftKey) return
    draftActive.current = true
    try {
      const raw = localStorage.getItem(draftKey)
      const draft = raw ? parseIdentityDraft(raw) : null
      if (draft) {
        setStep(draft.step)
        setName(draft.name)
        setEmoji(draft.emoji)
      } else if (raw) {
        localStorage.removeItem(draftKey)
      }
    } catch (error) {
      console.warn('[onboarding] identity draft could not be loaded', error)
    } finally {
      setLoadedDraftKey(draftKey)
    }
  }, [draftKey])

  useEffect(() => {
    if (!draftKey || loadedDraftKey !== draftKey || !draftActive.current) return
    const draft: IdentityDraft = { version: 2, step, name, emoji }
    const timer = setTimeout(() => {
      if (!draftActive.current) return
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft))
      } catch (error) {
        console.warn('[onboarding] identity draft could not be saved', error)
      }
    }, DRAFT_SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draftKey, emoji, loadedDraftKey, name, step])

  if (status === 'loading') return <PageSkeleton />
  if (status === 'anon') return <Redirect href="/login" />
  if (!draftKey || loadedDraftKey !== draftKey) return <PageSkeleton />

  const stepIndex = STEPS.indexOf(step)
  const nameValid = name.trim().length > 0
  const emojiValid = emoji !== null

  const goTo = (next: Step, nextDirection: 1 | -1) => {
    setDirection(nextDirection)
    setSaveError(null)
    setStep(next)
  }

  const clearDraft = () => {
    draftActive.current = false
    try {
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.warn('[onboarding] completed identity draft could not be removed', error)
    }
  }

  const finish = async () => {
    if (!nameValid || !emojiValid || saveLock.current) return
    saveLock.current = true
    setSaving(true)
    setSaveError(null)
    try {
      const id = await profileRepo.create({ name: name.trim(), emoji })
      try {
        await syncPendingFirstMeal(id)
      } catch (error) {
        // The local meal remains available for the tabs gate to retry.
        console.warn('[onboarding] first meal could not be synced yet', error)
      }
      clearDraft()
      setActiveProfileId(id)
      router.replace('/')
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        clearDraft()
        router.replace('/')
        return
      }
      setSaveError('Kaydedilemedi, birazdan tekrar dene.')
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
      >
        <View className="flex-row items-center gap-3">
          {stepIndex === 0 ? (
            <View className="h-11 w-11" />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Geri"
              onPress={() => goTo('name', -1)}
              className="h-11 w-11 items-center justify-center rounded-full active:bg-muted"
            >
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <IconChevronRight size={20} color={t.faint} />
              </View>
            </Pressable>
          )}
          <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </View>
          <AppText weight="semibold" className="w-8 text-right text-xs text-faint">
            {stepIndex + 1}/{STEPS.length}
          </AppText>
        </View>

        <Animated.View
          key={step}
          entering={(direction === 1 ? FadeInRight : FadeInLeft).duration(250)}
          className="flex-1 justify-center py-8"
        >
          {step === 'name' ? (
            <Question
              title="Sana nasıl seslenelim?"
              hint="Yalnızca ismin ve sevdiğin bir emoji. Geri kalanını ihtiyacın olduğunda sorarız."
            >
              <TextField
                value={name}
                onChangeText={(value) => {
                  setName(value)
                  setSaveError(null)
                }}
                placeholder="İsmin"
                maxLength={20}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => nameValid && goTo('emoji', 1)}
              />
            </Question>
          ) : (
            <Question
              title="Seni hangisi anlatsın?"
              hint="Avatarını daha sonra Profil'den istediğin zaman değiştirebilirsin."
            >
              <EmojiPicker
                value={emoji}
                onChange={(value) => {
                  setEmoji(value)
                  setSaveError(null)
                }}
              />
            </Question>
          )}
        </Animated.View>

        {saveError ? (
          <AppText selectable className="mb-3 text-center text-sm text-soft">
            {saveError}
          </AppText>
        ) : null}

        {step === 'name' ? (
          <PrimaryButton
            label="Devam"
            disabled={!nameValid}
            onPress={() => goTo('emoji', 1)}
          />
        ) : (
          <PrimaryButton
            label={saving ? 'Kaydediliyor…' : 'Afiet’e Geç'}
            disabled={!emojiValid || saving}
            onPress={() => void finish()}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
