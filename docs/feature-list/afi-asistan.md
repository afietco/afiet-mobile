# Afi — kutlama karakteri + yardımcı

> Durum: kutlama rolü tasarlandı (Dilim 1); asistan rolü kapsam netleşti,
> AI hattı ayrı planlanır · Kaynak: afiet-gamification/docs/05, 06 +
> ürün kararı (14 Tem 2026)

## Ne

Afi iki rol taşır:

1. **Kutlama karakteri (oyunlaştırma):** eşik anlarında belirir — ilk
   kayıt, ilk afiyet haftası, dönüş günü, unvan geçişleri. Buhar telleri
   animasyonlu; sahne kısa ve cömerttir ("Afiyet olsun! 🎉").
2. **Mini yardımcı (AI hattı):** uygulamanın birçok köşesinde küçük küçük
   yardımlar:
   - **Menüm doldurma:** kullanıcı yemeğin adını yazar, Afi grup + ölçü +
     yaklaşık makroları önerir (CustomFoodSheet'teki "Yakında" alanının
     gerçekleşmesi).
   - **Görsel analiz:** liste dışı bir yiyeceğin fotoğrafından tanıma +
     yaklaşık kalori/makro tahmini. Dil hep "yaklaşık" — kalori bilgidir,
     yargı değil.
   - **Chat desteği:** beslenme sorularına sofra dilinde, yargısız kısa
     cevaplar ("akşama ne pişirsem?" dahil).

## Neden

Kutlama rolü davranış döngüsünün duygusal ödülü; asistan rolü kayıt
sürtünmesini düşürür (Menüm ve liste-dışı yiyecek girişi bugün en zahmetli
akış) — ikisi de trueline'a hizmet eder: saydırmadan dengeler.

## Nasıl çalışır (kurallar ve sınırlar)

- **Afi HEP mutludur** (BRAND.md): kapalı mutlu gözler + minik gülümseme;
  üzgün/kızgın/solan varyant YAPILMAZ. Buhar hep iki tel. Tamagotchi
  suçluluğu (bakılmayınca kötüleşen maskot) kurulamaz.
- Kutlama sahneleri kullanıcıyı bekletmez: tek dokunuşla geçilir, 2–3 sn
  kendiliğinden sönümlenir.
- Asistan cevapları marka sesinde: sen dili, davet + merak, emir/suçluluk
  yok. Kalori sorulduğunda söyler ("yaklaşık 320 kcal") ama hedef/limit
  çerçevesi kurmaz.
- Sağlık teşhisi/diyet reçetesi vermez; gerekirse "bunu bir uzmanla
  konuşmak iyi olur" der.
- Görsel analiz sonucu her zaman DÜZENLENEBİLİR öneridir — kullanıcı
  onaylamadan kayda geçmez (sahiplik kullanıcıda).

## UI dokunuşları

- Kutlama: mevcut FirstLogCelebration düzeninin Afi'li genelleştirilmesi
  (`src/ui/Afi.tsx` statik SVG → hafif reanimated buhar animasyonu;
  Lottie/Rive kararı Dilim 4'te).
- Asistan girişleri bağlamsal küçük Afi düğmeleri: CustomFoodSheet'te
  "Afi doldursun", kayıt sheet'inde "listede yok → fotoğrafla sor",
  ayrı bir chat sekmesi DEĞİL (uygulama sohbet uygulamasına dönüşmez).

## Veri, teknik ve önkoşullar

- AI: backend üzerinden (Azure AI Foundry notu backend README'de);
  istemci anahtar taşımaz.
- Fotoğraf yükleme: backend'de dosya yolu yok → Cloudflare R2 önkoşulu.
- Maliyet/istismar: oran sınırı (kullanıcı/gün), yalnız oturumlu istek.
- Event'ler: `afi_celebration_shown {moment}`, `afi_assist_used
  {kind: menu|photo|chat}`, öneri kabul oranı `afi_suggestion_accepted`.
- Offline: kutlama rolü offline çalışır; asistan rolü online-gerektirir
  (sessizce gizlenir, hata diyaloğu açmaz).

## Yapma

- Afi'yi bildirim baskısının yüzü yapmak ("Afi üzüldü" ASLA).
- Chat'i ön plana alıp kayıt akışının önüne koymak.
- Görsel analiz sonucunu kesin doğru gibi sunmak.
