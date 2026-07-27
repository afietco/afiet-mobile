import type { AfiMotion, AfiPoseName } from '@/ui/maskot'
import type { AddFoodStep, AfiCue } from './contract'

/**
 * Afi's script for the wizard.
 *
 * Afi is the guide walking the user through the three decisions, so every step
 * gets its own stance and its own single line. Steps may push a cue of their
 * own through `onCue` (thinking, found it, photo route); these are what the
 * host falls back to.
 *
 * Copy rules from BRAND.md: sen dili, invitation instead of instruction, no
 * counting language, nothing that frames a missing entry as a failure.
 */

export const STEP_CUES: Record<AddFoodStep, AfiCue> = {
  meal: { pose: 'selam', line: 'Hangi öğüne yazalım?' },
  search: { pose: 'arama', line: 'Ne yedin? Yazmaya başla, birlikte bulalım.' },
  details: { pose: 'kasik', line: 'Ne kadar yedin? Kendi ölçünle söyle yeter.' },
}

/** Afi while the entry is being written. */
export const SAVING_CUE: AfiCue = { pose: 'dusunuyor', line: 'Sofrana yazıyorum…' }

/** Afi the moment the entry lands. */
export const SAVED_CUE: AfiCue = { pose: 'kutlama', line: 'Afiyet olsun! 🎉' }

/** Afi when the write did not go through; an invitation, never a reprimand. */
export const SAVE_ERROR_CUE: AfiCue = {
  pose: 'oops',
  line: 'Şimdi olmadı. Birazdan birlikte tekrar deneriz.',
}

/** Afi while the photo route is open above the wizard. */
export const PHOTO_CUE: AfiCue = { pose: 'foto', line: 'Fotoğrafı çek, ben tanıyayım.' }

/**
 * The motion each stance moves with. Poses carry a sensible default motion of
 * their own, so this table only names the ones the wizard wants read
 * differently: a wave to greet, a beat to confirm, a sway while thinking.
 */
const POSE_MOTION: Partial<Record<AfiPoseName, AfiMotion>> = {
  selam: 'selam',
  arama: 'nefes',
  kasik: 'nabiz',
  buldum: 'nabiz',
  dusunuyor: 'sallanma',
  foto: 'nefes',
}

/** Undefined leaves the pose on its own default motion. */
export function cueMotion(pose: AfiPoseName): AfiMotion | undefined {
  return POSE_MOTION[pose]
}

/** Two cues are the same stance when both the pose and the line match. */
export function sameCue(a: AfiCue, b: AfiCue): boolean {
  return a.pose === b.pose && a.line === b.line
}
