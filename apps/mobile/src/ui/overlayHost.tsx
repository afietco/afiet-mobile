import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { BackHandler } from 'react-native'

/**
 * One layer above the whole app, where every popup is drawn.
 *
 * A popup rendered where it is triggered is bounded by whatever contains it,
 * and on a tab screen that container stops at the top of the tab bar. Three
 * things follow from that, and all three were visible in the app:
 *
 *  - the popup only ever gets the height above the bar, so a long flow runs out
 *    of room and its own action row is the first thing to go;
 *  - its dimmed backdrop stops at the same line, so the bar stays lit, fully
 *    tappable, and one tap away from leaving the popup open behind a screen it
 *    does not belong to;
 *  - the bar is a later sibling of the screen container, so it paints over
 *    anything the popup does put in that band.
 *
 * Raising the popup is the only direction that works. The bar has to stay above
 * the screens it belongs to, so no z-order trick inside a screen can lift
 * something over it without burying the bar under every screen at the same
 * time. This host is mounted once, after the navigator, and popups render into
 * it: above the bar by construction, with the whole window to measure
 * themselves against.
 *
 * A native `Modal` clears the bar too, and that is what a couple of popups here
 * used to do one at a time. It does not generalise: iOS presents a modal on the
 * nearest view controller with no queue and no check, so two of them as
 * siblings mean the second is silently refused and simply never appears.
 * Everything in this host is ordinary React, so popups coexist and stack.
 *
 * One consequence worth knowing before debugging one: a popup no longer renders
 * inside the route that opened it, so a throw while rendering one is caught by
 * AppErrorBoundary rather than by that route's ErrorBoundary. Louder than it
 * was, and deliberately not swallowed here: a popup that quietly renders
 * nothing is a button that does nothing, which is the failure this app has
 * spent the most time getting away from.
 */

interface OverlayEntry {
  key: string
  node: ReactNode
}

interface OverlayHostApi {
  /** Adds the entry, or replaces the node of one already in the stack. */
  put: (key: string, node: ReactNode) => void
  /** Moves the entry to the front of the stack. */
  raise: (key: string) => void
  remove: (key: string) => void
}

const OverlayHostContext = createContext<OverlayHostApi | null>(null)

/**
 * Mounted once, from the root layout, around the whole app.
 *
 * Entries render after `children`, so they paint above every screen and above
 * the tab bar. Later in the list means further to the front.
 */
export function OverlayHost({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<OverlayEntry[]>([])

  const api = useMemo<OverlayHostApi>(
    () => ({
      put: (key, node) =>
        setEntries((current) => {
          const index = current.findIndex((entry) => entry.key === key)
          if (index === -1) return [...current, { key, node }]
          const next = current.slice()
          next[index] = { key, node }
          return next
        }),
      raise: (key) =>
        setEntries((current) => {
          const index = current.findIndex((entry) => entry.key === key)
          if (index === -1 || index === current.length - 1) return current
          const next = current.slice()
          const [entry] = next.splice(index, 1)
          next.push(entry)
          return next
        }),
      remove: (key) =>
        setEntries((current) =>
          current.some((entry) => entry.key === key)
            ? current.filter((entry) => entry.key !== key)
            : current,
        ),
    }),
    [],
  )

  /* `children` is the same element on a state change here, so React skips the
     whole app subtree and only the entries below it are reconciled. */
  return (
    <OverlayHostContext.Provider value={api}>
      {children}
      {entries.map((entry) => (
        <Fragment key={entry.key}>{entry.node}</Fragment>
      ))}
    </OverlayHostContext.Provider>
  )
}

interface OverlayProps {
  /**
   * The popup's own idea of being open.
   *
   * Becoming active moves the entry to the front, so a popup opened from inside
   * another one is the one in front whatever order the two were mounted in.
   * Public profiles, for instance, are mounted at app start and can be opened
   * from a sheet belonging to a screen mounted much later.
   */
  active?: boolean
  /**
   * Android hardware back while active. Without it, back leaves the route and
   * takes the screen behind the popup with it.
   */
  onRequestClose?: () => void
  children: ReactNode
}

/**
 * Draws its children in the host instead of where it sits.
 *
 * The component itself still runs where it was written, so its hooks see the
 * tree it belongs to: navigation, insets and the screen's own context all read
 * the way the author expects. Only the rendered output moves.
 */
export function Overlay({ active = true, onRequestClose, children }: OverlayProps) {
  const host = useContext(OverlayHostContext)
  const key = useId()

  useEffect(() => {
    host?.put(key, children)
  }, [children, host, key])

  useEffect(() => () => host?.remove(key), [host, key])

  useEffect(() => {
    if (active) host?.raise(key)
  }, [active, host, key])

  useEffect(() => {
    if (!active || !onRequestClose) return
    /* Handlers are called last-registered first, and a popup registers when it
       opens, so the one in front is the one that answers. */
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose()
      return true
    })
    return () => subscription.remove()
  }, [active, onRequestClose])

  /* Without a host there is nowhere above the app to draw, and a popup that
     renders nothing at all is worse than one that renders in place: falling
     back keeps it usable wherever the provider is missing. */
  if (!host) return <>{children}</>
  return null
}
