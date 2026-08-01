# afiet'te bugün ajan verisi nasıl akıyor

> Durum: **mevcut durumun fotoğrafı**, 1 Ağu 2026. Öneri, plan ya da yön
> içermez; yalnızca bugün kodda ne olduğunu yazar. Karşılaştırma için yanındaki
> referans: [mp-referans.md](mp-referans.md).
>
> Kaynaklar: `afiet-backend/internal/server/chat_handlers.go`,
> `internal/afi/ask.go`, `internal/afi/ask_foundry.go`,
> `internal/config/config.go`, `afiet-mobile/apps/mobile/src/features/chat/`.

---

## 1. Zincir

```
MOBİL (sohbet ekranı)
  └── POST /v1/afi/sohbet  { assistant, message, date, history[] }
        └── handleAfiChat
              ├── chatContext(assistant, uid, day)   ← Neon'dan taze okuma
              └── Foundry ajanı (SSE)  → delta akışı → mobil
                                          └── geçmiş YALNIZCA cihazda saklanır
```

Kalıcı bir hafıza katmanı, kuyruk, worker ya da damıtma adımı **yok**. Bağlam
her istekte sıfırdan kuruluyor ve istek bitince kayboluyor.

---

## 2. Ajanlar

Beş Foundry ajanı, adları env'de (`internal/config/config.go`):

| Env | Varsayılan ad | Nerede |
|---|---|---|
| `CHAT_AGENT_AFI` | `afi` | `/v1/afi/sohbet` |
| `CHAT_AGENT_DIYETISYEN` | `afi-diyetisyen` | `/v1/afi/sohbet` |
| `CHAT_AGENT_PSIKOLOG` | `afi-psikolog` | `/v1/afi/sohbet` |
| `FOUNDRY_AGENT_VISION` | `afi-food-vision` | `/v1/afi/photo-chat` |
| `FOUNDRY_AGENT_NUTRITION` | `afi-nutiriton-detector` | besin tanıma |
| `ASK_AGENT_NAME` | `afi-bilgi-sofrasi` | landing "Afi'ye sor" |

Sürüm (`*_VERSION`) boş bırakılırsa Foundry o an yayınlanmış olanı çözüyor; üç
ortam tek Foundry projesini paylaştığı için portaldan yapılan bir publish
deploy'suz prod'u değiştirir.

---

## 3. Bağlam: her istekte sunucu kuruyor

`chatContext(ctx, assistant, uid, day)` asistana göre dallanıyor:

| Asistan | Sunucunun eklediği | Okunan yer |
|---|---|---|
| `afi` | bugünün öğünleri (ad, öğün, besin grupları), su bardağı, kayıt serisi | `MealsByDate`, `WaterByDate`, `LoggedDates` |
| `beslenme` | son 7 gün: kaç gün kayıt var, hangi besin grubu kaç gün sofrada | 7 paralel `MealsByDate` |
| `destek` | **hiçbir şey** (fonksiyonun ilk satırı bu asistanda erken döner) | yok |

Bağlam bloğu `UYGULAMA BAĞLAMI (afiet sunucusundan, kullanıcı yazmadı; …)`
ön ekiyle, **sorudan önce giden bir user mesajı** olarak taşınıyor: Responses
API `agent_reference` ile birlikte system/developer rolü kabul etmiyor.

Bağlam okuması başarısız olursa cevap yine veriliyor, yalnızca bağlamsız.

---

## 4. Geçmiş: cihazda

- Sunucuda transkript **yok** (faz-1 gizlilik kararı; destek sohbeti için
  özellikle olmamalı).
- Mobil, soru-cevap çiftlerini her istekte gövdede yolluyor.
- Sunucu son **12 turu**, tur başına **4000 karakteri**, mesaj başına **1000
  karakteri** alıyor.
- Çevrimdışı/uyarı balonları ne saklanıyor ne gönderiliyor.
- Cihazda: hesap başına, asistan başına, sohbet başına bir kayıt
  (`fh:chat:account:<id>:<asistan>:index` + `…:s:<sessionId>`).

---

## 5. Akış ve sınırlar

- SSE: `status` → `delta`* → `done`, arada `: ping` (10 sn).
- Akış isteğin bağlamından koparılıp kendi **120 sn** bütçesine alınıyor;
  `/v1`'in 30 sn timeout'u sağlıklı bir diyetisyen akışını kesiyordu.
- Kullanıcı başına **günlük mesaj sınırı** (in-process, instance başına).
- `CHAT_LOCKED_ASSISTANTS` bir asistanı kapatabiliyor.

---

## 6. Sızıntı koruması

Foundry'nin ham akışı `response.created` / `in_progress` / `completed`
çerçevelerinde ajanın **tüm sistem promptunu** taşıyor. Sunucu bu yüzden akışı
proxy'lemiyor, ayrıştırıyor: yalnız `response.output_text.delta` içindeki metin
dışarı çıkıyor, o da cevap filtresinden geçtikten sonra.

---

## 7. Telemetri

Yalnız asistan kimliği, ilk token gecikmesi ve toplam süre. Yazılan hiçbir şey
ölçüme girmiyor; admin tarafında bu sohbetlerin dökümü yok.

---

## 8. Referansla arasındaki farklar (yalnızca tespit)

Aşağıdakiler eksik listesi değil, **fark listesi**. Hiçbiri "yapılmalı" demek
değildir.

| Max Potential'de var | afiet'te bugün |
|---|---|
| `domain_events` outbox, append-only | yok; olay tablosu var (`events`) ama sohbet zincirini beslemiyor |
| Relay + BullMQ/Redis kuyruk + worker | yok; her şey istek içinde senkron |
| DistillerAgent (damıtma işi) | yok |
| Kalıcı sporcu sayfası (`athlete_page_sections`/`_revisions`) | yok; kullanıcı hafızası her istekte taze okumadan ibaret |
| Bölümler: identity_goals / physical / mental / open_topics | yok |
| provenance: `[cN] → [inv:uuid, tarih]` | yok |
| Sürümlü zarf (`athlete_context.v1`) | yok; bağlam düz metin bir blok |
| Kapalı geri besleme döngüsü | yok; sohbet turu hiçbir kalıcı hafızayı güncellemiyor |
| Sohbet geçmişi sunucuda | **bilinçli olarak cihazda** (gizlilik kararı) |
