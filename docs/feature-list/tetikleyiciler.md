# Tetikleyiciler — T1–T7 ve iletişim kuralları

> Durum: tasarlandı · Dilim 1 (uygulama içi) → Dilim 2 (push)
> Kaynak: afiet-gamification/docs/06

## İlkeler

- Zaman değil **davranış/bağlam** bazlı; günde en fazla 1 proaktif dokunuş.
- Push altyapısı yok (expo-notifications kurulu değil) → Dilim 1'de tüm
  tetikleyiciler **Bugün ekranı kartları** olarak yaşar; Dilim 2'de aynı
  kurallar push'a taşınır. Sıra bilinçli: önce değer, sonra hatırlatma —
  bildirim, zayıf döngüyü kurtarmaz.
- Her tetikleyicinin susma koşulu ve tekrar sınırı vardır; cevapsızlık
  sıklığı DÜŞÜRÜR (ısrar markaya aykırı).
- Sofra molası tüm tetikleyicileri susturur.

## Tablo

| # | Koşul | Mesaj | Aksiyon | Susma | Sınır |
| --- | --- | --- | --- | --- | --- |
| T1 | Kayıt var + grup eksik | "Bugün sebzeye yer açılır mı? 🌿" | Hamleyi aç | Skor ≥4; haftada 2 ret | Günde 1 |
| T2 | 20:00 + kayıt yok | "Sofran seni özledi 🍲" | Kayıt sheet'i (akşam seçili) | Mola; dün de cevapsızsa | Günde 1, haftada ≤3 |
| T3 | Pazar 19:00 + özet hazır | "Bu haftanın sofrası hazır ✨" | Haftalık özet | İlk hafta dolmadıysa | Haftada 1 |
| T4 | 3 gün temas yok | "Yarın yeni bir sofra. Hazır olduğunda buradayım 🥣" | Bugün ekranı | Mola; bildirim kapalı | 3g → 7g → susar |
| T5 | Grup üyesi afiyet günü | "Ayşe bugün afiyetteydi — bir 🎉 gönder?" | Tek dokunuş tepki | Paylaşım kapalıysa | Günde ≤2 |
| T6 | İlk afiyet haftası | "Bu hafta afiyetteydin 🎉" | Afi kutlaması | — | Haftada 1 |
| T7 | Ritim 2 hafta oturdu | "Ritmini sen belirle: haftada kaç gün?" | Hedef ayarı | Ayarladıysa | Bir kez |

Metinler örnek kalıptır; varyantlar VOICE.md havuzundan çoğaltılır,
utandıran/üzen emoji kullanılmaz.

## Anti-kurallar (asla)

- Kayıp diliyle geri çağırma ("serin bozulmak üzere / son şansın").
- 21:00–09:00 arası proaktif bildirim.
- Aynı gün ikinci proaktif bildirim.
- Tatlı/fastfood sayacı üzerinden mesaj.
- Cevapsızlığa rağmen sabit sıklık.

## Veri ve event'ler

- `nudge_shown / nudge_acted {trigger_id, surface}` — dönüşüm tetikleyici
  bazında okunur; bildirim kapatma oranı >%5/hafta ise T2/T4 sıklığı
  otomatik yarıya iner (guardrail).
