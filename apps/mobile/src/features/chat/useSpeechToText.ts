import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as Haptics from 'expo-haptics'

/**
 * Dictation for the chat composer: speech becomes text you can still edit.
 *
 * Not a voice message. Nothing is uploaded and no audio file is kept; the
 * device transcribes what it hears and hands back words, which land in the
 * field like anything else typed there. That is the whole reason this replaced
 * recording: the assistants read text, so a voice message could only ever be
 * an attachment nobody on the other end could open.
 *
 * The transcript arrives in pieces and is corrected as it goes: iOS and
 * Android both re-issue the whole utterance on every result, with `isFinal`
 * marking the last one. So the latest result REPLACES what is shown rather
 * than being appended to it, and only what was in the field before dictation
 * started is kept in front of it.
 */

/** Turkish, because everything the person says to Afi is in Turkish. */
const LANG = 'tr-TR'

export type SpeechPhase = 'idle' | 'listening' | 'denied'

export interface SpeechToText {
  phase: SpeechPhase
  /** What has been heard so far in this dictation; '' before the first word. */
  transcript: string
  start: () => Promise<void>
  /** Stops listening and keeps the words. */
  finish: () => void
  /** Stops listening and throws the words away. */
  cancel: () => void
  /** Clears a refusal so the button can ask again after a trip to Settings. */
  dismissDenied: () => void
  /** True when the device cannot transcribe at all (no recognizer installed). */
  unavailable: boolean
}

export function useSpeechToText(): SpeechToText {
  const [phase, setPhase] = useState<SpeechPhase>('idle')
  const [transcript, setTranscript] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  /* A cancel has to survive the events still in flight behind it: the engine
     goes on delivering the last utterance for a beat after being told to stop. */
  const keeping = useRef(true)

  useSpeechRecognitionEvent('result', (event) => {
    if (!keeping.current) return
    const said = event.results[0]?.transcript ?? ''
    setTranscript(said)
  })

  useSpeechRecognitionEvent('end', () => {
    setPhase((current) => (current === 'listening' ? 'idle' : current))
  })

  useSpeechRecognitionEvent('error', (event) => {
    /* "no-speech" is someone thinking, not a failure worth a dialog. */
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      setPhase('denied')
      return
    }
    if (event.error === 'language-not-supported' || event.error === 'audio-capture') {
      setUnavailable(true)
    }
    setPhase((current) => (current === 'listening' ? 'idle' : current))
  })

  const start = useCallback(async () => {
    let granted = false
    try {
      granted = (await ExpoSpeechRecognitionModule.requestPermissionsAsync()).granted
    } catch {
      granted = false
    }
    if (!granted) {
      setPhase('denied')
      return
    }
    try {
      keeping.current = true
      setTranscript('')
      ExpoSpeechRecognitionModule.start({
        lang: LANG,
        /* The words appear as they are said; waiting for the final result
           leaves someone talking at a field that shows nothing. */
        interimResults: true,
        /* A pause in the middle of a sentence must not end the dictation. It
           ends when the person says it does. */
        continuous: true,
        addsPunctuation: true,
      })
      setPhase('listening')
      void Haptics.selectionAsync()
    } catch {
      setPhase('idle')
      setUnavailable(true)
    }
  }, [])

  const finish = useCallback(() => {
    keeping.current = true
    try {
      ExpoSpeechRecognitionModule.stop()
    } catch {
      // Already stopped; the transcript is whatever was heard until now.
    }
    setPhase('idle')
  }, [])

  const cancel = useCallback(() => {
    keeping.current = false
    try {
      ExpoSpeechRecognitionModule.abort()
    } catch {
      // Nothing to abort.
    }
    setTranscript('')
    setPhase('idle')
  }, [])

  const dismissDenied = useCallback(() => setPhase('idle'), [])

  /**
   * Leaving the screen mid-sentence still closes the microphone.
   *
   * Backing out of a conversation is an ordinary way to abandon a dictation,
   * and the only one that never passes through a button.
   */
  const cancelRef = useRef(cancel)
  cancelRef.current = cancel
  useEffect(
    () => () => {
      cancelRef.current()
    },
    [],
  )

  return { phase, transcript, start, finish, cancel, dismissDenied, unavailable }
}
