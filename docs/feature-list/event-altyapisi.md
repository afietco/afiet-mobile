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
| `ui_tap` | target, ...bağlam | Adlandırılmış dokunuşlar (`trackTap`); hedef listesi aşağıda |
| `install_referrer` | source, medium, campaign, content, term, click (gclid/gbraid/wbraid türü, kimlik DEĞİL), empty | Android'de kurulum başına bir kez, ilk oturum başladıktan sonra; Play Install Referrer'dan (`lib/acquisition.ts`, 16 Ağu 2026). Kaynak sözlüğü: `afiet.co` (web rozeti, campaign = sayfa yolu), `google-play` (organik), `google-ads` (UTM'siz tıklama kimliği), `none` (referrer yok). iOS'ta yok |

Not: giriş yapmamış kullanıcının olayları cihazda bekler; kişi hiç giriş
yapmazsa sunucuya hiç ulaşmaz. Giriş öncesi funnel bu yüzden yalnız sonunda
üye olanlar için görünür.

### `ui_tap` hedefleri (5 Ağu 2026 dilimi)

Admin'deki "En sık dokunuşlar" listesi yalnız giriş düğmelerini gösteriyordu,
çünkü `ui_tap` tek yerde çağrılıyordu. Aşağıdaki hedefler o listeyi ürünün
kendi hunilerine bağlar. **Hedef adı ve prop değerleri sabit anahtardır**;
isim, e-posta, serbest metin ve besin adı props'a asla girmez.

| target | Props | Nerede |
| --- | --- | --- |
| `auth_email` / `auth_apple` / `auth_google` | mode (yalnız e-posta) | Giriş ekranı |
| `add_food_open` | from: meal_board \| today_card \| today_first \| meal_detail | Öğün ekleme akışının dört kapısı |
| `addfood_search_pick` | — | Arama sonucundan besin seçildi |
| `addfood_photo` | — | Aramadan foto turuna geçildi |
| `addfood_sentence` | — | "Bunu Afi çözsün" (cümleden besin) |
| `addfood_save` | again (bool) | Kaydet / Kaydet ve bir besin daha |
| `addfood_skip_item` | — | Cümle kuyruğunda "Bunu ekleme" |
| `afi_photo_shot` | source: camera \| library | Foto turunda görsel istendi (izin/iptal dahil) |
| `afi_photo_correction` | — | Foto turunda kullanıcı yazıyla düzeltti |
| `group_create_open` / `group_join_open` | — | Grubum boş durumundaki iki düğme |
| `group_create_submit` | — | "Grubu kur" gönderildi |
| `group_join_submit` | via: code \| public | Kodla katılma / keşiften katılma |
| `group_invite_share` | from: code \| icon | Davet paylaşımının iki tetikleyicisi |
| `friend_code_share` | — | Arkadaş kodu paylaşıldı |
| `kese_chip` | — | Bugün başlığındaki kese rozeti |
| `lig_open` | from: today \| progress \| standings | Lig ekranına üç giriş |
| `quest_claim` | from: list \| sheet | Görev ödülü toplandı |
| `chat_entry` | from, assistant | Sohbete giriş kartları (gövde `chat_*` ile ölçülür) |
| `tab_switch` | tab | Sekme değişimi (aynı sekmeye tekrar dokunma sayılmaz) |

Ölçülmüş bir davranışın üzerine `ui_tap` eklenmez: "Afi doldursun"
(`afi_assist_used`), foto sonucunun kabulü/reddi
(`afi_suggestion_accepted` / `afi_suggestion_rejected`), sofra tek dokunuşta
ekleme (`meal_logged`) ve sohbet gövdesi (`chat_*`) kendi event'lerini atar.

`reaction_sent` ("Afiyet olsun") bu dilimde ilk kez atılmaya başladı: grup
kimliği HAM gitmez, `hashId()` (`lib/track.ts`, sabit tuzlu çift şeritli
FNV-1a) ile takma ada çevrilir. Aynı grup her cihazda aynı değere düşer, ki
bir grubun selamları üyeleri arasında toplanabilsin.

## Yapma

- ~~Kişi-bazlı gözetleme ekranı~~ — bu kural 31 Tem 2026'da kullanıcı
  kararıyla kaldırıldı (backend migration 000033): admin kullanıcı detayı
  destek/teşhis amacıyla bireysel oturum dökümü gösterir. Okumanın ürün
  kararlarındaki birincil düzeyi yine kohort/trend.
- PII'yi props'a koymak (yemek adı serbest; isim/e-posta asla).
- Event şişmesi — "belki lazım olur" event'i eklenmez.
