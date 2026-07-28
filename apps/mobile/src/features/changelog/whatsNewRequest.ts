/**
 * One shot bridge from the menu to the release notes sheet.
 *
 * The menu is itself a modal, and the sheet opens in a modal host of its own so
 * it can cover the tab bar. Rendering one inside the other left the outer
 * backdrop swallowing every touch while the inner sheet sat behind it, which
 * reads as the app freezing. So the menu closes itself and asks; the prompt
 * that already lives outside every modal answers.
 */

let requested = false
const listeners = new Set<() => void>()

export function requestWhatsNew() {
  requested = true
  for (const listener of listeners) listener()
}

/** Reads the request and clears it, so it can never fire twice. */
export function consumeWhatsNewRequest(): boolean {
  const value = requested
  requested = false
  return value
}

export function onWhatsNewRequest(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
