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
    version: '0.5.0',
    date: '2026-07-09',
    highlights: [
      { emoji: '👋', text: 'Yeni tanışma akışı: uygulama ilk açılışta seni adım adım tanıyor — her ekranda tek soru, bir dakikada hazırsın' },
      { emoji: '🎡', text: 'Tarihler artık çarkla seçiliyor, boy ve kilo için kocaman ± düğmeli yeni girişler' },
      { emoji: '🏆', text: 'Başlangıç Görevleri: ilk öğününü, ilk bardağını ve ilk ölçümünü tamamla — hepsi bitince sürpriz var' },
      { emoji: '🎉', text: 'İlk besin kaydın konfetiyle kutlanıyor, serin o an başlıyor' },
      { emoji: '🧭', text: 'Beslenme ve Geçmiş\'e ilk girişte seni yönlendiren minik tanıtımlar' },
      { emoji: '👤', text: 'Profil sayfası sadeleşti: adını ve avatarını istediğin an değiştir' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-07-09',
    highlights: [
      { emoji: '⚖️', text: 'Yeni "Vücudum" ekranı: kilonu ve mezura ölçülerini kaydet — BMI, günlük enerjin ve yağ oranın kendiliğinden hesaplanır' },
      { emoji: '📈', text: 'Kilo ve yağ yolculuğun grafiklerde: aylara göre gezin, noktalara dokun — tarih ve değer anında görünür' },
      { emoji: '🔥', text: 'Günlük Enerji detayı: sana özel makro, su ve lif pusulası' },
      { emoji: '💧', text: 'Su hedefin artık kişisel — enerjine göre hesaplanan bardak sayısı' },
      { emoji: '🏠', text: 'Bugün ekranı yenilendi: Beslenme, Vücudum ve Su kartlarıyla günün tek bakışta' },
      { emoji: '📅', text: 'Geçmiş güzelleşti: her günün denge çubukları, su durumu ve ölçüm rozeti bir arada' },
    ],
  },
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
