# Changelog

Bu dosya projedeki dikkate değer değişiklikleri kaydeder.
Format [Keep a Changelog](https://keepachangelog.com/tr/) esinlidir,
sürümleme [SemVer](https://semver.org/lang/tr/) izler.

Geliştirme sırasında maddeler `[Yayınlanmadı]` altına eklenir; release'te
tarihli sürüm başlığına taşınır ve `src/data/changelog.ts` ile senkronlanır
(uygulama içi "Yenilikler" ekranı oradan beslenir).

## [Yayınlanmadı]

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
