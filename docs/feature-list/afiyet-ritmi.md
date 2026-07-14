# Afiyet ritmi — haftalık esnek seri

> Durum: tasarlandı · Dilim 1 · Kaynak: afiet-gamification/docs/05, 08
> Karar (14 Tem 2026): kesintisiz günlük seri yerine haftalık ritim seçildi.

## Ne

Haftalık pencereli seri: pazartesi–pazar arasında **7 günün 5'inde bir
"afiyet günü"** yaşamak hedeftir (afiyet günü = o gün en az bir öğün kaydı +
denge tabağına bakış). Kalan **2 gün "sofra payı"dır** — misafirlik,
hastalık, yoğunluk için baştan tanınmış hak; kullanılması başarısızlık değil.

## Neden klasik seri değil? (mekaniğin mantığı)

Klasik kesintisiz seri (Duolingo tarzı) ile farkı tek tabloda:

| | Kesintisiz seri | Afiyet ritmi |
| --- | --- | --- |
| Birim | Gün (her gün zorunlu) | Hafta (5/7 yeter) |
| 1 gün kaçınca | Sayı SIFIRLANIR — "47 gün gitti" dramı | Hiçbir şey sıfırlanmaz; o haftanın payından 1 gün kullanılır |
| 2–3 gün kaçınca | "Zaten bozuldu" → uygulama silinir | Hafta 5'e ulaşamayabilir; pazartesi pencere TAZE açılır, borç/telafi taşınmaz |
| Kutlama | Sayı büyüdükçe (kırılganlık da büyür) | Hafta tamamlanınca: "Bu hafta afiyetteydin 🎉" |
| Uzun vade | Tek kesinti tüm birikimi siler | **Toplam afiyet haftası birikir** (kesintisiz şart değil) → unvanlar: 4 hafta = Denge Yolcusu, 12 = Sofra Dostu, 24 = Sofra Ustası |
| Psikoloji | Kayıp korkusuyla tutma | Birikimle çekme — persona (sayaç yorgunu) kayıp diline alerjik |

Örnek hafta: Pzt ✓ · Sal ✓ · Çar ✗ (misafirlik) · Per ✓ · Cum ✓ · Cmt ✗ ·
Paz ✓ → **5/7, hafta afiyette** 🎉. Ertesi hafta 3/7'de kalırsa: kayıp
mesajı YOK, "Bugün farklıydı, yarın yeni bir sofra" tonu; pazartesi şerit
boş ve taze başlar. Streak'in motivasyonu (birikim) korunur, kırılganlığı
(tek gün her şeyi bozar) atılır.

## Nasıl çalışır (kurallar)

- Pencere: pazartesi 00:00 – pazar 23:59, kullanıcının yerel günüyle
  (`src/lib/dates.ts` yerel `YYYY-MM-DD` düzeni).
- Varsayılan hedef 5/7. Ritim 2 hafta oturunca T7 tetikleyicisi hedefi
  4–6 arası kişiselleştirme YETKİSİ verir (ödül-yetki katmanı).
- Gün "afiyet günü" sayılır ⇔ o gün ≥1 `meal_entries` kaydı VE denge
  görüntüleme gerçekleşti. (Pratikte kayıt sonrası tabak zaten gösterilir;
  ayrıştırmak sahte-hızlı kaydı ödüllendirmemek için.)
- Hafta hedefe ulaşınca: pazar kapanışında Afi kutlaması (T6). Ulaşamayınca:
  hiçbir olumsuz mesaj yok; pencere sessizce tazelenir.
- Toplam afiyet haftası sayacı kalıcıdır ve ASLA azalmaz.
- Sofra molası (bkz. sofra-molasi.md) açıkken hafta değerlendirmeye girmez.

## UI dokunuşları

- **Bugün ekranı:** beslenme kartına 7 noktalı **ritim şeridi** (dolu nokta =
  afiyet günü; bugünün noktası nabız gibi belirgin). Şerit Bugün'de yaşar —
  Geçmiş sayfasına bağımlılığı yok.
- Geçmiş'teki mevcut "seri 🔥" anlatımı, sayfanın planlanan
  sadeleşmesi/pivotuyla birlikte emekli edilir; yerine dokunulmazsa bile
  KUTLANAN birim ritme döner (kayıp dili kaldırılır).
- Hafta kutlaması: pazar gün kapanışında tam ekran hafif konfeti + Afi.

## Veri ve event'ler

- Türetilmiş değer — kalıcı state gerekmez; `GET /v1/summary`e afiyet günü
  alanı, haftalık pencere hesabı `GET /v1/summary/week` içinde.
- Event'ler: `afiyet_day_completed {score, week_day_no}`,
  `rhythm_week_completed {days, goal}`.
- Toplam afiyet haftası: backend'de küçük kalıcı sayaç (user_profiles'a
  alan ya da ayrı tablo — unvanlar bunun üzerinden).

## Yapma

- "Serin bozulmak üzere / son şansın" tarzı kayıp dili — asla.
- Geçmiş haftayı "kayıp/başarısız" diye anmak — asla.
- 7/7'yi özendirmek (mükemmeliyetçilik guardrail'i: 7/7 + hep 5/5 skor
  kovalayan segment büyürse "sofra payı" mesajı güçlendirilir).
