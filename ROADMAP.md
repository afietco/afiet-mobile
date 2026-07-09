# Yol Haritası

Amaç: Aile üyelerinin spora başlamasıyla birlikte beslenme ve aktivitelerini
oyunlaştırarak sağlıklı yaşam alışkanlıklarının sürdürülebilirliğini ve bilinçli
gelişimlerini desteklemek. Hobi projesi — mobil tarayıcıdan ana ekrana eklenen PWA.

## ✅ Aşama 1 — Beslenme takibi ve bilinci (mevcut)

- Öğün günlüğü: kahvaltı / öğle / akşam / ara öğün, porsiyon bazlı kayıt (kalori sayma yok)
- Besin grubu farkındalığı: her kayıtta besin grubu işaretleme, günlük 5 temel grup denge özeti
- Su takibi (bardak sayacı)
- Türk yemekleri autocomplete + kullanıcının girdiği besinleri öğrenme
- Cihaz içi çoklu profil (aile üyeleri), son 7 gün geçmişi, kayıt serisi (streak)

## Aşama 2 — Vücut ölçüleri ve hesaplayıcılar

- Kilo, boy, bel/kalça vb. ölçü kaydı ve zaman içi grafik
- Hesaplayıcılar: BMI, vücut yağ oranı (Navy metodu vb.), BMR / TDEE
- Hesaplayıcı sonuçlarının beslenme takibiyle ilişkilendirilmesi
  (örn. TDEE'ye göre porsiyon/denge önerilerinin kişiselleşmesi)

## Aşama 3 — Tracker yapısı

- Aşama 2'deki hesaplamaların teşvik edici biçimde yerleştirildiği takip yapısı
- Hedef belirleme (ölçü/alışkanlık hedefleri) ve ilerleme göstergeleri
- Haftalık/aylık trend özetleri, düzenli ölçüm hatırlatıcıları

## Aşama 4 — Oyunlaştırma

- Davranış psikolojisi temelli akış: küçük kazanımlar, kayıp kaçınma, alışkanlık döngüleri
- Oyunlaştırma öğeleri: rozetler, puanlar, seviyeler, seri (streak) ödülleri, görevler
- Aile içi sosyal katman: liderlik tablosu, birlikte hedefler
  (paylaşımlı veri gerektirir → backend kararı bu aşamada; not: PocketBase / Firebase /
  Convex / InstantDB alternatifleri değerlendirilecek, repository katmanı hazır)
- Akışta tutan UI/UX iyileştirmeleri (mikro animasyonlar, anlık geri bildirim)

## Teknik notlar

- Veri şu an tamamen cihazda (IndexedDB / Dexie). UI yalnızca `src/data/repositories`
  arayüzlerini kullanır; backend eklenince yeni implementasyon takılır, UI değişmez.
- FTUE ölçümü (yapılacak): backend yokken cihaz içi basit sayaçlarla izlenebilir
  (örn. "ilk gün en az bir öğün kaydı var mı", onboarding tamamlanma anı).
  API/backend aşamasında bu sayaçlar gerçek funnel metriklerine dönüştürülecek.
- FTUE notları (denetimden, ileriye dönük):
  - Kutlama anları Aşama 4'te değişken ödüllere evrilecek — farklı anlara
    farklı kutlamalar (3 gün seri, ilk 5/5 denge günü, ilk mezura ölçümü vb.).
  - Başlangıç görevleri tamamlama kutlamasında oto-kapanma varyantı,
    metrikler geldiğinde A/B ile denenebilir (şimdilik dismiss'e bağlı).
  - `FirstVisitIntro` deseni yeni bölümlere tek satırla eklenir
    (örn. Aşama 3'te Hedefler ekranı).
  - Doğum tarihi çarkındaki varsayılan tarihin çapa (anchoring) etkisi
    bilinçli kabul edildi — ekstra onay sürtünmesi eklenmedi; kullanım
    verisi geldiğinde gözden geçirilecek.
