/**
 * The name a sign-in provider already told us, kept for the identity form.
 *
 * Sign in with Apple hands the full name to the device once, on the first
 * authorization, and Stack Auth does not store it for us; Google's name lands
 * in Stack itself. Either way, asking the person to type a name we were just
 * given fails Apple's design guideline for Sign in with Apple (guideline 4)
 * and is simply rude. The provider name is stashed here per account before
 * the session opens, so the identity form finds it on its first render even
 * when the best-effort write to Stack is still in flight.
 */

const PREFIX = 'afiet:onboarding:known-name:v1:'
/** The identity field's own limit; a first name longer than this is truncated. */
const NAME_MAX_LENGTH = 20

function key(userId: string): string {
  return `${PREFIX}${userId}`
}

export function rememberKnownName(userId: string, fullName: string): void {
  const trimmed = fullName.trim()
  if (!trimmed) return
  try {
    localStorage.setItem(key(userId), trimmed)
  } catch {
    // Losing this only means the person is asked once; nothing else depends on it.
  }
}

export function readKnownName(userId: string): string | null {
  try {
    const value = localStorage.getItem(key(userId))
    return value && value.trim() ? value.trim() : null
  } catch {
    return null
  }
}

export function clearKnownName(userId: string | null): void {
  if (!userId) return
  try {
    localStorage.removeItem(key(userId))
  } catch {
    // Best effort.
  }
}

/**
 * How Afi addresses the person: the first name, which is what "Sana nasıl
 * seslenelim?" was asking for all along. Apple and Google give the full name;
 * a compound first name loses its second part here, and the field stays
 * editable for exactly that case.
 */
export function firstNameOf(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? ''
  return Array.from(first).slice(0, NAME_MAX_LENGTH).join('')
}
