/**
 * Chat with the three assistants (afi, beslenme, destek). Assistant ids are
 * product surface: they appear in the route param (sohbet?asistan=...) and in
 * stored history keys, so they stay Turkish while code identifiers stay English.
 */
export type AssistantId = 'afi' | 'beslenme' | 'destek'

export const ASSISTANT_IDS: AssistantId[] = ['afi', 'beslenme', 'destek']

export function isAssistantId(value: string | undefined): value is AssistantId {
  return value != null && (ASSISTANT_IDS as string[]).includes(value)
}

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Local YYYY-MM-DD, matches the app-wide date convention. */
  date: string
  /** The service could not be reached; bubble renders the offline pose. */
  offline?: boolean
}

/**
 * Transport seam: phase 1 ships a scripted mock, phase 3 swaps in the real
 * SSE client without touching the screen. Tokens arrive incrementally via
 * onToken; the resolved string is the full reply (used for history).
 */
export interface ChatTransport {
  send(input: {
    assistant: AssistantId
    history: ChatTurn[]
    text: string
    onToken: (token: string) => void
    signal?: AbortSignal
  }): Promise<string>
}
