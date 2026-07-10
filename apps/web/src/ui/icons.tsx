import type { ReactNode, SVGProps } from 'react'

/**
 * Uygulamanın özel ikon seti — "tatlı" çizgi stili.
 *
 * Tasarım dili:
 * - 24×24 grid, 1.8px yuvarlak uçlu çizgiler (Nunito'nun yumuşak karakteriyle uyumlu)
 * - Renk her zaman `currentColor`: ikon, metin rengini devralır — light/dark
 *   temada ve her vurgu renginde kendiliğinden çalışır
 * - Duotone dolgu: currentColor %15 opaklıkta — tema ne olursa olsun uyumlu
 *
 * Boyut: varsayılan 1em (yazı boyutunu izler); Tailwind `h-* w-*` ile ezilir.
 */
export type IconProps = SVGProps<SVGSVGElement>

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

/** Duotone dolgu katmanı */
function Tone({ d }: { d: string }) {
  return <path d={d} fill="currentColor" stroke="none" opacity={0.15} />
}

/* ── Gezinme ───────────────────────────────────────────── */

/** Buharlı kase — Bugün sekmesi */
export function IconBowl(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M4 13a8 8 0 0 0 16 0H4Z" />
      <path d="M4 13a8 8 0 0 0 16 0H4Z" />
      <path d="M9.5 3.5c.6.8.6 1.7 0 2.5-.6.8-.6 1.7 0 2.5" />
      <path d="M14.5 3.5c.6.8.6 1.7 0 2.5-.6.8-.6 1.7 0 2.5" />
    </Base>
  )
}

/** Takvim — Geçmiş sekmesi */
export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M3.75 8a3 3 0 0 1 3-3h10.5a3 3 0 0 1 3 3v2.2H3.75Z" />
      <rect x="3.75" y="5" width="16.5" height="15" rx="3" />
      <path d="M3.75 10.2h16.5" />
      <path d="M8 3v3.2M16 3v3.2" />
      <path d="M8.3 14.6h.01M12 14.6h.01M15.7 14.6h.01M8.3 17.4h.01M12 17.4h.01" strokeWidth={2.4} />
    </Base>
  )
}

/** Kişi — Profil sekmesi */
export function IconUser(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 4.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Z" />
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5.4 19.6c.8-3.4 3.4-5.3 6.6-5.3s5.8 1.9 6.6 5.3" />
    </Base>
  )
}

/* ── Öğünler ───────────────────────────────────────────── */

/** Gün doğumu — Kahvaltı */
export function IconSunrise(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M8.2 15.5a3.8 3.8 0 0 1 7.6 0Z" />
      <path d="M8.2 15.5a3.8 3.8 0 0 1 7.6 0" />
      <path d="M12 8.3V5.8M6.7 10.6 5.3 9.2M17.3 10.6l1.4-1.4" />
      <path d="M3.5 15.5h2.6M17.9 15.5h2.6M8 19.2h8" />
    </Base>
  )
}

/** Güneş — Öğle */
export function IconSun(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
    </Base>
  )
}

/** Ay — Akşam */
export function IconMoon(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M20 14.1A8 8 0 1 1 9.9 4a6.6 6.6 0 0 0 10.1 10.1Z" />
      <path d="M20 14.1A8 8 0 1 1 9.9 4a6.6 6.6 0 0 0 10.1 10.1Z" />
      <path d="M17.8 4.2v2.4M16.6 5.4H19" />
    </Base>
  )
}

/** Elma — Ara öğün */
export function IconApple(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 8.6c-2-1.5-4.9-1-6.1 1.2-1.3 2.3-.5 5.5 1 7.6 1 1.5 2.3 2.6 3.6 2.5.5 0 1-.3 1.5-.3s1 .3 1.5.3c1.3.1 2.6-1 3.6-2.5 1.5-2.1 2.3-5.3 1-7.6-1.2-2.2-4.1-2.7-6.1-1.2Z" />
      <path d="M12 8.6c-2-1.5-4.9-1-6.1 1.2-1.3 2.3-.5 5.5 1 7.6 1 1.5 2.3 2.6 3.6 2.5.5 0 1-.3 1.5-.3s1 .3 1.5.3c1.3.1 2.6-1 3.6-2.5 1.5-2.1 2.3-5.3 1-7.6-1.2-2.2-4.1-2.7-6.1-1.2Z" />
      <path d="M12 8.6c0-2 .7-3.3 2.2-4.1" />
    </Base>
  )
}

/* ── Besin grupları ────────────────────────────────────── */

/** Havuç — Sebze */
export function IconCarrot(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M14.9 9.1c1.9 1.9 1.7 4.7-.5 6.9-2.6 2.6-7.2 3.9-10.6 4 .1-3.4 1.4-8 4-10.6 2.2-2.2 5-2.4 6.9-.5.1.1.1.1.2.2Z" />
      <path d="M14.9 9.1c1.9 1.9 1.7 4.7-.5 6.9-2.6 2.6-7.2 3.9-10.6 4 .1-3.4 1.4-8 4-10.6 2.2-2.2 5-2.4 6.9-.5.1.1.1.1.2.2Z" />
      <path d="M8.3 15.7l1.3 1.3M11 12.4l1.3 1.3" />
      <path d="M14.9 9.1c-.4-1.8.2-3.4 1.7-4.6M14.9 9.1c1.8.4 3.4-.2 4.6-1.7" />
    </Base>
  )
}

/** Çilek — Meyve */
export function IconStrawberry(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 20.4c3.7-1.6 6.2-4.3 6.2-7.5 0-2.4-1.9-4-4-4-.8 0-1.6.3-2.2.9-.6-.6-1.4-.9-2.2-.9-2.1 0-4 1.6-4 4 0 3.2 2.5 5.9 6.2 7.5Z" />
      <path d="M12 20.4c3.7-1.6 6.2-4.3 6.2-7.5 0-2.4-1.9-4-4-4-.8 0-1.6.3-2.2.9-.6-.6-1.4-.9-2.2-.9-2.1 0-4 1.6-4 4 0 3.2 2.5 5.9 6.2 7.5Z" />
      <path d="M12 8.8V6.2" />
      <path d="M12 6.2c-1.5.1-2.6-.4-3.4-1.7M12 6.2c1.5.1 2.6-.4 3.4-1.7" />
      <path d="M9.7 13.3h.01M14.3 13.3h.01M12 16.1h.01" strokeWidth={2.4} />
    </Base>
  )
}

/** Brokoli — Sebze */
export function IconBroccoli(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M6.6 12.9a3 3 0 0 1 .3-5.9 4.5 4.5 0 0 1 8.8-1 3.3 3.3 0 0 1 1.7 6.7l-.4.2H6.6Z" />
      <path d="M6.6 12.9a3 3 0 0 1 .3-5.9 4.5 4.5 0 0 1 8.8-1 3.3 3.3 0 0 1 1.7 6.9H6.6Z" />
      <path d="m10.1 12.9-.5 4.5a1.9 1.9 0 0 0 1.9 2.1h1a1.9 1.9 0 0 0 1.9-2.1l-.5-4.5" />
      <path d="M9.4 9.7h.01M12.6 8.3h.01M14.9 10.5h.01" strokeWidth={2.2} />
    </Base>
  )
}

/** Yumurta — Protein */
export function IconEgg(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 4.2c-3 0-5.9 4.5-5.9 8.7 0 3.5 2.6 6.3 5.9 6.3s5.9-2.8 5.9-6.3c0-4.2-2.9-8.7-5.9-8.7Z" />
      <path d="M12 4.2c-3 0-5.9 4.5-5.9 8.7 0 3.5 2.6 6.3 5.9 6.3s5.9-2.8 5.9-6.3c0-4.2-2.9-8.7-5.9-8.7Z" />
      <path d="M8.9 12.2c0 1.7.8 3.1 2 3.9" />
    </Base>
  )
}

/** But — Protein (alternatif) */
export function IconDrumstick(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M9.8 4.5a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Z" />
      <circle cx="9.8" cy="9.8" r="5.3" />
      <path d="M13.6 13.6l3.6 3.6" />
      <circle cx="18.9" cy="16.4" r="1.5" />
      <circle cx="16.4" cy="18.9" r="1.5" />
      <path d="M7.6 8.2l1 1" />
    </Base>
  )
}

/** Başak — Tahıl */
export function IconWheat(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21v-4" />
      <path d="M12 9.8c-2.1.2-3.7-.8-4.5-2.9 2.2-.2 3.7.9 4.5 2.9Z" />
      <path d="M12 9.8c2.1.2 3.7-.8 4.5-2.9-2.2-.2-3.7.9-4.5 2.9Z" />
      <path d="M12 13.4c-2.1.2-3.7-.8-4.5-2.9 2.2-.2 3.7.9 4.5 2.9Z" />
      <path d="M12 13.4c2.1.2 3.7-.8 4.5-2.9-2.2-.2-3.7.9-4.5 2.9Z" />
      <path d="M12 17c-2.1.2-3.7-.8-4.5-2.9 2.2-.2 3.7.9 4.5 2.9Z" />
      <path d="M12 17c2.1.2 3.7-.8 4.5-2.9-2.2-.2-3.7.9-4.5 2.9Z" />
      <path d="M12 9.8c-.9-1.1-1.2-2.4-.8-4.1 1.6.4 2.5 1.4 2.8 3" />
    </Base>
  )
}

/** Süt bardağı — Süt ürünü */
export function IconMilk(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M8.35 10.8 9.2 19.4a1.7 1.7 0 0 0 1.7 1.3h2.2a1.7 1.7 0 0 0 1.7-1.3l.85-8.6c-1.2.6-2.4.6-3.65-.1-1.2-.6-2.4-.6-3.65.1Z" />
      <path d="M7.8 4h8.4l-1.15 14.8a2 2 0 0 1-2 1.9h-2.1a2 2 0 0 1-2-1.9L7.8 4Z" />
      <path d="M8.3 10.6c1.25-.7 2.45-.7 3.7 0 1.2.7 2.45.7 3.7 0" />
    </Base>
  )
}

/** Zeytin dalı — Sağlıklı yağ */
export function IconOlive(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 9.3a4.2 5.3 0 1 1 0 10.6 4.2 5.3 0 0 1 0-10.6Z" />
      <ellipse cx="12" cy="14.6" rx="4.2" ry="5.3" />
      <path d="M12 9.3V7" />
      <path d="M12 7c-.4-2-1.7-3.2-3.9-3.5.3 2.2 1.6 3.4 3.9 3.5Z" />
      <path d="M12 7c.4-2 1.7-3.2 3.9-3.5-.3 2.2-1.6 3.4-3.9 3.5Z" />
      <path d="M10.2 12.6c-.4.6-.6 1.3-.6 2" />
    </Base>
  )
}

/** Kek — Tatlı/Şekerli */
export function IconCupcake(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M6.4 13.2a3 3 0 0 1 .3-5.9 4.5 4.5 0 0 1 8.8-1 3.3 3.3 0 0 1 2.1 6.9Z" />
      <path d="M6.4 13.2a3 3 0 0 1 .3-5.9 4.5 4.5 0 0 1 8.8-1 3.3 3.3 0 0 1 2.1 6.9" />
      <path d="M6.4 13.2h11.2l-1.15 5.6a2.2 2.2 0 0 1-2.15 1.7h-4.6a2.2 2.2 0 0 1-2.15-1.7L6.4 13.2Z" />
      <path d="M10.1 13.2l-.4 7M13.9 13.2l.4 7" />
    </Base>
  )
}

/** Hamburger — Fast food */
export function IconBurger(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M4.8 10.5c0-3.4 3.2-5.7 7.2-5.7s7.2 2.3 7.2 5.7H4.8Z" />
      <path d="M4.8 10.5c0-3.4 3.2-5.7 7.2-5.7s7.2 2.3 7.2 5.7H4.8Z" />
      <path d="M9.7 7.7h.01M13.3 7.2h.01" strokeWidth={2.2} />
      <path d="M4.8 13.5c1.2 1 2.4-1 3.6 0s2.4-1 3.6 0 2.4-1 3.6 0 2.4-1 3.6 0" />
      <path d="M5.4 16.5h13.2v.4a3 3 0 0 1-3 3H8.4a3 3 0 0 1-3-3Z" />
    </Base>
  )
}

/* ── Durum ve eylemler ─────────────────────────────────── */

/** Su damlası */
export function IconDrop(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 3.8S5.8 10.4 5.8 14.4a6.2 6.2 0 0 0 12.4 0C18.2 10.4 12 3.8 12 3.8Z" />
      <path d="M12 3.8S5.8 10.4 5.8 14.4a6.2 6.2 0 0 0 12.4 0C18.2 10.4 12 3.8 12 3.8Z" />
      <path d="M9.1 14.6a3.1 3.1 0 0 0 1.9 2.7" />
    </Base>
  )
}

/** Alev — kayıt serisi */
export function IconFlame(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 3.5c.4 2.6-.5 4.2-2 5.7-1.6 1.6-3.4 3.3-3.4 6a5.9 5.9 0 0 0 11.8 0c0-2.1-1-3.9-2.2-5.3-.5 1-1.3 1.6-2.3 1.5-1-.1-1.5-1-1.3-2.2.2-1.6.2-3.7-.6-5.7Z" />
      <path d="M12 3.5c.4 2.6-.5 4.2-2 5.7-1.6 1.6-3.4 3.3-3.4 6a5.9 5.9 0 0 0 11.8 0c0-2.1-1-3.9-2.2-5.3-.5 1-1.3 1.6-2.3 1.5-1-.1-1.5-1-1.3-2.2.2-1.6.2-3.7-.6-5.7Z" />
    </Base>
  )
}

/** Pırıltı — yenilikler, kutlama */
export function IconSparkles(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M10.5 3.8c.5 3.2 2.3 5 5.5 5.5-3.2.5-5 2.3-5.5 5.5-.5-3.2-2.3-5-5.5-5.5 3.2-.5 5-2.3 5.5-5.5Z" />
      <path d="M10.5 3.8c.5 3.2 2.3 5 5.5 5.5-3.2.5-5 2.3-5.5 5.5-.5-3.2-2.3-5-5.5-5.5 3.2-.5 5-2.3 5.5-5.5Z" />
      <path d="M17.8 14.2c.3 2 1.4 3.1 3.4 3.4-2 .3-3.1 1.4-3.4 3.4-.3-2-1.4-3.1-3.4-3.4 2-.3 3.1-1.4 3.4-3.4Z" />
    </Base>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Base>
  )
}

export function IconMinus(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5.5 12h13" />
    </Base>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m4.5 12.8 4.7 4.7L19.5 7" />
    </Base>
  )
}

export function IconX(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </Base>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Base>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 6.5h15" />
      <path d="M9.5 6.5V5A1.5 1.5 0 0 1 11 3.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
      <path d="m6.5 6.5.8 12.1a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12.1" />
      <path d="M10 10.5v6M14 10.5v6" />
    </Base>
  )
}

export function IconPencil(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15.9 5.4a2.12 2.12 0 0 1 3 3L8.6 18.7l-4.1 1 1-4.1L15.9 5.4Z" />
      <path d="m14.5 6.8 3 3" />
    </Base>
  )
}

/* ── Gelecek özellikler için hazır ─────────────────────── */

/** Grafik — istatistik/içgörüler */
export function IconChart(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M10 7h4v13.5h-4Z" />
      <rect x="4.5" y="12.5" width="4" height="8" rx="1.4" />
      <rect x="10" y="7" width="4" height="13.5" rx="1.4" />
      <rect x="15.5" y="4" width="4" height="16.5" rx="1.4" />
    </Base>
  )
}

/** Kupa — ödüller/oyunlaştırma */
export function IconTrophy(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M8 4.5h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 4.5h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 6.5H5.6a2 2 0 0 0 .2 4H8M16 6.5h2.4a2 2 0 0 1-.2 4H16" />
      <path d="M12 13.5v3" />
      <path d="M8.5 20.5v-1a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5v1Z" />
    </Base>
  )
}

/** Nabız — aktivite/hareket */
export function IconActivity(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3.5 12.5h3.4l2.4-6.2 4.4 11.4 2.4-5.2h4.4" />
    </Base>
  )
}

/** Dişli — ayarlar */
export function IconGear(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M10.3 4.3a1.8 1.8 0 0 1 3.4 0l.2.7a1.8 1.8 0 0 0 2.5 1l.6-.3a1.8 1.8 0 0 1 2.4 2.4l-.3.6a1.8 1.8 0 0 0 1 2.5l.7.2a1.8 1.8 0 0 1 0 3.4l-.7.2a1.8 1.8 0 0 0-1 2.5l.3.6a1.8 1.8 0 0 1-2.4 2.4l-.6-.3a1.8 1.8 0 0 0-2.5 1l-.2.7a1.8 1.8 0 0 1-3.4 0l-.2-.7a1.8 1.8 0 0 0-2.5-1l-.6.3a1.8 1.8 0 0 1-2.4-2.4l.3-.6a1.8 1.8 0 0 0-1-2.5l-.7-.2a1.8 1.8 0 0 1 0-3.4l.7-.2a1.8 1.8 0 0 0 1-2.5l-.3-.6a1.8 1.8 0 0 1 2.4-2.4l.6.3a1.8 1.8 0 0 0 2.5-1l.2-.7Z" />
      <circle cx="12" cy="12" r="2.9" />
    </Base>
  )
}

/** Zil — hatırlatmalar */
export function IconBell(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 4a6 6 0 0 1 6 6v3.2l1.3 2.6a.9.9 0 0 1-.8 1.2H5.5a.9.9 0 0 1-.8-1.2L6 13.2V10a6 6 0 0 1 6-6Z" />
      <path d="M12 4a6 6 0 0 1 6 6v3.2l1.3 2.6a.9.9 0 0 1-.8 1.2H5.5a.9.9 0 0 1-.8-1.2L6 13.2V10a6 6 0 0 1 6-6Z" />
      <path d="M10 20.3a2 2 0 0 0 4 0" />
    </Base>
  )
}

/** Kalp — sağlık */
export function IconHeart(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 20s-7.5-4.4-7.5-9.7C4.5 7.2 6.6 5 9.2 5c1.2 0 2.2.5 2.8 1.2C12.6 5.5 13.6 5 14.8 5c2.6 0 4.7 2.2 4.7 5.3C19.5 15.6 12 20 12 20Z" />
      <path d="M12 20s-7.5-4.4-7.5-9.7C4.5 7.2 6.6 5 9.2 5c1.2 0 2.2.5 2.8 1.2C12.6 5.5 13.6 5 14.8 5c2.6 0 4.7 2.2 4.7 5.3C19.5 15.6 12 20 12 20Z" />
    </Base>
  )
}

/** Yarım dolu daire — otomatik tema */
export function IconContrast(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4.5a7.5 7.5 0 0 1 0 15Z" fill="currentColor" stroke="none" opacity={0.3} />
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 4.5v15" />
    </Base>
  )
}

/** Tartı — Vücudum */
export function IconScale(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 4.5c3.2 0 5.6.8 7 1.6l-1.6 4.6a2 2 0 0 1-1.9 1.3H8.5a2 2 0 0 1-1.9-1.3L5 6.1c1.4-.8 3.8-1.6 7-1.6Z" />
      <rect x="4" y="4.5" width="16" height="15" rx="3.2" />
      <path d="M17.4 6.6 16.3 9.8a1.6 1.6 0 0 1-1.5 1.1h-5.6a1.6 1.6 0 0 1-1.5-1.1L6.6 6.6" />
      <path d="M12 8.4 13.6 6" />
      <path d="M8.3 16.6h.01M12 16.6h.01M15.7 16.6h.01" strokeWidth={2.4} />
    </Base>
  )
}

/** Mezura — vücut ölçüleri */
export function IconRuler(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M4.2 15.2 15.2 4.2a2.4 2.4 0 0 1 3.4 0l1.2 1.2a2.4 2.4 0 0 1 0 3.4l-11 11a2.4 2.4 0 0 1-3.4 0l-1.2-1.2a2.4 2.4 0 0 1 0-3.4Z" />
      <path d="M4.2 15.2 15.2 4.2a2.4 2.4 0 0 1 3.4 0l1.2 1.2a2.4 2.4 0 0 1 0 3.4l-11 11a2.4 2.4 0 0 1-3.4 0l-1.2-1.2a2.4 2.4 0 0 1 0-3.4Z" />
      <path d="m7.6 11.8 1.7 1.7M10.4 9l1.2 1.2M13.2 6.2l1.7 1.7" />
    </Base>
  )
}

/** Hedef — günlük denge */
export function IconTarget(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 7.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Z" />
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 12h.01" strokeWidth={2.6} />
    </Base>
  )
}

/** Açık kitap — besin rehberi */
export function IconBook(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M12 6.2c-1.7-1.3-4.2-2-8-2v13.6c3.8 0 6.3.7 8 2V6.2Z" />
      <path d="M12 6.2c-1.7-1.3-4.2-2-8-2v13.6c3.8 0 6.3.7 8 2 1.7-1.3 4.2-2 8-2V4.2c-3.8 0-6.3.7-8 2Z" />
      <path d="M12 6.2v13.6" />
      <path d="M6.8 8.6c1.2.1 2.3.3 3.2.6M6.8 11.8c1.2.1 2.3.3 3.2.6" />
    </Base>
  )
}

/** Yer imi — Menüm (kayıtlı besinler) */
export function IconBookmark(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M7 5.8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V20l-5-3.4L7 20V5.8Z" />
      <path d="M7 5.8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V20l-5-3.4L7 20V5.8Z" />
    </Base>
  )
}

/** Yer imi + artı — besini menüne kaydet */
export function IconBookmarkPlus(props: IconProps) {
  return (
    <Base {...props}>
      <Tone d="M7 5.8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V20l-5-3.4L7 20V5.8Z" />
      <path d="M7 5.8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V20l-5-3.4L7 20V5.8Z" />
      <path d="M12 8.2v4M10 10.2h4" />
    </Base>
  )
}
