import type { MealType } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { foodRepo, mealRepo } from '@/data/repositories'
import { ftueSeen, markFtueSeen } from '@/features/ftue/ftueFlags'
import { track } from '@/lib/track'
import { resolveMealEntryDate } from '../mealEntryDate'
import { forgetFilledMenuFood, takeFilledMenuFood } from './afiFill'
import {
  addFoodReducer,
  canGoBack,
  canSaveDraft,
  createFlowState,
  telemetrySource,
  type AddFoodFlowState,
} from './addFoodMachine'
import type { AddFoodStep, AfiCue, FoodDraft } from './contract'
import { PHOTO_CUE, SAVED_CUE, SAVE_ERROR_CUE, SAVING_CUE, STEP_CUES, sameCue } from './cues'

/**
 * The add-food wizard's brain: the step machine, the draft, Afi's current
 * stance and the single write at the end of it.
 *
 * The host component below it stays presentational on purpose. Everything that
 * decides whether the flow may move or may be written lives here (and, for the
 * parts that need no React at all, in `addFoodMachine.ts`), so the rules are
 * testable without mounting a sheet.
 */

const SAVE_ERROR = 'Öğünü kaydedemedik. Bağlantını kontrol edip tekrar dene.'

type SavePhase = 'editing' | 'saving' | 'saved'

export interface AddFoodFlowOptions {
  profileId: number
  /** The day the caller is looking at; new entries still land on the live day. */
  date: string
  open: boolean
  /** A preselected meal skips the first step entirely. */
  meal: MealType | null
  onClose: () => void
}

export interface AddFoodFlowController {
  step: AddFoodStep
  meal: MealType | null
  draft: FoodDraft
  cue: AfiCue
  /** 'forward' or 'back'; the host animates the step swap accordingly. */
  direction: AddFoodFlowState['direction']
  /** The day the entry will be written to, kept live across midnight. */
  entryDate: string
  saving: boolean
  error: string | null
  canGoBack: boolean
  canSave: boolean
  /** The saved food name while the one-time first-log celebration is up. */
  celebrating: string | null
  /** The Afi photo route is open above the wizard. */
  photoOpen: boolean
  chooseMeal: (meal: MealType) => void
  patchDraft: (patch: Partial<FoodDraft>) => void
  advance: () => void
  back: () => void
  setCue: (cue: AfiCue) => void
  save: () => void
  openPhoto: () => void
  closePhoto: () => void
  /** Sends an unknown food into the details step's Afi fill mode. */
  openBookmark: (name: string) => void
  dismissCelebration: () => void
  /** The user asked to leave; ignored while a write is in flight. */
  close: () => void
}

export function useAddFoodFlow({
  profileId,
  date,
  open,
  meal,
  onClose,
}: AddFoodFlowOptions): AddFoodFlowController {
  const [state, dispatch] = useReducer(addFoodReducer, meal, createFlowState)
  // Afi's stance is derived, never stored per step: a step's own cue only
  // outlives the step it was pushed from, so nothing has to be cleaned up.
  const [override, setOverride] = useState<{ step: AddFoodStep; cue: AfiCue } | null>(null)
  const [entryDate, setEntryDate] = useState(date)
  const [phase, setPhase] = useState<SavePhase>('editing')
  const [error, setError] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState<string | null>(null)
  const [photoOpen, setPhotoOpen] = useState(false)

  // Latest values for the stable callbacks below, so a keystroke in one step
  // never invalidates the handlers the other steps hold.
  const stateRef = useRef(state)
  stateRef.current = state
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const savingRef = useRef(false)

  useEffect(() => {
    if (!open) return
    dispatch({ type: 'reset', meal })
    setOverride(null)
    setEntryDate(resolveMealEntryDate())
    setPhase('editing')
    setError(null)
    setCelebrating(null)
    setPhotoOpen(false)
    // A half-filled menu record from a previous run must not ride along.
    forgetFilledMenuFood()
  }, [meal, open])

  // A sheet left open across midnight must not write yesterday's day.
  useEffect(() => {
    if (!open) return
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') setEntryDate(resolveMealEntryDate())
    })
    return () => subscription.remove()
  }, [open])

  const setCue = useCallback((cue: AfiCue) => {
    setOverride((prev) => {
      const step = stateRef.current.step
      // Bailing out on an identical cue keeps a step that re-announces itself
      // on every render from looping.
      if (prev && prev.step === step && sameCue(prev.cue, cue)) return prev
      return { step, cue }
    })
  }, [])

  const chooseMeal = useCallback((next: MealType) => {
    void Haptics.selectionAsync()
    dispatch({ type: 'meal', meal: next })
  }, [])

  const patchDraft = useCallback((patch: Partial<FoodDraft>) => {
    setError(null)
    dispatch({ type: 'draft', patch })
  }, [])

  const advance = useCallback(() => {
    void Haptics.selectionAsync()
    dispatch({ type: 'advance' })
  }, [])

  const back = useCallback(() => {
    void Haptics.selectionAsync()
    dispatch({ type: 'back' })
  }, [])

  const openPhoto = useCallback(() => {
    void Haptics.selectionAsync()
    setPhotoOpen(true)
  }, [])

  const closePhoto = useCallback(() => setPhotoOpen(false), [])

  /**
   * The bookmark route for a food the catalogue does not know.
   *
   * It no longer detours through a separate define sheet: the details step's
   * fill mode IS the bookmark route. The name travels with an empty group list,
   * which is exactly what that step reads as "unknown", so the user describes
   * the food under its name and Afi fills the rest in place.
   */
  const openBookmark = useCallback((name: string) => {
    void Haptics.selectionAsync()
    setError(null)
    dispatch({
      type: 'draft',
      patch: { name, groups: [], measure: 'porsiyon', origin: 'bookmark' },
    })
    dispatch({ type: 'advance' })
  }, [])

  const save = useCallback(() => {
    void (async () => {
      const current = stateRef.current
      if (savingRef.current || current.meal === null || !canSaveDraft(current)) return
      savingRef.current = true
      setPhase('saving')
      setError(null)
      const { draft, meal: mealType } = current
      const foodName = draft.name.trim()
      try {
        const saveDate = resolveMealEntryDate()
        setEntryDate(saveDate)
        // Celebrate the actual first meal ever logged, not an existing install.
        const firstEver =
          !ftueSeen('firstMealCelebrated') &&
          (await mealRepo.loggedDates(profileId)).length === 0
        await mealRepo.add({
          profileId,
          date: saveDate,
          meal: mealType,
          foodName,
          quantity: draft.quantity,
          measure: draft.measure,
          groups: draft.groups,
          createdAt: new Date().toISOString(),
        })
        track('meal_logged', {
          meal: mealType,
          group_count: draft.groups.length,
          source: telemetrySource(draft.origin),
        })
        /* A food Afi just filled in is worth keeping: it lands in the user's
           menu so the next search finds it without asking Afi again. The meal
           itself is already written, so a failure here must not surface as a
           save error; saveCustom also swallows the duplicate-name conflict. */
        const learned = takeFilledMenuFood()
        if (learned) {
          try {
            await foodRepo.saveCustom(learned)
          } catch {
            /* The menu entry is a convenience, not part of the log. */
          }
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setPhase('saved')
        if (!ftueSeen('firstMealCelebrated')) {
          markFtueSeen('firstMealCelebrated')
          if (firstEver) {
            setCelebrating(foodName)
            return
          }
        }
        closeRef.current()
      } catch {
        setPhase('editing')
        setError(SAVE_ERROR)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } finally {
        savingRef.current = false
      }
    })()
  }, [profileId])

  const dismissCelebration = useCallback(() => {
    setCelebrating(null)
    closeRef.current()
  }, [])

  const close = useCallback(() => {
    if (savingRef.current) return
    closeRef.current()
  }, [])

  const saving = phase === 'saving'
  const cue = saving
    ? SAVING_CUE
    : phase === 'saved'
      ? SAVED_CUE
      : error !== null
        ? SAVE_ERROR_CUE
        : photoOpen
          ? PHOTO_CUE
          : override !== null && override.step === state.step
            ? override.cue
            : STEP_CUES[state.step]

  return {
    step: state.step,
    meal: state.meal,
    draft: state.draft,
    cue,
    direction: state.direction,
    entryDate,
    saving,
    error,
    canGoBack: canGoBack(state),
    canSave: canSaveDraft(state),
    celebrating,
    photoOpen,
    chooseMeal,
    patchDraft,
    advance,
    back,
    setCue,
    save,
    openPhoto,
    closePhoto,
    openBookmark,
    dismissCelebration,
    close,
  }
}
