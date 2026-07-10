import { todayISO, type MealEntry } from '@afiet/core'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { db } from '@/data/db'
import { notify } from '@/data/live'
import { mealRepo, measurementRepo, profileRepo, waterRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconMinus, IconPlus } from '@/ui/icons'

/* GEÇİCİ geliştirme ekranı (Faz 4 doğrulaması) — sqlite repo'ları + useLive
   reaktivitesini cihazda kurcalamak için. Faz 11'de silinecek. */

/** Tüm veriyi siler — onboarding'i temiz kurulum gibi denemek için.
    Repo arayüzlerinde bilerek yıkıcı işlem yok; bu dev aracı db'ye iner. */
async function resetAllData() {
  await db.execAsync(
    'DELETE FROM meals; DELETE FROM water; DELETE FROM measurements; DELETE FROM customFoods; DELETE FROM profiles;',
  )
  await AsyncStorage.removeItem('fh:activeProfileId')
  notify('profiles', 'meals', 'water', 'customFoods', 'measurements')
  // Profil kalmayınca (tabs) kapısı onboarding'e yönlendirir
  router.replace('/')
}

function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl bg-emerald-600 px-4 py-2.5 active:opacity-80"
    >
      <AppText weight="semibold" className="text-center text-white">
        {label}
      </AppText>
    </Pressable>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-2xl bg-surface p-4">
      <AppText weight="bold" className="mb-3 text-ink">
        {title}
      </AppText>
      {children}
    </View>
  )
}

export default function DebugScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const date = todayISO()

  const { id: profileId, profile } = useActiveProfile()
  const profiles = useLive(['profiles'], () => profileRepo.all(), []) ?? []
  const water = useLive(
    ['water'],
    () => (profileId ? waterRepo.forDay(profileId, date) : Promise.resolve(undefined)),
    [profileId, date],
  )
  const meals =
    useLive(
      ['meals'],
      () => (profileId ? mealRepo.forDay(profileId, date) : Promise.resolve([] as MealEntry[])),
      [profileId, date],
    ) ?? []
  const latest = useLive(
    ['measurements'],
    () => (profileId ? measurementRepo.latest(profileId) : Promise.resolve(undefined)),
    [profileId],
  )

  const glasses = water?.glasses ?? 0

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}
    >
      <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center gap-1">
        <IconChevronRight size={16} color={t.faint} strokeWidth={2.2} />
        <AppText className="text-soft">Geri</AppText>
      </Pressable>

      <AppText weight="extrabold" className="text-2xl text-ink">
        Veri katmanı testi
      </AppText>
      <AppText className="mt-1 mb-5 text-sm text-soft">
        Geçici ekran — sqlite + canlı sorgular. Uygulamayı kapatıp açınca veriler kalmalı.
      </AppText>

      <View className="gap-4">
        <Card title={`Profiller (${profiles.length})`}>
          {profiles.map((p) => (
            <AppText key={p.id} className="py-0.5 text-ink">
              {p.emoji} {p.name} {p.id === profileId ? '· aktif' : ''}
            </AppText>
          ))}
          <View className="mt-3">
            <Btn
              label="+ Test profili oluştur"
              onPress={() =>
                void profileRepo.create({
                  name: `Deneme ${profiles.length + 1}`,
                  emoji: '🦊',
                  sex: 'kadin',
                  birthDate: '1995-06-15',
                  heightCm: 170,
                  activityLevel: 'orta',
                })
              }
            />
          </View>
        </Card>

        {profileId != null && (
          <>
            <Card title={`Su — bugün ${glasses} bardak`}>
              <View className="flex-row items-center justify-center gap-6">
                <Pressable
                  onPress={() => void waterRepo.setGlasses(profileId, date, Math.max(0, glasses - 1))}
                  className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-70"
                >
                  <IconMinus size={20} color={t.soft} strokeWidth={2.4} />
                </Pressable>
                <AppText weight="extrabold" className="min-w-10 text-center text-3xl text-ink">
                  {glasses}
                </AppText>
                <Pressable
                  onPress={() => void waterRepo.setGlasses(profileId, date, glasses + 1)}
                  className="h-11 w-11 items-center justify-center rounded-full bg-emerald-600 active:opacity-80"
                >
                  <IconPlus size={20} color="#ffffff" strokeWidth={2.4} />
                </Pressable>
              </View>
            </Card>

            <Card title={`Bugünün öğünleri (${meals.length})`}>
              {meals.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => void mealRepo.remove(m.id!)}
                  className="flex-row items-center justify-between py-1"
                >
                  <AppText className="text-ink">
                    {m.foodName} · {m.quantity} {m.measure ?? 'porsiyon'}
                  </AppText>
                  <AppText className="text-xs text-faint">sil</AppText>
                </Pressable>
              ))}
              <View className="mt-3">
                <Btn
                  label="+ Mercimek çorbası (1 kase)"
                  onPress={() =>
                    void mealRepo.add({
                      profileId,
                      date,
                      meal: 'ogle',
                      foodName: 'Mercimek çorbası',
                      quantity: 1,
                      measure: 'kase',
                      groups: ['tahil'],
                      createdAt: new Date().toISOString(),
                    })
                  }
                />
              </View>
            </Card>

            <Card
              title={
                latest ? `Son ölçüm — ${latest.weightKg} kg (${latest.date})` : 'Ölçüm yok'
              }
            >
              <Btn
                label="Bugüne +0,5 kg yaz (upsert)"
                onPress={() =>
                  void measurementRepo.upsertForDay(profileId, date, {
                    weightKg: Math.round(((latest?.weightKg ?? 70) + 0.5) * 10) / 10,
                  })
                }
              />
            </Card>
          </>
        )}

        <Card title="Onboarding testi">
          <AppText className="mb-3 text-sm text-soft">
            Tüm veriyi siler ve temiz kurulum gibi onboarding'e döner.
          </AppText>
          <Pressable
            onPress={() => void resetAllData()}
            className="rounded-xl border border-red-300 px-4 py-2.5 active:opacity-70 dark:border-red-900"
          >
            <AppText weight="semibold" className="text-center text-red-600 dark:text-red-400">
              Tümünü sıfırla
            </AppText>
          </Pressable>
        </Card>

        <AppText className="text-center text-xs text-faint">
          Profil: {profile ? `${profile.emoji} ${profile.name}` : '—'} · Tarih: {date}
        </AppText>
      </View>
    </ScrollView>
  )
}
