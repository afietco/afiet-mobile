# Denge tabağı ve gün kapanışı

> Durum: tasarlandı (büyük kısmı mevcut altyapının çerçevelenmesi) · Dilim 1
> Kaynak: afiet-gamification/docs/05

## Ne

Kayıt anında 5 besin grubunun (sebze/meyve/protein/tahıl/süt) renklenmesi —
zaten var olan DayBalance (0–5 skor) + MacroRings üzerine **oyunlaştırma
çerçevesi**: anlık kutlama dili, gün kapanış cümlesi ve renk-öncelikli sunum.

## Neden

Personanın (sayaç yorgunu) bariyeri "girdiğim verinin karşılığı yok" hissi.
Kaydın karşılığı ANINDA ve görsel olmalı — davranış döngüsünün ödül ayağı.

## Nasıl çalışır

- Her kayıtta tabak/halka animasyonlu renklenir + mevcut haptik başarı
  dokunuşu (`notificationAsync(Success)`).
- Günün İLK "kayıt + bakış" çifti tamamlandığında bir kez:
  **"Bugün afiyetteydin 🌿"** mikro-kutlaması (abartısız — konfeti değil,
  yumuşak vurgu; konfeti ilk-kayıt FTUE'de ve hafta kutlamasında kalır).
- Skor sunumu renk-öncelikli: "3/5" rakamı ikincil, renklenen gruplar
  birincil. **3+/5 de kutlanır** — 5/5 "tam not" gibi konumlanmaz.
- Tatlı/fastfood sayaçları (sweetCount/fastfoodCount) tabakta YARGI üretmez;
  yalnız içgörülerde nötr bilgi olarak kalır.

## UI dokunuşları

- Bugün ekranı beslenme kartı: mevcut MacroRings + grup renk noktaları;
  gün kapanış cümlesi kartın altına.
- Renkler `src/ui/appIcons.tsx` [açık, koyu] çiftlerinden — yeni renk yok.

## Veri ve event'ler

- Veri tamamen mevcut: DayBalance (`internal/calc` + insights).
- Event: `balance_viewed {score, missing[]}`, `afiyet_day_completed`.

## Yapma

- Skoru limit/not gibi sunmak ("5/5'i kaçırdın") — asla.
- 5/5 sonrası "daha fazla kayıt" teşviki — gün tamamsa sistem sakinleşir.
