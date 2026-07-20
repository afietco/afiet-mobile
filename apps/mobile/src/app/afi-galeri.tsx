import { Redirect } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/theme/useTheme'
import { AfiPose, type AfiMotion, type AfiPoseName } from '@/ui/maskot'
import { AppText } from '@/ui/AppText'
import { ScreenHeader } from '@/ui/ScreenHeader'

/* Afi maskot galerisi; afiet-brand/maskot/afi-maskot.html'in uygulama içi
   karşılığı. Pozların ve hareketlerin gerçek cihazda nasıl durduğunu görmek
   için var; YALNIZCA geliştirmede açılır, üretimde Bugün'e döner. */

const POSES: { pose: AfiPoseName; note: string }[] = [
  { pose: 'temel', note: 'Bugün, genel bekleme' },
  { pose: 'selam', note: 'onboarding, karşılama' },
  { pose: 'kutlama', note: 'ilk kayıt, hafta tamam' },
  { pose: 'merak', note: 'boş durumlar' },
  { pose: 'uyku', note: 'akşam özeti, gece' },
  { pose: 'aile', note: 'grup, davet' },
  { pose: 'su', note: 'su bölümü' },
  { pose: 'kasik', note: 'ilk kayıt boş durumu' },
  { pose: 'oops', note: 'hata (yüz üzülmez)' },
  { pose: 'mini', note: '32 px ve altı' },
]

const MOTIONS: { motion: AfiMotion; label: string; pose: AfiPoseName }[] = [
  { motion: 'idle', label: 'idle', pose: 'temel' },
  { motion: 'gunaydin', label: 'günaydın', pose: 'temel' },
  { motion: 'selam', label: 'selam', pose: 'selam' },
  { motion: 'zipla', label: 'zıplama', pose: 'kutlama' },
  { motion: 'zafer', label: 'zafer', pose: 'kutlama' },
  { motion: 'yukleniyor', label: 'yükleniyor', pose: 'temel' },
  { motion: 'heyecan', label: 'heyecan', pose: 'temel' },
  { motion: 'peek', label: 'peek', pose: 'merak' },
  { motion: 'uyku', label: 'uyku', pose: 'uyku' },
  { motion: 'aile', label: 'aile', pose: 'aile' },
  { motion: 'pop', label: 'pop', pose: 'temel' },
]

function Cell({
  children,
  label,
  note,
}: {
  children: React.ReactNode
  label: string
  note?: string
}) {
  return (
    <View className="mb-3 w-[48%] items-center rounded-2xl bg-surface p-3">
      <View className="h-28 w-28 items-center justify-center">{children}</View>
      <AppText weight="bold" className="mt-1 text-sm text-ink">
        {label}
      </AppText>
      {note ? (
        <AppText className="text-center text-xs text-soft">{note}</AppText>
      ) : null}
    </View>
  )
}

export default function AfiGaleriScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()

  if (!__DEV__) return <Redirect href="/" />

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader
          title="Afi galerisi"
          subtitle={`Tema: ${isDark ? 'koyu' : 'açık'}`}
        />

        <AppText className="mb-3 text-sm text-soft">
          Koyu zeminde uzun tel beyaza döner, kontur kalkar. reduceMotion açıkken
          hepsi statik pozunda durur.
        </AppText>

        <AppText weight="bold" className="mb-2 mt-2 text-lg text-ink">
          Pozlar
        </AppText>
        <View className="flex-row flex-wrap justify-between">
          {POSES.map((p) => (
            <Cell key={p.pose} label={p.pose} note={p.note}>
              <AfiPose pose={p.pose} size={p.pose === 'mini' ? 32 : 96} />
            </Cell>
          ))}
        </View>

        <AppText weight="bold" className="mb-2 mt-4 text-lg text-ink">
          Hareketler
        </AppText>
        <View className="flex-row flex-wrap justify-between">
          {MOTIONS.map((m) => (
            <Cell key={m.motion} label={m.label} note={m.pose}>
              <AfiPose pose={m.pose} motion={m.motion} size={96} />
            </Cell>
          ))}
        </View>

        <AppText weight="bold" className="mb-2 mt-4 text-lg text-ink">
          Boy merdiveni
        </AppText>
        <View className="flex-row flex-wrap items-end gap-4 rounded-2xl bg-surface p-4">
          {[128, 96, 64, 48].map((s) => (
            <View key={s} className="items-center">
              <AfiPose pose="temel" size={s} />
              <AppText className="text-xs text-soft">{s}</AppText>
            </View>
          ))}
          {[32, 24].map((s) => (
            <View key={`mini-${s}`} className="items-center">
              <AfiPose pose="mini" size={s} />
              <AppText className="text-xs text-soft">mini {s}</AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
