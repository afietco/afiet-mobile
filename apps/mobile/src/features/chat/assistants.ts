import type { AfiPoseName } from '@/ui/maskot'
import type { AssistantId } from './types'

/**
 * Product copy and visual identity of the three chat assistants.
 *
 * All three now carry their own name, because all three have their own mascot:
 * Afi the bowl, Sini the tray, Demi the teapot (`ui/maskot/sofra`). They used
 * to be titled by what they are to the person reading ("kişisel beslenme
 * uzmanım"), which was a way of naming them without naming them, and which sat
 * badly against the pricing rule that protected titles are never published. A
 * name the character actually owns says more and claims less.
 *
 * The bridge chips still speak of "beslenme sohbeti" and "destek sohbeti"
 * (chat/bridge.ts): that is the agents' own wording for each other, and it is
 * matched against what they say, not against these titles.
 */
export interface AssistantSpec {
  id: AssistantId
  title: string
  subtitle: string
  /** Afi's header and empty-state pose. The other two have one body each. */
  pose: AfiPoseName
  /** First bubble shown while the conversation is still empty. */
  welcome: string
  /** Tappable openers under the welcome bubble. */
  starters: string[]
  placeholder: string
  busyLabel: string
}

export const ASSISTANTS: Record<AssistantId, AssistantSpec> = {
  afi: {
    id: 'afi',
    title: 'Afi',
    subtitle: 'Sofra arkadaşın',
    pose: 'selam',
    welcome:
      'Hoş geldin! Sofranla ilgili ne istersen konuşabiliriz: bir besin sorabilir, gününe bakabilir ya da aklındakini yazabilirsin 🧡',
    starters: ['Bugünüm nasıl gidiyor?', 'Bir besin soracağım', "afiet'i nasıl kullanırım?"],
    placeholder: "Afi'ye yaz…",
    busyLabel: 'Afi yazıyor…',
  },
  beslenme: {
    id: 'beslenme',
    title: 'Sini',
    subtitle: 'Haftanı birlikte dengeleyelim',
    pose: 'kasik',
    welcome:
      'Hoş geldin. Haftanın dengesine bakabilir, öğün fikirleri bulabilir, porsiyonları konuşabiliriz. Nereden başlayalım?',
    starters: ['Haftamı değerlendir', 'Öğün fikri ver', 'Porsiyonları konuşalım'],
    placeholder: 'Sorunu yaz…',
    busyLabel: 'Bakıyor…',
  },
  destek: {
    id: 'destek',
    title: 'Demi',
    subtitle: 'Sana ait güvenli bir alan',
    pose: 'sicaklik',
    welcome:
      'Burası sana ait bir alan. Yemekle ilişkin, duyguların, aklından geçenler: istediğin yerden başlayabilirsin. Acele etmiyoruz.',
    starters: ['İçimi dökmek istiyorum', 'Yemekle aram zor', 'Suçluluk hissediyorum'],
    placeholder: 'Buradayım, yaz…',
    busyLabel: 'Yazıyor…',
  },
}
