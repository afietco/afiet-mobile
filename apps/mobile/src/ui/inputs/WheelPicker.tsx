import * as Haptics from 'expo-haptics'
import { useEffect, useRef } from 'react'
import {
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { AppText } from '../AppText'

/* iOS tarzı kaydırmalı seçim çarkı; web ui/inputs/WheelPicker.tsx portu.
   DIY ScrollView: snapToInterval ortadaki öğeye kilitler, kütüphane yok.
   Bilerek FlatList DEĞİL: ≤101 basit satır için sanallaştırma gereksiz;
   üstelik başlangıç ofsetine atlarken pencere dışı satırları boş bırakıyor
   ve adım ScrollView'ının içinde iç içe VirtualizedList uyarısı veriyordu.
   Web'deki üst/alt solma degradesi native'de atlandı (gradient bağımlılığı
   gerektirir); seçili/soluk yazı hiyerarşisi odağı zaten veriyor. */

const ITEM_H = 44
const VISIBLE = 5
const PAD = (ITEM_H * (VISIBLE - 1)) / 2

export interface WheelItem {
  key: number
  label: string
}

interface WheelColumnProps {
  items: WheelItem[]
  value: number
  onChange: (key: number) => void
  ariaLabel: string
  className?: string
}

/** Tek sütun: snap ile ortadaki öğe seçilir, öğeye dokununca oraya kayar */
export function WheelColumn({ items, value, onChange, ariaLabel, className = 'flex-1' }: WheelColumnProps) {
  const listRef = useRef<ScrollView>(null)
  const offsetY = useRef(0)
  const scrolling = useRef(false)
  const tickIdx = useRef(0)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initialIdx = Math.max(
    0,
    items.findIndex((i) => i.key === value),
  )

  const idxAt = (y: number) => Math.min(items.length - 1, Math.max(0, Math.round(y / ITEM_H)))

  // İlk açılışta ve dışarıdan değer değişiminde çark hizalanır (ör. ay
  // değişince gün kelepçelendi); kullanıcının süren kaydırmasına araya girilmez
  useEffect(() => {
    if (scrolling.current) return
    const idx = items.findIndex((i) => i.key === value)
    if (idx < 0) return
    const target = idx * ITEM_H
    if (Math.abs(offsetY.current - target) > 1) {
      listRef.current?.scrollTo({ y: target, animated: false })
      offsetY.current = target
    }
  }, [value, items])

  const clearSettle = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = null
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y
    if (!scrolling.current) return
    // Her satır geçişinde iOS picker tıkı; state'e dokunmadan (ref),
    // kaydırma sırasında render tetiklenmez, çark akıcı kalır
    const idx = idxAt(offsetY.current)
    if (idx !== tickIdx.current) {
      tickIdx.current = idx
      void Haptics.selectionAsync()
    }
  }

  // Değer YALNIZCA çark yerleşince yazılır; kaydırma sırasında her satırda
  // onChange etmek tüm ekranı yeniden render edip kaymalara yol açıyordu
  const settle = (y: number) => {
    clearSettle()
    scrolling.current = false
    const key = items[idxAt(y)]?.key
    if (key !== undefined && key !== value) onChange(key)
  }

  return (
    <View className={className} style={{ height: ITEM_H * VISIBLE }} accessibilityLabel={ariaLabel}>
      <ScrollView
        ref={listRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        contentOffset={{ x: 0, y: initialIdx * ITEM_H }}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          scrolling.current = true
          tickIdx.current = idxAt(offsetY.current)
          clearSettle()
        }}
        onMomentumScrollBegin={clearSettle}
        onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => {
          // Parmak momentum olmadan kalkarsa momentumEnd hiç gelmez (Android) ;
          // kısa bekleme içinde momentum başlamadıysa burada yerleşilir
          const y = e.nativeEvent.contentOffset.y
          clearSettle()
          settleTimer.current = setTimeout(() => settle(y), 150)
        }}
      >
        <View style={{ height: PAD }} />
        {items.map((item) => {
          const selected = item.key === value
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                void Haptics.selectionAsync()
                onChange(item.key)
              }}
              className="items-center justify-center"
              style={{ height: ITEM_H }}
            >
              <AppText
                weight={selected ? 'extrabold' : 'semibold'}
                className={selected ? 'text-lg text-ink' : 'text-faint'}
              >
                {item.label}
              </AppText>
            </Pressable>
          )
        })}
        <View style={{ height: PAD }} />
      </ScrollView>
    </View>
  )
}

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const pad2 = (n: number) => String(n).padStart(2, '0')

interface WheelDatePickerProps {
  /** YYYY-MM-DD */
  value: string
  onChange: (iso: string) => void
  minYear?: number
  maxYear?: number
  /** YYYY-MM-DD; ilerisi seçilirse bu tarihe kelepçelenir */
  maxDate?: string
  /** Bölümün aksan rengine uyum (Vücudum → violet) */
  accent?: 'emerald' | 'violet'
}

/** Gün / Ay / Yıl çarklı tarih seçici */
export function WheelDatePicker({
  value,
  onChange,
  minYear,
  maxYear,
  maxDate,
  accent = 'emerald',
}: WheelDatePickerProps) {
  const currentYear = new Date().getFullYear()
  const yMax = maxYear ?? currentYear
  const yMin = minYear ?? yMax - 100
  const [y, m, d] = value.split('-').map(Number)

  const set = (ny: number, nm: number, nd: number) => {
    const clampedDay = Math.min(nd, daysInMonth(ny, nm))
    const iso = `${ny}-${pad2(nm)}-${pad2(clampedDay)}`
    onChange(maxDate && iso > maxDate ? maxDate : iso)
  }

  const days: WheelItem[] = Array.from({ length: daysInMonth(y, m) }, (_, i) => ({
    key: i + 1,
    label: String(i + 1),
  }))
  const months: WheelItem[] = MONTHS_TR.map((label, i) => ({ key: i + 1, label }))
  const years: WheelItem[] = Array.from({ length: yMax - yMin + 1 }, (_, i) => ({
    key: yMin + i,
    label: String(yMin + i),
  }))

  const band =
    accent === 'violet'
      ? 'bg-violet-500/10 border-violet-500/20'
      : 'bg-emerald-500/10 border-emerald-500/20'

  return (
    <View className="relative rounded-3xl bg-surface p-2">
      {/* Ortadaki seçim bandı; çark merkezine sabitlenir */}
      <View
        pointerEvents="none"
        className={`absolute rounded-2xl border ${band}`}
        style={{ left: 12, right: 12, top: '50%', marginTop: -ITEM_H / 2, height: ITEM_H }}
      />
      <View className="flex-row gap-1">
        <WheelColumn items={days} value={d} onChange={(nd) => set(y, m, nd)} ariaLabel="Gün" className="w-16 shrink-0" />
        <WheelColumn items={months} value={m} onChange={(nm) => set(y, nm, d)} ariaLabel="Ay" className="flex-1" />
        <WheelColumn items={years} value={y} onChange={(ny) => set(ny, m, d)} ariaLabel="Yıl" className="w-20 shrink-0" />
      </View>
    </View>
  )
}
