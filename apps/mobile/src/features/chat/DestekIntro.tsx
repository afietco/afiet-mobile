import { Linking, Pressable, ScrollView, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'

/**
 * One-time gate before the destek conversation opens: says plainly what this
 * space is and is not, and puts 112 in reach before anything else. Accepting
 * is remembered per account (ftue flag `chatDestekIntroSeen`).
 */
export function DestekIntro({ onAccept }: { onAccept: () => void }) {
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
        <AppText className="text-xs text-faint">
          Yazdıkların yalnızca bu cihazda saklanır; istediğin an silebilirsin.
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAccept}
        className="items-center rounded-2xl bg-emerald-600 py-3.5"
      >
        <AppText weight="bold" className="text-base text-white">
          Anladım, başlayalım
        </AppText>
      </Pressable>
    </ScrollView>
  )
}
