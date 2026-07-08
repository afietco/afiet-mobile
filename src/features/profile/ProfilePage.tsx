import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { profileRepo } from '../../data/repositories'
import { WhatsNewSheet } from '../changelog/WhatsNewSheet'
import { IconSparkles } from '../../ui/icons'
import { setActiveProfileId, useActiveProfile } from './useActiveProfile'

const EMOJIS = ['😀', '😎', '🦁', '🐻', '🦊', '🐼', '🦉', '🐬', '🌸', '⚡', '🔥', '⭐']

export function ProfilePage() {
  const navigate = useNavigate()
  const { id: activeId } = useActiveProfile()
  const profiles = useLiveQuery(() => profileRepo.all(), [])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  const select = (id: number) => {
    setActiveProfileId(id)
    navigate('/')
  }

  const create = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = await profileRepo.create(trimmed, emoji)
    setName('')
    setCreating(false)
    select(id)
  }

  const showForm = creating || profiles?.length === 0

  return (
    <div className="mx-auto max-w-lg px-4 pt-8 pb-28">
      <h1 className="mb-1 text-2xl font-extrabold text-emerald-700">Aile Sağlık 🥗</h1>
      <p className="mb-6 text-slate-500">Kim kayıt tutuyor? Profilini seç veya oluştur.</p>

      <div className="grid grid-cols-2 gap-3">
        {profiles?.map((p) => (
          <button
            key={p.id}
            onClick={() => select(p.id!)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-white p-5 shadow-sm transition-transform active:scale-95 ${
              p.id === activeId ? 'border-emerald-500' : 'border-transparent'
            }`}
          >
            <span className="text-4xl">{p.emoji}</span>
            <span className="font-semibold">{p.name}</span>
            {p.id === activeId && (
              <span className="text-xs font-medium text-emerald-600">Aktif</span>
            )}
          </button>
        ))}
        {!showForm && (
          <button
            onClick={() => setCreating(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-5 text-slate-400 active:scale-95"
          >
            <span className="text-3xl">＋</span>
            <span className="text-sm font-medium">Yeni Profil</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold">Yeni profil oluştur</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="İsim (örn. Anne, Berk...)"
            className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            maxLength={20}
          />
          <div className="mb-4 flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`rounded-xl p-2 text-2xl ${
                  emoji === e ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-slate-50'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <button
            onClick={create}
            disabled={!name.trim()}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-40"
          >
            Oluştur ve Başla
          </button>
        </div>
      )}

      <button
        onClick={() => setShowWhatsNew(true)}
        className="mx-auto mt-8 flex items-center gap-1.5 text-sm text-slate-400 active:text-emerald-600"
      >
        Sürüm {__APP_VERSION__} · Yenilikler
        <IconSparkles className="h-4 w-4" />
      </button>

      <WhatsNewSheet open={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
    </div>
  )
}
