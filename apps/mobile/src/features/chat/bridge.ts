import { turkishLower } from '@afiet/core'
import type { AssistantId } from './types'

/**
 * Cross-assistant bridge: the agents are instructed to refer users verbally
 * ("bunun için beslenme sohbeti var" style). When the latest reply names
 * another conversation, the screen turns that referral into a tappable chip.
 * Deterministic on purpose: a keyword match on our own product terms, not a
 * guess about intent.
 */
const MENTIONS: { target: AssistantId; needle: string; label: string }[] = [
  { target: 'beslenme', needle: 'beslenme sohbeti', label: 'Beslenme sohbetine geç' },
  { target: 'destek', needle: 'destek sohbeti', label: 'Destek sohbetine geç' },
]

export function detectBridge(
  current: AssistantId,
  replyText: string,
): { target: AssistantId; label: string } | null {
  const haystack = turkishLower(replyText)
  for (const m of MENTIONS) {
    if (m.target !== current && haystack.includes(m.needle)) {
      return { target: m.target, label: m.label }
    }
  }
  return null
}
