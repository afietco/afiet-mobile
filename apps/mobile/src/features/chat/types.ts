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

/**
 * What a turn carried besides its words.
 *
 * Only what is needed to draw it again: the file itself stays where the OS put
 * it and is referenced, never copied into history. The image payload an upload
 * would need is deliberately absent, so a stored conversation cannot grow by
 * megabytes per photo (see ChatDraftAttachment for the composer's fuller form).
 */
export interface ChatAttachment {
  kind: 'image' | 'audio'
  /** Local file uri. May outlive the file itself; anything drawing it degrades. */
  uri: string
  /** Audio only. */
  durationMs?: number
}

/**
 * The composer's attachment, before it becomes a turn.
 *
 * Carries the upload representation as well: the resized JPEG for a photo, and
 * for audio nothing yet, because the file is not read into memory until there
 * is somewhere to send it.
 */
export interface ChatDraftAttachment extends ChatAttachment {
  base64?: string
}

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Local YYYY-MM-DD, matches the app-wide date convention. */
  date: string
  /** The service could not be reached; bubble renders the offline pose. */
  offline?: boolean
  /** A server notice (e.g. daily limit), rendered plainly; not conversation. */
  notice?: boolean
  /** A photo or a voice message the person attached to their own turn. */
  attachment?: ChatAttachment
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
