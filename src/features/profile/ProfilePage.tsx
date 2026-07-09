import { useState } from 'react'
import { Link } from 'react-router'
import { profileRepo } from '../../data/repositories'
import { WhatsNewSheet } from '../changelog/WhatsNewSheet'
import { IconChevronRight, IconContrast, IconMoon, IconPencil, IconScale, IconSparkles, IconSun } from '../../ui/icons'
import { EmojiPicker } from '../../ui/inputs/EmojiPicker'
import { TextField } from '../../ui/inputs/TextField'
import { useTheme, type ThemePref } from '../theme/useTheme'
import { useActiveProfile } from './useActiveProfile'

const THEME_OPTIONS: { key: ThemePref; label: string; Icon: typeof IconSun }[] = [
  { key: 'light', label: 'Açık', Icon: IconSun },
  { key: 'dark', label: 'Koyu', Icon: IconMoon },
  { key: 'system', label: 'Otomatik', Icon: IconContrast },
]

function ThemePicker() {
  const { pref, setPref } = useTheme()
  return (
    <div className="mt-4 rounded-2xl bg-surface p-5 shadow-sm">
      <h2 className="mb-3 font-bold">Görünüm</h2>
      <div className="flex overflow-hidden rounded-xl border border-line">
        {THEME_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => setPref(o.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
              pref === o.key ? 'bg-emerald-600 text-white' : 'bg-surface text-soft'
            }`}
          >
            <o.Icon className="h-4.5 w-4.5" />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Kişisel ayarlar sayfası — tek kullanıcı: kimlik, görünüm, sürüm */
export function ProfilePage() {
  const { profile } = useActiveProfile()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [showWhatsNew, setShowWhatsNew] = useState(false)

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
    <div className="mx-auto max-w-lg px-4 pt-8 pb-28">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Profil</h1>

      {!editing ? (
        <div className="animate-slide-fade-in flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-4xl dark:bg-emerald-900/60">
            {profile.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold">{profile.name}</p>
            <p className="text-sm text-soft">Verilerin yalnızca bu cihazda</p>
          </div>
          <button
            onClick={startEdit}
            aria-label="İsmi ve avatarı düzenle"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-soft active:scale-90"
          >
            <IconPencil className="h-4.5 w-4.5" />
          </button>
        </div>
      ) : (
        <div className="animate-slide-fade-in rounded-2xl bg-surface p-5 shadow-sm">
          <h2 className="mb-3 font-bold">İsim ve avatar</h2>
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="İsmin"
            maxLength={20}
            autoFocus
          />
          <div className="mt-4">
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 rounded-xl bg-muted py-3 font-semibold text-soft active:scale-[0.98]"
            >
              Vazgeç
            </button>
            <button
              onClick={() => void saveEdit()}
              disabled={!name.trim()}
              className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      <Link
        to="/vucudum"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-5 shadow-sm active:scale-[0.99]"
      >
        <IconScale className="h-5.5 w-5.5 text-violet-600 dark:text-violet-400" />
        <span className="flex-1 font-bold">Vücut bilgilerin</span>
        <IconChevronRight className="h-4.5 w-4.5 text-faint" />
      </Link>

      <ThemePicker />

      <button
        onClick={() => setShowWhatsNew(true)}
        className="mx-auto mt-8 flex items-center gap-1.5 text-sm text-faint active:text-emerald-600"
      >
        afiet {__APP_VERSION__} · Yenilikler
        <IconSparkles className="h-4 w-4" />
      </button>

      <WhatsNewSheet open={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
    </div>
  )
}
