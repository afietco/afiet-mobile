import type { ReactNode } from 'react'
import { IconChevronRight } from './icons'

interface CardHeaderProps {
  icon: ReactNode
  /** Renkli yumuşak zemin sınıfları (bg + text, dark varyantlarıyla) */
  iconBg: string
  title: string
  /** Sağ taraf: durum metni/pill/butonlar */
  meta?: ReactNode
  /** Karta dokununca gidilecek yer varsa ok gösterilir */
  chevron?: boolean
}

/** Dashboard kartlarının ortak başlık satırı — ikon rozeti + başlık + sağ meta */
export function CardHeader({ icon, iconBg, title, meta, chevron = false }: CardHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2.5 font-bold">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </span>
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {meta}
        {chevron && <IconChevronRight className="h-5 w-5 text-faint" />}
      </div>
    </div>
  )
}
