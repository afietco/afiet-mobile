import { Redirect, router } from 'expo-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ApiError } from '@/data/api/client'
import { profileRepo } from '@/data/repositories'
import { useAuth } from '@/features/auth/AuthContext'
import { markInvitedAccount, setTableAnswer } from '@/features/ftue/chapter-store'
import type { TableAnswer } from '@/features/ftue/chapters'
import {
  dismissPushPrimer,
  requestPushPermission,
  shouldShowPushPrimer,
} from '@/features/push/push-notifications'
import { peekPendingJoin } from '@/features/groups/pendingJoin'
import { syncPendingFirstMeal } from '@/features/onboarding/pendingFirstMeal'
import { identityDraftKey } from '@/features/onboarding/identityDraft'
import { firstNameOf, readKnownName } from '@/features/onboarding/knownName'
import { setActiveProfileId } from '@/features/profile/useActiveProfile'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { EmojiPicker } from '@/ui/inputs/EmojiPicker'
import { TextField } from '@/ui/inputs/TextField'
import { PageSkeleton } from '@/ui/PageSkeleton'

/**
 * Name, emoji, and the two questions that end the first session.
 *
 * Neither of the last two changes what the app can do. "Sofranda kim var?"
 * only decides when the social chapter comes up, and the notification question
 * is asked here, in our own screen, before the system is ever allowed to ask:
 * the platform dialog can be shown once in the life of an install, and a "no"
 * to it is permanent and only undoable in Settings. Afi asking first turns a
 * permanent no into "not now".
 */
const STEPS = ['name', 'emoji', 'table', 'notify'] as const
type Step = (typeof STEPS)[number]

const TABLE_OPTIONS: { value: TableAnswer; label: string; hint: string }[] = [
  { value: 'solo', label: 'Yalnız benim sofram', hint: 'Kendi ritmimi kuruyorum' },
  { value: 'partner', label: 'Eşimle', hint: 'İkimiz için' },
  { value: 'family', label: 'Ailece', hint: 'Çocuklar, anne baba, hepimiz' },
]

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
  const { status, userId, getStackUser } = useAuth()
  const t = tokens[isDark ? 'dark' : 'light']
  const draftKey = userId ? identityDraftKey(userId) : null
  const saveLock = useRef(false)
  const draftActive = useRef(true)

  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  /* Null while we are still asking the system whether the question is worth
     putting on screen: already answered once, or not a platform that asks. */
  const [asksPush, setAsksPush] = useState<boolean | null>(null)
  const [pushBusy, setPushBusy] = useState(false)
  const [loadedDraftKey, setLoadedDraftKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void shouldShowPushPrimer()
      .then((show) => alive && setAsksPush(show))
      .catch(() => alive && setAsksPush(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!draftKey || !userId) return
    draftActive.current = true
    let alive = true
    let draft: IdentityDraft | null = null
    try {
      const raw = localStorage.getItem(draftKey)
      draft = raw ? parseIdentityDraft(raw) : null
      if (draft) {
        setStep(draft.step)
        setName(draft.name)
        setEmoji(draft.emoji)
      } else if (raw) {
        localStorage.removeItem(draftKey)
      }
    } catch (error) {
      console.warn('[onboarding] identity draft could not be loaded', error)
    }
    if (draft) {
      setLoadedDraftKey(draftKey)
      return
    }

    /* No form in progress: a name a provider already gave us fills the field
       and the form opens on the emoji step, so nobody who signed in with Apple
       or Google types a name we were handed (App Review, guideline 4). The
       provider stash answers at once; Stack is asked only when it is empty,
       and not for long: a slow network puts the person on the name step,
       never on a blank screen. The field stays reachable through the back
       arrow, so a first name that came out wrong is one tap from being fixed. */
    const known = readKnownName(userId)
    const adopt = (fullName: string | null) => {
      if (!alive) return
      const first = fullName ? firstNameOf(fullName) : ''
      if (first) {
        setName(first)
        setStep('emoji')
      }
      setLoadedDraftKey(draftKey)
    }
    if (known) {
      adopt(known)
      return
    }
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))
    void Promise.race([getStackUser().then((user) => user?.displayName ?? null), timeout])
      .catch(() => null)
      .then(adopt)
    return () => {
      alive = false
    }
  }, [draftKey, getStackUser, userId])

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

  /* Somebody who arrived through a group invitation is not asked who else
     eats at their table: the answer is the group they are about to join, and
     the record says so instead (features/ftue/chapters.ts, invited). */
  const invited = peekPendingJoin() !== null
  const steps: readonly Step[] = invited ? STEPS.filter((s) => s !== 'table') : STEPS
  const stepIndex = steps.indexOf(step)
  const nameValid = name.trim().length > 0
  const emojiValid = emoji !== null

  const goTo = (next: Step) => {
    if (next !== 'name') Keyboard.dismiss()
    setSaveError(null)
    setStep(next)
  }

  /* Still unknown counts as "do not ask": the platform has already been
     asked once in that case, or it is not a platform that asks at all. */
  const afterTable = () => {
    if (asksPush === true) goTo('notify')
    else void finish()
  }

  /** Answering is a single tap, and it moves on by itself. */
  const answerTable = (answer: TableAnswer) => {
    setTableAnswer(answer)
    afterTable()
  }

  /** The invited person's table is already known; the question is skipped. */
  const leaveEmoji = () => {
    if (!invited) {
      goTo('table')
      return
    }
    markInvitedAccount()
    afterTable()
  }

  const answerPush = (allow: boolean) => {
    if (pushBusy || saving) return
    setPushBusy(true)
    const ask = allow ? requestPushPermission() : dismissPushPrimer()
    void ask
      .catch(() => {
        // Account settings keep a durable way in, so a failure here is not
        // worth stopping the one thing this screen exists to finish.
      })
      .finally(() => {
        setPushBusy(false)
        void finish()
      })
  }

  const clearDraft = () => {
    draftActive.current = false
    try {
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.warn('[onboarding] completed identity draft could not be removed', error)
    }
  }

  const finishDestination = () => (peekPendingJoin() ? '/grubum' : '/')

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
      track('onboarding_completed')
      router.replace(finishDestination())
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        clearDraft()
        router.replace(finishDestination())
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
      <View
        className="flex-1 px-5"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <View className="flex-row items-center gap-3">
          {stepIndex === 0 || step === 'notify' ? (
            <View className="h-11 w-11" />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Geri"
              onPress={() => goTo(steps[stepIndex - 1])}
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
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </View>
          <AppText weight="semibold" className="w-8 text-right text-xs text-faint">
            {stepIndex + 1}/{steps.length}
          </AppText>
        </View>

        {/* The question scrolls, the button does not.
            A `flex-1` spacer used to push the button to the bottom edge, which
            works right up until the question itself is taller than the screen.
            At the larger text sizes the spacer collapsed to nothing, the
            content ran past the bottom and Devam went with it, out of reach and
            with nothing to scroll. The body now takes whatever room is left and
            scrolls inside it; the button is its sibling, so it keeps its own
            height and stays where it is. */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingTop: 32, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                /* Keep the iOS password tooling away from a plain name field:
                   the delayed "Save password?" sheet used to land right here. */
                autoComplete="off"
                textContentType="nickname"
                returnKeyType="next"
                onSubmitEditing={() => nameValid && goTo('emoji')}
              />
            </Question>
          ) : step === 'emoji' ? (
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
          ) : step === 'table' ? (
            <Question
              title="Sofranda kim var?"
              hint="Bunu yalnız sıralamayı bilmek için soruyorum. Sonradan değişir ve hiçbir şeyi kapatmaz."
            >
              <View className="gap-2.5">
                {TABLE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label}. ${option.hint}`}
                    onPress={() => answerTable(option.value)}
                    className="rounded-2xl border border-line bg-surface px-4 py-4 active:bg-muted"
                  >
                    <AppText weight="bold" className="text-ink">
                      {option.label}
                    </AppText>
                    <AppText className="mt-0.5 text-sm text-soft">{option.hint}</AppText>
                  </Pressable>
                ))}
              </View>
            </Question>
          ) : (
            <Question
              title="Sana seslenebilir miyim?"
              hint="Sofran seni beklerken bir kez seslenirim: öğün vakti, afiyet haftan, sofrandan gelen selam. Sessiz kalmamı istersen o da olur."
            >
              <View className="rounded-2xl bg-surface p-4">
                <AppText className="text-sm leading-6 text-soft">
                  Günde birden fazla seslenmem. Kararını sonra Hesap ayarlarından
                  değiştirebilirsin.
                </AppText>
              </View>
            </Question>
          )}
        </ScrollView>

        {saveError ? (
          <AppText selectable className="mb-3 text-center text-sm text-soft">
            {saveError}
          </AppText>
        ) : null}

        {step === 'name' ? (
          <PrimaryButton
            label="Devam"
            disabled={!nameValid}
            onPress={() => goTo('emoji')}
          />
        ) : step === 'emoji' ? (
          <PrimaryButton
            label="Devam"
            disabled={!emojiValid}
            onPress={leaveEmoji}
          />
        ) : step === 'table' ? null : (
          <>
            <PrimaryButton
              label={saving || pushBusy ? 'Hazırlanıyor…' : 'Olur, seslen'}
              disabled={saving || pushBusy}
              onPress={() => answerPush(true)}
            />
            {/* The quiet answer is a real answer, not a way out of the screen:
                same weight of words, no dimming, no second thought asked. */}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saving || pushBusy }}
              disabled={saving || pushBusy}
              onPress={() => answerPush(false)}
              className="mt-2 w-full items-center py-3.5"
            >
              <AppText weight="semibold" className="text-soft">
                Şimdilik sessiz
              </AppText>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
