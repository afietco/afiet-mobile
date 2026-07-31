import type { ReactNode } from 'react'
import { View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconCalendar, IconHeart } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'

/**
 * What the rhythm actually is, said once, where it is asked.
 *
 * The card leads with a total, and a total of zero is the worst sentence this
 * app can open with: "Toplam 0 hafta" announces a shortfall to somebody who
 * has not been here long enough to have one, against a rule nobody has
 * explained. Three words are doing the work of a whole system there (ritim,
 * afiyet günü, afiyet haftası) and none of them is defined anywhere the person
 * is looking.
 *
 * So the number stops being the explanation. This sheet is, and it is opened
 * on purpose from a question mark rather than pushed at anyone. The three
 * definitions are in the order they build on each other, and the last line is
 * the one that matters most: a week you do not reach costs nothing.
 */

interface RhythmInfoSheetProps {
  open: boolean
  onClose: () => void
  /** The person's own weekly goal, so the example uses their number. */
  goal?: number
}

function Term({
  icon,
  term,
  children,
}: {
  icon: ReactNode
  term: string
  children: string
}) {
  return (
    <View className="mt-4 flex-row items-start gap-3">
      <View className="mt-0.5 h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
        {icon}
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-ink">
          {term}
        </AppText>
        <AppText className="mt-0.5 text-[15px] leading-6 text-soft">{children}</AppText>
      </View>
    </View>
  )
}

export function RhythmInfoSheet({ open, onClose, goal }: RhythmInfoSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const accent = isDark ? '#34d399' : '#047857'
  const days = goal && goal > 0 ? goal : 5

  return (
    <Sheet
      name="rhythm_info"
      open={open}
      onClose={onClose}
      title={
        <>
          <IconBowl size={22} color={accent} />
          <AppText weight="bold" className="text-lg text-ink">
            Afiyet ritmi nedir?
          </AppText>
        </>
      }
    >
      <AfiPose pose="ritim" motion="nefes" intro="giris" size={64} />
      <AppText className="mt-3 text-[15px] leading-6 text-ink">
        Burada gün saymıyoruz, bir ritim kuruyoruz. Üç kelime var ve üçü
        birbirinin üstüne biniyor.
      </AppText>

      <Term icon={<IconBowl size={18} color={accent} />} term="Afiyet günü">
        {
          'Bir gün içinde en az bir öğün kaydettiysen o gün afiyet günüdür. Günün tamamını yazmak gerekmiyor; tek bir kayıt o günü sayar.'
        }
      </Term>

      <Term icon={<IconCalendar size={18} color={accent} />} term="Afiyet haftası">
        {`Bir hafta içinde kendine seçtiğin gün sayısı kadar afiyet günü topladıysan o hafta afiyet haftası olur. Şu an hedefin haftada ${String(days)} gün ve bunu Vücudum'dan değiştirebilirsin.`}
      </Term>

      <Term icon={<IconHeart size={18} color={accent} />} term="Ritim">
        {
          'Biriken afiyet haftalarının tamamı. Haftaların arka arkaya olması gerekmiyor: tuttuğun her hafta sayılır, tutmadığın hafta ise yalnızca sayılmaz.'
        }
      </Term>

      {/* The whole point of the sheet, so it is the last thing read. */}
      <View className="mt-5 rounded-2xl bg-muted p-4" style={{ borderColor: t.line }}>
        <AppText className="text-[15px] leading-6 text-soft">
          Kaçırdığın bir gün hiçbir şeyi geri almaz. Hafta içinde her güne
          yetişmeni beklemiyorum, zaten hedef yedi değil {String(days)}: kalan
          günler senin sofra payın.
        </AppText>
      </View>
    </Sheet>
  )
}
