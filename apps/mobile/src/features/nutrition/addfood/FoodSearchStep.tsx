import { addDays, turkishLower, type CustomFood, type MealEntry } from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Keyboard, Platform, Pressable, View, type KeyboardEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { sofraSummary, sofrasForMeal, useSofrasResult, type Sofra } from '../sofra'
import { useCustomFoods } from '../useCustomFoods'
import type { AfiCue, SearchStepProps } from './contract'
import {
  buildFoodSearchRows,
  buildMenuRows,
  FOOD_SEARCH_LIMIT,
  MENU_PREVIEW_LIMIT,
  type FoodSearchRow,
} from './foodSearch'
import { PERSONAL_HISTORY_DAYS, personalFoodRows } from './personalFoods'
import { looksLikeSentence } from './sentenceInput'
import { parseSentence, type ParsedFood } from './sentenceParse'
import { mealRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { AfiPose } from '@/ui/maskot'
import { fontFamilies } from '@/theme/fonts'
import {
  IconBookmark,
  IconBookmarkPlus,
  IconBowl,
  IconCamera,
  IconChevronRight,
  IconSearch,
  IconUtensils,
} from '@/ui/icons'

/**
 * Step two of the add-food flow: find the food.
 *
 * The step resolves a food or it resolves nothing. A name typed by hand never
 * becomes a saveable draft here; an unknown food goes to Afi through the photo
 * route or the bookmark route, which is why there is no group or measure editor
 * on this screen. Picking a row is the confirmation, so there is no next button.
 */

const FOOD_NAME_MAX_LENGTH = 80

/**
 * How long typing has to stop before Afi says he is looking.
 *
 * The catalogue scan itself is cheap enough to run on every keystroke, and the
 * rows below do exactly that: waiting to show them would make the list feel
 * broken. What the wait is for is Afi. He used to change stance on every
 * keystroke, so a five letter word put him through "bir saniye, listeye
 * bakıyorum" five times and he read as flustered rather than helpful. He now
 * waits until the typing has actually stopped before he says anything about
 * what he found.
 *
 * Short, because this is only Afi's mouth. It used to be two seconds, shared
 * with the panel below, and a stance that arrives two seconds after the typing
 * stops reads as a guide who was not listening.
 */
const AFI_SETTLE_MS = 750

/**
 * How long the "this food is not in the list" panel waits. Deliberately much
 * longer than Afi's own clock: the panel is a verdict on what somebody is still
 * spelling, and flashing "listede yok" in the middle of a half-typed word is
 * exactly what made it feel accusatory. It stays at the two seconds it was
 * given for that reason.
 */
const MISSING_SETTLE_MS = 2000

/**
 * How long the rows below wait. Deliberately still short: the list is what the
 * person is reading while they type, and a list that lags two seconds behind
 * the field reads as broken rather than as calm.
 */
const LIST_DEBOUNCE_MS = 140

/** Rows that still sit above an open keyboard on a small phone. */
const KEYBOARD_ROW_LIMIT = 5

/** Keeps the search memo stable while the menu query is still loading. */
const EMPTY_MENU: CustomFood[] = []

/** Same reason, for the sofra query: a fresh [] would rebuild the meal filter. */
const EMPTY_SOFRAS: Sofra[] = []

/** And for the history read, which feeds the personal drawer's ranking. */
const EMPTY_HISTORY: MealEntry[] = []

/**
 * Keyboard height in JS.
 *
 * The sheet itself does the heavy lifting: @/ui/Sheet passes
 * `keyboardBehavior="interactive"` (iOS lifts the sheet by the keyboard height)
 * and `android_keyboardInputMode="adjustResize"` (Android resizes the window and
 * the sheet re-lays out above the keyboard). This hook only tells the step how
 * much room is really left, so the result list can shrink instead of hiding.
 */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const onShow = (event: KeyboardEvent) => setHeight(event.endCoordinates.height)
    const onHide = () => setHeight(0)
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow,
    )
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide,
    )
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])
  return height
}

const FoodRow = memo(function FoodRow({
  row,
  divider,
  menuColor,
  onSelect,
}: {
  row: FoodSearchRow
  divider: boolean
  menuColor: string
  onSelect: (row: FoodSearchRow) => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        row.exact
          ? `${row.name}, tam eşleşme. Seçmek için dokun`
          : `${row.name} seç${row.origin === 'menu' ? ', menünden' : ''}`
      }
      onPress={() => onSelect(row)}
      className={`min-h-12 flex-row items-center gap-3 px-3 py-2 active:bg-muted ${
        divider ? 'border-t border-line/40' : ''
      } ${row.exact ? 'bg-emerald-50 dark:bg-emerald-950/50' : ''}`}
    >
      <View className="h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
        {row.origin === 'menu' ? (
          <IconBookmark size={16} color={menuColor} />
        ) : (
          <AppText className="text-base">{row.emoji ?? ''}</AppText>
        )}
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {row.name}
        </AppText>
        {row.exact ? (
          <AppText weight="bold" className="text-xs text-emerald-700 dark:text-emerald-300">
            aradığın tam bu
          </AppText>
        ) : row.origin === 'menu' ? (
          <AppText className="text-xs text-faint">menünden</AppText>
        ) : null}
      </View>
      <View className="shrink-0 flex-row items-center gap-1">
        {row.groups.map((group) => (
          <GroupIcon key={group} group={group} size={16} />
        ))}
      </View>
    </Pressable>
  )
})

/** A shut drawer that says what is in it: icon, label, how much, chevron. */
function DrawerHeader({
  label,
  hint,
  open,
  tint,
  icon,
  chevron,
  onPress,
}: {
  label: string
  hint: string
  open: boolean
  tint: string
  icon: ReactNode
  chevron: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${hint}`}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      className="min-h-12 flex-row items-center gap-2 px-3 py-3 active:bg-muted"
    >
      <View className={`h-8 w-8 items-center justify-center rounded-xl ${tint}`}>{icon}</View>
      <AppText weight="bold" className="min-w-0 flex-1 text-sm text-ink">
        {label}
      </AppText>
      <AppText className="shrink-0 text-xs text-soft">{hint}</AppText>
      <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
        <IconChevronRight size={16} color={chevron} />
      </View>
    </Pressable>
  )
}

export function FoodSearchStep({
  draft,
  date,
  meal,
  profileId,
  onDraft,
  onAdvance,
  onCue,
  onNeedPhoto,
  onPickSofra,
  onNeedBookmark,
  onSentence,
}: SearchStepProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const insets = useSafeAreaInsets()
  const keyboardHeight = useKeyboardHeight()
  const menuFoods = useCustomFoods()
  // Empty results from useLive are a fresh array each render; pin them so the
  // catalogue scan below is not re-run for nothing.
  const menu = menuFoods.length > 0 ? menuFoods : EMPTY_MENU

  // Coming back from the details step, the input shows what was resolved.
  const [query, setQuery] = useState(() => draft.name)
  /* Three clocks over one field, fastest first. The list keeps up with the
     typing; Afi speaks about a word that is finished rather than once per
     letter; the "not in the list" panel waits longest of all, because it is a
     verdict rather than a reaction. */
  const [listQuery, setListQuery] = useState(() => draft.name)
  const [afiQuery, setAfiQuery] = useState(() => draft.name)
  const [missingQuery, setMissingQuery] = useState(() => draft.name)
  /* The personal drawer opens with the step: it is this person's own foods, so
     it is worth reading before anything is typed. Menüm stays shut behind it,
     and opening one closes the other, because two open drawers push the search
     field and the first results off a keyboard-sized screen. */
  const [openDrawer, setOpenDrawer] = useState<'personal' | 'menu' | null>('personal')

  const trimmed = query.trim()
  const listSettling = query !== listQuery
  /* An emptied field is settled at once: there is nothing to look for, so
     holding Afi on the last thing he said about a word that is gone would
     leave him answering a question nobody is asking any more. */
  const afiSettling = trimmed.length > 0 && query !== afiQuery
  const missingSettling = trimmed.length > 0 && query !== missingQuery

  useEffect(() => {
    if (!listSettling) return
    const id = setTimeout(() => setListQuery(query), LIST_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [query, listSettling])

  useEffect(() => {
    if (query === afiQuery) return
    const id = setTimeout(() => setAfiQuery(query), trimmed.length > 0 ? AFI_SETTLE_MS : 0)
    return () => clearTimeout(id)
  }, [afiQuery, query, trimmed.length])

  useEffect(() => {
    if (query === missingQuery) return
    const id = setTimeout(() => setMissingQuery(query), trimmed.length > 0 ? MISSING_SETTLE_MS : 0)
    return () => clearTimeout(id)
  }, [missingQuery, query, trimmed.length])

  const rows = useMemo(
    () => buildFoodSearchRows(listQuery, menu, FOOD_SEARCH_LIMIT),
    [menu, listQuery],
  )
  const menuRows = useMemo(() => buildMenuRows(menu, MENU_PREVIEW_LIMIT), [menu])
  /* One range read of this person's own record. The drawer below ranks it by
     meal; the query itself is meal-blind so switching meals inside the flow
     does not fetch again. */
  const history =
    useLiveValue(
      ['meals'],
      () => mealRepo.forRange(profileId, addDays(date, -PERSONAL_HISTORY_DAYS), date),
      [profileId, date],
    ) ?? EMPTY_HISTORY
  const personal = useMemo(() => personalFoodRows(history, meal), [history, meal])
  /* Sofras are only offered before anything is typed: once there is a query
     the person is after one specific food, and a set of five would be an
     answer to a question they stopped asking. */
  const sofras = useSofrasResult().data ?? EMPTY_SOFRAS
  const mealSofras = useMemo(() => sofrasForMeal(sofras, meal), [sofras, meal])

  // The list shrinks while the keyboard is up so its rows stay above it.
  const rowLimit = keyboardHeight > 0 ? KEYBOARD_ROW_LIMIT : FOOD_SEARCH_LIMIT
  const visibleRows = rows.length > rowLimit ? rows.slice(0, rowLimit) : rows
  const searching = trimmed.length > 0
  /* The two-button panel is a strong statement, so it waits on the slowest
     clock of the three rather than on Afi's: flashing "bu besin listede yok"
     in the middle of a word people are still spelling is how it used to feel
     accusatory. */
  const nothingFound = searching && !missingSettling && rows.length === 0

  const cue = useMemo<AfiCue>(() => {
    if (!searching)
      return { pose: 'arama', line: 'Ne yedin? Yazmaya başla, listeye birlikte bakalım.' }
    if (rows.length === 0)
      return { pose: 'merak', line: 'Bu besin listede yok, ama çaresi var.' }
    if (rows[0].exact) return { pose: 'buldum', line: 'Aradığın tam burada, dokunman yeter.' }
    return { pose: 'arama', line: 'Bunlardan biri mi?' }
  }, [rows, searching])

  // The host owns the mascot; the cue is pushed to it, never rendered here.
  const cueRef = useRef(onCue)
  useEffect(() => {
    cueRef.current = onCue
  }, [onCue])
  useEffect(() => {
    /* Nothing is pushed while the typing is still going, so Afi holds whatever
       stance he was in. That silence is the feature: he no longer restates
       what he is doing on every letter. */
    if (afiSettling) return
    cueRef.current(cue)
  }, [afiSettling, cue])

  const changeQuery = useCallback(
    (value: string) => {
      setQuery(value)
      // Editing away from a resolved food drops the resolution with it, so a
      // stale catalogue match can never travel forward with new text.
      if (draft.origin !== null && turkishLower(value.trim()) !== turkishLower(draft.name)) {
        onDraft({
          name: value.trim(),
          groups: [],
          measure: 'porsiyon',
          origin: null,
          gramPerMeasure: undefined,
        })
      }
    },
    [draft.name, draft.origin, onDraft],
  )

  const selectRow = useCallback(
    (row: FoodSearchRow) => {
      Keyboard.dismiss()
      void Haptics.selectionAsync()
      /* Which of the three doors out of this step was used. The row itself
         never travels: the name of a food is the person's meal. */
      trackTap('addfood_search_pick')
      /* Picking a row settles both clocks on the spot: the answer is already
         known, so neither the list nor Afi has anything left to wait for. */
      setQuery(row.name)
      setListQuery(row.name)
      setAfiQuery(row.name)
      setMissingQuery(row.name)
      onDraft({
        name: row.name,
        groups: row.groups,
        measure: row.measure ?? 'porsiyon',
        origin: row.origin,
        gramPerMeasure: row.gramPerMeasure,
      })
      cueRef.current({ pose: 'buldum', line: `${row.name}, tamam. Sırada ölçüsü var.` })
      onAdvance()
    },
    [onAdvance, onDraft],
  )

  const submit = useCallback(() => {
    const exact = rows.find((row) => row.exact)
    if (exact) selectRow(exact)
  }, [rows, selectRow])

  const askPhoto = useCallback(() => {
    Keyboard.dismiss()
    trackTap('addfood_photo')
    cueRef.current({ pose: 'foto', line: 'Fotoğrafını çek, ben tanıyayım.' })
    onNeedPhoto()
  }, [onNeedPhoto])

  const askBookmark = useCallback(() => {
    Keyboard.dismiss()
    cueRef.current({ pose: 'dusunuyor', line: 'Anlat bakalım, birlikte menüne ekleyelim.' })
    onNeedBookmark(trimmed)
  }, [onNeedBookmark, trimmed])

  /**
   * "Bunu Afi çözsün": one field, several foods.
   *
   * The offer only appears for text that reads like a sentence rather than a
   * name (sentenceInput.ts), because a row sitting over the result someone is
   * reaching for is worse than no row at all.
   */
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const isSentence = looksLikeSentence(trimmed)

  const askSentence = useCallback(() => {
    if (reading) return
    Keyboard.dismiss()
    trackTap('addfood_sentence')
    setReading(true)
    setReadError(null)
    cueRef.current({ pose: 'arama', line: 'Bakayım, neler yemişsin…' })
    void parseSentence(trimmed)
      .then((foods) => {
        if (foods.length === 0) {
          setReadError('Bu cümleden besin çıkaramadım. Tek tek yazmayı dener misin?')
          cueRef.current({ pose: 'oops', line: 'Bunu çözemedim, tek tek deneyelim mi?' })
          return
        }
        onSentence(foods)
      })
      .catch((error: unknown) => {
        /* The reader falls back to the device for anything the person cannot
           act on, so what reaches here is only the two refusals that are
           theirs to answer: the daily limit, and a sentence the server would
           not take. "Try again" would be wrong advice for either. */
        const status = (error as { status?: number } | null)?.status
        setReadError(
          status === 429
            ? 'Bugünlük Afi hakkın doldu. Yarın yine buradayım 🌿'
            : 'Bu cümleyi alamadım. Biraz kısaltıp dener misin?',
        )
        cueRef.current({ pose: 'oops', line: 'Bunu şimdilik çözemedim.' })
      })
      .finally(() => setReading(false))
  }, [onSentence, reading, trimmed])

  const menuColor = isDark ? '#c4b5fd' : '#7c3aed'
  const accent = isDark ? '#34d399' : '#047857'

  /*
    Two drawers, one of them open.

    They used to be one slot fighting over it: a saved menu hid the starters
    entirely, so somebody who had taught the app three foods could no longer
    see what else the catalogue held at this meal. Both belong here, and only
    one belongs open at a time. Opened together they push the search field and
    the first results off a keyboard-sized screen, which is the one thing this
    step exists to keep in view.

    The personal drawer leads and opens with the step, because it is no longer
    a generic list: it is what this person eats at this meal (personalFoods.ts).
    Menüm stays behind it, shut, saying what is inside and how much, which is
    enough to decide whether to open it.
  */
  const toggleDrawer = (drawer: 'personal' | 'menu') =>
    setOpenDrawer((current) => (current === drawer ? null : drawer))

  const menuOrPersonal =
    menuRows.length === 0 && personal.length === 0 ? (
      <AppText className="mt-3 text-sm text-faint">
        Menüne kaydettiğin besinler burada çıkar. Şimdilik yazıp listede arayalım.
      </AppText>
    ) : (
      <View className="mt-3 gap-2">
        {personal.length > 0 ? (
          <View className="overflow-hidden rounded-2xl border border-line bg-surface">
            <DrawerHeader
              label="Afi'nin senin için seçtikleri"
              hint={`${String(personal.length)} besin`}
              open={openDrawer === 'personal'}
              tint="bg-emerald-100 dark:bg-emerald-900/40"
              icon={<IconBowl size={16} color={accent} />}
              chevron={t.faint}
              onPress={() => toggleDrawer('personal')}
            />
            {openDrawer === 'personal' ? (
              <>
                {personal.map((row) => (
                  <FoodRow
                    key={row.key}
                    row={row}
                    divider
                    menuColor={menuColor}
                    onSelect={selectRow}
                  />
                ))}
                <AppText className="border-t border-line/40 px-3 py-2.5 text-xs text-faint">
                  Aradığın bunlar değilse adını yazmaya başla; katalogda iki binden fazla
                  besin var.
                </AppText>
              </>
            ) : null}
          </View>
        ) : null}

        {menuRows.length > 0 ? (
          <View className="overflow-hidden rounded-2xl border border-line bg-surface">
            <DrawerHeader
              label="Menümden seç"
              hint={`${String(menu.length)} besin`}
              open={openDrawer === 'menu'}
              tint="bg-violet-100 dark:bg-violet-900/40"
              icon={<IconBookmark size={16} color={menuColor} />}
              chevron={t.faint}
              onPress={() => toggleDrawer('menu')}
            />
            {openDrawer === 'menu' ? (
              <>
                {menuRows.map((row) => (
                  <FoodRow
                    key={row.key}
                    row={row}
                    divider
                    menuColor={menuColor}
                    onSelect={selectRow}
                  />
                ))}
                {menu.length > menuRows.length ? (
                  <AppText className="border-t border-line/40 px-3 py-2.5 text-xs text-faint">
                    Menünde {menu.length - menuRows.length} besin daha var, adını yazınca
                    burada çıkar.
                  </AppText>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}
      </View>
    )


  return (
    <View>
      <View className="flex-row items-center gap-2">
        <View className="min-w-0 flex-1 justify-center">
          {/* BottomSheetTextInput, not TextInput: the sheet only tracks the
              focused input when it comes from the library, and that tracking is
              what lifts the sheet clear of the keyboard. */}
          <BottomSheetTextInput
            autoFocus
            accessibilityLabel="Besin ara"
            value={query}
            onChangeText={changeQuery}
            onSubmitEditing={submit}
            returnKeyType="search"
            maxLength={FOOD_NAME_MAX_LENGTH}
            autoCorrect={false}
            placeholder="Ne yedin? (örn. mercimek çorbası)"
            placeholderTextColor={t.faint}
            style={{
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 14,
              paddingLeft: 40,
              paddingRight: 16,
              paddingVertical: 12,
              fontFamily: fontFamilies.normal,
              fontSize: 16,
              color: t.ink,
            }}
          />
          {/* Drawn after the input so Android paints it on top as well. */}
          <View pointerEvents="none" className="absolute left-3.5 z-10">
            <IconSearch size={18} color={t.faint} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fotoğrafla ekle: Afi tanısın"
          onPress={askPhoto}
          className="h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 active:opacity-80"
        >
          <IconCamera size={22} color="#ffffff" />
        </Pressable>
      </View>

      {isSentence ? (
        <View className="mt-3 overflow-hidden rounded-2xl border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/50">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Yazdığın cümledeki besinleri Afi ayırsın"
            accessibilityState={{ busy: reading }}
            onPress={askSentence}
            disabled={reading}
            className={`flex-row items-center gap-2.5 px-3 py-2.5 active:opacity-80 ${
              reading ? 'opacity-60' : ''
            }`}
          >
            <AfiPose pose={reading ? 'dusunuyor' : 'arama'} size={34} />
            <View className="min-w-0 flex-1">
              <AppText weight="bold" className="text-sm text-emerald-900 dark:text-emerald-100">
                {reading ? 'Afi bakıyor…' : 'Bunu Afi çözsün'}
              </AppText>
              <AppText numberOfLines={1} className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
                Cümledeki besinleri tek tek ayırıp sırayla sorar
              </AppText>
            </View>
            {reading ? null : <IconChevronRight size={16} color={accent} />}
          </Pressable>
          {readError ? (
            <AppText
              accessibilityLiveRegion="polite"
              className="border-t border-emerald-600/20 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-100"
            >
              {readError}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {searching ? (
        visibleRows.length > 0 ? (
          <View className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
            {visibleRows.map((row, index) => (
              <FoodRow
                key={row.key}
                row={row}
                divider={index > 0}
                menuColor={menuColor}
                onSelect={selectRow}
              />
            ))}
          </View>
        ) : nothingFound ? (
          <View
            accessibilityLiveRegion="polite"
            className="mt-3 gap-3 rounded-2xl border border-line bg-surface p-4"
          >
            <AppText selectable className="text-sm text-soft">
              {`“${trimmed}” listede yok. İki yolu var: fotoğrafını çek, Afi tanısın; ya da Afi'ye anlat, birlikte menüne ekleyelim.`}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fotoğrafını çek, Afi tanısın"
              onPress={askPhoto}
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 active:opacity-90"
            >
              <IconCamera size={20} color="#ffffff" />
              <AppText weight="semibold" className="text-white">
                Fotoğrafını çek
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Afi'ye anlat, menüne eklensin"
              onPress={askBookmark}
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-surface px-4 py-3 active:opacity-80 dark:border-emerald-500"
            >
              <IconBookmarkPlus size={20} color={accent} />
              <AppText weight="semibold" className="text-emerald-700 dark:text-emerald-400">
                {"Afi'ye anlat"}
              </AppText>
            </Pressable>
          </View>
        ) : null
      ) : (
        <>
          {/* A sofra is the whole meal at once, so it is offered above the
              single foods rather than after them: someone who has saved one is
              usually here to use it. Tapping opens the sofra step, where the
              amounts can still be adjusted before anything is written. */}
          {mealSofras.length > 0 ? (
            <View className="mt-3 overflow-hidden rounded-2xl border border-violet-200 bg-surface dark:border-violet-900">
              <View className="min-h-12 flex-row items-center gap-2 px-3 py-3">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                  <IconUtensils size={16} color={menuColor} />
                </View>
                <AppText weight="bold" className="min-w-0 flex-1 text-sm text-ink">
                  Sofralarım
                </AppText>
              </View>
              {mealSofras.map((sofra) => (
                <Pressable
                  key={sofra.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${sofra.name} sofrasını aç: ${sofraSummary(sofra)}`}
                  onPress={() => {
                    Keyboard.dismiss()
                    void Haptics.selectionAsync()
                    onPickSofra(sofra)
                  }}
                  className="min-h-12 flex-row items-center gap-3 border-t border-line/40 px-3 py-2.5 active:bg-muted"
                >
                  <View className="min-w-0 flex-1">
                    <AppText weight="semibold" numberOfLines={1} className="text-ink">
                      {sofra.name}
                    </AppText>
                    <AppText numberOfLines={1} className="text-xs text-faint">
                      {sofraSummary(sofra)}
                    </AppText>
                  </View>
                  <AppText
                    weight="bold"
                    className="shrink-0 text-xs text-violet-700 dark:text-violet-300"
                  >
                    {sofra.foods.length} besin
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : null}
          {menuOrPersonal}
        </>
      )}

      {searching && rows.length > visibleRows.length ? (
        <AppText className="mt-2 text-xs text-faint">
          Listede {rows.length - visibleRows.length} eşleşme daha var, birkaç harf daha yazınca
          daralır.
        </AppText>
      ) : null}

      {/* iOS keeps the keyboard over the sheet, so the tail of the list needs
          room to scroll clear of it. Android resizes the window instead
          (adjustResize), where reserving the same space would count twice. */}
      {Platform.OS === 'ios' && keyboardHeight > 0 ? (
        <View style={{ height: Math.max(0, keyboardHeight - insets.bottom) }} />
      ) : null}
    </View>
  )
}
