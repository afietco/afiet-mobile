# Event altyapısı — kendi tablomuz + admin görünürlüğü

> Durum: tasarlandı · Dilim 1 (ÖNKOŞUL — ilk yapılacak iş)
> Kaynak: afiet-gamification/docs/07
> Karar (14 Tem 2026): kendi `events` tablomuz; PostHog vb. dış bağımlılık YOK.

## Ne

Minimal davranış telemetrisi: backend'de tek `events` tablosu, mobilde tek
`track()` yardımcısı, admin panelde okuma görünümü. Oyunlaştırma
metriklerinin (davranış + ürün + guardrail) tamamı buradan okunur.

## Neden

Şu an ne mobilde ne backend'de event altyapısı var; oyunlaştırmanın etkisi
ölçülemez. İlke: **ölçemeyeceğimiz özelliği açmayız.** Veri bizde kalır,
admin'de görünür — dış servis bağımlılığı istenmiyor.

## Nasıl çalışır

- **Backend:** `events (id, user_id, name text, props jsonb, created_at)`
  + `POST /v1/events` (toplu kabul: dizi halinde). Günlük toplulaştırma
  için basit view'lar/sorgular (kullanıcı bazlı değil kohort bazlı okunur).
- **Mobil:** `track(name, props)` — kuyruğa yazar, fırsat buldukça toplu
  gönderir. Kuyruk AsyncStorage'da saklanır (31 Tem 2026): çevrimdışı anlar
  ve uygulama kapanışları veri kaybettirmez; gönderilemeyen olaylar bir
  sonraki açılışta tekrar denenir, üst sınır 500 olay (eskiler düşer).
  Kullanıcı deneyimi asla bloklanmaz; auth yoksa olaylar girişe kadar
  kuyrukta bekler. Her olaya otomatik `sid` (oturum kimliği) ve `ts`
  (istemci zaman damgası, epoch ms) eklenir.
- **Sözlük disiplini:** yalnız tanımlı event'ler (aşağıda); sözlük dışı
  event eklemek istendiğinde önce bu dosya güncellenir.
- **Admin:** mevcut Dashboard'a "sofra paneli" bölümü — afiyet günü/hafta
  trendi, hamle dönüşümü, özet açılma, bildirim sağlığı (gösterildi→
  davranış), guardrail sayaçları. Haftalık 30 dk okuma ritüeliyle.

## Event sözlüğü (Dilim 1)

| Event | Props |
| --- | --- |
| `meal_logged` | meal, group_count, source(seed/custom) |
| `water_logged` | glasses |
| `measurement_added` | — |
| `onboarding_completed` | — |
| `balance_viewed` | score, missing[] |
| `afiyet_day_completed` | score, week_day_no |
| `move_offered` / `move_done` / `move_dismissed` | group, day |
| `week_summary_opened` | week_no, rhythm_days |
| `rhythm_week_completed` | days, goal |
| `nudge_shown` / `nudge_acted` | trigger_id(T1..T7), surface(inapp/push) |
| `reaction_sent` | group_id_hash |
| `pause_started` / `pause_ended` | reason? |
| `afi_celebration_shown` / `afi_assist_used` / `afi_suggestion_accepted` | moment / kind / kind |

## Oturum sözlüğü (31 Tem 2026 dilimi)

Her olay otomatik `sid` + `ts` taşır; aşağıdakiler oturum iskeletidir.
Admin kullanıcı detayı (`GET /v1/admin/users/{id}`) oturumları `sid` ile
gruplayıp bu olaylardan zaman çizelgesi kurar.

| Event | Props | Ne zaman |
| --- | --- | --- |
| `session_start` | platform, app_version, from_notification | Uygulama açılışı ve 5 dk'dan uzun arka plan sonrası dönüş |
| `session_end` | duration_sec | Arka planda 5 dk dolunca (geriye dönük, bir sonraki uyanışta) |
| `screen_view` | screen, from, duration_sec | Ekrandan ÇIKARKEN (süre o an belli olur); `ts` girişi gösterir |
| `sheet_view` / `sheet_closed` | sheet / sheet, duration_sec | Alt sayfa açılınca / kapanınca (`ui/Sheet.tsx` `name` prop'u; hamburger menü de aynı sözlüğü kullanır) |
| `ui_tap` | target, ...bağlam | Adlandırılmış dokunuşlar (`trackTap`); ilk kullanım giriş düğmeleri (auth_email/auth_google/auth_apple) |

Not: giriş yapmamış kullanıcının olayları cihazda bekler; kişi hiç giriş
yapmazsa sunucuya hiç ulaşmaz. Giriş öncesi funnel bu yüzden yalnız sonunda
üye olanlar için görünür.

## Yapma

- ~~Kişi-bazlı gözetleme ekranı~~ — bu kural 31 Tem 2026'da kullanıcı
  kararıyla kaldırıldı (backend migration 000033): admin kullanıcı detayı
  destek/teşhis amacıyla bireysel oturum dökümü gösterir. Okumanın ürün
  kararlarındaki birincil düzeyi yine kohort/trend.
- PII'yi props'a koymak (yemek adı serbest; isim/e-posta asla).
- Event şişmesi — "belki lazım olur" event'i eklenmez.
