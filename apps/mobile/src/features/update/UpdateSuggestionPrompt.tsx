/**
 * The dismissible half of the update gate: there is a newer build, and that is
 * all. It takes no for an answer and stops asking about the same version for a
 * few days (see decideAppUpdate), because a nudge that repeats every launch
 * stops being a nudge.
 *
 * Mounted where the release-notes sheet is, past the profile gate, and it
 * stands down for the launch when that sheet is due: somebody who just
 * updated should read what they got, not be asked to update again.
 */
import { useEffect, useState } from 'react'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { releaseNoteFor, shouldAnnounce } from '@/features/changelog/releaseNotes'
import { AfiScene } from '@/ui/maskot/AfiScene'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { openStore } from './storeLink'
import { currentAppVersion, declineUpdate } from './versionGate'
import { useUpdateVerdict } from './useUpdateVerdict'

const LAST_SEEN_VERSION_KEY = 'fh:lastSeenVersion'

export function UpdateSuggestionPrompt() {
  const verdict = useUpdateVerdict()
  const { id: profileId } = useActiveProfile()
  const [standDown, setStandDown] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [opening, setOpening] = useState(false)
  const version = currentAppVersion()

  /* Read once per launch rather than per render: the release-notes sheet marks
     the version as seen when it is closed, and re-reading after that would let
     this prompt appear the moment the other one is dismissed. */
  useEffect(() => {
    let alive = true
    void AsyncStorage.getItem(LAST_SEEN_VERSION_KEY)
      .then((lastSeen) => {
        if (!alive) return
        setStandDown(
          shouldAnnounce({ version, lastSeen, hasProfile: profileId !== null }) &&
            releaseNoteFor(version) !== undefined,
        )
      })
      .catch(() => {
        if (alive) setStandDown(false)
      })
    return () => {
      alive = false
    }
    // Deliberately once per mount; profileId settles before this host mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (verdict.kind !== 'suggested' || dismissed || standDown !== false) return null

  const decline = () => {
    setDismissed(true)
    void declineUpdate(verdict.version)
  }

  return (
    <AfiScene
      pose="selam"
      title="afiet yenilendi ✨"
      body={message(verdict.message)}
      badge={version ? `v${version} → v${verdict.version}` : `v${verdict.version}`}
      actionLabel="Güncelle"
      actionBusy={opening}
      onAction={() => {
        setOpening(true)
        void openStore(verdict.storeUrl).then(() => {
          setOpening(false)
          /* Leaving for the store counts as an answer either way: coming back
             to the same card is what makes an update feel like nagging. */
          decline()
        })
      }}
      secondaryLabel="Şimdi değil"
      onSecondary={decline}
      onClose={decline}
      confetti={false}
    />
  )
}

function message(fromServer: string | null): string {
  return fromServer ?? 'Mağazada daha yeni bir sürüm var. Hazır olduğunda alabilirsin.'
}
