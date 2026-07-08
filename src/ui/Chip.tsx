import type { ReactNode } from 'react'

interface ChipProps {
  label: string
  icon?: ReactNode
  active?: boolean
  onClick?: () => void
}

export function Chip({ label, icon, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-line bg-surface text-soft'
      }`}
    >
      {icon && <span className={`text-base ${active ? '[&_svg]:text-white' : ''}`}>{icon}</span>}
      <span>{label}</span>
    </button>
  )
}
