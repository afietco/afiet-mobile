interface ChipProps {
  label: string
  emoji?: string
  active?: boolean
  onClick?: () => void
}

export function Chip({ label, emoji, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
    </button>
  )
}
