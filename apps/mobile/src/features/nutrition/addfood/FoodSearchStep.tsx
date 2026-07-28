import { turkishLower, type CustomFood } from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Platform, Pressable, View, type KeyboardEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCustomFoods } from '../useCustomFoods'
import type { AfiCue, SearchStepProps } from './contract'
import {
  buildFoodSearchRows,
  buildMenuRows,
  FOOD_SEARCH_LIMIT,
  MENU_PREVIEW_LIMIT,
  type FoodSearchRow,
} from './foodSearch'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import {
  IconBookmark,
  IconBookmarkPlus,
  IconCamera,
  IconChevronRight,
  IconSearch,
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

/** Keystrokes settle before the ~2000 food catalogue is scanned. */
const SEARCH_DEBOUNCE_MS = 140

/** Rows that still sit above an open keyboard on a small phone. */
const KEYBOARD_ROW_LIMIT = 5

/** Keeps the search memo stable while the menu query is still loading. */
const EMPTY_MENU: CustomFood[] = []

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

export function FoodSearchStep({
  draft,
  onDraft,
  onAdvance,
  onCue,
  onNeedPhoto,
  onNeedBookmark,
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
  const [settledQuery, setSettledQuery] = useState(() => draft.name)
  const [menuOpen, setMenuOpen] = useState(true)

  const trimmed = query.trim()
  const settling = query !== settledQuery

  useEffect(() => {
    if (!settling) return
    const id = setTimeout(() => setSettledQuery(query), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [query, settling])

  const rows = useMemo(
    () => buildFoodSearchRows(settledQuery, menu, FOOD_SEARCH_LIMIT),
    [menu, settledQuery],
  )
  const menuRows = useMemo(() => buildMenuRows(menu, MENU_PREVIEW_LIMIT), [menu])

  // The list shrinks while the keyboard is up so its rows stay above it.
  const rowLimit = keyboardHeight > 0 ? KEYBOARD_ROW_LIMIT : FOOD_SEARCH_LIMIT
  const visibleRows = rows.length > rowLimit ? rows.slice(0, rowLimit) : rows
  const searching = trimmed.length > 0
  const nothingFound = searching && !settling && rows.length === 0

  const cue = useMemo<AfiCue>(() => {
    if (!searching)
      return { pose: 'arama', line: 'Ne yedin? Yazmaya başla, listeye birlikte bakalım.' }
    if (settling) return { pose: 'dusunuyor', line: 'Bir saniye, listeye bakıyorum.' }
    if (rows.length === 0)
      return { pose: 'merak', line: 'Bu besin listede yok, ama çaresi var.' }
    if (rows[0].exact) return { pose: 'buldum', line: 'Aradığın tam burada, dokunman yeter.' }
    return { pose: 'arama', line: 'Bunlardan biri mi?' }
  }, [rows, searching, settling])

  // The host owns the mascot; the cue is pushed to it, never rendered here.
  const cueRef = useRef(onCue)
  useEffect(() => {
    cueRef.current = onCue
  }, [onCue])
  useEffect(() => {
    cueRef.current(cue)
  }, [cue])

  const changeQuery = useCallback(
    (value: string) => {
      setQuery(value)
      // Editing away from a resolved food drops the resolution with it, so a
      // stale catalogue match can never travel forward with new text.
      if (draft.origin !== null && turkishLower(value.trim()) !== turkishLower(draft.name)) {
        onDraft({ name: value.trim(), groups: [], measure: 'porsiyon', origin: null })
      }
    },
    [draft.name, draft.origin, onDraft],
  )

  const selectRow = useCallback(
    (row: FoodSearchRow) => {
      Keyboard.dismiss()
      void Haptics.selectionAsync()
      setQuery(row.name)
      setSettledQuery(row.name)
      onDraft({
        name: row.name,
        groups: row.groups,
        measure: row.measure ?? 'porsiyon',
        origin: row.origin,
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
    cueRef.current({ pose: 'foto', line: 'Fotoğrafını çek, ben tanıyayım.' })
    onNeedPhoto()
  }, [onNeedPhoto])

  const askBookmark = useCallback(() => {
    Keyboard.dismiss()
    cueRef.current({ pose: 'dusunuyor', line: 'Anlat bakalım, birlikte menüne ekleyelim.' })
    onNeedBookmark(trimmed)
  }, [onNeedBookmark, trimmed])

  const menuColor = isDark ? '#c4b5fd' : '#7c3aed'
  const accent = isDark ? '#34d399' : '#047857'

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
              fontFamily: 'Nunito_400Regular',
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
      ) : menuRows.length > 0 ? (
        <View className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Menümden seç, ${menu.length} besin`}
            accessibilityState={{ expanded: menuOpen }}
            onPress={() => setMenuOpen((open) => !open)}
            className="min-h-12 flex-row items-center gap-2 px-3 py-3 active:bg-muted"
          >
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <IconBookmark size={16} color={menuColor} />
            </View>
            <AppText weight="bold" className="min-w-0 flex-1 text-sm text-ink">
              Menümden seç
            </AppText>
            <AppText className="shrink-0 text-xs text-soft">{menu.length} besin</AppText>
            <View style={{ transform: [{ rotate: menuOpen ? '90deg' : '0deg' }] }}>
              <IconChevronRight size={16} color={t.faint} />
            </View>
          </Pressable>
          {menuOpen ? (
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
                  Menünde {menu.length - menuRows.length} besin daha var, adını yazınca burada
                  çıkar.
                </AppText>
              ) : null}
            </>
          ) : null}
        </View>
      ) : (
        <AppText className="mt-3 text-sm text-faint">
          Menüne kaydettiğin besinler burada çıkar. Şimdilik yazıp listede arayalım.
        </AppText>
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
