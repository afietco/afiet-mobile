/**
 * Uygulama içi "Yenilikler ✨" ekranının verisi.
 * CHANGELOG.md ile release sırasında senkron tutulur (/release komutu).
 * Maddeler kullanıcı diliyle yazılır — teknik detay değil, fayda anlatılır.
 * En yeni sürüm en üstte.
 */
export interface ReleaseNote {
  version: string
  /** YYYY-MM-DD */
  date: string
  highlights: { emoji: string; text: string }[]
}

export const CHANGELOG: ReleaseNote[] = [
  {
    version: '0.3.0',
    date: '2026-07-09',
    highlights: [
      { emoji: '🌙', text: 'Koyu tema geldi! Telefonun gece modundaysa uygulama da kararır; Profil > Görünüm\'den elle de seçebilirsin' },
      { emoji: '🎨', text: 'Baştan aşağı yeni, el çizimi tadında ikonlar — besin grupları artık rengarenk' },
      { emoji: '💧', text: 'Su damlaları, alev ve tüm küçük simgeler yeni tasarımla daha tatlı' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-07-09',
    highlights: [
      { emoji: '🍽️', text: '"Bir Besin Daha" ile aynı öğüne art arda besin ekleyebilirsin' },
      { emoji: '⚡', text: 'Besin eklemek artık daha hızlı: porsiyon sorusu yok, gruplar kendiliğinden seçiliyor' },
      { emoji: '📅', text: 'Geçmişte bir güne dokun — denge, su ve öğünlerin detayı açılır' },
      { emoji: '🌅', text: 'Yeni karşılama ekranı: güne özel selam ve seri rozetin başköşede' },
      { emoji: '✨', text: 'Her şey daha yumuşak: ekranlar kayarak açılır, yenilikler tatlı tatlı belirir' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-07-08',
    highlights: [
      { emoji: '🥗', text: 'Öğün günlüğü: ne yediğini yaz, besin gruplarını o tanısın' },
      { emoji: '🎯', text: 'Günlük Denge: 5 temel besin grubunu kapsadın mı, tek bakışta' },
      { emoji: '💧', text: 'Su takibi ve 🔥 kayıt serisi' },
      { emoji: '👨‍👩‍👧‍👦', text: 'Herkese ayrı profil — tek cihazda tüm aile' },
    ],
  },
]
