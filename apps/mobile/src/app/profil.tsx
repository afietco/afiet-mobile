import { CORE_GROUPS, SEXES, activityMeta, groupMeta, todayISO } from '@afiet/core'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { requireApi } from '@/data/api/apiHolder'
import { profileRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useSummary } from '@/data/useSummary'
import { BodySetupSheet } from '@/features/body/BodySetupSheet'
import { MemberRing } from '@/features/groups/MemberRing'
import { ProfileSocialRow } from '@/features/profile/ProfileSocialRow'
import { UsernameSheet } from '@/features/profile/UsernameSheet'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useMyUsername } from '@/features/social/store'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconPencil, IconScale, IconSparkles } from '@/ui/icons'
import { EmojiPicker } from '@/ui/inputs/EmojiPicker'
import { TextField } from '@/ui/inputs/TextField'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/* Profilim: hamburger menüden açılır. Kimlik (enerji halkalı avatar + isim +
   @kullanıcı adı), sosyal kısayollar (arkadaşlarım + grubum), afiyet ritmi
   özeti ve vücut/beslenme özeti tek bakışta. Kimlik düzenleme mevcut
   updateIdentity akışını korur; vücut düzenleme BodySetupSheet'e açılır. Tema
   seçici ayrı Görünüm (/gorunum) sayfasına taşındı.

   Veri kaynakları (hepsi GERÇEK backend, istemci hesaplamaz):
   - avatar enerji oranı, bugünün besin grubu dengesi, "bugün afiyette" →
     useSummary (backend gün özeti).
   - arkadaş sayısı → useFriends; grup adı/emojisi → useGroups (ProfileSocialRow
     içinde okunur, dokununca ilgili sayfaya götürür).
   - afiyet hafta + gün sayısı → /v1/summary/week/history (rhythmHistory);
     girişsiz/erişilemezse sakin sıfır durumuna düşer.
   - @kullanıcı adı → useMyUsername (profil tablosuna bağlı, UsernameSheet ile
     belirlenir/değiştirilir). */

export default function ProfilScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const emerald = isDark ? '#34d399' : '#059669'
  const today = todayISO()

  const { profile } = useActiveProfile()
  const summary = useSummary(today)
  const myUsername = useMyUsername()
  // Afiyet hafta sayısı, GERÇEK kaynak (/v1/summary/week/history). Erişilemezse
  // (girişsiz/hata) null döner; useLive öğün değişiminde tazeler.
  const rhythm = useLive(
    ['meals'],
    async () => {
      try {
        return await requireApi().rhythmHistory(today)
      } catch {
        return null
      }
    },
    [today],
  )

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [bodyOpen, setBodyOpen] = useState(false)

  if (!profile || summary === undefined) return <PageSkeleton />

  const initial = profile.name.trim() ? (profile.name.trim()[0]?.toUpperCase() ?? null) : null

  // Enerji halkası oranı = günün enerjisi / hedef; hedef yoksa 0 (boş halka).
  const energyTarget = summary?.targets.energyKcal ?? 0
  const energyRatio = summary && energyTarget > 0 ? summary.nutrition.kcal / energyTarget : 0

  // "Bugün afiyette" → o gün en az bir besin kaydı (useSummary'den türetilir).
  const loggedCount = summary
    ? summary.nutrition.knownCount + summary.nutrition.unknownCount
    : 0
  const afiyetToday = loggedCount > 0

  const totalWeeks = rhythm?.totalWeeks ?? 0
  // Toplam afiyet günü: geçmiş haftaların günlük afiyet sayılarının toplamı.
  const totalAfiyetDays = rhythm?.weeks.reduce((sum, w) => sum + w.done, 0) ?? 0

  // Vücut özeti (yalnız okuma; düzenleme BodySetupSheet'e açılır).
  const sexLabel = profile.sex ? (SEXES.find((s) => s.key === profile.sex)?.label ?? null) : null
  const activityLabel = profile.activityLevel ? activityMeta(profile.activityLevel).label : null
  const hasBody = !!(profile.sex && profile.heightCm && profile.activityLevel)
  const bodyLine = [sexLabel, profile.heightCm ? `${profile.heightCm} cm` : null, activityLabel]
    .filter(Boolean)
    .join(' · ')
  const covered = new Set(summary?.nutrition.balance.covered ?? [])

  const startEdit = () => {
    setName(profile.name)
    setEmoji(profile.emoji)
    setEditing(true)
  }

  const saveEdit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await profileRepo.updateIdentity(profile.id!, { name: trimmed, emoji })
    setEditing(false)
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        className="flex-1 bg-canvas"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader title="Profilim" />

        {editing ? (
          <View className="rounded-2xl bg-surface p-5">
            <AppText weight="bold" className="mb-3 text-ink">
              İsim ve avatar
            </AppText>
            <TextField
              value={name}
              onChangeText={setName}
              placeholder="İsmin"
              maxLength={20}
              autoFocus
            />
            <View className="mt-4">
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </View>
            <View className="mt-5 flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditing(false)}
                className="flex-1 items-center rounded-xl bg-muted py-3"
              >
                <AppText weight="semibold" className="text-soft">
                  Vazgeç
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void saveEdit()}
                disabled={!name.trim()}
                className={`flex-1 items-center rounded-xl bg-emerald-600 py-3 ${
                  !name.trim() ? 'opacity-40' : ''
                }`}
              >
                <AppText weight="semibold" className="text-white">
                  Kaydet
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {/* Kimlik: enerji halkalı avatar + isim + @kullanıcı adı */}
            <View className="items-center rounded-2xl bg-surface p-6">
              <MemberRing emoji={profile.emoji} initial={initial} ratio={energyRatio} size={96} />

              <View className="mt-4 flex-row items-center gap-2">
                <AppText weight="extrabold" numberOfLines={1} className="text-xl text-ink">
                  {profile.name}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="İsmi ve avatarı düzenle"
                  onPress={startEdit}
                  hitSlop={8}
                  className="h-8 w-8 items-center justify-center rounded-full bg-muted"
                >
                  <IconPencil size={15} color={t.soft} />
                </Pressable>
              </View>

              {myUsername ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Kullanıcı adını değiştir"
                  onPress={() => setUsernameOpen(true)}
                  hitSlop={8}
                  className="mt-1"
                >
                  <AppText className="text-sm text-soft">@{myUsername}</AppText>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setUsernameOpen(true)}
                  className="mt-2 rounded-full bg-emerald-50 px-3.5 py-1.5 dark:bg-emerald-950/50"
                >
                  <AppText
                    weight="semibold"
                    className="text-sm text-emerald-700 dark:text-emerald-300"
                  >
                    @ Kullanıcı adı belirle
                  </AppText>
                </Pressable>
              )}
            </View>

            {/* Sosyal kısayollar: arkadaşlarım + grubum (gerçek sayılarla) */}
            <ProfileSocialRow today={today} />

            {/* Afiyet ritmi: toplam hafta + gün ve bugünün durumu bir arada */}
            <View className="mt-4 rounded-2xl bg-surface p-5">
              <View className="flex-row items-center gap-2">
                <IconSparkles size={18} color={emerald} />
                <AppText weight="bold" className="text-ink">
                  Afiyet ritmin
                </AppText>
              </View>
              <View className="mt-3 flex-row gap-3">
                <View className="flex-1 rounded-xl bg-canvas p-3">
                  <AppText weight="extrabold" className="text-2xl text-ink">
                    {totalWeeks}
                  </AppText>
                  <AppText className="text-xs text-soft">afiyet haftası</AppText>
                </View>
                <View className="flex-1 rounded-xl bg-canvas p-3">
                  <AppText weight="extrabold" className="text-2xl text-ink">
                    {totalAfiyetDays}
                  </AppText>
                  <AppText className="text-xs text-soft">afiyet günü</AppText>
                </View>
              </View>
              <AppText className="mt-3 text-xs text-faint">
                {afiyetToday
                  ? 'Bugün afiyettesin ✨ ritmin sürüyor.'
                  : totalAfiyetDays > 0
                    ? 'Bugün bir besin ekleyince ritmine bir gün daha katılır.'
                    : 'İlk afiyet gününe doğru; bugün bir besin ekleyerek başlayabilirsin.'}
              </AppText>
            </View>

            {/* Vücut + beslenme özeti (özet; düzenleme derinlere yönlendirir) */}
            <View className="mt-4 rounded-2xl bg-surface p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <IconScale size={18} color={violet} />
                  <AppText weight="bold" className="text-ink">
                    Vücut ve beslenme
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Vücut bilgilerini düzenle"
                  onPress={() => setBodyOpen(true)}
                  hitSlop={8}
                  className="flex-row items-center gap-1"
                >
                  <IconPencil size={14} color={t.soft} />
                  <AppText className="text-xs text-soft">Düzenle</AppText>
                </Pressable>
              </View>

              {hasBody ? (
                <AppText className="mt-3 text-sm text-soft">{bodyLine}</AppText>
              ) : (
                <AppText className="mt-3 text-sm text-soft">
                  Boy, cinsiyet ve aktivite düzeyini eklersen özetin burada belirir.
                </AppText>
              )}

              <View className="my-3 border-t border-line/50" />

              <AppText weight="semibold" className="text-xs text-soft">
                Bugünün besin grubu dengesi
              </AppText>
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {CORE_GROUPS.map((g) => {
                  const on = covered.has(g)
                  return (
                    <View
                      key={g}
                      className={`rounded-full px-3 py-1 ${
                        on ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-canvas'
                      }`}
                    >
                      <AppText
                        className={`text-xs ${
                          on ? 'text-emerald-700 dark:text-emerald-300' : 'text-faint'
                        }`}
                      >
                        {groupMeta(g).label}
                      </AppText>
                    </View>
                  )
                })}
              </View>
              <AppText className="mt-2 text-xs text-faint">
                {afiyetToday
                  ? `Bugün ${covered.size}/${CORE_GROUPS.length} temel grubu dengeledin.`
                  : 'Bugün ilk besinini ekleyince dengen burada belirir.'}
              </AppText>
            </View>

            <AppText className="mt-6 text-center text-xs text-faint">
              Temayı Görünüm sayfasından ayarlayabilirsin. Hesap işlemleri Hesap ayarlarım'da.
            </AppText>
          </>
        )}
      </ScrollView>

      <UsernameSheet
        open={usernameOpen}
        onClose={() => setUsernameOpen(false)}
        current={myUsername}
      />
      <BodySetupSheet profile={profile} open={bodyOpen} onClose={() => setBodyOpen(false)} />
    </View>
  )
}
