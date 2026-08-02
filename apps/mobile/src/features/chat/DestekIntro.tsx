import { Linking, Pressable, ScrollView, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'

/**
 * Consent gate before the destek conversation opens: says plainly what this
 * space is and is not, puts 112 in reach before anything else, and asks for
 * agreement to storing what gets said here.
 *
 * It asks rather than informs because what is said here can be about mental
 * health, which the data protection rules treat as a special category: a
 * privacy policy is not enough on its own. Accepting is recorded on the
 * server (a device flag cannot prove consent) and mirrored to the ftue flag
 * `chatDestekConsent2026_08` so the screen is not shown again.
 */
export function DestekIntro({
  onAccept,
  pending = false,
  failed = false,
}: {
  onAccept: () => void
  pending?: boolean
  failed?: boolean
}) {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View className="items-center pt-4">
        <AfiPose pose="sicaklik" size={120} intro="giris" />
      </View>
      <View className="gap-3 rounded-2xl bg-surface p-5">
        <AppText weight="bold" className="text-lg text-ink">
          Başlamadan önce
        </AppText>
        <AppText className="text-sm leading-relaxed text-ink">
          Burası yemekle ilişkin, duyguların ve aklından geçenler için sana ait bir alan. Seni
          dinlerim, yargılamam, acele ettirmem.
        </AppText>
        <AppText className="text-sm leading-relaxed text-ink">
          Bu sohbet iyi bir dinleyicidir ama bir terapi değildir ve bir uzmanın yerini tutmaz.
          Zorlandığın dönemde bir ruh sağlığı profesyoneliyle görüşmek her zaman iyi bir adımdır.
        </AppText>
        <AppText className="text-sm leading-relaxed text-ink">
          Acil bir durumdaysan ya da kendine zarar verme düşüncen varsa lütfen 112'yi ara ve
          güvendiğin birine haber ver.
        </AppText>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="112'yi ara"
          onPress={() => void Linking.openURL('tel:112')}
          className="self-start rounded-xl bg-muted px-4 py-2.5"
        >
          <AppText weight="semibold" className="text-sm text-ink">
            112'yi ara
          </AppText>
        </Pressable>
        <AppText className="text-xs leading-relaxed text-faint">
          Yazdıkların hesabına bağlı olarak afiet'in sunucusunda saklanıyor; böylece sohbetin
          cihaz değiştirsen de kaybolmuyor. Burada konuşulanlar ruh sağlığınla ilgili
          olabileceği için özel korumalı sayılıyor, o yüzden başlamadan önce onayını
          soruyoruz. İstediğin an silebilirsin; sildiğinde sunucudan da gider.
        </AppText>
      </View>
      {failed ? (
        /* The chat does not open without a recorded consent, so this says what
           happened and offers the only useful next move rather than a dead end. */
        <AppText className="text-center text-sm leading-relaxed text-faint">
          Onayın kaydedilemedi, bağlantını kontrol edip tekrar dener misin?
        </AppText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: pending }}
        disabled={pending}
        onPress={onAccept}
        className={`items-center rounded-2xl py-3.5 ${pending ? 'bg-emerald-600/60' : 'bg-emerald-600'}`}
      >
        <AppText weight="bold" className="text-base text-white">
          {pending ? 'Kaydediliyor…' : 'Onaylıyorum, başlayalım'}
        </AppText>
      </Pressable>
    </ScrollView>
  )
}
