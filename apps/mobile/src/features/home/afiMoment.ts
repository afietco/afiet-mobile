import type { AfiMotion, AfiPoseName } from '@/ui/maskot'

/**
 * What Afi says on Today.
 *
 * Afi is the one at the table who is glad you came, so the note reads the day
 * and answers it: it celebrates what closed, keeps company at night, invites
 * when the table is still empty and names what is still open. It never counts,
 * never scolds and never dramatises a gap (BRAND.md voice rules, docs/09
 * invariants).
 *
 * Everything true right now is collected, in the order it should be read, and
 * the note cycles through it. The conditions are written to be independent, so
 * a moment can never contradict another one in the same list.
 *
 * Scope is deliberately *today*. The weekly rhythm has its own celebration
 * when the week closes; a note that congratulated the week would then repeat
 * itself for the rest of it.
 *
 * Pure on purpose: the whole set is decided here so every state can be unit
 * tested, and the screen only renders what comes back.
 */

/** Accent family for the note; mirrors the section colours used on Today. */
export type AfiAccent = 'emerald' | 'sky' | 'amber' | 'violet'

export interface AfiMoment {
  /** Stable id: React key and tests both read this. */
  key: string
  pose: AfiPoseName
  motion: AfiMotion
  line: string
  accent: AfiAccent
  /** The one thing worth doing right now, or null when Afi only keeps company. */
  action: 'meal' | null
}

export interface AfiMomentInput {
  /** Local hour, 0-23. */
  hour: number
  /** Meals logged today, known and unknown together. */
  mealsToday: number
  /** Core food groups still missing today; empty once all five are covered. */
  missingGroups: string[]
  /** Sweet and fast food entries logged today. */
  sweetCount: number
  fastfoodCount: number
  waterGlasses: number
  /** Personal glass target; 0 or NaN means the target is not known yet. */
  waterTarget: number
  /** Consecutive days with a record, ending today or yesterday. */
  streak: number
  /**
   * Nothing has ever been logged. The nutrition hero already carries Afi and
   * its own invitation on that screen, so the note stands down rather than
   * putting two mascots on one page.
   */
  neverLogged: boolean
}

/**
 * How each core group is invited to the table. Written out per group because
 * Turkish suffixes do not survive being generated from the label.
 */
const GROUP_INVITE: Record<string, string> = {
  sebze: 'sebzeye',
  meyve: 'meyveye',
  protein: 'proteine',
  tahil: 'tahıla',
  sut: 'süt ürününe',
}

/** Night starts here; before this Afi stays awake with you. */
const NIGHT_FROM = 22
const NIGHT_UNTIL = 5
const MORNING_UNTIL = 11
/** Below this a run is not yet a rhythm worth naming. */
const RHYTHM_FROM = 3

const count = (value: number) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 0)

/** A target only counts once the backend has actually sent one. */
const hasTarget = (value: number) => Number.isFinite(value) && value > 0

/**
 * Everything Afi can truthfully say about today, in reading order.
 *
 * Empty exactly when the note should not appear at all: before the first ever
 * record, where the nutrition hero already carries Afi and its own invitation.
 */
export function collectAfiMoments(input: AfiMomentInput): AfiMoment[] {
  if (input.neverLogged) return []

  const hour = Number.isFinite(input.hour) ? Math.min(23, Math.max(0, Math.floor(input.hour))) : 12
  const meals = count(input.mealsToday)
  const glasses = count(input.waterGlasses)
  const streak = count(input.streak)
  const sweetish = count(input.sweetCount) + count(input.fastfoodCount)
  const night = hour >= NIGHT_FROM || hour < NIGHT_UNTIL
  const morning = hour >= NIGHT_UNTIL && hour <= MORNING_UNTIL

  /* Unknown group keys still count as a gap (the catalogue can grow ahead of
     the app), they just cannot be named in the invitation. */
  const gaps = Math.min(5, Math.max(0, input.missingGroups.length))
  const invitation = input.missingGroups.map((group) => GROUP_INVITE[group]).find(Boolean)

  const waterKnown = hasTarget(input.waterTarget)
  const waterGap = waterKnown ? Math.max(0, input.waterTarget - glasses) / input.waterTarget : 0

  const moments: AfiMoment[] = []

  // Every core group made it to the plate. That leads, whatever else is true.
  if (meals > 0 && gaps === 0) {
    moments.push(
      waterKnown && waterGap === 0
        ? {
            key: 'denge-ve-su',
            pose: 'kutlama',
            motion: 'zafer',
            line: 'Beş grup da, suyun da tamam. Afiyet olsun! 🌟',
            accent: 'emerald',
            action: null,
          }
        : {
            key: 'denge-tamam',
            pose: 'kutlama',
            motion: 'zipla',
            line: 'Bugün beş grubun hepsi sofrandaydı. Afiyet olsun! 🌟',
            accent: 'emerald',
            action: null,
          },
    )
  }

  // Late night: the day is done either way, so nothing is asked of you.
  if (night) {
    moments.push(
      meals > 0
        ? {
            key: 'gece-dolu',
            pose: 'uyku',
            motion: 'uyku',
            line: 'Sofran doluydu, gün kapandı. İyi geceler 🌙',
            accent: 'violet',
            action: null,
          }
        : {
            key: 'gece-sessiz',
            pose: 'uyku',
            motion: 'uyku',
            line: 'Bugün sessiz geçti. Yarın yeni bir sofra kurarız 🌙',
            accent: 'violet',
            action: null,
          },
    )
  }

  if (!night && meals === 0) {
    if (morning) {
      moments.push({
        key: 'gunaydin',
        pose: 'selam',
        motion: 'gunaydin',
        line: 'Günaydın! Kahvaltı sofraya gelince buradayım.',
        accent: 'amber',
        action: 'meal',
      })
    } else {
      // A run in progress is worth saying out loud; the invitation is the same.
      moments.push(
        streak >= RHYTHM_FROM
          ? {
              key: 'sofra-bekliyor-ritim',
              pose: 'merak',
              motion: 'idle',
              line: `${String(streak)} gündür sofrandasın. Bugünün kaydını da bekliyorum 🌱`,
              accent: 'emerald',
              action: 'meal',
            }
          : {
              key: 'sofra-bekliyor',
              pose: 'merak',
              motion: 'idle',
              line: 'Sofran seni bekliyor. Bugün ne yedin? 🍲',
              accent: 'emerald',
              action: 'meal',
            },
      )
    }
  }

  // What is still open on the plate, named without a verdict.
  if (!night && meals > 0 && gaps > 0) {
    moments.push({
      key: 'denge-eksik',
      pose: 'merak',
      motion: 'idle',
      line: invitation
        ? `Bugün ${invitation} yer açılır mı? 🌿`
        : 'Bugün tabağa bir renk daha eklemeye ne dersin? 🌿',
      accent: 'emerald',
      action: 'meal',
    })
  }

  if (!night && waterKnown && waterGap > 0) {
    moments.push(
      glasses === 0
        ? {
            key: 'su-yok',
            pose: 'su',
            motion: 'idle',
            line: 'Bir bardak suya ne dersin? 💧',
            accent: 'sky',
            action: null,
          }
        : {
            key: 'su-devam',
            pose: 'su',
            motion: 'idle',
            line: `Suyun ${String(glasses)} bardak. Yanına bir tane daha güzel gider 💧`,
            accent: 'sky',
            action: null,
          },
    )
  }

  // A sweet day is a day, not a mistake.
  if (!night && meals > 0 && sweetish >= 2) {
    moments.push({
      key: 'tatli-gunu',
      pose: 'temel',
      motion: 'idle',
      line: 'Bugün tatlı ağır bastı, olur böyle. Sofrada renge hep yer var.',
      accent: 'amber',
      action: 'meal',
    })
  }

  // Consistency across days closes the note, at any hour.
  if (meals > 0 && streak >= RHYTHM_FROM) {
    moments.push({
      key: 'ritim',
      pose: 'kutlama',
      motion: 'zipla',
      line: `${String(streak)} gündür sofrandasın. Ritmin güzel 🌱`,
      accent: 'emerald',
      action: null,
    })
  }

  return moments
}
