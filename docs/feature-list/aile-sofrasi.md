# Aile sofrası — ortak hedef ve afiyet olsun jesti

> Durum: ortak hedef 0.3.1'de yayında; afiyet olsun jesti geliştirmede
> · Dilim 3 · Kaynak: afiet-gamification/docs/05, 06
> Önkoşul: Gruplarım altyapısı (üyelik + davet, development'ta mevcut)
> Karar (16 Tem 2026): emoji seçmeli "tepki" mekaniği elendi; yerine tek
> ve kültürel jest olan "Afiyet olsun 🧡" seçildi. Gerekçe: "kim niye
> yapsın" sorusunun cevabı kültürün kendisi olmalı; sofrada zaten
> söylenen sözün tek dokunuşluk hali motivasyon anlatısı gerektirmez.

## Ne

Grubun ortak haftalık hedefi ("bu hafta ailece 12 afiyet günü") ve üyeler
arası tek dokunuşluk "Afiyet olsun 🧡" jesti. **Sıralama/kıyas yok** —
rekabet değil, aynı sofranın sıcaklığı.

## Neden

Marka zag'i "birey değil aile"; persona yakın çevre desteğine açık,
rekabete kapalı. Sosyal bağ churn'ü düşürür — ama yalnız güven korunursa.

## Nasıl çalışır

- **Paylaşım varsayılan KAPALI.** Üye açarsa grup yalnız şunu görür:
  o gün/haftada kaç afiyet günü yaşadığı. **Öğün detayı, skor, kilo asla
  paylaşılmaz.**
- Ortak hedef: üye sayısı × kişisel ritim hedeflerinin toplamından öneri;
  kurucu 1 hafta sonra düzenleyebilir (ödül-yetki).
- Afiyet olsun: o gün afiyette olan ve paylaşımı açık üyenin satırında
  "Afiyet olsun 🧡" butonu; üye başına günde 1 kez, gönderilince
  "Afiyet olsun dedin ✓" nötr etiketine döner. Alan taraf Bugün'de tek
  seferlik yumuşak kart görür ("Ayşe afiyet olsun dedi"; birden fazla
  gönderen tek cümlede birleşir), dokununca kapanır, cevap beklenmez.
  Jest tek yönlü pozitif, yorum/mesajlaşma YOK (aile içi baskı kanalı
  açılmaz). Push daveti (T5) Dilim 2 altyapısını bekler.
- Haftalık aile özeti: "bu hafta sofranızda 11 afiyet günü vardı" — kişi
  kırılımı vurgulanmaz, toplam kutlanır; herkese kendi cümlesi.
- Liderlik tablosu bilinçli YOK (gerekçe: afiet-gamification/docs/05
  elenenler tablosu).

## UI dokunuşları

- Gruplar ekranına (development'taki yeni sekme düzenine uyarak) grup
  kartında ortak hedef halkası + üye tepki satırı.
- Tepki bildirimi Dilim 3'te push ile (Dilim 2 altyapısını kullanır).

## Veri ve event'ler

- Backend: grup içi afiyet-günü paylaşım uçları + afiyet olsun ucu
  (yeni; gönderimler kalıcı tabloda tutulur, ileride oyunlaştırmaya
  kıyassız biçimde bağlanabilir); paylaşım izni üye-başına bayrak
  (varsayılan false).
- Event: `greeting_sent {group_id_hash}`, paylaşım aç/kapa event'i
  (guardrail: kapama oranı >%20 ise varsayılanlar gözden geçirilir).

## Yapma

- Üye kırılımlı karşılaştırma ekranı, "en iyi üye" vurgusu — asla.
- Çocuk profilleri için ayrı düşünülmeden açmak (backlog persona "sofra
  kaptanı" turu bunu ele alacak).
