import * as Haptics from 'expo-haptics'
import { useCallback, useMemo, useState } from 'react'
import { AppText } from './AppText'

/**
 * What a form is still waiting on before it can go through.
 *
 * `field` is the form's own key for whatever the message is about, so the
 * screen can mark that input or scroll to it. Nothing here interprets it.
 */
export interface FormProblem {
  /** Said to the person, in their words, naming what to do next. */
  message: string
  field?: string
}

/**
 * A primary button that answers every press.
 *
 * A button disabled because a form is incomplete tells the person nothing:
 * not what is missing, not that the app noticed the press. When the missing
 * field has scrolled out of view, which happens to any sheet taller than the
 * window, there is nothing on screen to read at all. App Review found exactly
 * that in the measurement sheet on 19 Aug 2026 and reported the app as
 * unresponsive, which is precisely how it behaved.
 *
 * So a gated button here is never drawn or wired as disabled. It takes the
 * press, and either the action runs or the form says what it is waiting on.
 * Only work already in flight disables anything, because a second press would
 * duplicate it.
 */
export function useFormGate() {
  const [problem, setProblem] = useState<FormProblem | null>(null)

  /**
   * Runs `action` when nothing is missing, and otherwise raises the first
   * thing that is. The warning haptic fires for the raise alone: a press that
   * goes through has its own answer, on screen.
   *
   * Returns what was raised, so a form that can carry the person to the field
   * (by scrolling to it, or focusing it) knows which one and when.
   */
  const attempt = useCallback(
    (find: () => FormProblem | null, action: () => void): FormProblem | null => {
      const found = find()
      if (!found) {
        setProblem(null)
        action()
        return null
      }
      setProblem(found)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      return found
    },
    [],
  )

  /** Drops the standing complaint the moment the person acts on it. */
  const clear = useCallback(() => setProblem(null), [])

  /* Kept stable so a form can depend on the gate in an effect without the
     effect re-running on every render. */
  return useMemo(
    () => ({ problem, attempt, clear, raise: setProblem }),
    [problem, attempt, clear],
  )
}

/**
 * The raised problem, where the eye already is: just above the button that
 * refused. Forms whose missing field has a line of its own (an input hint,
 * say) put the message there instead and leave this out.
 */
export function FormProblemNote({
  problem,
  className = '',
}: {
  problem: FormProblem | null
  className?: string
}) {
  if (!problem) return null
  return (
    <AppText className={`mb-3 text-center text-sm text-amber-700 dark:text-amber-300 ${className}`}>
      {problem.message}
    </AppText>
  )
}
