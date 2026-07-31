import { formatMealAmount, mealMeta, type MealEntry, type MealType } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { createRestoredMealEntry } from './meal-remove-undo'
import { entriesForMeal } from './meal-shortcuts'
import { mealRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { IconPencil, IconPlus, IconTrash } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'

/**
 * What is on the table for one meal today, and everything that can be done to
 * it: every entry with its amount, a way to change one, a way to take one back
 * off, and a way to put another on.
 *
 * Removing used to be the only verb here. Somebody looking at "Kahvaltı · 1
 * besin · Beyaz peynir" and wanting two slices instead of one, or wanting to
 * add the olives they forgot, had to close this, find the add button, and
 * start over from the meal step they had already answered by opening this
 * sheet. The two writes belong where the meal is being read.
 *
 * Neither is performed here. The sheet closes and hands the intent up, because
 * the flows that own those writes are sheets of their own and a sheet stacked
 * on a sheet reads as a place you cannot get out of.
 */

interface MealDetailSheetProps {
  profileId: number
  date: string
  /** May be null while the sheet is closed. */
  meal: MealType | null
  open: boolean
  onClose: () => void
  /** Opens the add flow on this meal; the sheet closes first. */
  onAddFood: (meal: MealType) => void
  /** Opens the edit form for one entry; the sheet closes first. */
  onEditEntry: (entry: MealEntry) => void
}

const UNDO_REMOVE_DURATION_MS = 6_000
const NO_ENTRIES: MealEntry[] = []
const DEFAULT_MEAL: MealType = 'kahvalti'

export function MealDetailSheet({
  profileId,
  date,
  meal,
  open,
  onClose,
  onAddFood,
  onEditEntry,
}: MealDetailSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  // Sheet freezes the last rendered content while it animates out, so a meal
  // that goes back to null only affects output nobody sees.
  const activeMeal = meal ?? DEFAULT_MEAL

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [removedEntry, setRemovedEntry] = useState<MealEntry | null>(null)
  const [undoingRemove, setUndoingRemove] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const undoRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearUndoTimer = () => {
    if (undoRemoveTimerRef.current !== null) clearTimeout(undoRemoveTimerRef.current)
    undoRemoveTimerRef.current = null
  }

  useEffect(
    () => () => {
      if (undoRemoveTimerRef.current !== null) clearTimeout(undoRemoveTimerRef.current)
    },
    [],
  )

  // A pending undo belongs to one opening of one meal; the next one starts clean.
  const handleClose = () => {
    clearUndoTimer()
    setRemovedEntry(null)
    setActionError(null)
    onClose()
  }

  /* Both hand-offs close first and act after. The add flow and the edit form
     are sheets, and a sheet opened over this one would bury the way out. */
  const leaveTo = (act: () => void) => {
    handleClose()
    act()
  }

  const day = useLive(
    ['meals'],
    () => (open && profileId ? mealRepo.forDay(profileId, date) : Promise.resolve(NO_ENTRIES)),
    [profileId, date, open],
  )
  const entries = useMemo(
    () => entriesForMeal(day.data ?? NO_ENTRIES, date, activeMeal),
    [activeMeal, date, day.data],
  )

  const offerRemoveUndo = (entry: MealEntry) => {
    clearUndoTimer()
    setRemovedEntry(entry)
    undoRemoveTimerRef.current = setTimeout(() => {
      setRemovedEntry(null)
      undoRemoveTimerRef.current = null
    }, UNDO_REMOVE_DURATION_MS)
  }

  const removeEntry = async (entry: MealEntry) => {
    if (entry.id === undefined || deletingId !== null) return
    setDeletingId(entry.id)
    setActionError(null)
    try {
      await mealRepo.remove(entry.id)
      offerRemoveUndo(entry)
      void Haptics.selectionAsync()
    } catch {
      setActionError('Kaydı kaldıramadık. Birazdan tekrar deneyebilirsin.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setDeletingId(null)
    }
  }

  const undoRemove = async () => {
    const entry = removedEntry
    if (!entry || undoingRemove) return
    clearUndoTimer()
    setUndoingRemove(true)
    setActionError(null)
    try {
      await mealRepo.add(createRestoredMealEntry(entry))
      setRemovedEntry(null)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      offerRemoveUndo(entry)
      setActionError('Kaydı geri getiremedik. Birazdan tekrar deneyebilirsin.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setUndoingRemove(false)
    }
  }

  const loadFailed = day.error !== null && entries.length === 0

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={
        <>
          <MealIcon meal={activeMeal} size={22} />
          <AppText weight="bold" className="text-lg text-ink">
            {mealMeta(activeMeal).label}
          </AppText>
        </>
      }
    >
      {loadFailed ? (
        <View className="items-center gap-3 rounded-2xl bg-canvas px-4 py-6">
          <AppText selectable className="text-center text-sm text-soft">
            Bu öğünü şu an getiremedik. Bağlantını kontrol edip tekrar deneyebilirsin.
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Öğünü tekrar yükle"
            onPress={day.retry}
            className="min-h-11 justify-center rounded-xl bg-surface px-4 active:opacity-80"
          >
            <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-400">
              Tekrar dene
            </AppText>
          </Pressable>
        </View>
      ) : day.loading ? (
        <View className="items-center justify-center rounded-2xl bg-canvas px-4 py-8">
          <AppText accessibilityLiveRegion="polite" className="text-sm text-faint">
            Öğünün geliyor…
          </AppText>
        </View>
      ) : entries.length === 0 ? (
        <View className="items-center rounded-2xl bg-canvas px-4 py-5">
          <AfiPose pose="kasik" size={96} />
          <AppText weight="bold" className="mt-1 text-center text-base text-ink">
            Bu öğün şimdilik boş
          </AppText>
          <AppText className="mt-1 text-center text-sm leading-5 text-soft">
            Sofranı kurunca burada görünecek. Afi kasesini hazır tutuyor 🍲
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${mealMeta(activeMeal).label} için besin ekle`}
            onPress={() => leaveTo(() => onAddFood(activeMeal))}
            className="mt-4 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 active:opacity-90"
          >
            <IconPlus size={18} color="#ffffff" strokeWidth={2.4} />
            <AppText weight="bold" className="text-white">
              Besin ekle
            </AppText>
          </Pressable>
        </View>
      ) : (
        <>
          <AppText weight="semibold" className="-mt-1 mb-2 text-xs text-faint">
            {entries.length} besin
          </AppText>
          <View className="gap-2">
            {entries.map((entry) => (
              <View
                key={entry.id ?? `${entry.createdAt}-${entry.foodName}`}
                className="flex-row items-center gap-2 rounded-2xl bg-canvas py-1.5 pl-3 pr-1"
              >
                {/* The row itself is the edit control: what someone wants to
                    change about a logged food is almost always its amount, and
                    the amount is the thing they are looking straight at. The
                    pencil beside the bin is what says so, because a row that
                    happens to be tappable looks exactly like one that is not. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.foodName}, ${formatMealAmount(entry)}. Düzenle`}
                  accessibilityState={{ disabled: deletingId !== null }}
                  disabled={deletingId !== null || entry.id === undefined}
                  onPress={() => leaveTo(() => onEditEntry(entry))}
                  className="min-w-0 flex-1 py-1 active:opacity-70"
                >
                  <AppText weight="semibold" numberOfLines={1} className="text-ink">
                    {entry.foodName}
                  </AppText>
                  <View className="mt-0.5 flex-row items-center gap-1.5">
                    <AppText className="text-xs text-soft">{formatMealAmount(entry)}</AppText>
                    {entry.groups.length > 0 ? (
                      <View className="flex-row items-center gap-0.5">
                        {entry.groups.map((g) => (
                          <GroupIcon key={g} group={g} size={13} />
                        ))}
                      </View>
                    ) : null}
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.foodName} kaydını düzenle`}
                  accessibilityState={{ disabled: deletingId !== null }}
                  disabled={deletingId !== null || entry.id === undefined}
                  onPress={() => leaveTo(() => onEditEntry(entry))}
                  className={`h-11 w-11 items-center justify-center rounded-full active:bg-muted ${
                    deletingId !== null ? 'opacity-40' : ''
                  }`}
                >
                  <IconPencil size={17} color={t.faint} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.foodName} kaydını kaldır`}
                  accessibilityState={{
                    disabled: deletingId !== null,
                    busy: deletingId === entry.id,
                  }}
                  disabled={deletingId !== null}
                  onPress={() => void removeEntry(entry)}
                  className={`h-11 w-11 items-center justify-center rounded-full active:bg-muted ${
                    deletingId !== null ? 'opacity-40' : ''
                  }`}
                >
                  <IconTrash size={18} color={t.faint} />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${mealMeta(activeMeal).label} için bir besin daha ekle`}
            onPress={() => leaveTo(() => onAddFood(activeMeal))}
            className="mt-3 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 py-3 active:opacity-80 dark:border-emerald-500"
          >
            <IconPlus size={17} color={isDark ? '#34d399' : '#047857'} strokeWidth={2.4} />
            <AppText weight="semibold" className="text-emerald-700 dark:text-emerald-400">
              Bir besin daha ekle
            </AppText>
          </Pressable>
        </>
      )}

      {removedEntry ? (
        <View
          accessibilityLiveRegion="polite"
          className="mt-3 flex-row items-center gap-3 rounded-2xl bg-muted px-3 py-2"
        >
          <AppText selectable numberOfLines={2} className="min-w-0 flex-1 text-sm text-soft">
            “{removedEntry.foodName}” kaldırıldı.
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${removedEntry.foodName} kaydını geri al`}
            accessibilityState={{ disabled: undoingRemove, busy: undoingRemove }}
            disabled={undoingRemove}
            onPress={() => void undoRemove()}
            className={`h-11 items-center justify-center rounded-xl bg-surface px-4 active:opacity-80 ${
              undoingRemove ? 'opacity-40' : ''
            }`}
          >
            <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-400">
              {undoingRemove ? 'Geri alınıyor…' : 'Geri al'}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {actionError ? (
        <AppText selectable className="mt-3 text-center text-sm text-soft">
          {actionError}
        </AppText>
      ) : null}

    </Sheet>
  )
}
