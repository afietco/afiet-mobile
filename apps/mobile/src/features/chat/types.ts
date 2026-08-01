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
 * A photo, and only a photo. Speech is not an attachment here: the microphone
 * dictates into the field (chat/useSpeechToText), so what reaches a turn is
 * words like any other.
 *
 * Only what is needed to draw it again is kept: the file stays where the OS
 * put it and is referenced, never copied into history. The payload an upload
 * would need is deliberately absent, so a stored conversation cannot grow by
 * megabytes per photo (see ChatDraftAttachment for the composer's fuller form).
 */
export interface ChatAttachment {
  kind: 'image'
  /** Local file uri. May outlive the file itself; anything drawing it degrades. */
  uri: string
}

/**
 * The composer's attachment, before it becomes a turn: the resized JPEG that
 * an upload will need, alongside the uri that draws it.
 */
export interface ChatDraftAttachment extends ChatAttachment {
  base64?: string
}

/**
 * One conversation, as the list of them needs to know it.
 *
 * The turns live under their own key (chatStore), so opening the drawer costs
 * one small read no matter how much has been said in any of them.
 */
export interface ChatSessionMeta {
  id: string
  /** Taken from the first thing the person said in it. */
  title: string
  /** Kept at the top of the list, and exempt from the oldest-dropped cap. */
  pinned?: boolean
  /** Epoch ms of the last message either side sent. */
  updatedAt: number
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
