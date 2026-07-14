# Haftalık sofra özeti

> Durum: tasarlandı · Dilim 1 · Kaynak: afiet-gamification/docs/05, 06, 08

## Ne

Pazar akşamı açılan tam ekran hafta görünümü: ritim şeridinin hafta hali +
5 besin grubunun hafta boyunca dağılımı + **tek** kişisel içgörü + Afi.

## Neden

Persona ilerlemesini GÖRMEK istiyor, puan istemiyor. Haftalık değerlendirme,
davranış döngüsünün "yansıma" ayağı; ritmin aynası.

## Nasıl çalışır

- Hazırlanma: pazar 19:00 (T3 daveti); istenirse sonra da açılabilir.
- İçerik sırası: (1) ritim sonucu ("5/7 — bu hafta afiyetteydin 🎉" ya da
  nötr "3 afiyet günü"), (2) grupların hafta görünümü (hangi renkler ne
  sıklıkta), (3) TEK içgörü ("Salı günleri sebze azalıyor — öğle molası
  mı?" tonunda, yargısız), (4) Afi selamı.
- **Erişim-ödülü:** ilk haftanın sonunda AÇILIR — "kilitli" gösterilmez,
  yoktan var olur (kıtlık hissi kurulmaz).
- Kişisel içgörüler 3 hafta veri birikince derinleşir (Dilim 4'te).
- Hafta-hafta kıyas nötr dille; "geçen haftadan kötü" çerçevesi yok.

## UI dokunuşları

- Sheet (mevcut `src/ui/Sheet.tsx` düzeni) ya da tam ekran modal;
  Bugün'de pazar günü beliren "Bu haftanın sofrası hazır ✨" kartından açılır.
- Grafik: 7 sütunlu mini grup-renk ızgarası (yeni bileşen; renkler
  appIcons çiftlerinden).

## Veri ve event'ler

- **Backend önkoşulu:** `GET /v1/summary/week` — günlük summary'nin 7
  günlük toplulaştırması + içgörü seçici. Uç gecikirse geçici istemci
  tarafı hesap KABUL (7 × günlük özet çağrısı yerine tek yeni uç tercih).
- Event: `week_summary_opened {week_no, rhythm_days}`.

## Yapma

- Birden fazla içgörü/istatistik yığını — veri takıntısı guardrail'i.
- Kaçan haftada olumsuz karşılaştırma — pencere hep taze.
