import { router } from 'expo-router'
import { useState } from 'react'
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePremium, type PremiumPlan } from '@/features/premium/usePremium'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck, IconChevronRight } from '@/ui/icons'
import { DemiPose, SiniPose } from '@/ui/maskot/sofra'

/**
 * The offer, and the two doors in the app that had nowhere to go.
 *
 * Logging a meal, the balance plate,
 * the rhythm, the league and the table cloth stay free forever, and saying so
 * on this screen is not modesty: the whole product argument is that the health
 * loop must never have a price on it, so the screen that asks for money is the
 * one place that has to prove it.
 *
 * What premium sells is access rather than an allowance: Sini and Demi, the two
 * assistants that are not free. It used to sell a bigger weekly purse, which
 * meant the screen had to quote a number and the app had to display that number
 * everywhere for the promise to be checkable. The purse is gone; what is bought
 * is now a door, and a door needs no arithmetic.
 *
 * What is free is not negotiable and is named on this screen: logging, balance,
 * rhythm, the league, the cloth, general Afi, and recognising food from a photo.
 * The wall is in exactly one place: the two assistants themselves, which open
 * only with afiet+ (14 Aug decision). Afi answers three times a day for free.
 *
 * Nothing here is a locked door with a price on it. Free is a real product and
 * this is an invitation, in the tone the app uses when something runs out.
 *
 * No telemetry yet, deliberately. The funnel this screen sits at the end of is
 * worth measuring, but an event name has to exist in three places at once (this
 * client, the server whitelist and the column's enum), so it arrives with the
 * slice that adds the server side rather than as a call that gets rejected.
 */

/** Every claim below is a thing the app does today. Nothing forthcoming. */
const INCLUDED = [
  'Sini ile haftanın dengesini konuşursun: eksik grup, öğün fikri, porsiyon.',
  'Demi ile yemekle ilişkini konuşursun; acelesi olmayan, yargılamayan bir alan.',
  'Kaydın, dengen, ritmin, ligin, Afi ve fotoğraftan besin tanıma ücretsiz kalmaya devam eder.',
]

export default function PremiumScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { isPremium, packages, busy, error, purchase, restore } = usePremium()
  /* What somebody tapped, which is nothing until they tap. The plan the button
     actually buys is derived below, because this screen does not get to decide
     which plans exist: the store does, and it has shipped an offering missing
     one of them (14 Aug, the annual package was absent from `default`).

     Holding 'annual' here instead made the preference outlive the offer. With
     no annual package the selection matched no card, every card drew unselected,
     and the button called purchase('annual') for a package that was not there.
     The one control that takes money answered "mağazaya ulaşamadık" every
     time, on a screen that otherwise looked fine. */
  const [chosen, setChosen] = useState<PremiumPlan | null>(null)

  /* Annual first, because the year is the plan that actually keeps people fed:
     it is chosen by most of the category and holds on to them far longer. It is
     a preference among what exists, not a promise that it does. */
  const selected =
    packages.find((p) => p.plan === chosen) ??
    packages.find((p) => p.plan === 'annual') ??
    packages[0]
  const plan = selected?.plan ?? 'annual'

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="mb-2 flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
          >
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <IconChevronRight size={20} color={t.faint} />
            </View>
          </Pressable>
        </View>

        {/* The two characters it buys, rather than Afi, who is free. The
            headline and the store listing have to promise the same thing:
            App Review reads both and a mismatch is a 3.1.2 rejection. */}
        <View className="items-center px-2 pb-1">
          <View className="flex-row items-end justify-center gap-1">
            <SiniPose size={92} />
            <DemiPose size={92} />
          </View>
          <AppText weight="extrabold" className="mt-2 text-center text-2xl text-ink">
            afiet+
          </AppText>
          <AppText className="mt-1.5 text-center text-sm leading-6 text-soft">
            Sini ve Demi sana açılır. Kaydın, dengen, ritmin, ligin ve Afi
            ücretsiz kalmaya devam eder 🌿
          </AppText>
        </View>

        {isPremium ? (
          <ThankYou />
        ) : (
          <>
            <View className="mt-5 gap-2.5 rounded-2xl bg-surface p-4">
              {INCLUDED.map((line) => (
                <View key={line} className="flex-row items-start gap-2.5">
                  <View className="mt-0.5">
                    <IconCheck size={17} color={isDark ? '#34d399' : '#059669'} strokeWidth={2.6} />
                  </View>
                  <AppText className="min-w-0 flex-1 text-sm leading-5 text-ink">{line}</AppText>
                </View>
              ))}
            </View>

            <View className="mt-4 gap-2.5">
              {packages.map((pkg) => (
                <PlanCard
                  key={pkg.plan}
                  selected={pkg.plan === plan}
                  onPress={() => setChosen(pkg.plan)}
                  title={pkg.plan === 'annual' ? 'Yıllık' : 'Aylık'}
                  price={pkg.intro ? pkg.intro.price : pkg.price}
                  suffix={pkg.plan === 'annual' ? '/yıl' : '/ay'}
                  note={
                    pkg.intro
                      ? `${pkg.intro.note}, sonra ${pkg.price}/yıl`
                      : pkg.perMonth
                        ? `ayda ${pkg.perMonth}`
                        : null
                  }
                  badge={pkg.intro ? 'İlk yıl' : pkg.perMonth ? null : null}
                  isDark={isDark}
                />
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${plan === 'annual' ? 'Yıllık' : 'Aylık'} premium'a geç`}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => void purchase(plan)}
              className={`mt-4 items-center rounded-2xl px-4 py-4 ${
                busy ? 'bg-emerald-600/60' : 'bg-emerald-600 active:opacity-90'
              }`}
            >
              <AppText weight="bold" className="text-base text-white">
                {busy ? 'Bir saniye…' : 'Premium ile devam et'}
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Satın alımlarımı geri yükle"
              disabled={busy}
              onPress={() => void restore()}
              className="mt-2 items-center rounded-2xl px-4 py-3 active:bg-muted"
            >
              <AppText weight="semibold" className="text-sm text-soft">
                Satın alımlarımı geri yükle
              </AppText>
            </Pressable>

            {/* A purchase that fails silently reads as an app that took the
                money. Whatever went wrong gets one plain sentence here. */}
            {error ? (
              <AppText
                accessibilityRole="alert"
                className="mt-2 px-1 text-center text-xs leading-5 text-rose-600"
              >
                {error}
              </AppText>
            ) : null}

            {/* App Review asks for the length, the price and the renewal in
                plain words on the screen itself, next to the button that
                charges. Reading it should also be enough to know how to stop. */}
            <AppText className="mt-3 px-1 text-center text-xs leading-5 text-faint">
              {selected?.plan === 'annual'
                ? 'Yıllık abonelik, her yıl kendiliğinden yenilenir.'
                : 'Aylık abonelik, her ay kendiliğinden yenilenir.'}{' '}
              Ücret onayladığın anda mağaza hesabından tahsil edilir. Dilediğin
              zaman mağaza ayarlarından iptal edebilirsin; iptal etmezsen dönem
              bitmeden yenilenir.
            </AppText>
          </>
        )}

        <View className="mt-3 flex-row items-center justify-center gap-3">
          <LegalLink label="Gizlilik" url="https://afiet.co/gizlilik" />
          <AppText className="text-xs text-faint">·</AppText>
          {/* Both pages are live and answer 200. App Review 3.1.2 looks for
              this link here AND on the store listing, and a 404 on either is a
              rejection; checked again before every submission. */}
          <LegalLink label="Kullanım Koşulları" url="https://afiet.co/kosullar" />
          <AppText className="text-xs text-faint">·</AppText>
          <LegalLink
            label="Aboneliğimi yönet"
            url={
              Platform.OS === 'ios'
                ? 'https://apps.apple.com/account/subscriptions'
                : 'https://play.google.com/store/account/subscriptions'
            }
          />
        </View>
      </ScrollView>
    </View>
  )
}

function ThankYou() {
  return (
    <View className="mt-5 rounded-2xl bg-emerald-600 p-4 dark:bg-emerald-700">
      <AppText weight="bold" className="text-base text-white">
        Premium'dasın 🌿
      </AppText>
      {/* Names what was bought rather than a quantity. The weekly purse it
          used to count is gone from the app, and a number nothing displays any
          more would be a promise with nowhere to check it. */}
      <AppText className="mt-1 text-sm leading-5 text-emerald-50/90">
        Sini ve Demi artık sana açık. Afi, kaydın ve dengen zaten ücretsizdi,
        öyle kalıyor.
      </AppText>
    </View>
  )
}

function PlanCard({
  selected,
  onPress,
  title,
  price,
  suffix,
  note,
  badge,
  isDark,
}: {
  selected: boolean
  onPress: () => void
  title: string
  price: string
  suffix: string
  note: string | null
  badge: string | null
  isDark: boolean
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title} plan, ${price}${suffix}${note ? `, ${note}` : ''}`}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border-2 p-4 ${
        selected
          ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/60'
          : 'border-transparent bg-surface active:opacity-80'
      }`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-emerald-600 dark:border-emerald-400' : 'border-line'
        }`}
      >
        {selected ? (
          <View className="h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
        ) : null}
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <AppText weight="bold" className="text-base text-ink">
            {title}
          </AppText>
          {badge ? (
            <View className="rounded-full bg-emerald-600 px-2 py-0.5 dark:bg-emerald-500">
              <AppText weight="bold" className="text-[10px] text-white">
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
        {note ? <AppText className="mt-0.5 text-xs text-soft">{note}</AppText> : null}
      </View>
      <AppText weight="extrabold" className="text-base text-ink">
        {price}
        <AppText className="text-xs text-soft">{suffix}</AppText>
      </AppText>
    </Pressable>
  )
}

function LegalLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void Linking.openURL(url)}
      hitSlop={6}
    >
      <AppText className="text-xs text-soft underline">{label}</AppText>
    </Pressable>
  )
}

/* Pushed from the assistant gate and from the menu, so a throw here
   must stop at this route rather than reaching the root. */
export { ScreenErrorBoundary as ErrorBoundary } from '@/ui/ScreenErrorBoundary'
