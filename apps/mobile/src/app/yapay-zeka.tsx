import { router, type Href } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ASSISTANTS } from '@/features/chat/assistants'
import type { AssistantId } from '@/features/chat/types'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconLock, IconSparkles } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * Yapay Zeka Merkezi: who the three assistants are, and what each one is
 * allowed to know.
 *
 * They used to be two unexplained doors in the app menu, one of them named
 * "Destek sohbeti", which is the least self-explanatory thing in the product:
 * nothing said what it was for, who was answering, or where what you typed
 * went. An assistant that reads your meals and one that is deliberately blind
 * to them cannot be told apart from a menu row, and the difference is the
 * whole reason the second one exists.
 *
 * So the doors were replaced by one that opens here. Every claim on this
 * screen is a fact about the code: what goes out is in chat/sseTransport, what
 * is kept is in chat/chatStore, and the assistants themselves are the Foundry
 * agents behind /v1/afi/sohbet.
 */

interface AgentCard {
  id: AssistantId
  /** What this one is actually for, in one line. */
  what: string
  /** What it can see. Nothing here may overstate the request. */
  sees: string
  tint: [string, string]
  plate: string
}

const AGENTS: AgentCard[] = [
  {
    id: 'afi',
    what: 'Sofra arkadaşın. Bir besini sorabilir, gününe bakabilir, uygulamayı nasıl kullanacağını öğrenebilirsin.',
    sees: 'Bugün ne kaydettiğini görür.',
    tint: ['#0284c7', '#38bdf8'],
    plate: 'bg-sky-100 dark:bg-sky-900/50',
  },
  {
    id: 'beslenme',
    what: 'Haftanın dengesine bakar, öğün fikri verir, porsiyonları konuşur.',
    sees: 'Son haftanın besin dengesini görür.',
    tint: ['#059669', '#34d399'],
    plate: 'bg-emerald-100 dark:bg-emerald-900/50',
  },
  {
    id: 'destek',
    what: 'Yemekle ilişkin, duyguların ve aklından geçenler için sana ait bir alan.',
    sees: 'Hiçbir yemek kaydını görmez. Yalnızca ona yazdıklarını okur.',
    tint: ['#7c3aed', '#a78bfa'],
    plate: 'bg-violet-100 dark:bg-violet-900/50',
  },
]

/** Facts about how this works, in the order people wonder about them. */
const HOW: { title: string; body: string }[] = [
  {
    title: 'Yazışmaların cihazında kalıyor',
    body: 'Sohbetlerin telefonunda saklanıyor. Bir sohbeti sildiğinde cihazından siliniyor; bizim tarafımızda okunabilecek bir dökümü yok.',
  },
  {
    title: 'Her sohbetin bildiği ayrı',
    body: 'Bir asistan yalnız yukarıda yazan kadarını görüyor. Destek sohbetine ne yediğin gitmiyor; bu bir tercih değil, öyle kurulu.',
  },
  {
    title: 'Cevaplar tahmindir, teşhis değildir',
    body: 'Üçü de yapay zekâ. Yanılabilirler ve hiçbiri doktor, diyetisyen ya da terapist yerine geçmez. Bir rahatsızlığın varsa uzmanına danış.',
  },
  {
    title: 'Sayı değil denge',
    body: 'Kalori saydırmıyoruz. Asistanlar da aynı dili konuşuyor: yargılamadan, el ölçüsüyle, dengeyle.',
  },
]

export default function YapayZekaScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

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
          title="Yapay Zeka Merkezi"
          subtitle="Üç asistan, ne yaptıkları ve ne gördükleri"
          icon={<IconSparkles size={24} color={isDark ? '#a78bfa' : '#7c3aed'} />}
        />

        <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-surface p-4">
          <AfiPose pose="merak" size={56} />
          <AppText className="min-w-0 flex-1 text-sm leading-5 text-soft">
            Afi tek bir asistan değil. Sofranı bilen, haftanı değerlendiren ve
            yalnızca seni dinleyen üç ayrı sohbet var; hangisine ne anlattığın
            sana kalmış 🌱
          </AppText>
        </View>

        <View className="gap-3">
          {AGENTS.map((agent) => {
            const spec = ASSISTANTS[agent.id]
            const color = agent.tint[isDark ? 1 : 0]
            return (
              <Pressable
                key={agent.id}
                accessibilityRole="button"
                accessibilityLabel={`${spec.title} sohbetini aç`}
                onPress={() => router.push(`/sohbet?asistan=${agent.id}` as Href)}
                className="rounded-2xl bg-surface p-4 active:bg-muted"
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-2xl ${agent.plate}`}
                  >
                    <AfiPose pose={spec.pose} size={34} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <AppText weight="bold" numberOfLines={1} className="text-ink">
                      {spec.title}
                    </AppText>
                    <AppText numberOfLines={1} className="text-xs text-soft">
                      {spec.subtitle}
                    </AppText>
                  </View>
                  <IconChevronRight size={18} color={t.faint} />
                </View>

                <AppText className="mt-3 text-sm leading-5 text-soft">{agent.what}</AppText>

                <View className="mt-2.5 flex-row items-center gap-2 rounded-xl bg-muted px-3 py-2">
                  <IconLock size={15} color={color} />
                  <AppText className="min-w-0 flex-1 text-xs leading-4 text-soft">
                    {agent.sees}
                  </AppText>
                </View>
              </Pressable>
            )
          })}
        </View>

        <AppText weight="extrabold" className="mb-2 mt-6 text-lg text-ink">
          Nasıl çalışıyor?
        </AppText>
        <View className="overflow-hidden rounded-2xl bg-surface">
          {HOW.map((item, index) => (
            <Fact key={item.title} title={item.title} body={item.body} first={index === 0} />
          ))}
        </View>

        <AppText className="mt-4 px-1 text-xs leading-5 text-faint">
          Sohbetlerin günlük bir sınırı var; dolduğunda asistan bunu kendi
          söylüyor ve ertesi gün yeniden açılıyor.
        </AppText>
      </ScrollView>
    </View>
  )
}

/* A render error here must not take the whole app down with it: this screen is
   pushed from the app menu, which is drawn in the overlay layer, so a throw
   would otherwise reach the root boundary rather than this route's. */
export { ScreenErrorBoundary as ErrorBoundary } from '@/ui/ScreenErrorBoundary'

function Fact({ title, body, first }: { title: string; body: string; first: boolean }): ReactNode {
  return (
    <View className={`px-4 py-3.5 ${first ? '' : 'border-t border-line/40'}`}>
      <AppText weight="bold" className="text-sm text-ink">
        {title}
      </AppText>
      <AppText className="mt-1 text-sm leading-5 text-soft">{body}</AppText>
    </View>
  )
}
