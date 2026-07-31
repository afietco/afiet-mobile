import { MEAL_TYPES, type CustomFood, type MealType } from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconCheck, IconTrash } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import { isSofraSaveable, saveSofra, type Sofra, type SofraFood } from './sofra'
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
  /** Düzenlenen sofra; null yeni sofra demek. */
  initial: Sofra | null
  onClose: () => void
}

function toFood(food: CustomFood): SofraFood {
  return {
    name: food.name,
    groups: food.groups,
    measure: food.measure ?? null,
    quantity: 1,
  }
}

export function SofraSheet({ open, initial, onClose }: SofraSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const menu = useCustomFoods()
  const [name, setName] = useState('')
  const [meals, setMeals] = useState<MealType[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Seeded during render rather than from an effect, the same way the Afi note
     restarts its rotation: an effect would paint one frame of the previous
     sofra's name into the field before correcting itself. The key covers both
     "opened" and "opened on a different sofra". */
  const seedKey = open ? (initial?.id ?? 'yeni') : 'kapali'
  const [seeded, setSeeded] = useState(seedKey)
  if (seedKey !== seeded) {
    setSeeded(seedKey)
    setName(initial?.name ?? '')
    setMeals(initial?.meals ?? [])
    setPicked(initial?.foods.map((food) => food.name) ?? [])
    setSaving(false)
    setError(null)
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
      .then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
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
          fontFamily: 'Nunito_400Regular',
          fontSize: 16,
          color: t.ink,
        }}
      />

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
        <View className="overflow-hidden rounded-2xl border border-line bg-surface">
          {menu.map((food, index) => {
            const on = picked.includes(food.name)
            return (
              <Pressable
                key={food.id ?? food.name}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={food.name}
                onPress={() => toggleFood(food.name)}
                className={`min-h-12 flex-row items-center gap-3 px-3 py-2.5 active:bg-muted ${
                  index > 0 ? 'border-t border-line/40' : ''
                } ${on ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}
              >
                <View
                  className={`h-6 w-6 items-center justify-center rounded-lg border ${
                    on ? 'border-emerald-600 bg-emerald-600' : 'border-line'
                  }`}
                >
                  {on ? <IconCheck size={14} color="#ffffff" /> : null}
                </View>
                <AppText numberOfLines={1} className="min-w-0 flex-1 text-ink">
                  {food.name}
                </AppText>
                <View className="shrink-0 flex-row items-center gap-1">
                  {food.groups.map((group) => (
                    <GroupIcon key={group} group={group} size={16} />
                  ))}
                </View>
              </Pressable>
            )
          })}
        </View>
      )}

      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          className="mt-3 text-center text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sofrayı kaydet"
        accessibilityState={{ disabled: !canSave, busy: saving }}
        disabled={!canSave}
        onPress={submit}
        className={`mt-5 min-h-12 items-center justify-center rounded-2xl bg-emerald-600 py-3.5 active:opacity-90 ${
          canSave ? '' : 'opacity-40'
        }`}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <AppText weight="bold" className="text-white">
            {initial ? 'Değişiklikleri kaydet' : 'Sofrayı kaydet'}
          </AppText>
        )}
      </Pressable>

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
    </Sheet>
  )
}
