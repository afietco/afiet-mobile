import type { AssistantId, ChatTransport, ChatTurn } from './types'

/**
 * Phase-1 scripted transport: streams canned replies token by token so the
 * screen, typing indicator and history behave exactly like the real SSE
 * client will. Replaced by the backend transport in phase 3.
 */

const TOKEN_DELAY_MS = 28
const FIRST_TOKEN_DELAY_MS = 550

interface Script {
  /** Matched with turkish-insensitive `includes` against the user text. */
  match: string[]
  reply: string
}

const SCRIPTS: Record<AssistantId, Script[]> = {
  afi: [
    {
      match: ['nasıl kullan', 'ne yapabilir'],
      reply:
        'Sofranı birlikte tutuyoruz: öğünlerini Besin Ekle ile kaydedersin, ben fotoğraftan tanımana yardım ederim. Bugün ekranında gününü, Beslenme ekranında haftanın dengesini görürsün. İstersen bir öğün ekleyerek başlayalım mı?',
    },
    {
      match: ['bugün', 'nasıl gidiyor'],
      reply:
        'Bugün sofranda sebze ve tahıl güzel görünüyor, protein biraz sessiz kalmış. Akşama bir kase yoğurt ya da bir porsiyon tavuk eklersen gün dengelenir. Sayı değil denge önemli, hatırlatayım 🧡',
    },
    {
      // The "Bir besin soracağım" starter chip must land on a script: chips
      // we offer may never fall through to the generic fallback.
      match: ['besin soracağım', 'besin sor'],
      reply:
        'Sor bakalım! Hangi besin aklında? Adını yazman yeter, besin grubunu ve yaklaşık değerlerini birlikte görürüz.',
    },
    {
      match: ['kalori', 'kaç'],
      reply:
        'Yaklaşık söyleyeyim: bir kase mercimek çorbası 120 ile 180 kalori arası olur, içindeki yağa göre değişir. Besin grubu olarak bakliyat tarafında, yanına ekmek eklersen tahıl da katılır.',
    },
  ],
  beslenme: [
    {
      match: ['hafta', 'değerlendir'],
      reply:
        'Haftana baktım: sebze çoğu gün sofranda, eline sağlık. Bakliyat iki haftadır az görünüyor; bu hafta iki öğüne mercimek ya da nohut eklemek dengeler. Tatlı haftaya güzel yayılmış, orada bir şey değiştirmene gerek yok. İstersen bakliyatı hangi öğünlere yerleştireceğimize birlikte bakalım.',
    },
    {
      match: ['öğün', 'fikir', 'ne yesem'],
      reply:
        'Akşam için pratik bir fikir: fırında sebzeli tavuk, yanına bulgur pilavı ve bir kase yoğurt. Tabağın yarısı sebze, çeyreği protein, çeyreği tahıl olsun; bu hem doyurur hem dengeler. Kahvaltı fikri de istersen söyleyeyim.',
    },
    {
      match: ['porsiyon', 'ölçü'],
      reply:
        'El ölçüsü dilini kullanıyoruz: avuç kuruyemiş ve atıştırmalık için, kase çorba ve yoğurt için, dilim ekmek ve börek için. Gram saymana gerek yok; elin hep yanında. Hangi besinin ölçüsünü merak ediyorsun?',
    },
  ],
  destek: [
    {
      match: ['suçlu', 'pişman', 'nefret'],
      reply:
        'Bunu yazman bile önemli. Yemek sonrası suçluluk çok yaygın ve çok yorucu; üstelik çoğu zaman daha fazla yemeye zemin hazırlayan da o duygu oluyor. Şu an aklından geçen düşünce tam olarak ne, biraz açmak ister misin?',
    },
    {
      match: ['içimi dökmek', 'konuşmak istiyorum'],
      reply: 'Buradayım ve acele etmiyoruz. İstediğin yerden, istediğin kadar anlat.',
    },
    {
      match: ['yemekle aram', 'duygusal yeme', 'gece'],
      reply:
        'Yemekle ilişki zorlayıcı olabiliyor; bunda yalnız değilsin ve bu bir irade meselesi değil. Genelde hangi anlarda zorlanıyorsun: belirli saatler mi, belirli duygular mı?',
    },
  ],
}

const FALLBACK: Record<AssistantId, string> = {
  afi: 'Bunu tam anlayamadım ama sofranla ilgili her konuda yardım etmeyi çok isterim. Bugünkü öğünlerine mi bakalım, yoksa bir besin mi soracaksın?',
  beslenme:
    'Bunu biraz daha açar mısın? Haftanın dengesine bakabilir, öğün fikri verebilir ya da porsiyonları konuşabiliriz.',
  destek: 'Seni doğru anlamak istiyorum. Biraz daha anlatır mısın, şu an sana en ağır gelen ne?',
}

const lower = (s: string) => s.toLocaleLowerCase('tr-TR')

function pickReply(assistant: AssistantId, text: string, history: ChatTurn[]): string {
  const needle = lower(text)
  const script = SCRIPTS[assistant].find((s) => s.match.some((m) => needle.includes(lower(m))))
  if (script) return script.reply
  // Second unmatched turn in a row: vary the fallback so the mock does not
  // repeat itself verbatim (the real agent never would).
  const lastAssistant = [...history].reverse().find((t) => t.role === 'assistant')
  if (lastAssistant?.text === FALLBACK[assistant]) {
    return assistant === 'destek'
      ? 'Dinliyorum. Kelimeler hemen gelmiyorsa o da olur; hazır olduğunda yaz.'
      : 'Şöyle yapalım: bana kısaca ne yediğini ya da neyi merak ettiğini yaz, oradan devam edelim.'
  }
  return FALLBACK[assistant]
}

// Hermes has no DOMException; an Error with the standard name works everywhere.
function abortError(): Error {
  const e = new Error('aborted')
  e.name = 'AbortError'
  return e
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(abortError())
    })
  })

export const mockTransport: ChatTransport = {
  async send({ assistant, history, text, onToken, signal }) {
    const reply = pickReply(assistant, text, history)
    await wait(FIRST_TOKEN_DELAY_MS, signal)
    // Stream word by word: close enough to token cadence for UI purposes.
    const words = reply.split(' ')
    let sent = ''
    for (const [i, word] of words.entries()) {
      if (signal?.aborted) throw abortError()
      sent += (i === 0 ? '' : ' ') + word
      onToken(i === 0 ? word : ` ${word}`)
      await wait(TOKEN_DELAY_MS, signal)
    }
    return sent
  },
}
