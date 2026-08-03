/**
 * The add-food sheet, kept off the first paint.
 *
 * AddFoodSheet reaches the seed catalogue (`@afiet/core/foods`, 1.1 MB of
 * object literals) through its search steps, and Bugün mounts it on every
 * launch even though it stays shut until somebody taps. Importing it directly
 * meant every cold start evaluated the whole catalogue before the first frame.
 *
 * So it is loaded in two moves instead:
 *
 *  1. Nothing at all during the first render.
 *  2. Once the launch has settled, or immediately if somebody taps before
 *     that, the real sheet is required and mounted.
 *
 * The warm-up is what keeps this invisible: by the time anyone reaches for the
 * "+" the module has long since been evaluated, and the sheet mounts shut, as
 * it always did. Sheet contents are lazy on their own (ui/Sheet.tsx), so
 * mounting late costs nothing either.
 */
import { lazy, Suspense, useEffect, useState, type ComponentProps } from 'react'

const AddFoodSheet = lazy(() =>
  import('./AddFoodSheet').then((module) => ({ default: module.AddFoodSheet })),
)

type AddFoodSheetProps = ComponentProps<typeof AddFoodSheet>

export function DeferredAddFoodSheet(props: AddFoodSheetProps) {
  const [mounted, setMounted] = useState(false)

  /* Idle time rather than a timer: the warm-up is meant to land in a gap, not
     to compete with the animation that is still finishing. (InteractionManager
     did the same job and is deprecated in favour of exactly this.) */
  useEffect(() => {
    if (mounted) return
    const handle = requestIdleCallback(() => setMounted(true), { timeout: 2000 })
    return () => cancelIdleCallback(handle)
  }, [mounted])

  // A tap that beats the warm-up mounts it right away; React suspends for the
  // microtask the import takes and the sheet opens on the next frame.
  if (!mounted && !props.open) return null

  return (
    <Suspense fallback={null}>
      <AddFoodSheet {...props} />
    </Suspense>
  )
}
