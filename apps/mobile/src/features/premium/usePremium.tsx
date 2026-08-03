import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Whether this person has premium, and what it would cost them.
 *
 * The implementation behind this is a mock, and the shape is not: it is the
 * shape RevenueCat gives back, so slice 2 replaces the body of this file and
 * nothing that reads it. Two rules are already in force here because they are
 * the ones that are expensive to retrofit:
 *
 *  - prices are strings that arrive from outside, never written in our code.
 *    The store formats and localises them, TR prices are entered by hand in
 *    both consoles, and a number typed here would be a second source of truth
 *    that goes stale the first time a price moves (docs/revenuecat-dilim-plani).
 *  - the product identifiers are fixed and shared with both stores. They are
 *    written down once, here.
 */

export type PremiumPlan = 'annual' | 'monthly'

export interface PremiumPackage {
  plan: PremiumPlan
  /** Store product id; same string in App Store Connect and Play Console. */
  productId: string
  /** Localised, store-formatted. Shown as-is. */
  price: string
  /** What it works out to per month, when there is a sensible answer. */
  perMonth: string | null
  /** An introductory offer the store is running on this package. */
  intro: { price: string; note: string } | null
}

export interface PremiumApi {
  isPremium: boolean
  packages: PremiumPackage[]
  /** True while a purchase or restore is in flight. */
  busy: boolean
  purchase: (plan: PremiumPlan) => Promise<void>
  restore: () => Promise<void>
}

const MOCK_PACKAGES: PremiumPackage[] = [
  {
    plan: 'annual',
    productId: 'afiet_premium_annual',
    price: '799,99 TL',
    perMonth: '66,66 TL',
    intro: { price: '599,99 TL', note: 'ilk yıl' },
  },
  {
    plan: 'monthly',
    productId: 'afiet_premium_monthly',
    price: '129,99 TL',
    perMonth: null,
    intro: null,
  },
]

const PremiumContext = createContext<PremiumApi | null>(null)

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false)
  const [busy, setBusy] = useState(false)

  /* Stands in for the store sheet: long enough to see the button's own busy
     state, which is the part of the flow this slice exists to get right. */
  const settle = useCallback(async () => {
    setBusy(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setBusy(false)
  }, [])

  const purchase = useCallback(
    async (_plan: PremiumPlan) => {
      await settle()
      setIsPremium(true)
    },
    [settle],
  )

  const restore = useCallback(async () => {
    await settle()
  }, [settle])

  const api = useMemo<PremiumApi>(
    () => ({ isPremium, packages: MOCK_PACKAGES, busy, purchase, restore }),
    [busy, isPremium, purchase, restore],
  )

  return <PremiumContext.Provider value={api}>{children}</PremiumContext.Provider>
}

/**
 * Without a provider this reports "not premium" rather than throwing.
 *
 * Every gate in the app reads this, including screens that can be opened from
 * places the provider does not wrap yet, and a paywall that crashes the screen
 * it was supposed to decorate is worse than one that shows the free state.
 */
export function usePremium(): PremiumApi {
  return (
    useContext(PremiumContext) ?? {
      isPremium: false,
      packages: MOCK_PACKAGES,
      busy: false,
      purchase: async () => undefined,
      restore: async () => undefined,
    }
  )
}
