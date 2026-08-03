import type { AfiPoseName } from '@/ui/maskot'
import type { AssistantId } from './types'

/**
 * Product copy and visual identity of the three chat assistants. The dietitian
 * and psychologist deliberately carry no proper name (pricing decision: those
 * names are unpublished); they are titled by what they are to the person
 * reading, which is a specialist of their own rather than a room to talk in.
 * The bridge chips still speak of "beslenme sohbeti" and "destek sohbeti"
 * (chat/bridge.ts): that is the agents' own wording for each other, and it is
 * matched against what they say, not against these titles.
 */
export interface AssistantSpec {
  id: AssistantId
  title: string
  subtitle: string
  /** Header and empty-state mascot pose. */
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
    title: 'Kişisel beslenme uzmanım',
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
    title: 'Kişisel destek uzmanım',
    subtitle: 'Sana ait güvenli bir alan',
    pose: 'sicaklik',
    welcome:
      'Burası sana ait bir alan. Yemekle ilişkin, duyguların, aklından geçenler: istediğin yerden başlayabilirsin. Acele etmiyoruz.',
    starters: ['İçimi dökmek istiyorum', 'Yemekle aram zor', 'Suçluluk hissediyorum'],
    placeholder: 'Buradayım, yaz…',
    busyLabel: 'Yazıyor…',
  },
}
