import Constants from 'expo-constants'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { profileRepo } from '../../data/repositories'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { THEME_KEY, tokens, useTheme, type ThemePref } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconContrast, IconMoon, IconPencil, IconScale, IconSun } from '@/ui/icons'
import { EmojiPicker } from '@/ui/inputs/EmojiPicker'
import { TextField } from '@/ui/inputs/TextField'

/* Web ProfilePage.tsx portu. Bilinçli fark: "Yenilikler" sheet'i web'in
   changelog.ts akışına bağlı — mobil sürüm notları Faz 7 dağıtımıyla gelecek;
   şimdilik sürüm dipnotu yeter. */

// Web ProfilePage'deki THEME_OPTIONS aynası — etiket/ikon/sıra birebir
const THEME_OPTIONS: { key: ThemePref; label: string; Icon: typeof IconSun }[] = [
  { key: 'light', label: 'Açık', Icon: IconSun },
  { key: 'dark', label: 'Koyu', Icon: IconMoon },
  { key: 'system', label: 'Otomatik', Icon: IconContrast },
]

function ThemePicker() {
  const { pref, setPref, isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <View className="mt-4 rounded-2xl bg-surface p-5">
      <AppText weight="bold" className="mb-3 text-ink">
        Görünüm
      </AppText>
      <View className="flex-row overflow-hidden rounded-xl border border-line">
        {THEME_OPTIONS.map((o) => {
          const selected = pref === o.key
          return (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setPref(o.key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 ${
                selected ? 'bg-emerald-600' : 'bg-surface'
              }`}
            >
              <o.Icon size={18} color={selected ? '#ffffff' : t.soft} />
              <AppText
                weight="semibold"
                className={`text-sm ${selected ? 'text-white' : 'text-soft'}`}
              >
                {o.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>
      <AppText className="mt-3 text-xs text-faint">
        Tema tercihi cihazda saklanır ({THEME_KEY}).
      </AppText>
    </View>
  )
}

/** Kişisel ayarlar sayfası — tek kullanıcı: kimlik, görünüm, sürüm */
export default function ProfilScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { profile } = useActiveProfile()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')

  if (!profile) return null

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
    <ScrollView
      className="flex-1 bg-canvas"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 32,
      }}
    >
      <AppText weight="extrabold" className="mb-6 text-2xl text-ink">
        Profil
      </AppText>

      {!editing ? (
        <View className="flex-row items-center gap-4 rounded-2xl bg-surface p-5">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/60">
            <Text style={{ fontSize: 34, lineHeight: 42 }}>{profile.emoji}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <AppText weight="extrabold" numberOfLines={1} className="text-lg text-ink">
              {profile.name}
            </AppText>
            <AppText className="text-sm text-soft">Verilerin yalnızca bu cihazda</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="İsmi ve avatarı düzenle"
            onPress={startEdit}
            className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted"
          >
            <IconPencil size={18} color={t.soft} />
          </Pressable>
        </View>
      ) : (
        <View className="rounded-2xl bg-surface p-5">
          <AppText weight="bold" className="mb-3 text-ink">
            İsim ve avatar
          </AppText>
          <TextField value={name} onChangeText={setName} placeholder="İsmin" maxLength={20} autoFocus />
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
      )}

      <Link href="/vucudum" asChild>
        <Pressable className="mt-4 flex-row items-center gap-3 rounded-2xl bg-surface p-5">
          <IconScale size={22} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="bold" className="flex-1 text-ink">
            Vücut bilgilerin
          </AppText>
          <IconChevronRight size={18} color={t.faint} />
        </Pressable>
      </Link>

      <ThemePicker />

      <AppText className="mt-8 text-center text-xs text-faint">
        afiet v{Constants.expoConfig?.version ?? '?'}
      </AppText>
    </ScrollView>
  )
}
