import { useTheme } from '@/theme/useTheme'
import { IconBowl } from '@/ui/icons'
import { AfiScene } from '@/ui/maskot/AfiScene'

/* Native first-log celebration; the shared scene lives in ui/maskot/AfiScene.tsx. */

interface FirstLogCelebrationProps {
  foodName: string
  onClose: () => void
}

/**
 * One-time full-screen celebration for the first meal ever logged.
 *
 * It used to carry the push permission primer on its back. That question now
 * belongs to the end of onboarding (app/onboarding.tsx), where the account it
 * would notify actually exists: asking here meant asking a person who had not
 * signed up yet whether they wanted to hear from us later.
 */
export function FirstLogCelebration({ foodName, onClose }: FirstLogCelebrationProps) {
  const { isDark } = useTheme()

  return (
    <AfiScene
      pose="kutlama"
      motion="zipla"
      size={120}
      title="Afiyet olsun!"
      body={`“${foodName}” ile ilk kaydını yaptın. Bir günde en az bir öğün kaydettiğinde o gün afiyet günü olur, ve bu senin ilkin.`}
      /* Not "bu hafta 1/5". This scene fires on the first log EVER
         (useAddFoodFlow's `firstEver`), and a weekly counter at that moment
         answers a question nobody has yet: it names a target of five before
         the person has finished their first day, and reads as four still owed
         rather than as one done. The milestone is the milestone. */
      badge="İlk afiyet günün"
      badgeIcon={<IconBowl size={18} color={isDark ? '#6ee7b7' : '#047857'} />}
      actionLabel="Devam ✨"
      onAction={onClose}
      onClose={onClose}
    />
  )
}
