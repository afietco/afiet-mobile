import type { Href } from 'expo-router'
import type { ApiQuest } from '@/data/api/client'

/**
 * What a quest means, and the one tap that moves it.
 *
 * The list answers "how far am I"; the detail answers the two questions the
 * list cannot fit. The first is what the quest actually counts, and that is
 * Afi's to tell: it comes from the server (`narration`) so the words can be
 * rewritten from the admin panel without an app release. The second is where
 * to go and do it, and that is the app's to know, because routes are not
 * content and a screen name stored in a database would rot the first time one
 * moved. So the two halves live in different places on purpose, and only the
 * second one is here.
 */

/** The starter shown under the narration; absent for quests with no route. */
export interface QuestAction {
  /** Button label, the verb of the thing itself: "Öğün ekle", not "Başla". */
  label: string
  /** Said to a screen reader, because leaving the screen deserves warning. */
  hint: string
  href: Href
}

/**
 * Keyed by metric family, not by quest key.
 *
 * Every threshold of the same metric is completed by the same act (the first
 * afiyet day and the hundredth both need a meal), and new thresholds are added
 * from the admin panel, where nobody would think to come back here. Keying by
 * family means a quest this app has never heard of still gets its starter.
 */
const ACTIONS: Record<string, QuestAction> = {
  /* The add-food sheet lives on Bugün and is opened by the same token a meal
     reminder uses (features/push/push-target.ts), so this route is the one way
     into it that is already known to work from a screen stacked over the tabs. */
  afiyet_day: {
    label: 'Öğün ekle',
    hint: 'Bugün ekranına gider ve besin ekleme sayfasını açar',
    href: { pathname: '/(tabs)', params: { pushTarget: 'meal' } },
  },
  afiyet_week: {
    label: 'Öğün ekle',
    hint: 'Bugün ekranına gider ve besin ekleme sayfasını açar',
    href: { pathname: '/(tabs)', params: { pushTarget: 'meal' } },
  },
  distinct_food: {
    label: 'Yeni bir besin ekle',
    hint: 'Bugün ekranına gider ve besin ekleme sayfasını açar',
    href: { pathname: '/(tabs)', params: { pushTarget: 'meal' } },
  },
  distinct_group: {
    label: 'Öğün ekle',
    hint: 'Bugün ekranına gider ve besin ekleme sayfasını açar',
    href: { pathname: '/(tabs)', params: { pushTarget: 'meal' } },
  },
  custom_food: {
    label: "Menüm'e yemek öğret",
    hint: 'Menüm ekranını açar',
    href: '/menum',
  },
  group_join: {
    label: 'Grubuma git',
    hint: 'Grubum ekranını açar',
    href: '/grubum',
  },
  greeting: {
    label: 'Grubuma git',
    hint: 'Grubum ekranını açar',
    href: '/grubum',
  },
  measurement: {
    label: 'Ölçümümü gir',
    hint: 'Vücudum ekranını açar',
    href: '/vucudum',
  },
}

/** The action that moves this quest, or null when the app has no route for it. */
export function questAction(quest: ApiQuest): QuestAction | null {
  return ACTIONS[quest.group] ?? null
}

/**
 * What Afi says about the quest.
 *
 * `detail` is the one-line label the list already shows, so falling back to it
 * repeats a sentence rather than leaving a blank: a server without the
 * narration column, or a quest written in the panel without one, still opens
 * to something readable.
 */
export function questNarration(quest: ApiQuest): string {
  const narration = quest.narration?.trim()
  return narration && narration.length > 0 ? narration : quest.detail
}

/** Sayaç metni: "4 / 7". Alınmış görevde hedef hedeftir, ilerleme değil. */
export function questCounter(quest: ApiQuest): string {
  const current = quest.claimed || quest.completed ? quest.target : quest.progress
  return `${String(current)} / ${String(quest.target)}`
}

/**
 * Birimi bilinen metriklerde kalan miktar; ötekilerde susar.
 *
 * Yanlış birim ("kalan 3 gün" yerine "kalan 3 grup") sayının kendisinden daha
 * kafa karıştırıcı olurdu, o yüzden tanımadığı metrikte satır hiç çıkmaz.
 */
const REMAINING_UNITS: Record<string, string> = {
  afiyet_day: 'gün',
  afiyet_week: 'hafta',
  distinct_food: 'besin',
  distinct_group: 'besin grubu',
  custom_food: 'yemek',
  greeting: 'selam',
}

export function questRemaining(quest: ApiQuest): string | null {
  if (quest.completed || quest.claimed) return null
  const unit = REMAINING_UNITS[quest.group]
  const left = quest.target - quest.progress
  if (!unit || left <= 0) return null
  return `Kalan ${String(left)} ${unit}`
}
