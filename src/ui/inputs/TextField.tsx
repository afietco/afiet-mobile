import type { InputHTMLAttributes } from 'react'

/** Custom metin alanı — büyük dokunma hedefi, yumuşak odak geçişi */
export function TextField({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border-2 border-line bg-surface px-5 py-4 text-lg font-semibold shadow-sm outline-none transition-colors duration-200 placeholder:font-normal placeholder:text-faint focus:border-emerald-500 ${className}`}
    />
  )
}
