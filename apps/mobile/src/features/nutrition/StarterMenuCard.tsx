import { turkishLower, type CustomFood } from '@afiet/core'
import { SEED_FOODS, type SeedFood } from '@afiet/core/foods'
import * as Haptics from 'expo-haptics'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { foodRepo } from '@/data/repositories'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { IconCheck } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'

/**
 * The empty menu, answered.
 *
 * Menüm opened on a mascot and an explanation of two other places a food could
 * come from. That is the screen at its least useful, and it is also the screen
 * most people see first: a menu is the thing you have to already have used the
 * app to own. Nothing on it could be tapped.
 *
 * These six are added with one tap, from the catalogue, with the catalogue's
 * own groups and measures behind them. They are not seeded silently on the
 * person's behalf: writing rows into somebody's account that they did not ask
 * for means the first thing they do here is delete six things. The tap is the
 * whole difference between a starting point and a mess to clean up.
 */

/** Everyday things, ordinary enough that most people would have added them. */
const STARTER_NAMES = ['Yumurta', 'Beyaz peynir', 'Yoğurt', 'Domates', 'Zeytin', 'Ceviz']

function starterFoods(): SeedFood[] {
  const wanted = new Set(STARTER_NAMES.map(turkishLower))
  const found = new Map<string, SeedFood>()
  for (const food of SEED_FOODS) {
    const key = turkishLower(food.name)
    if (wanted.has(key) && !found.has(key)) found.set(key, food)
  }
  // Kept in the order they are written above rather than catalogue order.
  return STARTER_NAMES.map((name) => found.get(turkishLower(name))).filter(
    (food): food is SeedFood => food !== undefined,
  )
}

function toCustomFood(food: SeedFood): CustomFood {
  return {
    name: food.name,
    groups: food.groups,
    measure: food.measure,
    macros: food.macros,
    description: food.description,
  }
}

export function StarterMenuCard() {
  const foods = useMemo(() => starterFoods(), [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addAll = () => {
    if (saving) return
    setSaving(true)
    setError(null)
    /* Sequential rather than parallel: each is its own request, and six at
       once against a cold container is how a first run turns into six
       timeouts. `saveCustom` already treats a duplicate name as success. */
    void (async () => {
      try {
        for (const food of foods) await foodRepo.saveCustom(toCustomFood(food))
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } catch {
        setError('Menüne ekleyemedim. Bağlantını kontrol edip tekrar dener misin?')
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } finally {
        setSaving(false)
      }
    })()
  }

  return (
    <View className="rounded-2xl bg-surface p-5">
      <View className="flex-row items-start gap-3">
        <AfiPose pose="kasik" motion="nefes" intro="giris" size={64} />
        <View className="min-w-0 flex-1">
          <AppText weight="bold" className="text-ink">
            Menün henüz boş
          </AppText>
          <AppText className="mt-1 text-sm leading-5 text-soft">
            İstersen sık yenen birkaç besinle başlayalım; hepsini sonra
            düzenleyebilir ya da silebilirsin.
          </AppText>
        </View>
      </View>

      <View className="mt-4 gap-1.5">
        {foods.map((food) => (
          <View key={food.name} className="flex-row items-center gap-2.5">
            <AppText className="text-base">{food.emoji}</AppText>
            <AppText className="min-w-0 flex-1 text-sm text-ink">{food.name}</AppText>
            <View className="shrink-0 flex-row items-center gap-1">
              {food.groups.map((group) => (
                <GroupIcon key={group} group={group} size={15} />
              ))}
            </View>
          </View>
        ))}
      </View>

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
        accessibilityLabel={`Bu ${String(foods.length)} besni menüme ekle`}
        accessibilityState={{ disabled: saving, busy: saving }}
        disabled={saving}
        onPress={addAll}
        className={`mt-4 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 active:opacity-90 ${
          saving ? 'opacity-60' : ''
        }`}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <IconCheck size={18} color="#ffffff" strokeWidth={2.4} />
            <AppText weight="bold" className="text-white">
              Bunları menüme ekle
            </AppText>
          </>
        )}
      </Pressable>

      <AppText className="mt-3 text-center text-xs text-faint">
        Ya da yukarıdan kendi besnini ekleyebilirsin.
      </AppText>
    </View>
  )
}
