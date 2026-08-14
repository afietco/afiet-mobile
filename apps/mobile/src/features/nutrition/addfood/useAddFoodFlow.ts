import type { MealType } from '@afiet/core'
import { findSeedFood } from '@afiet/core/foods'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { AppState, Keyboard } from 'react-native'
import { foodRepo, mealRepo } from '@/data/repositories'
import { ftueSeen, markFtueSeen } from '@/features/ftue/ftueFlags'
import { track } from '@/lib/track'
import { resolveMealEntryDate } from '../mealEntryDate'
import type { Sofra, SofraFood } from '../sofra'
import {
  addFoodReducer,
  canGoBack,
  canSaveDraft,
  createFlowState,
  telemetrySource,
  type AddFoodFlowState,
} from './addFoodMachine'
import { forgetFilledMenuFood, rememberFilledMenuFood, takeFilledMenuFood } from './afiFill'
import type { AddFoodStep, AfiCue, FoodDraft } from './contract'
import {
  DESCRIBE_CUE,
  PHOTO_CUE,
  SAVED_CUE,
  SAVE_ERROR_CUE,
  SAVING_CUE,
  STEP_CUES,
  sameCue,
} from './cues'
import type { ParsedFood } from './sentenceParse'

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

/**
 * The two doors into the Afi screen.
 *
 * They used to be two different features against two different agents: the
 * camera opened the photo assistant, while "Afi'ye anlat" walked to a locked
 * details step that asked for a description and posted it to a second
 * suggestion endpoint. One food, two Afis, two ways of being told no. The
 * describe door now opens the same screen, which already accepts a text-only
 * turn, and this flag only changes the sentence Afi opens with.
 */
export type AfiScreenIntent = 'photo' | 'describe'

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
  /** The Afi screen is open above the wizard. */
  photoOpen: boolean
  /**
   * Why the Afi screen was opened: to photograph a plate, or to describe a food
   * the catalogue does not know. Only the greeting differs; the screen, the
   * agent and the write behind them are one.
   */
  photoIntent: AfiScreenIntent
  /** The sofra the sofra step is showing, null everywhere else. */
  sofra: Sofra | null
  chooseMeal: (meal: MealType) => void
  patchDraft: (patch: Partial<FoodDraft>) => void
  advance: () => void
  back: () => void
  setCue: (cue: AfiCue) => void
  save: (andAnother?: boolean) => void
  /** Opens the sofra step on a saved sofra; nothing is written yet. */
  pickSofra: (sofra: Sofra) => void
  /** Writes the sofra's foods, in the amounts the sofra step collected. */
  addSofra: (foods: SofraFood[]) => void
  openPhoto: () => void
  closePhoto: () => void
  /** Hands an unknown food to Afi in the photo-and-chat screen. */
  openBookmark: (name: string) => void
  /** Confirms the foods a sentence produced, one at a time. */
  startSentence: (foods: ParsedFood[]) => void
  /** Drops the food on screen and moves on to the next one in the sentence. */
  skipQueued: () => void
  /** How many foods of the sentence are still waiting behind this one. */
  queued: number
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
  const [photoIntent, setPhotoIntent] = useState<AfiScreenIntent>('photo')
  /* The sofra being confirmed. It lives here rather than in the machine
     because it is not a decision the machine has to reason about: the step is,
     and this is what that step is showing. */
  const [sofra, setSofra] = useState<Sofra | null>(null)
  /* Foods a sentence produced that have not been confirmed yet. The one on
     screen is NOT in here: it lives in the draft like any other food. */
  const [queue, setQueue] = useState<ParsedFood[]>([])

  // Latest values for the stable callbacks below, so a keystroke in one step
  // never invalidates the handlers the other steps hold.
  const stateRef = useRef(state)
  stateRef.current = state
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const savingRef = useRef(false)
  const queueRef = useRef(queue)
  queueRef.current = queue

  useEffect(() => {
    if (!open) return
    dispatch({ type: 'reset', meal })
    setOverride(null)
    setQueue([])
    setEntryDate(resolveMealEntryDate())
    setPhase('editing')
    setError(null)
    setCelebrating(null)
    setPhotoOpen(false)
    setPhotoIntent('photo')
    setSofra(null)
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
    // Leaving the sofra step puts the sofra down with it.
    setSofra(null)
    // A half-filled menu record from a previous run must not ride along.
    forgetFilledMenuFood()
    dispatch({ type: 'back' })
  }, [])

  const openPhoto = useCallback(() => {
    void Haptics.selectionAsync()
    setPhotoIntent('photo')
    setPhotoOpen(true)
  }, [])

  /**
   * Closing the Afi screen closes the wizard behind it.
   *
   * The screen writes its own entries and keeps going ("başka besin var mı?"),
   * so somebody who shuts it is done adding, not halfway through a search. It
   * used to uncover the wizard sitting where they left it, which reads as the
   * app refusing to let go.
   */
  const closePhoto = useCallback(() => {
    setPhotoOpen(false)
    closeRef.current()
  }, [])

  /**
   * The unknown-food route: hand it to Afi and let him ask.
   *
   * It used to walk to the details step in a locked "fill" mode that demanded a
   * name AND a short description before its one button would even light up, and
   * posted them to a second suggestion agent. The Afi screen already takes a
   * text-only turn against the assistant this app actually has, so the route is
   * the same screen the camera opens, with a different opening sentence.
   */
  const openBookmark = useCallback((name: string) => {
    void Haptics.selectionAsync()
    setError(null)
    dispatch({ type: 'draft', patch: { name } })
    setPhotoIntent('describe')
    setPhotoOpen(true)
  }, [])

  /**
   * Loads one food read out of a sentence into the draft.
   *
   * A food the catalogue does not know is parked for the menu, so somebody who
   * writes "çeçil peynir" once finds it in the list next time rather than
   * describing it again. `saveCustom` treats a duplicate name as success, so a
   * repeat costs nothing.
   *
   * Only WITH its values, though. The reader returns them, but its offline
   * fallback invents nothing, and a food parked without them would make every
   * total it later appeared in come out quietly short. Every other door into
   * the menu carries values (the define sheet demands them, the photo
   * assistant and the catalogue supply them); this one now matches.
   */
  const loadParsedFood = useCallback((food: ParsedFood) => {
    if (!food.inPool && food.groups.length > 0 && food.macros) {
      rememberFilledMenuFood({
        name: food.name.trim(),
        groups: food.groups,
        measure: food.measure,
        macros: food.macros,
      })
    }
    dispatch({
      type: 'draft',
      patch: {
        name: food.name.trim(),
        groups: food.groups,
        measure: food.measure,
        quantity: food.quantity,
        origin: 'cumle',
        /* A food the sentence reader matched to the catalogue can still offer
           grams in the details step, so the weight travels with it. */
        gramPerMeasure: findSeedFood(food.name)?.gramPerMeasure,
      },
    })
  }, [])

  /**
   * Starts the queue a sentence produced.
   *
   * The foods are confirmed one at a time rather than written in a batch: each
   * one lands on the details step where its amount and its groups can be
   * corrected, which is the only place the person can disagree with what Afi
   * read. A batch write would put the reading straight into their record.
   */
  const startSentence = useCallback(
    (foods: ParsedFood[]) => {
      const [first, ...rest] = foods
      if (!first) return
      void Haptics.selectionAsync()
      setError(null)
      setQueue(rest)
      loadParsedFood(first)
      dispatch({ type: 'advance' })
    },
    [loadParsedFood],
  )

  /** Drops the food on screen and moves to the next one the sentence held. */
  const skipQueued = useCallback(() => {
    const [next, ...rest] = queueRef.current
    void Haptics.selectionAsync()
    setError(null)
    if (!next) {
      setQueue([])
      dispatch({ type: 'nextFood' })
      return
    }
    setQueue(rest)
    loadParsedFood(next)
  }, [loadParsedFood])

  const save = useCallback((andAnother = false) => {
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
        /* A food the reader just taught us is worth keeping: it lands in the
           menu so the next search finds it without asking again. The meal is
           already written, so a failure here must not surface as a save error;
           saveCustom also swallows the duplicate-name conflict. */
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
        /* The description field may still hold the keyboard, and the next step
           is a search that opens its own. Close it either way: staying open
           over a fresh step is what makes it feel stuck. */
        Keyboard.dismiss()
        /* The rest of the sentence outranks both endings below: someone who
           wrote three foods is not done after the first one, and closing the
           sheet would drop the other two without saying so. */
        const [queued, ...rest] = queueRef.current
        if (queued) {
          setPhase('editing')
          setQueue(rest)
          loadParsedFood(queued)
          return
        }
        if (andAnother) {
          /* A meal is usually several foods, so saving one does not have to be
             the end of the visit: the sheet stays open on the same meal with an
             empty draft, which is what the single form used to allow. */
          setPhase('editing')
          dispatch({ type: 'nextFood' })
          return
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

  /** Opens the sofra step. Nothing is written until that step says so. */
  const pickSofra = useCallback((picked: Sofra) => {
    setError(null)
    setSofra(picked)
    dispatch({ type: 'sofra' })
  }, [])

  /**
   * Writes a whole sofra into the chosen meal in one go.
   *
   * The amounts come from the sofra step rather than from the saved sofra: the
   * same table is rarely the same size two days running, and writing the saved
   * quantities without asking is what made a sofra feel like a decision taken
   * on somebody's behalf.
   *
   * A partial sofra is worse than none: half a breakfast in the log is a
   * balance nobody ate. Everything written so far is therefore removed when a
   * later food fails, the same way repeating a meal already does
   * (meal-shortcuts.ts), and the flow reports one failure rather than several.
   */
  const addSofra = useCallback(
    (foods: SofraFood[]) => {
      if (savingRef.current || foods.length === 0) return
      const mealType = stateRef.current.meal
      if (mealType === null) return
      savingRef.current = true
      setPhase('saving')
      setError(null)
      void (async () => {
        const saveDate = resolveMealEntryDate()
        const written: number[] = []
        try {
          setEntryDate(saveDate)
          for (const food of foods) {
            const id = await mealRepo.add({
              profileId,
              date: saveDate,
              meal: mealType,
              foodName: food.name,
              quantity: food.quantity,
              measure: food.measure ?? 'porsiyon',
              groups: food.groups,
              createdAt: new Date().toISOString(),
            })
            written.push(id)
          }
          track('meal_logged', {
            meal: mealType,
            group_count: foods.length,
            source: 'sofra',
          })
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          setPhase('saved')
          Keyboard.dismiss()
          closeRef.current()
        } catch {
          await Promise.allSettled([...written].reverse().map((id) => mealRepo.remove(id)))
          setPhase('editing')
          setError(SAVE_ERROR)
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        } finally {
          savingRef.current = false
        }
      })()
    },
    [profileId],
  )

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
          ? photoIntent === 'describe'
            ? DESCRIBE_CUE
            : PHOTO_CUE
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
    photoIntent,
    sofra,
    chooseMeal,
    patchDraft,
    advance,
    back,
    setCue,
    save,
    pickSofra,
    addSofra,
    openPhoto,
    closePhoto,
    openBookmark,
    startSentence,
    skipQueued,
    queued: queue.length,
    dismissCelebration,
    close,
  }
}
