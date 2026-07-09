# Changelog

Bu dosya projedeki dikkate değer değişiklikleri kaydeder.
Format [Keep a Changelog](https://keepachangelog.com/tr/) esinlidir,
sürümleme [SemVer](https://semver.org/lang/tr/) izler.

Geliştirme sırasında maddeler `[Yayınlanmadı]` altına eklenir; release'te
tarihli sürüm başlığına taşınır ve `src/data/changelog.ts` ile senkronlanır
(uygulama içi "Yenilikler" ekranı oradan beslenir).

## [Yayınlanmadı]

### ✨ Yeni

- Bugün ekranı yenilendi: Beslenme, Vücudum ve Su kartlarıyla tek bakışta
  gün özeti; + ile ana ekrandan besin eklenir (öğün sheet içinde seçilir,
  saate göre makul öğün önseçilir).
- Yeni "Vücudum" ekranı: kilo ve mezura ölçülerini kaydet; BMI, günlük
  enerji ihtiyacı (BMR/TDEE) ve vücut yağ oranı (US Navy yöntemi)
  kendiliğinden hesaplanır — düğmeye basmak yok.
- Kilo yolculuğu grafiği ve ölçüm geçmişi.

- BMI kartına dokununca detay sheet'i: kısa açıklama, aralık rehberi ve
  BMI gelişim grafiği.
- Gelişim grafiklerinde zaman aralığı seçimi (1H / 1A / 1Y / Tümü) —
  seçenekler kayıt geçmişi biriktikçe görünür olur, varsayılan tüm zamanlar.
- Yolculuk kartı: kilo ve yağ oranı grafikleri alt alta, tek tarih
  filtresi ikisine birden uygulanır; grafiklere değer ve tarih eksenleri
  eklendi.
- Grafiklerde aylık görünüm: Ay seçiliyken önceki aylar arasında
  gezinilebilir (haftalık/yıllık seçenekler sadeleştirildi).
- Grafik çizgisi soldan sağa çizilerek girer; Bugün kartları art arda
  süzülerek açılır (hareket azaltma tercihine saygılı).
- Günlük Enerji kartına dokununca detay sheet'i: belirgin BMR/TDEE
  blokları, çarpan denklemi ve enerjiye göre makro pusulası
  (protein/karbonhidrat/yağ gram aralıkları).
- Enerji detayında su ve lif pusulası: TDEE'den günlük su ihtiyacı
  (litre + bardak) ve lif hedefi hesaplanır.
- Su kartının günlük hedefi artık kişisel: vücut bilgileri ve ölçüm
  varsa TDEE'den türetilen bardak sayısı kullanılır (yoksa 8 bardak).
- Ölçüm Ekle'de mezura ölçüleri artık hep açık (katlanır bölüm kalktı).
- Bugün'deki Vücudum kartı sadeleşti: mini grafik kalktı, üç istatistik
  yeterli.

### 🔧 İyileştirme

- Beslenme detayı (öğün kartları ve besin ekleme) kendi sayfasına taşındı
  (`/beslenme`) — Bugün ekranı sadeleşiyor.
- Bugün kartları ortak başlık diliyle hizalandı: renkli ikon rozeti +
  başlık + sağda durum (denge skoru, son ölçüm günü, bardak sayısı).
- Ölçüm geçmişi sayfayı uzatmak yerine "Geçmiş" butonuyla açılan
  sheet'e taşındı; kayıtlar tarih rozetli, kilo değişimli ve mezura
  çipli yeni bir görünüme kavuştu.
- Bugün'deki Vücudum kartı zenginleşti: kilo (değişim okuyla), BMI ve
  yağ oranı (yoksa enerji) mini istatistikleri + tam genişlik trend.
- Bugün'deki Beslenme kartı sadeleşti (günlük mesaj yalnızca /beslenme'de).

## [0.3.0] — 2026-07-09

### ✨ Yeni

- Dark mode: sistem tercihine otomatik uyum + Profil'den elle seçim
  (Açık / Koyu / Otomatik). Semantik renk token'larıyla tek yerden tema;
  durum çubuğu rengi ve form kontrolleri de temaya uyar, açılışta tema
  flash'ı yaşanmaz.

### 🔧 İyileştirme

- Emoji ikonlar yerine uygulamaya özel, tatlı çizgi stilinde SVG ikon seti
  (`src/ui/icons.tsx`): duotone, currentColor tabanlı — light/dark tema ve
  her vurgu rengiyle uyumlu. Besin grupları ve öğünler artık renkli özel
  ikonlarla gösteriliyor (`src/ui/appIcons.tsx`); gelecek özellikler için
  kupa, grafik, zil, dişli, nabız gibi ikonlar hazır.

## [0.2.0] — 2026-07-09

### ✨ Yeni

- "Bir Besin Daha 🍽️" butonu: besini kaydedip akışı sıfırlar, aynı öğüne
  zincirleme ekleme yapılır; öğüne eklenmiş besinler sheet üstünde
  rozetlerle görünür
- Geçmişte gün detayı: güne dokununca denge kartı, su ve öğün bazında
  besin listesini gösteren pop-up
- Bugün sayfasına saat bazlı karşılamalı, seri rozetli gradient hero header
- Uygulama içi "Yenilikler ✨" ekranı: güncellemeden sonra bir kez gösterilir,
  Profil sayfasından tekrar açılabilir

### 🔧 İyileştirme

- Porsiyon/adet seçimi kaldırıldı — kayıt akışı "yaz → kaydet"e indi
- Besin grupları besin netleşmeden gösterilmez; tanınan besinde yalnızca
  ilişkili gruplar görünür ("Düzenle" ile tam liste)
- Sheet'lere yumuşak açılış/kapanış animasyonu; pill ve liste girişlerine
  mikro animasyonlar (hareket azaltma ayarına saygılı)
- Uygulama fontu Nunito Variable oldu (self-hosted, offline destekli)
- Gün geçiş okları header'dan kaldırıldı — Bugün sayfası yalnızca bugünü
  gösterir, geçmiş günler Geçmiş sekmesinde

### 🐛 Düzeltme

- Besin yazılırken (henüz seçilmeden) tüm grup çiplerinin görünmesi

## [0.1.0] — 2026-07-08

### ✨ Yeni

- İlk sürüm: mobil öncelikli PWA (offline çalışır, ana ekrana eklenir)
- Öğün günlüğü: kahvaltı / öğle / akşam / ara öğün için besin kaydı,
  Türk yemekleri otomatik tamamlama ve kullanıcı girdilerinden öğrenme
- Günlük Denge: 5 temel besin grubu kapsama skoru ve yargılamayan
  günlük mesajlar (kalori sayımı yok)
- Su takibi (bardak sayacı) ve 🔥 kesintisiz kayıt serisi
- Geçmiş ekranı: son 7 günün denge çubukları
- Çoklu profil: aile üyeleri tek cihazda ayrı kayıt tutar
