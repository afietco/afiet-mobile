export const AVATAR_EMOJIS = ['😀', '😎', '🦁', '🐻', '🦊', '🐼', '🦉', '🐬', '🌸', '⚡', '🔥', '⭐']

interface EmojiPickerProps {
  value: string | null
  onChange: (emoji: string) => void
}

/** Avatar emoji ızgarası — onboarding ve profil düzenlemede ortak */
export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATAR_EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          aria-pressed={value === e}
          onClick={() => onChange(e)}
          className={`flex aspect-square items-center justify-center rounded-2xl text-4xl shadow-sm transition-all duration-150 active:scale-90 ${
            value === e
              ? 'scale-105 bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-900/60 dark:ring-emerald-400'
              : 'bg-surface'
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
