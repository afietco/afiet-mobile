import { Circle, G, Path } from 'react-native-svg'
import { Layer } from './parts'

/**
 * Lig kademelerinin baharatları (afiet-brand/maskot/afi-lig-*.svg portu).
 *
 * KARAR (26 Tem 2026): kademeler renk tonuyla değil KENDİ FORMUYLA ayrılır.
 * Cılız bir renk değişimi kademeyi anlatmaz; bu yüzden her kademe kendi
 * baharatının çizimini taşır ve renk yalnız destektir. Sahne kademe
 * yükseldikçe zenginleşir: tuz en sade, safran en zengin.
 *
 * Kademe anahtarları @afiet/core'daki LeagueTierKey ile birebir aynıdır.
 * Baharatlar statiktir; hareketi figürün kendi süzülmesi taşır.
 */

/* ---------- 1 · Tuz (zemin kademe, en sade) ---------- */

/** İzometrik kristal; kontur şart, beyaz üst yüz krem zeminde kaybolur. */
function Crystal({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const w = +(s * 0.87).toFixed(1)
  const h = +(s * 0.5).toFixed(1)
  return (
    <G stroke="#c9bb9e" strokeWidth={2.5} strokeLinejoin="round">
      <Path d={`M${cx} ${cy - s}L${cx + w} ${cy - h}L${cx} ${cy}L${cx - w} ${cy - h}Z`} fill="#ffffff" />
      <Path d={`M${cx - w} ${cy - h}L${cx} ${cy}L${cx} ${cy + s}L${cx - w} ${cy + h}Z`} fill="#ece4d4" />
      <Path d={`M${cx + w} ${cy - h}L${cx} ${cy}L${cx} ${cy + s}L${cx + w} ${cy + h}Z`} fill="#d9cdb4" />
    </G>
  )
}

function SaltCrystals() {
  return (
    <Layer>
      <Crystal cx={420} cy={150} s={34} />
      <Crystal cx={86} cy={214} s={22} />
      <Crystal cx={452} cy={268} s={16} />
    </Layer>
  )
}

/* ---------- 2 · Nane ---------- */

function MintSprig() {
  return (
    <Layer>
      <Path
        d="M424 344C430 300 436 260 442 220"
        fill="none"
        stroke="#059669"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <G transform="translate(442 220) rotate(-34)">
        <Path d="M0 0C14.5 -40 40.9 -40 66 0C40.9 40 14.5 40 0 0Z" fill="#34d399" />
        <Path d="M8 0L58 0" fill="none" stroke="#059669" strokeWidth={5} strokeLinecap="round" opacity={0.4} />
      </G>
      <G transform="translate(433 290) rotate(18)">
        <Path d="M0 0C12.3 -34 34.7 -34 56 0C34.7 34 12.3 34 0 0Z" fill="#34d399" />
        <Path d="M7 0L49 0" fill="none" stroke="#059669" strokeWidth={4} strokeLinecap="round" opacity={0.4} />
      </G>
    </Layer>
  )
}

/* ---------- 3 · Kekik ---------- */

/** Sap üzerinde karşılıklı yaprak çifti. */
const THYME_LEAVES: { at: [number, number]; d: string }[] = [
  { at: [413, 320], d: 'M0 0C4.4 -8 12.4 -8 20 0C12.4 8 4.4 8 0 0Z' },
  { at: [418, 292], d: 'M0 0C5.1 -9 14.3 -9 23 0C14.3 9 5.1 9 0 0Z' },
  { at: [424, 264], d: 'M0 0C5.5 -10 15.5 -10 25 0C15.5 10 5.5 10 0 0Z' },
  { at: [431, 236], d: 'M0 0C5.1 -9 14.3 -9 23 0C14.3 9 5.1 9 0 0Z' },
  { at: [438, 212], d: 'M0 0C4.2 -8 11.8 -8 19 0C11.8 8 4.2 8 0 0Z' },
]

function ThymeSprig() {
  return (
    <Layer>
      <Path
        d="M410 340C416 288 426 240 442 196"
        fill="none"
        stroke="#65a30d"
        strokeWidth={8}
        strokeLinecap="round"
      />
      {THYME_LEAVES.map(({ at, d }, i) => (
        <G key={i} transform={`translate(${at[0]} ${at[1]})`}>
          <Path d={d} fill="#84cc16" transform="rotate(-32)" />
          <Path d={d} fill="#84cc16" transform="rotate(-148)" opacity={0.85} />
        </G>
      ))}
      <Path
        d="M0 0C4.8 -9 13.6 -9 22 0C13.6 9 4.8 9 0 0Z"
        fill="#84cc16"
        transform="translate(442 196) rotate(-78)"
      />
    </Layer>
  )
}

/* ---------- 4 · Sumak ---------- */

/** Koni salkım: yukarı sivrilen dört sıra tane. */
const SUMAC_ROWS: [number[], number][] = [
  [[452], 168],
  [[441, 463], 190],
  [[430, 452, 474], 212],
  [[419, 441, 463, 485], 234],
]

function SumacCluster() {
  return (
    <Layer>
      <Path
        d="M452 258C448 290 442 314 434 334"
        fill="none"
        stroke="#7f1d1d"
        strokeWidth={7}
        strokeLinecap="round"
      />
      {SUMAC_ROWS.map(([xs, cy]) =>
        xs.map((cx, i) => (
          <Circle key={`${cy}-${cx}`} cx={cx} cy={cy} r={11} fill={i % 2 ? '#be123c' : '#e11d48'} />
        )),
      )}
      {/* sofraya düşen iki tane */}
      <Circle cx={424} cy={296} r={8} fill="#e11d48" opacity={0.8} />
      <Circle cx={408} cy={330} r={5.5} fill="#be123c" opacity={0.65} />
    </Layer>
  )
}

/* ---------- 5 · Safran (zirve) ---------- */

/**
 * Üç stigma teli + altın hale. Tek kademe ki parıltısı mint değil ALTIN:
 * bu, su pozundaki "bölüm aksanı korunur" kuralının safran karşılığıdır.
 */
function SaffronThreads() {
  return (
    <Layer>
      <Circle cx={448} cy={242} r={64} fill="#fbbf24" opacity={0.16} />
      <G fill="none" strokeLinecap="round">
        <Path d="M448 284C460 256 442 240 456 210" stroke="#dc2626" strokeWidth={10} />
        <Path d="M418 292C428 268 412 254 422 228" stroke="#ea580c" strokeWidth={9} />
        <Path d="M478 272C488 250 472 238 482 216" stroke="#f97316" strokeWidth={8} />
      </G>
      <Path d="M430 150l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#fbbf24" opacity={0.95} />
      <Path d="M492 178l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#fbbf24" opacity={0.7} />
    </Layer>
  )
}

/* ------------------------------------------------------------------ */

export type SpiceKey = 'tuz' | 'nane' | 'kekik' | 'sumak' | 'safran'

export const SPICES: Record<SpiceKey, () => React.ReactElement> = {
  tuz: SaltCrystals,
  nane: MintSprig,
  kekik: ThymeSprig,
  sumak: SumacCluster,
  safran: SaffronThreads,
}
