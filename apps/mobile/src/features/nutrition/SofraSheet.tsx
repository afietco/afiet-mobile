import { MEAL_TYPES, type CustomFood, type MealType } from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconBookmark, IconCheck, IconTrash, IconX } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import { fontFamilies } from '@/theme/fonts'
import { isSofraSaveable, saveSofra, type Sofra, type SofraDraft, type SofraFood } from './sofra'
import { MenuPickerSheet } from './MenuPickerSheet'
import { SofraMacroLine } from './SofraMacroLine'
import { useCustomFoods } from './useCustomFoods'

/**
 * Building a sofra: a name, when it belongs, and which of your foods are on it.
 *
 * Everything is picked rather than typed. The foods come from the menu the
 * person has already taught the app, so a sofra can never carry a food with no
 * groups behind it, and adding one to a meal later moves the balance exactly
 * as adding it by hand would.
 *
 * The meal row is optional and says so. Left empty the sofra is offered at
 * every meal, which is the honest reading of "I did not say": a set nobody has
 * placed is not a set that belongs nowhere.
 */

const SAVE_ERROR = 'Sofranı kaydedemedim. Bağlantını kontrol edip tekrar dener misin?'
const NAME_TAKEN = 'Bu adda bir sofran zaten var. Başka bir ad dener misin?'
const SHEET_HEIGHT_RATIO = 0.92

interface SofraSheetProps {
  open: boolean
  /** The sofra being edited; null means a new one. */
  initial: Sofra | null
  /**
   * A starting point for a new sofra: name, meal and foods filled in, still
   * all editable. The FTUE offers one built from what the person keeps
   * logging; ignored while `initial` is set.
   */
  draft?: SofraDraft | null
  onClose: () => void
  /** Called after a successful save, before the sheet closes. */
  onSaved?: (sofra: Sofra) => void
}

function toFood(food: CustomFood): SofraFood {
  return {
    name: food.name,
    groups: food.groups,
    measure: food.measure ?? null,
    quantity: 1,
  }
}

export function SofraSheet({ open, initial, draft: seed, onClose, onSaved }: SofraSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const menu = useCustomFoods()
  const [name, setName] = useState('')
  const [meals, setMeals] = useState<MealType[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  /* Seeded during render rather than from an effect, the same way the Afi note
     restarts its rotation: an effect would paint one frame of the previous
     sofra's name into the field before correcting itself. The key covers both
     "opened" and "opened on a different sofra". */
  const seedKey = open ? (initial?.id ?? (seed ? 'taslak' : 'yeni')) : 'kapali'
  const [seeded, setSeeded] = useState(seedKey)
  if (seedKey !== seeded) {
    setSeeded(seedKey)
    const source = initial ?? seed ?? null
    setName(source?.name ?? '')
    setMeals(source?.meals ?? [])
    setPicked(source?.foods.map((food) => food.name) ?? [])
    setSaving(false)
    setError(null)
    setPickerOpen(false)
  }

  const toggleMeal = (meal: MealType) => {
    void Haptics.selectionAsync()
    setMeals((current) =>
      current.includes(meal) ? current.filter((m) => m !== meal) : [...current, meal],
    )
  }

  const toggleFood = (foodName: string) => {
    void Haptics.selectionAsync()
    setPicked((current) =>
      current.includes(foodName)
        ? current.filter((n) => n !== foodName)
        : [...current, foodName],
    )
  }

  /* Ordered by the menu rather than by when each was tapped: the menu is
     alphabetical and the person is reading it while picking, so a list that
     reshuffled under the tap would be the harder thing to use. */
  const foods: SofraFood[] = menu.filter((food) => picked.includes(food.name)).map(toFood)
  const draft = { name, meals, foods }
  const canSave = isSofraSaveable(draft) && !saving

  const submit = () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    void saveSofra(draft, initial?.id)
      .then((saved) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        onSaved?.(saved)
        onClose()
      })
      .catch((cause: unknown) => {
        const conflict =
          typeof cause === 'object' && cause !== null && 'status' in cause && cause.status === 409
        setError(conflict ? NAME_TAKEN : SAVE_ERROR)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      })
      .finally(() => setSaving(false))
  }

  return (
    <Sheet
      name="sofra"
      open={open}
      onClose={onClose}
      heightRatio={SHEET_HEIGHT_RATIO}
      enablePanDownToClose={!saving}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          {initial ? 'Sofrayı düzenle' : 'Yeni sofra'}
        </AppText>
      }
    >
      <View className="flex-row items-start gap-3">
        <AfiPose pose="kasik" motion="nefes" intro="giris" size={56} />
        <AppText className="min-w-0 flex-1 text-sm leading-5 text-soft">
          Birlikte yediğin besinleri bir araya getir; besin eklerken hepsini tek
          dokunuşla sofrana taşıyayım.
        </AppText>
      </View>

      <AppText weight="semibold" className="mb-1.5 mt-4 text-sm text-soft">
        Sofranın adı
      </AppText>
      {/* Save sits beside the name rather than under everything else. It used
          to be the last thing on a 92% sheet, below a list that grew with the
          menu, so finishing a sofra meant scrolling past every food you own to
          reach the button. It appears once there is a name to save and stays
          inactive until something is actually on the table. */}
      <View className="flex-row items-center gap-2">
        <View className="min-w-0 flex-1">
          <BottomSheetTextInput
            accessibilityLabel="Sofranın adı"
            value={name}
            onChangeText={setName}
            maxLength={60}
            placeholder="örn. Sabah sofram"
            placeholderTextColor={t.faint}
            style={{
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: fontFamilies.normal,
              fontSize: 16,
              color: t.ink,
            }}
          />
        </View>
        {name.trim().length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              canSave
                ? 'Sofrayı kaydet'
                : 'Sofrayı kaydet, önce en az bir besin seçmelisin'
            }
            accessibilityState={{ disabled: !canSave, busy: saving }}
            disabled={!canSave}
            onPress={submit}
            className={`h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 active:opacity-80 ${
              canSave ? '' : 'opacity-40'
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <IconCheck size={22} color="#ffffff" strokeWidth={2.6} />
            )}
          </Pressable>
        ) : null}
      </View>

      <AppText weight="semibold" className="mb-1.5 mt-4 text-sm text-soft">
        Ne zaman kurulur?
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {MEAL_TYPES.map((meal) => (
          <Chip
            key={meal.key}
            label={meal.label}
            icon={
              <MealIcon
                meal={meal.key}
                size={16}
                color={meals.includes(meal.key) ? '#ffffff' : undefined}
              />
            }
            active={meals.includes(meal.key)}
            onPress={() => toggleMeal(meal.key)}
          />
        ))}
      </View>
      <AppText className="mt-1.5 text-xs text-faint">
        {meals.length === 0
          ? 'Seçmezsen her öğünde önerilir.'
          : 'Besin eklerken yalnız bu öğünlerde çıkar.'}
      </AppText>

      <AppText weight="semibold" className="mb-1.5 mt-4 text-sm text-soft">
        Sofradaki besinler {picked.length > 0 ? `(${String(picked.length)})` : ''}
      </AppText>

      {menu.length === 0 ? (
        /* A sofra is built out of the menu, so an empty menu is not an error
           here, it is the step before this one. */
        <View className="rounded-2xl bg-muted p-4">
          <AppText className="text-sm leading-5 text-soft">
            Sofra kurmak için önce menüne birkaç besin eklemen gerekiyor. Bu
            ekranı kapatıp “Yeni Besin Ekle” ile başlayabilirsin.
          </AppText>
        </View>
      ) : (
        <>
          {/* Only what is ON the table, never the whole menu: the menu is a
              list to choose from and belongs on the screen that does the
              choosing (MenuPickerSheet). */}
          {foods.length > 0 ? (
            <View className="mb-2 overflow-hidden rounded-2xl border border-line bg-surface">
              {foods.map((food, index) => (
                <View
                  key={food.name}
                  className={`min-h-12 flex-row items-center gap-3 px-3 py-2.5 ${
                    index > 0 ? 'border-t border-line/40' : ''
                  }`}
                >
                  <AppText numberOfLines={1} className="min-w-0 flex-1 text-ink">
                    {food.name}
                  </AppText>
                  <View className="shrink-0 flex-row items-center gap-1">
                    {food.groups.map((group) => (
                      <GroupIcon key={group} group={group} size={16} />
                    ))}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${food.name} besnini sofradan çıkar`}
                    onPress={() => toggleFood(food.name)}
                    className="-mr-1 h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-muted"
                  >
                    <IconX size={16} color={t.faint} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {foods.length > 0 ? (
            <View className="mb-2">
              <SofraMacroLine foods={foods} showGroups />
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menünden besin seç"
            onPress={() => setPickerOpen(true)}
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-3 active:bg-muted"
          >
            <IconBookmark size={18} color={t.soft} />
            <AppText weight="semibold" className="text-sm text-soft">
              {foods.length > 0 ? 'Menümden seç' : 'Menümden besin seç'}
            </AppText>
          </Pressable>
        </>
      )}

      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          className="mt-3 text-center text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </AppText>
      ) : null}

      {/* Deleting lives on the row in Menüm, not here: a destructive action
          inside an editor is one mis-tap away from the save button. */}
      {initial ? (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          <IconTrash size={14} color={t.faint} />
          <AppText className="text-xs text-faint">
            Silmek için Menüm’deki sofraya uzun bas.
          </AppText>
        </View>
      ) : null}

      <MenuPickerSheet
        open={pickerOpen}
        selected={picked}
        onClose={() => setPickerOpen(false)}
        onDone={setPicked}
      />
    </Sheet>
  )
}
