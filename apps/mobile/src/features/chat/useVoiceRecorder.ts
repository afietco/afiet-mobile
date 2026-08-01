import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio'
import { useCallback, useState } from 'react'
import * as Haptics from 'expo-haptics'
import type { ChatDraftAttachment } from './types'

/**
 * Recording a voice message, as the composer needs it.
 *
 * The recorder itself is a native object with a lifetime of its own, so this
 * hook owns exactly three things around it: whether the microphone was refused
 * (which is a different screen, not an error), the live duration, and the rule
 * that a recording too short to contain a word is a slip rather than a message.
 *
 * The audio session is handed back after every recording. On iOS a session left
 * in recording mode routes later playback to the earpiece, which is how a
 * feature nobody used makes every other sound in the app quiet and strange.
 */

/** Below this a recording is a mis-tap, not a message. */
const MIN_MS = 700

export type VoiceRecorderPhase = 'idle' | 'recording' | 'denied'

export interface VoiceRecorder {
  phase: VoiceRecorderPhase
  /** Milliseconds recorded so far; 0 unless recording. */
  elapsedMs: number
  start: () => Promise<void>
  /** Ends the recording and returns it, or null if there was nothing worth keeping. */
  finish: () => Promise<ChatDraftAttachment | null>
  cancel: () => Promise<void>
  /** Clears a refusal so the button can ask again after a trip to Settings. */
  dismissDenied: () => void
}

export function useVoiceRecorder(): VoiceRecorder {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const state = useAudioRecorderState(recorder, 200)
  const [phase, setPhase] = useState<VoiceRecorderPhase>('idle')

  /* Both endings share this: the session goes back to playback, and the phase
     returns to idle whether or not the native stop resolved cleanly. */
  const release = useCallback(async () => {
    try {
      await recorder.stop()
    } catch {
      // Already stopped, or never started; nothing left to do either way.
    }
    await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined)
    setPhase('idle')
  }, [recorder])

  const start = useCallback(async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync()
    if (!permission.granted) {
      setPhase('denied')
      return
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await recorder.prepareToRecordAsync()
      recorder.record()
      setPhase('recording')
      void Haptics.selectionAsync()
    } catch {
      await release()
    }
  }, [recorder, release])

  const finish = useCallback(async (): Promise<ChatDraftAttachment | null> => {
    /* Read before stopping: the recorder resets its clock on the way down, and
       the polled state can be up to one interval behind. */
    const durationMs = Math.round(recorder.currentTime * 1000)
    await release()
    const uri = recorder.uri
    if (!uri || durationMs < MIN_MS) return null
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    return { kind: 'audio', uri, durationMs }
  }, [recorder, release])

  const cancel = useCallback(async () => {
    await release()
  }, [release])

  return {
    phase,
    elapsedMs: phase === 'recording' ? state.durationMillis : 0,
    start,
    finish,
    cancel,
    dismissDenied: useCallback(() => setPhase('idle'), []),
  }
}

/** "0:07", the only shape a voice message length ever takes here. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes)}:${seconds.toString().padStart(2, '0')}`
}
