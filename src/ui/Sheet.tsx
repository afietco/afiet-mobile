import { useEffect, useRef, useState, type ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

const EXIT_MS = 300

/** Mobil alt sayfa (bottom sheet) — yumuşak açılış/kapanış geçişli */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  // render: DOM'da tut; show: geçiş sınıflarını uygula (aç/kapa animasyonu)
  const [render, setRender] = useState(open)
  const [show, setShow] = useState(false)
  // Kapanış animasyonu sırasında parent içeriği boşaltabilir — son doluyu göster
  const lastContent = useRef<{ title: string; children: ReactNode }>({ title, children })
  if (open) lastContent.current = { title, children }

  useEffect(() => {
    if (open) {
      setRender(true)
      // Önce kapalı hali boyansın, sonraki karede geçiş başlasın (çift rAF)
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShow(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }
    setShow(false)
    const t = setTimeout(() => setRender(false), EXIT_MS)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!render) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [render])

  if (!render) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none ${
          show ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          show ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{lastContent.current.title}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500"
          >
            Kapat
          </button>
        </div>
        {lastContent.current.children}
      </div>
    </div>
  )
}
