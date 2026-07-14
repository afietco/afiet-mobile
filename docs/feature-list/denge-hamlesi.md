# Denge hamlesi — günlük tek mikro davet

> Durum: tasarlandı · Dilim 1 · Kaynak: afiet-gamification/docs/05, 06

## Ne

Günün eksik besin grubundan üretilen **tek** küçük davet:
"Bugün sebzeye yer açılır mı? 🌿" · "Bir avuç kuruyemişe ne dersin? 🥜".
Kullanıcı sonraki öğünde o grubu eklerse hamle tamamlanır.

## Neden

Karar yorgunluğunu tek seçeneğe indirir; "ne yesem?" anına küçük,
uygulanabilir bir yön verir (persona hedefi). Telafi davranışını tetikler —
telafi EDEMEMEK başarısızlık değildir, davet ertesi gün sessizce yenilenir.

## Nasıl çalışır

- Kaynak: DayBalance.missing — gün içi ilk kayıttan sonra hesaplanır (T1).
- Günde EN FAZLA 1 hamle. Skor zaten ≥4 ise hamle çıkmaz (gün iyi gidiyor).
- Metin havuzu ~30 cümle, insights.ts tonunda (yargısız, davetkâr);
  grup başına 5–6 varyant, ardışık günlerde tekrar etmez.
- Tamamlanınca: ilgili grubun tabakta renklenmesi + minik konfeti +
  `move_done`. Reddedilince (kapat/χ): sessiz, `move_dismissed`.
- **Susma kuralı:** aynı hafta 2 ret → o hafta hamle çıkmaz (görev
  yorgunluğu panzehiri).
- Ödül-yetki: ilk 5 tamamlanan hamleden sonra "hamle tercihleri" açılır
  ("bana tatlı önerme" vb. hariç tutma listesi).

## UI dokunuşları

- Bugün ekranında beslenme kartının altında kapatılabilir hamle kartı;
  dokununca kayıt sheet'i ilgili grup önerisiyle açılır (tek dokunuş akış).

## Veri ve event'ler

- `move_offered / move_done / move_dismissed {group, day}`.
- Tercihler AsyncStorage `fh:*` + profile sync (basit dizi).

## Yapma

- Günde ikinci hamle, "hadi ama" tekrarı — asla.
- Tatlı/fastfood AZALT çerçevesi ("bugün tatlıyı bırak") — davet hep
  EKLEme yönünde pozitiftir ("sebzeye yer açmak"), kısıtlama dili yok.
