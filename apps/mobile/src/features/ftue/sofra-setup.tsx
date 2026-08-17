import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import {
  allChaptersSettled,
  BUILT_CHAPTERS,
  CHAPTER_KEYS,
  chapterEntry,
  EMPTY_RECORD,
  GUIDE_ROW_DAYS,
  teachingRetired,
  type ChapterKey,
  type ChapterRecord,
} from './chapters'
import { replayChapter, stopTeaching, useChapterSnapshot } from './chapter-store'

/**
 * "Sofra kurulumu": the guide, and the answer to the one real risk in showing
 * a feature only when it becomes meaningful.
 *
 * Staged reveal has a failure mode, and it is not confusion about any single
 * screen: it is the suspicion that something is being kept from you. So the
 * whole table is drawn from the first day, every piece still to come says what
 * will bring it, and anything already built can be asked for by hand whether
 * or not its turn has come. Nothing here is a checklist and nothing is ever
 * counted as missed; the pieces that have not arrived are on their way.
 */

interface Piece {
  key: ChapterKey
  title: string
  /** What brings this piece to the table, in Afi's voice. */
  when: string
}

const PIECES: Piece[] = [
  { key: 'balance', title: 'Denge pusulan', when: 'İlk kaydınla kart canlanır' },
  { key: 'closeDay', title: 'Günü kapat', when: 'Akşam, günün özeti ve suyun' },
  { key: 'rhythm', title: 'Ritmini bul', when: 'İkinci afiyet gününde' },
  { key: 'menu', title: 'Sofranı tanı', when: 'Aynı besini ikinci kez yazınca' },
  { key: 'direction', title: 'Yönün', when: "Vücudum'a ilk girdiğinde" },
  { key: 'circle', title: 'Sofrada yalnız değilsin', when: 'İlk ritim haftan dolunca' },
  { key: 'trail', title: 'Yolculuğun izi', when: 'İlk görevin hazır olunca' },
  { key: 'team', title: 'Sofra takımı', when: 'Tanımadığım bir besin yazınca' },
  { key: 'remind', title: 'Sofranı hatırlat', when: 'Üç gün ara verirsen' },
]

type PieceState = 'set' | 'next' | 'later' | 'coming'

function pieceState(record: ChapterRecord, key: ChapterKey): PieceState {
  const entry = chapterEntry(record, key)
  if (entry.state === 'done') return 'set'
  if (!BUILT_CHAPTERS.includes(key)) return 'coming'
  if (entry.state === 'passed' || teachingRetired(record)) return 'later'
  return 'next'
}

const STATE_LABEL: Record<PieceState, string> = {
  set: 'sofrada',
  next: 'sırada',
  later: 'başka zaman',
  coming: 'yolda',
}

function setCount(record: ChapterRecord): number {
  return CHAPTER_KEYS.filter((key) => chapterEntry(record, key).state === 'done').length
}

/* Eight places around one cloth, and the plate in the middle. Angles rather
   than a grid: a table is a table, and the first piece belongs at its centre. */
const TABLE = { cx: 160, cy: 84, rx: 104, ry: 46 }
const RING_ANGLES = [-160, -115, -70, -25, 25, 70, 115, 160]

function ringPosition(index: number): { x: number; y: number } {
  const radians = (RING_ANGLES[index] * Math.PI) / 180
  return {
    x: TABLE.cx + Math.cos(radians) * TABLE.rx,
    y: TABLE.cy + Math.sin(radians) * TABLE.ry,
  }
}

interface PieceArtProps {
  stroke: string
  fill: string
  dashed: boolean
}

/** Each piece is drawn centred on the origin so the ring can place it. */
function PieceArt({ index, stroke, fill, dashed }: PieceArtProps & { index: number }) {
  const dash = dashed ? '3 3' : undefined
  const common = { stroke, strokeWidth: 1.6, fill, strokeDasharray: dash }

  switch (index) {
    case 0: // Tabak, the centre of any sofra.
      return (
        <>
          <Circle r={15} {...common} />
          <Circle r={8} stroke={stroke} strokeWidth={1.2} fill="none" strokeDasharray={dash} />
        </>
      )
    case 1: // Bardak
      return <Rect x={-6} y={-9} width={12} height={18} rx={3} {...common} />
    case 2: // Peçete
      return (
        <>
          <Rect x={-9} y={-7} width={18} height={14} rx={2} {...common} />
          <Path d="M -9 0 L 9 -7" stroke={stroke} strokeWidth={1.2} fill="none" />
        </>
      )
    case 3: // Kaşık
      return (
        <>
          <Ellipse cy={-5} rx={5} ry={6.5} {...common} />
          <Rect x={-1.4} y={1} width={2.8} height={10} rx={1.4} {...common} />
        </>
      )
    case 4: // Çatal
      return (
        <>
          <Rect x={-1.4} y={0} width={2.8} height={11} rx={1.4} {...common} />
          <Path d="M -4 -10 L -4 -1 M 0 -10 L 0 -1 M 4 -10 L 4 -1" stroke={stroke} strokeWidth={1.4} fill="none" />
        </>
      )
    case 5: // İkinci tabak: the guest's place.
      return <Circle r={10} {...common} />
    case 6: // Ekmek sepeti
      return (
        <>
          <Path d="M -11 -3 A 11 11 0 0 0 11 -3 Z" {...common} />
          <Path d="M -11 -3 L 11 -3" stroke={stroke} strokeWidth={1.4} fill="none" />
        </>
      )
    case 7: // Sürahi
      return (
        <>
          <Path d="M -6 -8 L 6 -8 L 8 9 L -8 9 Z" {...common} />
          <Path d="M 6 -4 A 5 5 0 0 1 6 4" stroke={stroke} strokeWidth={1.4} fill="none" />
        </>
      )
    default: // Mum: the evening, and the only piece that means "later".
      return (
        <>
          <Rect x={-3.5} y={-2} width={7} height={12} rx={2} {...common} />
          <Path d="M 0 -10 C 3 -6 3 -3 0 -3 C -3 -3 -3 -6 0 -10 Z" {...common} />
        </>
      )
  }
}

/** The cloth and everything laid on it so far. */
export function SofraTable({ record }: { record: ChapterRecord }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const accent = isDark ? '#34d399' : '#047857'
  const wash = isDark ? '#10281f' : '#e3f2ea'

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={tableLabel(record)}>
      <Svg width="100%" height={172} viewBox="0 0 320 172">
        <Ellipse
          cx={TABLE.cx}
          cy={TABLE.cy}
          rx={TABLE.rx + 34}
          ry={TABLE.ry + 26}
          fill={t.muted}
          opacity={0.55}
        />
        {PIECES.map((piece, index) => {
          const state = pieceState(record, piece.key)
          const on = state === 'set'
          const position = index === 0 ? { x: TABLE.cx, y: TABLE.cy } : ringPosition(index - 1)
          return (
            <G key={piece.key} x={position.x} y={position.y} opacity={on ? 1 : 0.5}>
              <PieceArt
                index={index}
                stroke={on ? accent : t.faint}
                fill={on ? wash : 'none'}
                dashed={!on}
              />
            </G>
          )
        })}
      </Svg>
    </View>
  )
}

function tableLabel(record: ChapterRecord): string {
  const count = setCount(record)
  return `Sofra kurulumu: dokuz parçanın ${String(count)} tanesi sofrada`
}

/**
 * The compact invitation on Bugün. It retires itself once the table is laid,
 * and in any case after the first two weeks of logging: the return chapter can
 * only ever come to somebody who went away, so a row that waited for every
 * piece would wait forever on the people who never leave.
 */
export function SofraSetupRow({ loggedDays }: { loggedDays: number }) {
  const { record } = useChapterSnapshot()
  const { isDark } = useTheme()
  const faint = tokens[isDark ? 'dark' : 'light'].faint
  if (!record || allChaptersSettled(record) || loggedDays >= GUIDE_ROW_DAYS) return null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tableLabel(record)}. Sofra kurulumunu aç`}
      onPress={() => router.push('/gorevlerim')}
      className="flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3 active:bg-muted"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
        <Svg width={22} height={22} viewBox="-16 -16 32 32">
          <PieceArt index={0} stroke="#059669" fill="none" dashed={false} />
        </Svg>
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-ink">
          Sofra kurulumu
        </AppText>
        <AppText className="text-xs text-soft">
          {`${String(setCount(record))}/9 parça sofrada · sıradakini gör`}
        </AppText>
      </View>
      <IconChevronRight size={18} color={faint} />
    </Pressable>
  )
}

/** The full guide, at the top of Görevlerim. */
export function SofraSetupSection() {
  const { record } = useChapterSnapshot()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const current = record ?? EMPTY_RECORD

  const replay = (key: ChapterKey) => {
    replayChapter(key)
    router.navigate('/')
  }

  return (
    <View className="mt-3 overflow-hidden rounded-2xl bg-surface">
      <View className="px-5 pt-4">
        <AppText weight="extrabold" className="text-lg text-ink">
          Sofra kurulumu
        </AppText>
        <AppText className="mt-1 text-sm leading-5 text-soft">
          Uygulamayı birlikte kuruyoruz. Her parça, sana ait bir şey olduğunda sofraya gelir;
          hiçbiri kaçırılmaz, yalnız sırasını bekler.
        </AppText>
      </View>

      <SofraTable record={current} />

      <View className="px-5 pb-4">
        {PIECES.map((piece, index) => {
          const state = pieceState(current, piece.key)
          const built = BUILT_CHAPTERS.includes(piece.key)
          return (
            <View
              key={piece.key}
              className={`flex-row items-center gap-3 py-2.5 ${
                index > 0 ? 'border-t border-line/40' : ''
              }`}
            >
              <View className="h-8 w-8 items-center justify-center">
                <Svg width={26} height={26} viewBox="-16 -16 32 32">
                  <PieceArt
                    index={index}
                    stroke={state === 'set' ? (isDark ? '#34d399' : '#047857') : t.faint}
                    fill="none"
                    dashed={state !== 'set'}
                  />
                </Svg>
              </View>
              <View className="min-w-0 flex-1">
                <AppText
                  weight={state === 'set' ? 'bold' : 'semibold'}
                  className={state === 'set' ? 'text-ink' : 'text-soft'}
                >
                  {piece.title}
                </AppText>
                <AppText className="text-xs text-faint">
                  {state === 'set' ? STATE_LABEL.set : piece.when}
                </AppText>
              </View>
              {built ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${piece.title} bölümünü göster`}
                  onPress={() => replay(piece.key)}
                  className="rounded-lg px-2.5 py-1.5 active:bg-muted"
                >
                  <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-400">
                    {state === 'set' ? 'tekrar göster' : 'şimdi göster'}
                  </AppText>
                </Pressable>
              ) : (
                <AppText className="text-xs text-faint">{STATE_LABEL[state]}</AppText>
              )}
            </View>
          )
        })}

        {/* One tap does what two refusals would: the lessons stop, the reward
            does not, and every piece stays one tap from being shown again. */}
        {!teachingRetired(current) && !allChaptersSettled(current) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Anlatmayı bırak: kalan bölümler kendiliğinden gelmez, istersen buradan gösterirsin"
            onPress={stopTeaching}
            className="mt-3 items-center rounded-xl py-2.5 active:bg-muted"
          >
            <AppText weight="semibold" className="text-sm text-soft">
              Anlatmayı bırak
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
