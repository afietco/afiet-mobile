import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef } from 'react'
import { setPendingAdd } from '@/features/widget/pendingAdd'
import { PageSkeleton } from '@/ui/PageSkeleton'

/**
 * Handles afiet://ekle?ogun=<meal> widget links. The Today screen owns the
 * add-food sheet and consumes the selected meal from the one-shot bridge.
 */
export default function EkleRoute() {
  const { ogun } = useLocalSearchParams<{ ogun?: string | string[] }>()
  const rawMeal = Array.isArray(ogun) ? ogun[0] : ogun
  const handledMeal = useRef<{ value: string | undefined } | null>(null)

  useEffect(() => {
    if (handledMeal.current?.value === rawMeal) return
    handledMeal.current = { value: rawMeal }
    setPendingAdd(rawMeal)
    router.replace('/(tabs)')
  }, [rawMeal])

  return <PageSkeleton />
}
