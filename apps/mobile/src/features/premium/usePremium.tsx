import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Platform } from 'react-native'
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PurchasesStoreProduct,
} from 'react-native-purchases'

import { useAuth } from '@/features/auth/AuthContext'
import { config } from '@/config'

/**
 * Whether this person has premium, and what it would cost them.
 *
 * Two rules are in force here because they are the ones that are expensive to
 * retrofit:
 *
 *  - prices are strings that arrive from the store, never written in our code.
 *    The store formats and localises them, TR prices are entered by hand in
 *    both consoles, and a number typed here would be a second source of truth
 *    that goes stale the first time a price moves.
 *  - the entitlement name is the contract with the server. The client SDK is
 *    what makes the screen react instantly; the server's own copy is what
 *    decides whether a request is allowed (docs/revenuecat-dilim-plani, R3).
 */

/** The entitlement wired to all four store products in the RevenueCat dashboard. */
const ENTITLEMENT = 'premium'

export type PremiumPlan = 'annual' | 'monthly'

export interface PremiumPackage {
  plan: PremiumPlan
  /** Store product id; same string in App Store Connect and Play Console. */
  productId: string
  /** Localised, store-formatted. Shown as-is. */
  price: string
  /** What it works out to per month, when the store answers that question. */
  perMonth: string | null
  /** An introductory offer the store is running on this package. */
  intro: { price: string; note: string } | null
}

export interface PremiumApi {
  isPremium: boolean
  packages: PremiumPackage[]
  /** True while a purchase or restore is in flight. */
  busy: boolean
  /** Last thing that went wrong, in words meant for the person reading. */
  error: string | null
  purchase: (plan: PremiumPlan) => Promise<void>
  restore: () => Promise<void>
}

/**
 * The SDK, or null when this build cannot talk to a store.
 *
 * Required lazily and behind a try/catch on purpose. The module reaches for a
 * native module at import time, which is fine in a dev client or a store build
 * and fatal in Expo Go and in the expo-web preview we use to look at screens.
 * A paywall that is merely absent there is correct; a red screen is not.
 */
type PurchasesModule = typeof import('react-native-purchases').default
let purchasesModule: PurchasesModule | null | undefined

function getPurchases(): PurchasesModule | null {
  if (purchasesModule !== undefined) return purchasesModule
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    purchasesModule = (require('react-native-purchases') as { default: PurchasesModule }).default
  } catch {
    purchasesModule = null
  }
  return purchasesModule
}

const revenueCatKey =
  Platform.select({ ios: config.revenueCatKeys.ios, android: config.revenueCatKeys.android }) ?? ''

/** A build with no key sells nothing, which is a state and not a failure. */
const billingConfigured = revenueCatKey.length > 0

function planOf(pkg: PurchasesPackage): PremiumPlan | null {
  if (pkg.packageType === 'ANNUAL') return 'annual'
  if (pkg.packageType === 'MONTHLY') return 'monthly'
  return null
}

/**
 * The introductory offer, in the two strings the card shows.
 *
 * Only the "pay up front for one period" shape is described here, because that
 * is the offer the pricing policy defines (first year at a lower price). A free
 * trial would need different wording and we deliberately do not run one.
 */
function introOf(product: PurchasesStoreProduct): PremiumPackage['intro'] {
  const intro = product.introPrice
  if (!intro || intro.price <= 0) return null
  const note = intro.periodUnit === 'YEAR' && intro.periodNumberOfUnits === 1 ? 'ilk yıl' : 'ilk dönem'
  return { price: intro.priceString, note }
}

function toPremiumPackage(pkg: PurchasesPackage): PremiumPackage | null {
  const plan = planOf(pkg)
  if (!plan) return null
  return {
    plan,
    productId: pkg.product.identifier,
    price: pkg.product.priceString,
    /* The store computes this; dividing the year by twelve ourselves would be
       a second price in our code, formatted in a currency we guessed. */
    perMonth: plan === 'annual' ? pkg.product.pricePerMonthString : null,
    intro: introOf(pkg.product),
  }
}

function hasEntitlement(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT] !== undefined
}

/** RevenueCat reports a cancelled sheet as an error; the person did nothing wrong. */
function isCancellation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { userCancelled?: boolean }).userCancelled === true
}

const PremiumContext = createContext<PremiumApi | null>(null)

const NOT_PREMIUM: PremiumApi = {
  isPremium: false,
  packages: [],
  busy: false,
  error: null,
  purchase: async () => undefined,
  restore: async () => undefined,
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [isPremium, setIsPremium] = useState(false)
  const [packages, setPackages] = useState<PremiumPackage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** RevenueCat's own package objects, keyed by our plan, for purchasing. */
  const offered = useRef<Partial<Record<PremiumPlan, PurchasesPackage>>>({})

  const readOfferings = useCallback((offerings: PurchasesOfferings) => {
    const current = offerings.current
    if (!current) {
      /* An offering that resolves to nothing is the shape of an unfinished
         dashboard, not of a person without an offer. Leaving the list empty
         makes the screen show its free state instead of an empty price. */
      offered.current = {}
      setPackages([])
      return
    }
    const next: Partial<Record<PremiumPlan, PurchasesPackage>> = {}
    const mapped: PremiumPackage[] = []
    for (const pkg of current.availablePackages) {
      const mappedPackage = toPremiumPackage(pkg)
      if (!mappedPackage) continue
      next[mappedPackage.plan] = pkg
      mapped.push(mappedPackage)
    }
    offered.current = next
    /* Annual first: it is what the paywall preselects and what the category
       overwhelmingly buys. */
    mapped.sort((a, b) => (a.plan === b.plan ? 0 : a.plan === 'annual' ? -1 : 1))
    setPackages(mapped)
  }, [])

  useEffect(() => {
    const Purchases = billingConfigured ? getPurchases() : null
    if (!Purchases) return

    let cancelled = false
    Purchases.configure({ apiKey: revenueCatKey })
    Purchases.addCustomerInfoUpdateListener((info) => {
      if (!cancelled) setIsPremium(hasEntitlement(info))
    })
    void (async () => {
      try {
        const offerings = await Purchases.getOfferings()
        if (!cancelled) readOfferings(offerings)
      } catch {
        /* Offerings fail on a cold network as easily as on a broken dashboard.
           The screen shows the free state either way, and the next open retries. */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [readOfferings])

  /**
   * The RevenueCat identity follows the Stack Auth one.
   *
   * Purchases made before signing in belong to an anonymous id; logIn aliases
   * it onto the account, which is what keeps a purchase from disappearing when
   * someone buys first and signs in second.
   */
  useEffect(() => {
    const Purchases = billingConfigured ? getPurchases() : null
    if (!Purchases) return

    let cancelled = false
    void (async () => {
      try {
        const info = userId ? (await Purchases.logIn(userId)).customerInfo : await Purchases.logOut()
        if (!cancelled) setIsPremium(hasEntitlement(info))
      } catch {
        /* An identity that failed to switch is not worth a message: the
           entitlement listener corrects it on the next update. */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  const purchase = useCallback(async (plan: PremiumPlan) => {
    const Purchases = billingConfigured ? getPurchases() : null
    const pkg = offered.current[plan]
    if (!Purchases || !pkg) {
      setError('Şu an mağazaya ulaşamadık. Biraz sonra yeniden dener misin?')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await Purchases.purchasePackage(pkg)
      setIsPremium(hasEntitlement(result.customerInfo))
    } catch (e) {
      if (!isCancellation(e)) {
        setError('Satın alma tamamlanamadı. Mağaza hesabını kontrol edip yeniden dener misin?')
      }
    } finally {
      setBusy(false)
    }
  }, [])

  const restore = useCallback(async () => {
    const Purchases = billingConfigured ? getPurchases() : null
    if (!Purchases) return
    setBusy(true)
    setError(null)
    try {
      const info = await Purchases.restorePurchases()
      const restored = hasEntitlement(info)
      setIsPremium(restored)
      if (!restored) setError('Bu hesapta geri yüklenecek bir abonelik bulamadık.')
    } catch (e) {
      if (!isCancellation(e)) {
        setError('Geri yükleme tamamlanamadı. Biraz sonra yeniden dener misin?')
      }
    } finally {
      setBusy(false)
    }
  }, [])

  const api = useMemo<PremiumApi>(
    () => ({ isPremium, packages, busy, error, purchase, restore }),
    [busy, error, isPremium, packages, purchase, restore],
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
  return useContext(PremiumContext) ?? NOT_PREMIUM
}
